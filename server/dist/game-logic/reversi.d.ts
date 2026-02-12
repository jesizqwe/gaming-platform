import { PlayerSymbol } from '../types';
export declare function isValidReversiMove(board: (PlayerSymbol | null)[][], row: number, col: number, symbol: PlayerSymbol): boolean;
export declare function makeReversiMove(board: (PlayerSymbol | null)[][], row: number, col: number, symbol: PlayerSymbol): [number, number][];
export declare function hasValidMoves(board: (PlayerSymbol | null)[][], symbol: PlayerSymbol): boolean;
export declare function getValidReversiMoves(board: (PlayerSymbol | null)[][], symbol: PlayerSymbol): [number, number][];
export declare function getReversiScores(board: (PlayerSymbol | null)[][]): {
    black: number;
    white: number;
};
export declare function getBestReversiMove(board: (PlayerSymbol | null)[][], symbol: PlayerSymbol): [number, number] | null;
//# sourceMappingURL=reversi.d.ts.map