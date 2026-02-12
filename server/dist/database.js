"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameDatabase = void 0;
const pg_1 = require("pg");
class GameDatabase {
    constructor() {
        // Берем строку подключения из переменных окружения или кидаем ошибку
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is not set');
        }
        this.pool = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false } // Нужно для Neon
        });
        this.initTables();
    }
    async initTables() {
        const client = await this.pool.connect();
        try {
            await client.query(`
        CREATE TABLE IF NOT EXISTS players (
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            await client.query(`
        CREATE TABLE IF NOT EXISTS game_stats (
          id SERIAL PRIMARY KEY,
          player_name TEXT NOT NULL,
          game_type TEXT NOT NULL,
          result TEXT NOT NULL,
          opponent_name TEXT,
          played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (player_name) REFERENCES players(name)
        )
      `);
            console.log('✅ Tables initialized');
        }
        finally {
            client.release();
        }
    }
    async getOrCreatePlayer(name) {
        // Postgres аналог "INSERT OR IGNORE"
        await this.pool.query('INSERT INTO players (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]);
        const res = await this.pool.query('SELECT * FROM players WHERE name = $1', [name]);
        return res.rows[0];
    }
    async recordGame(playerName, gameType, result, opponentName = null) {
        await this.pool.query('INSERT INTO game_stats (player_name, game_type, result, opponent_name) VALUES ($1, $2, $3, $4)', [playerName, gameType, result, opponentName]);
    }
    async getPlayerStats(name) {
        const query = `
      SELECT
        game_type,
        COUNT(*) as total_games,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws
      FROM game_stats
      WHERE player_name = $1
      GROUP BY game_type
    `;
        const res = await this.pool.query(query, [name]);
        return res.rows;
    }
    async getLeaderboard(gameType = null) {
        let query = `
      SELECT
        player_name,
        COUNT(*) as total_games,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws
      FROM game_stats
    `;
        const params = [];
        if (gameType) {
            query += ` WHERE game_type = $1`;
            params.push(gameType);
        }
        query += `
      GROUP BY player_name
      ORDER BY wins DESC, total_games ASC
      LIMIT 10
    `;
        const res = await this.pool.query(query, params);
        return res.rows;
    }
    async close() {
        await this.pool.end();
    }
}
exports.GameDatabase = GameDatabase;
//# sourceMappingURL=database.js.map