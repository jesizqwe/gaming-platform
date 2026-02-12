import { PlayerSymbol } from '../types';
export declare function isValidTicTacToeMove(board: (PlayerSymbol | null)[][], row: number, col: number): boolean;
export declare function checkTicTacToeWinner(board: (PlayerSymbol | null)[][]): PlayerSymbol | null;
export declare function isBoardFull(board: (PlayerSymbol | null)[][]): boolean;
export declare function getBestTicTacToeMove(board: (PlayerSymbol | null)[][], symbol: PlayerSymbol): [number, number] | null;
//# sourceMappingURL=tictactoe.d.ts.map