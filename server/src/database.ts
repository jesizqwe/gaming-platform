import Database from 'better-sqlite3';
import path from 'path';
import { GameType, GameResult, GameStats, LeaderboardEntry } from './types';

export class GameDatabase {
  private db: Database.Database;

  constructor() {
    this.db = new Database(path.join(__dirname, '..', 'game_stats.db'));
    this.initTables();
  }

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS game_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_name TEXT NOT NULL,
        game_type TEXT NOT NULL,
        result TEXT NOT NULL,
        opponent_name TEXT,
        played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_name) REFERENCES players(name)
      )
    `);
  }

  getOrCreatePlayer(name: string): any {
    const stmt = this.db.prepare('INSERT OR IGNORE INTO players (name) VALUES (?)');
    stmt.run(name);
    return this.db.prepare('SELECT * FROM players WHERE name = ?').get(name);
  }

  recordGame(
    playerName: string,
    gameType: GameType,
    result: GameResult,
    opponentName: string | null = null
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO game_stats (player_name, game_type, result, opponent_name)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(playerName, gameType, result, opponentName);
  }

  getPlayerStats(name: string): GameStats[] {
    const stats = this.db.prepare(`
      SELECT
        game_type,
        COUNT(*) as total_games,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws
      FROM game_stats
      WHERE player_name = ?
      GROUP BY game_type
    `).all(name) as GameStats[];

    return stats;
  }

  getLeaderboard(gameType: GameType | null = null): LeaderboardEntry[] {
    let query = `
      SELECT
        player_name,
        COUNT(*) as total_games,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws
      FROM game_stats
    `;

    if (gameType) {
      query += ` WHERE game_type = ?`;
    }

    query += `
      GROUP BY player_name
      ORDER BY wins DESC, total_games ASC
      LIMIT 10
    `;

    const stmt = this.db.prepare(query);
    return (gameType ? stmt.all(gameType) : stmt.all()) as LeaderboardEntry[];
  }

  close(): void {
    this.db.close();
  }
}
