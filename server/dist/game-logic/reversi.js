"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidReversiMove = isValidReversiMove;
exports.makeReversiMove = makeReversiMove;
exports.hasValidMoves = hasValidMoves;
exports.getValidReversiMoves = getValidReversiMoves;
exports.getReversiScores = getReversiScores;
exports.getBestReversiMove = getBestReversiMove;
function isValidReversiMove(board, row, col, symbol) {
    if (board[row][col] !== null)
        return false;
    const opponent = symbol === 'black' ? 'white' : 'black';
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];
    for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;
        let hasOpponent = false;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            if (board[r][c] === null)
                break;
            if (board[r][c] === opponent) {
                hasOpponent = true;
            }
            else if (board[r][c] === symbol) {
                if (hasOpponent)
                    return true;
                break;
            }
            r += dr;
            c += dc;
        }
    }
    return false;
}
function makeReversiMove(board, row, col, symbol) {
    board[row][col] = symbol;
    const opponent = symbol === 'black' ? 'white' : 'black';
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];
    const flipped = [];
    for (const [dr, dc] of directions) {
        const toFlip = [];
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            if (board[r][c] === null)
                break;
            if (board[r][c] === opponent) {
                toFlip.push([r, c]);
            }
            else if (board[r][c] === symbol) {
                toFlip.forEach(([fr, fc]) => {
                    board[fr][fc] = symbol;
                    flipped.push([fr, fc]);
                });
                break;
            }
            r += dr;
            c += dc;
        }
    }
    return flipped;
}
function hasValidMoves(board, symbol) {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (isValidReversiMove(board, i, j, symbol)) {
                return true;
            }
        }
    }
    return false;
}
function getValidReversiMoves(board, symbol) {
    const moves = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (isValidReversiMove(board, i, j, symbol)) {
                moves.push([i, j]);
            }
        }
    }
    return moves;
}
function getReversiScores(board) {
    let black = 0;
    let white = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (board[i][j] === 'black')
                black++;
            else if (board[i][j] === 'white')
                white++;
        }
    }
    return { black, white };
}
function getBestReversiMove(board, symbol) {
    const validMoves = getValidReversiMoves(board, symbol);
    if (validMoves.length === 0)
        return null;
    const cornerBonus = 100;
    const edgeBonus = 10;
    let bestMove = validMoves[0];
    let bestScore = -Infinity;
    for (const [row, col] of validMoves) {
        let score = 0;
        // Corner bonus
        if ((row === 0 || row === 7) && (col === 0 || col === 7)) {
            score += cornerBonus;
        }
        // Edge bonus
        else if (row === 0 || row === 7 || col === 0 || col === 7) {
            score += edgeBonus;
        }
        // Count flips
        const tempBoard = board.map(row => [...row]);
        const flipped = makeReversiMove(tempBoard, row, col, symbol);
        score += flipped.length;
        if (score > bestScore) {
            bestScore = score;
            bestMove = [row, col];
        }
    }
    return bestMove;
}
//# sourceMappingURL=reversi.js.map