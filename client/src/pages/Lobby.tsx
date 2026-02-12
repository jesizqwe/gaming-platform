import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { SessionListItem, GameType } from '../types';
import Stats from '../components/Stats';
import Leaderboard from '../components/Leaderboard';

interface LobbyProps {
  socket: Socket;
  playerName: string;
}

export default function Lobby({ socket, playerName }: LobbyProps) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [selectedGameType, setSelectedGameType] = useState<GameType>('tictactoe');
  const [showStats, setShowStats] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    socket.emit('getSessions');

    socket.on('sessionsUpdate', (updatedSessions: SessionListItem[]) => {
      setSessions(updatedSessions);
    });

    socket.on('sessionCreated', ({ sessionId }: { sessionId: string }) => {
      navigate(`/game/${sessionId}`);
    });

    const interval = setInterval(() => {
      socket.emit('getSessions');
    }, 3000);

    return () => {
      clearInterval(interval);
      socket.off('sessionsUpdate');
      socket.off('sessionCreated');
    };
  }, [socket, navigate]);

  const handleCreateSession = (vsAI: boolean) => {
    socket.emit('createSession', {
      gameType: selectedGameType,
      playerName,
      vsAI
    });
  };

  const handleJoinSession = (sessionId: string) => {
    socket.emit('joinSession', { sessionId, playerName });
    // Navigate immediately, Game.tsx will handle gameStart event
    navigate(`/game/${sessionId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('playerName');
    window.location.href = '/';
  };

  const getGameTypeName = (type: GameType) => {
    return type === 'tictactoe' ? 'Tic-Tac-Toe' : 'Reversi';
  };

  const filteredSessions = sessions.filter(s => s.gameType === selectedGameType);

  return (
    <div className="lobby-page">
      <header className="lobby-header">
        <div className="header-content">
          <h1>🎮 Gaming Lobby</h1>
          <div className="header-user">
            <span className="user-name">👤 {playerName}</span>
            <button onClick={() => setShowStats(true)} className="btn btn-secondary btn-sm">
              Stats
            </button>
            <button onClick={() => setShowLeaderboard(true)} className="btn btn-secondary btn-sm">
              Leaderboard
            </button>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="lobby-content">
        <div className="lobby-section">
          <h2>Create New Game</h2>

          <div className="game-type-selector">
            <button
              className={`game-type-btn ${selectedGameType === 'tictactoe' ? 'active' : ''}`}
              onClick={() => setSelectedGameType('tictactoe')}
            >
              <span className="game-icon">⭕❌</span>
              <span>Tic-Tac-Toe</span>
            </button>
            <button
              className={`game-type-btn ${selectedGameType === 'reversi' ? 'active' : ''}`}
              onClick={() => setSelectedGameType('reversi')}
            >
              <span className="game-icon">⚫⚪</span>
              <span>Reversi</span>
            </button>
          </div>

          <div className="create-game-actions">
            <button onClick={() => handleCreateSession(false)} className="btn btn-primary">
              Create Public Game
            </button>
            <button onClick={() => handleCreateSession(true)} className="btn btn-secondary">
              Play vs AI
            </button>
          </div>
        </div>

        <div className="lobby-section">
          <h2>Available Games ({filteredSessions.length})</h2>

          {filteredSessions.length === 0 ? (
            <div className="empty-state">
              <p>No games available. Create one!</p>
            </div>
          ) : (
            <div className="sessions-list">
              {filteredSessions.map((session) => (
                <div key={session.id} className="session-card">
                  <div className="session-info">
                    <h3>{getGameTypeName(session.gameType)}</h3>
                    <p>Created by: <strong>{session.creator}</strong></p>
                  </div>
                  <button
                    onClick={() => handleJoinSession(session.id)}
                    className="btn btn-primary btn-sm"
                  >
                    Join Game
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showStats && (
        <Stats
          socket={socket}
          playerName={playerName}
          onClose={() => setShowStats(false)}
        />
      )}

      {showLeaderboard && (
        <Leaderboard
          socket={socket}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
}
