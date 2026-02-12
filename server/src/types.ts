export type GameType = 'tictactoe' | 'reversi';

export type PlayerSymbol = 'X' | 'O' | 'black' | 'white';

export type GameResult = 'win' | 'loss' | 'draw';

export type SessionState = 'waiting' | 'playing' | 'finished';

export interface Player {
  name: string;
  socketId: string | null;
  symbol: PlayerSymbol;
}

export interface GameSession {
  id: string;
  gameType: GameType;
  vsAI: boolean;
  player1: Player;
  player2: Player | null;
  state: SessionState;
  board: (PlayerSymbol | null)[][];
  currentTurn: string;
  createdAt: number;
}

export interface SessionListItem {
  id: string;
  gameType: GameType;
  creator: string;
  createdAt: number;
}

export interface GameStats {
  game_type: string;
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface LeaderboardEntry {
  player_name: string;
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface MoveData {
  sessionId: string;
  row: number;
  col: number;
}

export interface MoveMadeData {
  row: number;
  col: number;
  symbol: PlayerSymbol;
  playerName: string;
  flippedPieces?: [number, number][];
}

export interface GameEndResult {
  winner: string | null;
  isDraw: boolean;
  forfeit: boolean;
  scores?: { black: number; white: number } | null;
}
