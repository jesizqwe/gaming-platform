import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSocket } from './hooks/useSocket';
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import Game from './pages/Game';

function App() {
  const [playerName, setPlayerName] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    socket.on('nameSet', ({ success, name }: { success: boolean; name: string }) => {
      if (success) {
        setPlayerName(name);
        localStorage.setItem('playerName', name);
      }
    });

    // Check for existing player name
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      socket.emit('setPlayerName', savedName);
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('nameSet');
    };
  }, [socket]);

  if (!socket) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Connecting to server...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        {!isConnected && (
          <div style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            background: '#ef4444',
            color: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            zIndex: 9999,
            fontWeight: 600
          }}>
            Disconnected from server...
          </div>
        )}
        <Routes>
          <Route
            path="/"
            element={
              playerName ? (
                <Navigate to="/lobby" replace />
              ) : (
                <Login socket={socket} onLogin={setPlayerName} />
              )
            }
          />
          <Route
            path="/lobby"
            element={
              playerName ? (
                <Lobby socket={socket} playerName={playerName} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/game/:sessionId"
            element={
              playerName ? (
                <Game socket={socket} playerName={playerName} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
