import React, { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';
import { getHighScore, updateHighScore } from '../../../../../utils/gameScore';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const INITIAL_GAME_SPEED = 250; // 初始速度较慢
const MIN_GAME_SPEED = 80; // 最快速度
const SPEED_DECREASE_PER_SCORE = 5; // 每10分减少5ms

// 根据分数计算游戏速度
const calculateGameSpeed = (score: number): number => {
  const speedDecrease = Math.floor(score / 10) * SPEED_DECREASE_PER_SCORE;
  return Math.max(MIN_GAME_SPEED, INITIAL_GAME_SPEED - speedDecrease);
};

type Position = { x: number; y: number };
type Direction = { x: number; y: number };

// 生成随机食物位置
const generateFood = (snake: Position[]): Position => {
  let food: Position;
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((segment) => segment.x === food.x && segment.y === food.y));
  return food;
};

// 检查碰撞
const checkCollision = (head: Position, snake: Position[]): boolean => {
  // 检查是否撞墙
  if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
    return true;
  }
  // 检查是否撞到自己
  return snake.some((segment) => segment.x === head.x && segment.y === head.y);
};

const Snake: React.FC = () => {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>(() => generateFood(INITIAL_SNAKE));
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => getHighScore('snake'));
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const directionRef = useRef<Direction>(INITIAL_DIRECTION);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const snakeRef = useRef<Position[]>(INITIAL_SNAKE);
  const foodRef = useRef<Position>(generateFood(INITIAL_SNAKE));
  const scoreRef = useRef(0);

  // 同步 ref
  useEffect(() => {
    directionRef.current = direction;
    snakeRef.current = snake;
    foodRef.current = food;
    scoreRef.current = score;
  }, [direction, snake, food, score]);

  // 游戏结束时更新最高分
  useEffect(() => {
    if (gameOver && score > 0) {
      const newHighScore = updateHighScore('snake', score);
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

    const gameLoop = () => {
      const currentSnake = snakeRef.current;
      const currentDirection = directionRef.current;
      const currentFood = foodRef.current;

      // 计算新的头部位置
      const head = {
        x: currentSnake[0].x + currentDirection.x,
        y: currentSnake[0].y + currentDirection.y,
      };

      // 检查碰撞
      if (checkCollision(head, currentSnake)) {
        setGameOver(true);
        return;
      }

      // 创建新的蛇身
      const newSnake = [head, ...currentSnake];

      // 检查是否吃到食物
      if (head.x === currentFood.x && head.y === currentFood.y) {
        // 吃到食物，不删除尾部，生成新食物
        const newFood = generateFood(newSnake);
        setFood(newFood);
        const newScore = scoreRef.current + 10;
        setScore(newScore);
        // 更新最高分
        const newHighScore = updateHighScore('snake', newScore);
        setHighScore(newHighScore);
      } else {
        // 没吃到食物，删除尾部
        newSnake.pop();
      }

      setSnake(newSnake);
    };

    const startGameLoop = () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      const currentSpeed = calculateGameSpeed(scoreRef.current);
      gameLoopRef.current = setInterval(gameLoop, currentSpeed);
    };

    startGameLoop();

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameOver, isPaused]);

  // 处理方向改变
  const changeDirection = useCallback((newDirection: Direction) => {
    setDirection((prev) => {
      // 防止反向移动
      if (
        (newDirection.x === -prev.x && newDirection.y === prev.y) ||
        (newDirection.y === -prev.y && newDirection.x === prev.x)
      ) {
        return prev;
      }
      return newDirection;
    });
  }, []);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (!isPaused) {
            changeDirection({ x: 0, y: -1 });
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isPaused) {
            changeDirection({ x: 0, y: 1 });
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (!isPaused) {
            changeDirection({ x: -1, y: 0 });
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!isPaused) {
            changeDirection({ x: 1, y: 0 });
          }
          break;
        case ' ':
        case 'p':
        case 'P':
          e.preventDefault();
          setIsPaused((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameOver, isPaused, changeDirection]);

  // 重新开始游戏
  const handleRestart = () => {
    const initialSnake = INITIAL_SNAKE;
    const newFood = generateFood(initialSnake);
    setSnake(initialSnake);
    setFood(newFood);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    directionRef.current = INITIAL_DIRECTION;
    snakeRef.current = initialSnake;
    foodRef.current = newFood;
  };

  // 获取方向箭头
  const getDirectionArrow = (): string => {
    if (direction.x === 1) return '→'; // 右
    if (direction.x === -1) return '←'; // 左
    if (direction.y === -1) return '↑'; // 上
    if (direction.y === 1) return '↓'; // 下
    return '→';
  };

  // 渲染游戏网格
  const renderGrid = () => {
    const grid: (string | null)[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null));

    // 绘制食物
    if (food.y >= 0 && food.y < GRID_SIZE && food.x >= 0 && food.x < GRID_SIZE) {
      grid[food.y][food.x] = 'food';
    }

    // 绘制蛇
    snake.forEach((segment, index) => {
      if (segment.y >= 0 && segment.y < GRID_SIZE && segment.x >= 0 && segment.x < GRID_SIZE) {
        grid[segment.y][segment.x] = index === 0 ? 'head' : 'body';
      }
    });

    return grid;
  };

  const grid = renderGrid();
  const directionArrow = getDirectionArrow();

  return (
    <div className='snake-game'>
      <div className='snake-header'>
        <div className='snake-control-hint'>↑↓←→控制</div>
        <div className='snake-info'>
          <div className='score-container'>
            <div className='score-label'>分数：</div>
            <div className='score-value'>{score}</div>
          </div>
          <div className='score-container'>
            <div className='score-label'>最高分：</div>
            <div className='score-value'>{highScore}</div>
          </div>
          <div className='score-container'>
            <div className='score-label'>长度：</div>
            <div className='score-value'>{snake.length}</div>
          </div>
          <button className='restart-button' onClick={handleRestart}>
            重新开始
          </button>
        </div>
      </div>

      <div className='snake-board-container'>
        {gameOver && (
          <div className='game-over'>
            <div className='game-over-content'>
              <h3>游戏结束！</h3>
              <p>最终分数: {score}</p>
              <p>历史最高: {highScore}</p>
              {score === highScore && score > 0 && <p style={{ color: 'var(--theme-primary, #667eea)', fontWeight: 600 }}>🎉 新纪录！</p>}
              <p>蛇的长度: {snake.length}</p>
              <button onClick={handleRestart}>再玩一次</button>
            </div>
          </div>
        )}

        {isPaused && !gameOver && (
          <div className='pause-overlay'>
            <div className='pause-content'>暂停</div>
          </div>
        )}

        <div
          className='snake-board'
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`snake-cell ${
                  cell === 'head' ? 'snake-head' : cell === 'body' ? 'snake-body' : cell === 'food' ? 'snake-food' : ''
                }`}
              >
                {cell === 'head' && <span className='snake-head-arrow'>{directionArrow}</span>}
                {cell === 'food' && <span className='snake-food-icon'>🍎</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Snake;
