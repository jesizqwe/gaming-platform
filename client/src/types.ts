export type GameType = 'tictactoe' | 'reversi';

export type PlayerSymbol = 'X' | 'O' | 'black' | 'white';

export type GameResult = 'win' | 'loss' | 'draw';

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

export interface GameStartData {
  sessionId: string;
  gameType: GameType;
  player1: string;
  player2: string;
  currentTurn: string;
  board: (PlayerSymbol | null)[][];
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
