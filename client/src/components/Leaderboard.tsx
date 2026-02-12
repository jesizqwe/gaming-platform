import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { LeaderboardEntry, GameType } from '../types';

interface LeaderboardProps {
  socket: Socket;
  onClose: () => void;
}

export default function Leaderboard({ socket, onClose }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameType | 'all'>('all');

  useEffect(() => {
    const gameType = selectedGame === 'all' ? undefined : selectedGame;
    socket.emit('getLeaderboard', gameType);

    socket.on('leaderboardUpdate', (updatedLeaderboard: LeaderboardEntry[]) => {
      setLeaderboard(updatedLeaderboard);
    });

    return () => {
      socket.off('leaderboardUpdate');
    };
  }, [socket, selectedGame]);

  const getWinRate = (wins: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
  };

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content leaderboard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🏆 Leaderboard</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="leaderboard-filters">
          <button
            className={`filter-btn ${selectedGame === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedGame('all')}
          >
            All Games
          </button>
          <button
            className={`filter-btn ${selectedGame === 'tictactoe' ? 'active' : ''}`}
            onClick={() => setSelectedGame('tictactoe')}
          >
            Tic-Tac-Toe
          </button>
          <button
            className={`filter-btn ${selectedGame === 'reversi' ? 'active' : ''}`}
            onClick={() => setSelectedGame('reversi')}
          >
            Reversi
          </button>
        </div>

        <div className="leaderboard-content">
          {leaderboard.length === 0 ? (
            <div className="empty-state">
              <p>No players on the leaderboard yet.</p>
            </div>
          ) : (
            <div className="leaderboard-list">
              <div className="leaderboard-header">
                <span className="rank-col">Rank</span>
                <span className="name-col">Player</span>
                <span className="stat-col">Games</span>
                <span className="stat-col">Wins</span>
                <span className="stat-col">Win Rate</span>
              </div>
              {leaderboard.map((entry, index) => (
                <div key={entry.player_name} className={`leaderboard-row ${index < 3 ? 'top-three' : ''}`}>
                  <span className="rank-col">{getRankEmoji(index)}</span>
                  <span className="name-col">{entry.player_name}</span>
                  <span className="stat-col">{entry.total_games}</span>
                  <span className="stat-col stat-wins">{entry.wins}</span>
                  <span className="stat-col">{getWinRate(entry.wins, entry.total_games)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
