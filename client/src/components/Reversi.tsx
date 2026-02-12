import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { PlayerSymbol } from '../types';

interface ReversiProps {
  board: (PlayerSymbol | null)[][];
  onMove: (row: number, col: number) => void;
  disabled: boolean;
  socket: Socket;
  sessionId: string;
  playerSymbol: PlayerSymbol;
}

export default function Reversi({ board, onMove, disabled, socket, sessionId, playerSymbol }: ReversiProps) {
  const [validMoves, setValidMoves] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!disabled) {
      socket.emit('getValidMoves', { sessionId });
    }

    socket.on('validMovesUpdate', (moves: [number, number][]) => {
      const moveSet = new Set(moves.map(([r, c]) => `${r}-${c}`));
      setValidMoves(moveSet);
    });

    return () => {
      socket.off('validMovesUpdate');
    };
  }, [socket, sessionId, disabled, board]);

  const renderSymbol = (symbol: PlayerSymbol | null) => {
    if (symbol === 'black') return '⚫';
    if (symbol === 'white') return '⚪';
    return '';
  };

  const isValidMove = (row: number, col: number) => {
    return validMoves.has(`${row}-${col}`);
  };

  const getScores = () => {
    let black = 0;
    let white = 0;
    board.forEach(row => {
      row.forEach(cell => {
        if (cell === 'black') black++;
        if (cell === 'white') white++;
      });
    });
    return { black, white };
  };

  const scores = getScores();

  return (
    <div className="reversi-container">
      <div className="reversi-scores">
        <div className="score-item">
          <span className="score-label">⚫ Black:</span>
          <span className="score-value">{scores.black}</span>
        </div>
        <div className="score-item">
          <span className="score-label">⚪ White:</span>
          <span className="score-value">{scores.white}</span>
        </div>
      </div>

      <div className="reversi-board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={`reversi-cell ${cell ? 'filled' : ''} ${
                  !disabled && isValidMove(rowIndex, colIndex) ? 'valid-move' : ''
                } ${disabled && !cell ? 'disabled' : ''}`}
                onClick={() => !disabled && onMove(rowIndex, colIndex)}
                disabled={disabled || !isValidMove(rowIndex, colIndex)}
              >
                {cell && <span className="piece">{renderSymbol(cell)}</span>}
                {!disabled && isValidMove(rowIndex, colIndex) && (
                  <span className="hint-piece">{renderSymbol(playerSymbol)}</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
