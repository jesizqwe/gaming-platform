import { PlayerSymbol } from '../types';

interface TicTacToeProps {
  board: (PlayerSymbol | null)[][];
  onMove: (row: number, col: number) => void;
  disabled: boolean;
}

export default function TicTacToe({ board, onMove, disabled }: TicTacToeProps) {
  const renderSymbol = (symbol: PlayerSymbol | null) => {
    if (symbol === 'X') return '❌';
    if (symbol === 'O') return '⭕';
    return '';
  };

  return (
    <div className="tictactoe-board">
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={`board-cell ${cell ? 'filled' : ''} ${disabled && !cell ? 'disabled' : ''} ${disabled && cell ? 'opponent-move' : ''}`}
              onClick={() => !disabled && !cell && onMove(rowIndex, colIndex)}
              disabled={disabled || !!cell}
            >
              {renderSymbol(cell)}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
