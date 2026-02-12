import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { GameType, PlayerSymbol, GameStartData, MoveMadeData, GameEndResult } from '../types';
import TicTacToe from '../components/TicTacToe';
import Reversi from '../components/Reversi';

interface GameProps {
  socket: Socket;
  playerName: string;
}

export default function Game({ socket, playerName }: GameProps) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [gameType, setGameType] = useState<GameType | null>(null);
  const [board, setBoard] = useState<(PlayerSymbol | null)[][]>([]);
  const [currentTurn, setCurrentTurn] = useState<string>('');
  const [player1, setPlayer1] = useState<string>('');
  const [player2, setPlayer2] = useState<string>('');
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState<GameEndResult | null>(null);
  const [waiting, setWaiting] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    socket.on('gameStart', (data: GameStartData) => {
      console.log('Game started:', data);
      setGameType(data.gameType);
      setBoard(data.board);
      setCurrentTurn(data.currentTurn);
      setPlayer1(data.player1);
      setPlayer2(data.player2);
      setWaiting(false);
      setGameOver(false);
      setResult(null);
    });

    socket.on('moveMade', (data: MoveMadeData) => {
      setBoard(prev => {
        const newBoard = prev.map(row => [...row]);
        newBoard[data.row][data.col] = data.symbol;

        // Handle Reversi flips
        if (data.flippedPieces) {
          data.flippedPieces.forEach(([r, c]) => {
            newBoard[r][c] = data.symbol;
          });
        }

        return newBoard;
      });
    });

    socket.on('turnChange', ({ currentTurn: newTurn }: { currentTurn: string }) => {
      setCurrentTurn(newTurn);
    });

    socket.on('gameEnd', (endResult: GameEndResult) => {
      setResult(endResult);
      setGameOver(true);
    });

    socket.on('error', ({ message }: { message: string }) => {
      alert(message);
    });

    return () => {
      socket.off('gameStart');
      socket.off('moveMade');
      socket.off('turnChange');
      socket.off('gameEnd');
      socket.off('error');
    };
  }, [socket, sessionId]);

  const handleMove = (row: number, col: number) => {
    if (gameOver || currentTurn !== playerName) return;

    socket.emit('makeMove', {
      sessionId,
      row,
      col
    });
  };

  const handleLeave = () => {
    socket.emit('leaveSession', { sessionId });
    navigate('/lobby');
  };

  if (waiting) {
    return (
      <div className="game-page">
        <div className="game-container">
          <div className="waiting-screen">
            <div className="spinner"></div>
            <h2>Waiting for opponent...</h2>
            <p>Share the game link or wait for someone to join</p>
            <button onClick={handleLeave} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="game-container">
        <header className="game-header">
          <div className="game-info">
            <h2>{gameType === 'tictactoe' ? 'Tic-Tac-Toe' : 'Reversi'}</h2>
            <div className="players-info">
              <div className={`player ${currentTurn === player1 ? 'active' : ''}`}>
                <span className="player-name">{player1} {player1 === playerName && '(You)'}</span>
                <span className="player-symbol">
                  {gameType === 'tictactoe' ? '❌' : '⚫'}
                </span>
              </div>
              <span className="vs">vs</span>
              <div className={`player ${currentTurn === player2 ? 'active' : ''}`}>
                <span className="player-name">{player2} {player2 === playerName && '(You)'}</span>
                <span className="player-symbol">
                  {gameType === 'tictactoe' ? '⭕' : '⚪'}
                </span>
              </div>
            </div>
          </div>

          <button onClick={handleLeave} className="btn btn-secondary btn-sm">
            Leave Game
          </button>
        </header>

        <div className="turn-indicator">
          {!gameOver && (
            <p className={currentTurn === playerName ? 'your-turn' : ''}>
              {currentTurn === playerName ? "Your turn!" : `${currentTurn}'s turn`}
            </p>
          )}
        </div>

        <div className="game-board-container">
          {gameType === 'tictactoe' ? (
            <TicTacToe board={board} onMove={handleMove} disabled={gameOver || currentTurn !== playerName} />
          ) : (
            <Reversi
              board={board}
              onMove={handleMove}
              disabled={gameOver || currentTurn !== playerName}
              socket={socket}
              sessionId={sessionId!}
              playerSymbol={player1 === playerName ? 'black' : 'white'}
            />
          )}
        </div>

        {gameOver && result && (
          <div className="game-result-overlay">
            <div className="game-result-card">
              <h2>
                {result.isDraw
                  ? "It's a Draw!"
                  : result.winner === playerName
                  ? '🎉 You Won!'
                  : '😔 You Lost'}
              </h2>

              {result.forfeit && <p className="forfeit-message">Opponent left the game</p>}

              {result.scores && (
                <div className="game-scores">
                  <div className="score">
                    <span>⚫ Black:</span>
                    <strong>{result.scores.black}</strong>
                  </div>
                  <div className="score">
                    <span>⚪ White:</span>
                    <strong>{result.scores.white}</strong>
                  </div>
                </div>
              )}

              <div className="result-actions">
                <button onClick={handleLeave} className="btn btn-primary">
                  Back to Lobby
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
