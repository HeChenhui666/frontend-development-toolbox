import React, { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';
import { getHighScore, updateHighScore } from '../../../../../utils/gameScore';

type Grid = number[][];

const GRID_SIZE = 4;
const INITIAL_TILES = 2;

// 获取随机空位置
const getRandomEmptyCell = (grid: Grid): [number, number] | null => {
  const emptyCells: [number, number][] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid[i][j] === 0) {
        emptyCells.push([i, j]);
      }
    }
  }
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
};

// 生成新数字（2或4，90%概率是2）
const generateNewTile = (): number => {
  return Math.random() < 0.9 ? 2 : 4;
};

// 初始化游戏
const initializeGame = (): Grid => {
  const grid: Grid = Array(GRID_SIZE)
    .fill(0)
    .map(() => Array(GRID_SIZE).fill(0));

  // 随机生成初始的两个数字
  for (let i = 0; i < INITIAL_TILES; i++) {
    const cell = getRandomEmptyCell(grid);
    if (cell) {
      grid[cell[0]][cell[1]] = generateNewTile();
    }
  }

  return grid;
};

// 旋转网格（用于统一处理方向）
const rotateGrid = (grid: Grid, times: number): Grid => {
  let rotated = grid.map(row => [...row]);
  for (let t = 0; t < times; t++) {
    const newGrid: Grid = Array(GRID_SIZE)
      .fill(0)
      .map(() => Array(GRID_SIZE).fill(0));
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        newGrid[j][GRID_SIZE - 1 - i] = rotated[i][j];
      }
    }
    rotated = newGrid;
  }
  return rotated;
};

// 向左移动并合并
const moveLeft = (grid: Grid): { grid: Grid; score: number } => {
  const newGrid: Grid = grid.map(row => [...row]);
  let score = 0;

  for (let i = 0; i < GRID_SIZE; i++) {
    // 移除零
    const row = newGrid[i].filter(val => val !== 0);
    // 合并相同数字
    for (let j = 0; j < row.length - 1; j++) {
      if (row[j] === row[j + 1]) {
        row[j] *= 2;
        score += row[j];
        row[j + 1] = 0;
      }
    }
    // 再次移除零
    const merged = row.filter(val => val !== 0);
    // 填充到左侧
    newGrid[i] = [...merged, ...Array(GRID_SIZE - merged.length).fill(0)];
  }

  return { grid: newGrid, score };
};

// 检查是否可以移动
const canMove = (grid: Grid): boolean => {
  // 检查是否有空位
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid[i][j] === 0) return true;
    }
  }

  // 检查是否有可以合并的相邻数字
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const current = grid[i][j];
      if (
        (i < GRID_SIZE - 1 && grid[i + 1][j] === current) ||
        (j < GRID_SIZE - 1 && grid[i][j + 1] === current)
      ) {
        return true;
      }
    }
  }

  return false;
};

// 检查网格是否改变
const gridsEqual = (grid1: Grid, grid2: Grid): boolean => {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid1[i][j] !== grid2[i][j]) return false;
    }
  }
  return true;
};

const Game2048: React.FC = () => {
  const [grid, setGrid] = useState<Grid>(initializeGame());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => getHighScore('2048'));
  const [gameOver, setGameOver] = useState(false);
  const gameOverRef = useRef(gameOver);

  // 同步ref和state
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  // 游戏结束时更新最高分
  useEffect(() => {
    if (gameOver && score > 0) {
      const newHighScore = updateHighScore('2048', score);
      setHighScore(newHighScore);
    }
  }, [gameOver, score]);

  // 处理移动
  const handleMove = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      if (gameOverRef.current) return;

      setGrid(currentGrid => {
        let rotation = 0;

        // 统一转换为向左移动
        switch (direction) {
          case 'right':
            rotation = 2;
            break;
          case 'up':
            rotation = 3;
            break;
          case 'down':
            rotation = 1;
            break;
          default:
            rotation = 0;
        }

        const rotated = rotateGrid(currentGrid, rotation);
        const { grid: movedGrid, score: moveScore } = moveLeft(rotated);
        const finalGrid = rotateGrid(movedGrid, (4 - rotation) % 4);

        // 检查是否有变化
        if (gridsEqual(currentGrid, finalGrid)) {
          return currentGrid;
        }

        // 添加新数字
        const newCell = getRandomEmptyCell(finalGrid);
        if (newCell) {
          finalGrid[newCell[0]][newCell[1]] = generateNewTile();
        }

        // 更新分数
        setScore(prev => {
          const newScore = prev + moveScore;
          // 更新最高分
          const newHighScore = updateHighScore('2048', newScore);
          setHighScore(newHighScore);
          return newScore;
        });

        // 检查游戏是否结束
        if (!canMove(finalGrid)) {
          setGameOver(true);
        }

        return finalGrid;
      });
    },
    []
  );

  // 键盘事件处理
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleMove('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleMove('right');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleMove('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleMove('down');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleMove]);

  // 重新开始游戏
  const handleRestart = () => {
    setGrid(initializeGame());
    setScore(0);
    setGameOver(false);
  };

  const getTileStyle = (value: number) => ({
    backgroundColor: `var(--theme-game-2048-${value}, var(--theme-primary))`,
    color: `var(--theme-game-2048-text-${value}, var(--theme-onPrimary))`,
  });

  return (
    <div className="game-2048">
      <div className="game-header">
        <div className="game-title">
          <h2>🎮 2048</h2>
          <p className="game-hint">使用方向键控制</p>
        </div>
        <div className="game-info">
          <div className="score-container">
            <div className="score-label">分数</div>
            <div className="score-value">{score}</div>
          </div>
          <div className="score-container">
            <div className="score-label">最高分</div>
            <div className="score-value">{highScore}</div>
          </div>
          <button className="restart-button" onClick={handleRestart}>
            重新开始
          </button>
        </div>
      </div>

      <div className="game-grid-container">
        {gameOver && (
          <div className="game-over">
            <div className="game-over-content">
              <h3>游戏结束！</h3>
              <p>最终分数: {score}</p>
              <p>历史最高: {highScore}</p>
              {score === highScore && score > 0 && <p style={{ color: 'var(--theme-primary, #667eea)', fontWeight: 600 }}>🎉 新纪录！</p>}
              <button onClick={handleRestart}>再玩一次</button>
            </div>
          </div>
        )}

        <div className="game-grid">
          {grid.map((row, i) =>
            row.map((cell, j) => (
              <div key={`${i}-${j}`} className="game-cell">
                {cell !== 0 && (
                  <div
                    className="game-tile"
                    style={{
                      ...getTileStyle(cell),
                      fontSize: cell >= 1024 ? '14px' : cell >= 256 ? '16px' : '18px',
                    }}
                  >
                    {cell}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Game2048;

