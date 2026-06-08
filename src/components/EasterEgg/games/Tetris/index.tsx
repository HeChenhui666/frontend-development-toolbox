import React, { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';
import { getHighScore, updateHighScore } from '../../../../utils/gameScore';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// 方块形状定义
const TETROMINOES = {
  I: [
    [[1, 1, 1, 1]],
  ],
  O: [
    [[1, 1], [1, 1]],
  ],
  T: [
    [[0, 1, 0], [1, 1, 1]],
  ],
  S: [
    [[0, 1, 1], [1, 1, 0]],
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1]],
  ],
  J: [
    [[1, 0, 0], [1, 1, 1]],
  ],
  L: [
    [[0, 0, 1], [1, 1, 1]],
  ],
};

type TetrominoType = keyof typeof TETROMINOES;
type Board = number[][];

// 旋转方块
const rotateTetromino = (shape: number[][]): number[][] => {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: number[][] = Array(cols).fill(0).map(() => Array(rows).fill(0));
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      rotated[j][rows - 1 - i] = shape[i][j];
    }
  }
  
  return rotated;
};

// 生成随机方块
const getRandomTetromino = (): { type: TetrominoType; shape: number[][]; x: number; y: number } => {
  const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const type = types[Math.floor(Math.random() * types.length)];
  const shape = TETROMINOES[type][0];
  
  return {
    type,
    shape,
    x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
};

// 检查碰撞
const checkCollision = (
  board: Board,
  shape: number[][],
  x: number,
  y: number
): boolean => {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const newX = x + col;
        const newY = y + row;
        
        if (
          newX < 0 ||
          newX >= BOARD_WIDTH ||
          newY >= BOARD_HEIGHT ||
          (newY >= 0 && board[newY][newX])
        ) {
          return true;
        }
      }
    }
  }
  return false;
};

// 合并方块到棋盘
const mergeTetromino = (board: Board, shape: number[][], x: number, y: number): Board => {
  const newBoard = board.map(row => [...row]);
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const newY = y + row;
        const newX = x + col;
        if (newY >= 0) {
          newBoard[newY][newX] = 1;
        }
      }
    }
  }
  
  return newBoard;
};

// 清除完整行
const clearLines = (board: Board): { newBoard: Board; linesCleared: number } => {
  const newBoard: Board = [];
  let linesCleared = 0;
  
  for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
    if (board[row].every(cell => cell === 1)) {
      linesCleared++;
    } else {
      newBoard.unshift([...board[row]]);
    }
  }
  
  // 填充顶部空行
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(0));
  }
  
  return { newBoard, linesCleared };
};

const Tetris: React.FC = () => {
  const [board, setBoard] = useState<Board>(() =>
    Array(BOARD_HEIGHT).fill(0).map(() => Array(BOARD_WIDTH).fill(0))
  );
  const [currentPiece, setCurrentPiece] = useState(() => getRandomTetromino());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => getHighScore('tetris'));
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const dropTimeRef = useRef(1000);
  const boardRef = useRef(board);
  const currentPieceRef = useRef(currentPiece);

  // 同步 ref
  useEffect(() => {
    boardRef.current = board;
    currentPieceRef.current = currentPiece;
  }, [board, currentPiece]);

  // 游戏结束时更新最高分
  useEffect(() => {
    if (gameOver && score > 0) {
      const newHighScore = updateHighScore('tetris', score);
      setHighScore(newHighScore);
    }
  }, [gameOver, score]);

  // 游戏循环
  useEffect(() => {
    if (gameOver || isPaused) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const dropPiece = () => {
      const currentBoard = boardRef.current;
      const currentPiece = currentPieceRef.current;
      
      const newY = currentPiece.y + 1;
      
      if (checkCollision(currentBoard, currentPiece.shape, currentPiece.x, newY)) {
        // 方块无法继续下落，固定到棋盘
        const newBoard = mergeTetromino(currentBoard, currentPiece.shape, currentPiece.x, currentPiece.y);
        const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
        
        setBoard(clearedBoard);
        setLines(prevLines => {
          const newLines = prevLines + linesCleared;
          const newLevel = Math.floor(newLines / 10) + 1;
          setLevel(newLevel);
          dropTimeRef.current = Math.max(100, 1000 - (newLevel - 1) * 100);

          // 计算分数
          setScore(prevScore => {
            const newScore = prevScore + linesCleared * 100 * newLevel;
            // 更新最高分
            const newHighScore = updateHighScore('tetris', newScore);
            setHighScore(newHighScore);
            return newScore;
          });

          return newLines;
        });
        
        // 生成新方块
        const newPiece = getRandomTetromino();
        if (checkCollision(clearedBoard, newPiece.shape, newPiece.x, newPiece.y)) {
          setGameOver(true);
          return;
        }
        setCurrentPiece(newPiece);
      } else {
        setCurrentPiece({ ...currentPiece, y: newY });
      }
    };

    // 清除旧的定时器
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    
    gameLoopRef.current = setInterval(dropPiece, dropTimeRef.current);
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameOver, isPaused, level]);

  // 移动方块
  const movePiece = useCallback((dx: number, dy: number) => {
    if (gameOver || isPaused) return;

    setCurrentPiece(prev => {
      const newX = prev.x + dx;
      const newY = prev.y + dy;

      if (!checkCollision(boardRef.current, prev.shape, newX, newY)) {
        return { ...prev, x: newX, y: newY };
      }
      return prev;
    });
  }, [gameOver, isPaused]);

  // 旋转方块
  const rotatePiece = useCallback(() => {
    if (gameOver || isPaused) return;

    setCurrentPiece(prev => {
      const rotatedShape = rotateTetromino(prev.shape);

      if (!checkCollision(boardRef.current, rotatedShape, prev.x, prev.y)) {
        return { ...prev, shape: rotatedShape };
      }
      return prev;
    });
  }, [gameOver, isPaused]);

  // 快速下落
  const hardDrop = useCallback(() => {
    if (gameOver || isPaused) return;
    
    setCurrentPiece(prev => {
      let newY = prev.y;
      while (!checkCollision(board, prev.shape, prev.x, newY + 1)) {
        newY++;
      }
      
      const newBoard = mergeTetromino(board, prev.shape, prev.x, newY);
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
      
      setBoard(clearedBoard);
      setLines(prev => {
        const newLines = prev + linesCleared;
        const newLevel = Math.floor(newLines / 10) + 1;
        setLevel(newLevel);
        dropTimeRef.current = Math.max(100, 1000 - (newLevel - 1) * 100);
        return newLines;
      });
      setScore(prev => {
        const newScore = prev + linesCleared * 100 * level;
        // 更新最高分
        const newHighScore = updateHighScore('tetris', newScore);
        setHighScore(newHighScore);
        return newScore;
      });
      
      const newPiece = getRandomTetromino();
      if (checkCollision(clearedBoard, newPiece.shape, newPiece.x, newPiece.y)) {
        setGameOver(true);
        return prev;
      }
      return newPiece;
    });
  }, [board, gameOver, isPaused, level]);

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePiece(0, 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotatePiece();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePiece, rotatePiece, hardDrop, gameOver]);

  // 重新开始
  const handleRestart = () => {
    setBoard(Array(BOARD_HEIGHT).fill(0).map(() => Array(BOARD_WIDTH).fill(0)));
    setCurrentPiece(getRandomTetromino());
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setIsPaused(false);
    dropTimeRef.current = 1000;
  };

  // 渲染棋盘
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    // 将当前方块绘制到棋盘上
    if (!gameOver) {
      for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
          if (currentPiece.shape[row][col]) {
            const y = currentPiece.y + row;
            const x = currentPiece.x + col;
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
              displayBoard[y][x] = 2; // 2 表示当前方块
            }
          }
        }
      }
    }
    
    return displayBoard;
  };

  const displayBoard = renderBoard();

  return (
    <div className="tetris">
      <div className="tetris-header">
        <div className="tetris-title">
          <h2>🎮 俄罗斯方块</h2>
          <p className="tetris-hint">方向键控制，空格快速下落，P暂停</p>
        </div>
        <div className="tetris-info">
          <div className="info-item">
            <div className="info-label">分数</div>
            <div className="info-value">{score}</div>
          </div>
          <div className="info-item">
            <div className="info-label">最高分</div>
            <div className="info-value">{highScore}</div>
          </div>
          <div className="info-item">
            <div className="info-label">等级</div>
            <div className="info-value">{level}</div>
          </div>
          <div className="info-item">
            <div className="info-label">行数</div>
            <div className="info-value">{lines}</div>
          </div>
          <button className="restart-button" onClick={handleRestart}>
            重新开始
          </button>
        </div>
      </div>

      <div className="tetris-board-container">
        {gameOver && (
          <div className="game-over-overlay">
            <div className="game-over-content">
              <h3>游戏结束！</h3>
              <p>最终分数: {score}</p>
              <p>历史最高: {highScore}</p>
              {score === highScore && score > 0 && <p style={{ color: 'var(--theme-primary, #667eea)', fontWeight: 600 }}>🎉 新纪录！</p>}
              <button onClick={handleRestart}>再玩一次</button>
            </div>
          </div>
        )}
        
        {isPaused && !gameOver && (
          <div className="pause-overlay">
            <div className="pause-content">暂停</div>
          </div>
        )}

        <div className="tetris-board">
          {displayBoard.map((row, rowIndex) => (
            <div key={rowIndex} className="tetris-row">
              {row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`tetris-cell ${
                    cell === 1 ? 'filled' : cell === 2 ? 'current' : ''
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tetris;

