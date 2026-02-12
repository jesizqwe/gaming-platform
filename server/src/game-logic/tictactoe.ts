import { PlayerSymbol } from '../types';

export function isValidTicTacToeMove(
  board: (PlayerSymbol | null)[][],
  row: number,
  col: number
): boolean {
  return board[row] !== undefined && board[row][col] === null;
}

export function checkTicTacToeWinner(
  board: (PlayerSymbol | null)[][]
): PlayerSymbol | null {
  const size = board.length;

  // Check rows
  for (let i = 0; i < size; i++) {
    if (board[i][0] && board[i].every(cell => cell === board[i][0])) {
      return board[i][0];
    }
  }

  // Check columns
  for (let i = 0; i < size; i++) {
    if (board[0][i] && board.every(row => row[i] === board[0][i])) {
      return board[0][i];
    }
  }

  // Check diagonals
  if (board[0][0] && board.every((row, i) => row[i] === board[0][0])) {
    return board[0][0];
  }

  if (
    board[0][size - 1] &&
    board.every((row, i) => row[size - 1 - i] === board[0][size - 1])
  ) {
    return board[0][size - 1];
  }

  return null;
}

export function isBoardFull(board: (PlayerSymbol | null)[][]): boolean {
  return board.every(row => row.every(cell => cell !== null));
}

export function getBestTicTacToeMove(
  board: (PlayerSymbol | null)[][],
  symbol: PlayerSymbol
): [number, number] | null {
  const opponent = symbol === 'X' ? 'O' : 'X';

  // Try to win
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i][j] === null) {
        board[i][j] = symbol;
        if (checkTicTacToeWinner(board) === symbol) {
          board[i][j] = null;
          return [i, j];
        }
        board[i][j] = null;
      }
    }
  }

  // Block opponent
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i][j] === null) {
        board[i][j] = opponent;
        if (checkTicTacToeWinner(board) === opponent) {
          board[i][j] = null;
          return [i, j];
        }
        board[i][j] = null;
      }
    }
  }

  // Take center
  if (board[1][1] === null) return [1, 1];

  // Take corner
  const corners: [number, number][] = [[0, 0], [0, 2], [2, 0], [2, 2]];
  for (const [i, j] of corners) {
    if (board[i][j] === null) return [i, j];
  }

  // Take any edge
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i][j] === null) return [i, j];
    }
  }

  return null;
}
