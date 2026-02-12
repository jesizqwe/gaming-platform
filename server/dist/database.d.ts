import { GameType, GameResult, GameStats, LeaderboardEntry } from './types';
export declare class GameDatabase {
    private db;
    constructor();
    private initTables;
    getOrCreatePlayer(name: string): any;
    recordGame(playerName: string, gameType: GameType, result: GameResult, opponentName?: string | null): void;
    getPlayerStats(name: string): GameStats[];
    getLeaderboard(gameType?: GameType | null): LeaderboardEntry[];
    close(): void;
}
//# sourceMappingURL=database.d.ts.map