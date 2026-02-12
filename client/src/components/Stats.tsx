import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { GameStats } from '../types';

interface StatsProps {
  socket: Socket;
  playerName: string;
  onClose: () => void;
}

export default function Stats({ socket, playerName, onClose }: StatsProps) {
  const [stats, setStats] = useState<GameStats[]>([]);

  useEffect(() => {
    socket.emit('getStats', playerName);

    socket.on('statsUpdate', (updatedStats: GameStats[]) => {
      setStats(updatedStats);
    });

    return () => {
      socket.off('statsUpdate');
    };
  }, [socket, playerName]);

  const getGameTypeName = (type: string) => {
    return type === 'tictactoe' ? 'Tic-Tac-Toe' : 'Reversi';
  };

  const getWinRate = (wins: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
  };

  const getTotalStats = () => {
    const total = {
      total_games: 0,
      wins: 0,
      losses: 0,
      draws: 0
    };

    stats.forEach(stat => {
      total.total_games += stat.total_games;
      total.wins += stat.wins;
      total.losses += stat.losses;
      total.draws += stat.draws;
    });

    return total;
  };

  const totalStats = getTotalStats();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Your Statistics</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="stats-content">
          <div className="stats-summary">
            <h3>Overall Stats</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total Games</span>
                <span className="stat-value">{totalStats.total_games}</span>
              </div>
              <div className="stat-card success">
                <span className="stat-label">Wins</span>
                <span className="stat-value">{totalStats.wins}</span>
              </div>
              <div className="stat-card danger">
                <span className="stat-label">Losses</span>
                <span className="stat-value">{totalStats.losses}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Draws</span>
                <span className="stat-value">{totalStats.draws}</span>
              </div>
            </div>

            {totalStats.total_games > 0 && (
              <div className="win-rate">
                <span>Win Rate:</span>
                <strong>{getWinRate(totalStats.wins, totalStats.total_games)}%</strong>
              </div>
            )}
          </div>

          {stats.length > 0 && (
            <div className="stats-by-game">
              <h3>By Game Type</h3>
              {stats.map((stat) => (
                <div key={stat.game_type} className="game-stats-card">
                  <h4>{getGameTypeName(stat.game_type)}</h4>
                  <div className="game-stats-details">
                    <div className="stat-row">
                      <span>Games Played:</span>
                      <strong>{stat.total_games}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Wins:</span>
                      <strong className="text-success">{stat.wins}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Losses:</span>
                      <strong className="text-danger">{stat.losses}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Draws:</span>
                      <strong>{stat.draws}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Win Rate:</span>
                      <strong>{getWinRate(stat.wins, stat.total_games)}%</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {stats.length === 0 && (
            <div className="empty-state">
              <p>No games played yet. Start playing to see your stats!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
