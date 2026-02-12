"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameDatabase = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
class GameDatabase {
    constructor() {
        this.db = new better_sqlite3_1.default(path_1.default.join(__dirname, '..', 'game_stats.db'));
        this.initTables();
    }
    initTables() {
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
    getOrCreatePlayer(name) {
        const stmt = this.db.prepare('INSERT OR IGNORE INTO players (name) VALUES (?)');
        stmt.run(name);
        return this.db.prepare('SELECT * FROM players WHERE name = ?').get(name);
    }
    recordGame(playerName, gameType, result, opponentName = null) {
        const stmt = this.db.prepare(`
      INSERT INTO game_stats (player_name, game_type, result, opponent_name)
      VALUES (?, ?, ?, ?)
    `);
        stmt.run(playerName, gameType, result, opponentName);
    }
    getPlayerStats(name) {
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
    `).all(name);
        return stats;
    }
    getLeaderboard(gameType = null) {
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
        return (gameType ? stmt.all(gameType) : stmt.all());
    }
    close() {
        this.db.close();
    }
}
exports.GameDatabase = GameDatabase;
//# sourceMappingURL=database.js.map