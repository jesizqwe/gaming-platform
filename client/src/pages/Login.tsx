import { useState, FormEvent } from 'react';
import { Socket } from 'socket.io-client';

interface LoginProps {
  socket: Socket;
  onLogin: (name: string) => void;
}

export default function Login({ socket, onLogin }: LoginProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (name.length < 2 || name.length > 20) {
      setError('Name must be between 2 and 20 characters');
      return;
    }

    socket.emit('setPlayerName', name.trim());
    onLogin(name.trim());
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>🎮 Gaming Platform</h1>
          <p>Multiplayer Tic-Tac-Toe & Reversi</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="name">Enter Your Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="John Doe"
              autoFocus
              maxLength={20}
            />
            {error && <span className="error-message">{error}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-large">
            Start Playing
          </button>
        </form>

        <div className="login-features">
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span>Real-time Multiplayer</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🤖</span>
            <span>Play vs AI</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📊</span>
            <span>Track Your Stats</span>
          </div>
        </div>
      </div>
    </div>
  );
}
