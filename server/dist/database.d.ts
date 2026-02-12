import { GameType, GameResult, GameStats, LeaderboardEntry } from './types';
export declare class GameDatabase {
    private pool;
    constructor();
    private initTables;
    getOrCreatePlayer(name: string): Promise<any>;
    recordGame(playerName: string, gameType: GameType, result: GameResult, opponentName?: string | null): Promise<void>;
    getPlayerStats(name: string): Promise<GameStats[]>;
    getLeaderboard(gameType?: GameType | null): Promise<LeaderboardEntry[]>;
    close(): Promise<void>;
}
//# sourceMappingURL=database.d.ts.map