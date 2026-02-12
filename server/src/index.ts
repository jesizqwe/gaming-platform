import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { GameDatabase } from './database';
import {
  GameSession,
  SessionListItem,
  GameType,
  PlayerSymbol,
  MoveData,
  MoveMadeData,
  GameEndResult
} from './types';
import {
  isValidTicTacToeMove,
  checkTicTacToeWinner,
  isBoardFull,
  getBestTicTacToeMove
} from './game-logic/tictactoe';
import {
  isValidReversiMove,
  makeReversiMove,
  hasValidMoves,
  getValidReversiMoves,
  getReversiScores,
  getBestReversiMove
} from './game-logic/reversi';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const db = new GameDatabase();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Game sessions storage
const gameSessions = new Map<string, GameSession>();
const playerSockets = new Map<string, string>();

// Helper functions
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function getAvailableSessions(): SessionListItem[] {
  return Array.from(gameSessions.values())
    .filter(session => !session.player2 && session.state === 'waiting')
    .map(session => ({
      id: session.id,
      gameType: session.gameType,
      creator: session.player1.name,
      createdAt: session.createdAt
    }));
}

function initializeBoard(gameType: GameType): (PlayerSymbol | null)[][] {
  if (gameType === 'tictactoe') {
    return Array(3).fill(null).map(() => Array(3).fill(null));
  } else if (gameType === 'reversi') {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    // Initial Reversi setup
    board[3][3] = 'white';
    board[3][4] = 'black';
    board[4][3] = 'black';
    board[4][4] = 'white';
    return board;
  }
  return [];
}

function makeAIMove(session: GameSession): void {
  if (session.gameType === 'tictactoe') {
    const move = getBestTicTacToeMove(session.board, 'O');
    if (move) {
      const [row, col] = move;
      session.board[row][col] = 'O';

      io.to(session.id).emit('moveMade', {
        row,
        col,
        symbol: 'O',
        playerName: 'AI'
      } as MoveMadeData);

      const winnerSymbol = checkTicTacToeWinner(session.board);
      const isDraw = isBoardFull(session.board);

      if (winnerSymbol) {
        const winnerName = session.player1.symbol === winnerSymbol ? session.player1.name : session.player2!.name;
        endGame(session, winnerName);
      } else if (isDraw) {
        endGame(session, 'draw');
      } else {
        session.currentTurn = session.player1.name;
        io.to(session.id).emit('turnChange', { currentTurn: session.currentTurn });
      }
    }
  } else if (session.gameType === 'reversi') {
    const move = getBestReversiMove(session.board, 'white');
    if (move) {
      const [row, col] = move;
      const flippedPieces = makeReversiMove(session.board, row, col, 'white');

      io.to(session.id).emit('moveMade', {
        row,
        col,
        symbol: 'white',
        playerName: 'AI',
        flippedPieces
      } as MoveMadeData);

      if (hasValidMoves(session.board, 'black')) {
        session.currentTurn = session.player1.name;
        io.to(session.id).emit('turnChange', { currentTurn: session.currentTurn });
      } else if (hasValidMoves(session.board, 'white')) {
        setTimeout(() => makeAIMove(session), 500);
      } else {
        const scores = getReversiScores(session.board);
        let winner: string;
        if (scores.black > scores.white) winner = session.player1.name;
        else if (scores.white > scores.black) winner = 'AI';
        else winner = 'draw';
        endGame(session, winner);
      }
    }
  }
}

function endGame(session: GameSession, winner: string, forfeit = false): void {
  const result: GameEndResult = {
    winner: winner === 'draw' ? null : winner,
    isDraw: winner === 'draw',
    forfeit,
    scores: session.gameType === 'reversi' ? getReversiScores(session.board) : null
  };

  io.to(session.id).emit('gameEnd', result);

  // Record stats
  if (session.player2) {
    if (!session.vsAI || winner !== 'AI') {
      const player1Result = winner === session.player1.name ? 'win' : (winner === 'draw' ? 'draw' : 'loss');
      db.recordGame(session.player1.name, session.gameType, player1Result, session.player2.name);
    }

    if (session.player2.name !== 'AI') {
      const player2Result = winner === session.player2.name ? 'win' : (winner === 'draw' ? 'draw' : 'loss');
      db.recordGame(session.player2.name, session.gameType, player2Result, session.player1.name);
    }
  }

  session.state = 'finished';

  setTimeout(() => {
    gameSessions.delete(session.id);
    io.emit('sessionsUpdate', getAvailableSessions());
  }, 5000);
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('setPlayerName', (playerName: string) => {
    socket.data.playerName = playerName;
    playerSockets.set(playerName, socket.id);
    db.getOrCreatePlayer(playerName);
    socket.emit('nameSet', { success: true, name: playerName });
    console.log(`Player ${playerName} connected with socket ${socket.id}`);
  });

  socket.on('getStats', (playerName: string) => {
    const stats = db.getPlayerStats(playerName);
    socket.emit('statsUpdate', stats);
  });

  socket.on('getLeaderboard', (gameType?: GameType) => {
    const leaderboard = db.getLeaderboard(gameType || null);
    socket.emit('leaderboardUpdate', leaderboard);
  });

  socket.on('getSessions', () => {
    socket.emit('sessionsUpdate', getAvailableSessions());
  });

  socket.on('createSession', ({ gameType, playerName, vsAI }: { gameType: GameType; playerName: string; vsAI: boolean }) => {
    const sessionId = generateSessionId();

    const session: GameSession = {
      id: sessionId,
      gameType,
      vsAI,
      player1: {
        name: playerName,
        socketId: socket.id,
        symbol: gameType === 'tictactoe' ? 'X' : 'black'
      },
      player2: null,
      state: 'waiting',
      board: initializeBoard(gameType),
      currentTurn: playerName,
      createdAt: Date.now()
    };

    if (vsAI) {
      session.player2 = {
        name: 'AI',
        socketId: null,
        symbol: gameType === 'tictactoe' ? 'O' : 'white'
      };
      session.state = 'playing';
    }

    gameSessions.set(sessionId, session);
    socket.join(sessionId);

    socket.emit('sessionCreated', {
      sessionId,
      gameType,
      vsAI
    });

    // For AI games, immediately start the game
    if (vsAI) {
      socket.emit('gameStart', {
        sessionId,
        gameType: session.gameType,
        player1: session.player1.name,
        player2: session.player2!.name,
        currentTurn: session.currentTurn,
        board: session.board
      });
    } else {
      io.emit('sessionsUpdate', getAvailableSessions());
    }

    console.log(`Session ${sessionId} created by ${playerName}`);
  });

  socket.on('joinSession', ({ sessionId, playerName }: { sessionId: string; playerName: string }) => {
    const session = gameSessions.get(sessionId);

    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    if (session.player2) {
      socket.emit('error', { message: 'Session is full' });
      return;
    }

    session.player2 = {
      name: playerName,
      socketId: socket.id,
      symbol: session.gameType === 'tictactoe' ? 'O' : 'white'
    };
    session.state = 'playing';

    socket.join(sessionId);

    io.to(sessionId).emit('gameStart', {
      sessionId,
      gameType: session.gameType,
      player1: session.player1.name,
      player2: session.player2.name,
      currentTurn: session.currentTurn,
      board: session.board
    });

    io.emit('sessionsUpdate', getAvailableSessions());
    console.log(`${playerName} joined session ${sessionId}`);
  });

  socket.on('makeMove', ({ sessionId, row, col }: MoveData) => {
    const session = gameSessions.get(sessionId);

    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    const playerName = socket.data.playerName;

    if (session.currentTurn !== playerName) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    const player = session.player1.name === playerName ? session.player1 : session.player2!;

    if (session.gameType === 'tictactoe') {
      if (!isValidTicTacToeMove(session.board, row, col)) {
        socket.emit('error', { message: 'Invalid move' });
        return;
      }

      session.board[row][col] = player.symbol;

      const winnerSymbol = checkTicTacToeWinner(session.board);
      const isDraw = isBoardFull(session.board);

      io.to(sessionId).emit('moveMade', {
        row,
        col,
        symbol: player.symbol,
        playerName
      } as MoveMadeData);

      if (winnerSymbol) {
        const winnerName = session.player1.symbol === winnerSymbol ? session.player1.name : session.player2!.name;
        endGame(session, winnerName);
      } else if (isDraw) {
        endGame(session, 'draw');
      } else {
        session.currentTurn = session.player1.name === playerName ? session.player2!.name : session.player1.name;
        io.to(sessionId).emit('turnChange', { currentTurn: session.currentTurn });

        if (session.vsAI && session.currentTurn === 'AI') {
          setTimeout(() => makeAIMove(session), 500);
        }
      }
    } else if (session.gameType === 'reversi') {
      if (!isValidReversiMove(session.board, row, col, player.symbol)) {
        socket.emit('error', { message: 'Invalid move' });
        return;
      }

      const flippedPieces = makeReversiMove(session.board, row, col, player.symbol);

      io.to(sessionId).emit('moveMade', {
        row,
        col,
        symbol: player.symbol,
        playerName,
        flippedPieces
      } as MoveMadeData);

      const opponent = session.player1.name === playerName ? session.player2! : session.player1;

      if (hasValidMoves(session.board, opponent.symbol)) {
        session.currentTurn = opponent.name;
        io.to(sessionId).emit('turnChange', { currentTurn: session.currentTurn });

        if (session.vsAI && session.currentTurn === 'AI') {
          setTimeout(() => makeAIMove(session), 500);
        }
      } else if (hasValidMoves(session.board, player.symbol)) {
        io.to(sessionId).emit('turnChange', { currentTurn: session.currentTurn });
      } else {
        const scores = getReversiScores(session.board);
        let winner: string;
        if (scores.black > scores.white) {
          winner = session.player1.symbol === 'black' ? session.player1.name : session.player2!.name;
        } else if (scores.white > scores.black) {
          winner = session.player1.symbol === 'white' ? session.player1.name : session.player2!.name;
        } else {
          winner = 'draw';
        }
        endGame(session, winner);
      }
    }
  });

  socket.on('getValidMoves', ({ sessionId }: { sessionId: string }) => {
    const session = gameSessions.get(sessionId);
    if (session && session.gameType === 'reversi') {
      const player = session.player1.socketId === socket.id ? session.player1 : session.player2!;
      const validMoves = getValidReversiMoves(session.board, player.symbol);
      socket.emit('validMovesUpdate', validMoves);
    }
  });

  socket.on('leaveSession', ({ sessionId }: { sessionId: string }) => {
    const session = gameSessions.get(sessionId);
    if (session) {
      socket.leave(sessionId);

      if (session.state === 'playing') {
        const playerName = socket.data.playerName;
        const winner = session.player1.name === playerName ? session.player2!.name : session.player1.name;
        endGame(session, winner, true);
      } else {
        gameSessions.delete(sessionId);
        io.emit('sessionsUpdate', getAvailableSessions());
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    for (const [sessionId, session] of gameSessions.entries()) {
      if (session.player1.socketId === socket.id || (session.player2 && session.player2.socketId === socket.id)) {
        if (session.state === 'playing' && !session.vsAI) {
          const playerName = socket.data.playerName;
          const winner = session.player1.name === playerName ? session.player2!.name : session.player1.name;
          endGame(session, winner, true);
        } else {
          gameSessions.delete(sessionId);
          io.emit('sessionsUpdate', getAvailableSessions());
        }
        break;
      }
    }

    if (socket.data.playerName) {
      playerSockets.delete(socket.data.playerName);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🎮 Gaming Platform Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
