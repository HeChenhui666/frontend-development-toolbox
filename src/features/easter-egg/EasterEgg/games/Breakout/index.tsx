import React, { useRef, useEffect, useState, useCallback } from 'react';
import './index.css';
import { getHighScore, updateHighScore } from '../../../../../utils/gameScore';

// ── 画布与基础常量 ──
const CANVAS_WIDTH = 380;
const CANVAS_HEIGHT = 340;
const PADDLE_HEIGHT = 8;
const PADDLE_SPEED = 7;
const BALL_RADIUS = 4;
const BASE_BALL_SPEED = 3.2;
const BASE_PADDLE_WIDTH = 60;

// ── 砖块网格（更小更密）──
const BRICK_COLS = 12;
const BRICK_MAX_ROWS = 8;
const BRICK_WIDTH = 28;
const BRICK_HEIGHT = 11;
const BRICK_PADDING = 2;
const BRICK_OFFSET_TOP = 28;
const BRICK_OFFSET_LEFT = (CANVAS_WIDTH - BRICK_COLS * (BRICK_WIDTH + BRICK_PADDING) + BRICK_PADDING) / 2;

// ── 颜色 ──
const ROW_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6'];
const STEEL_COLOR = '#475569';
const STEEL_BORDER = '#64748b';
const MULTI_HIT_COLORS: Record<number, string> = { 3: '#fbbf24', 2: '#fb923c', 1: '#f87171' };

type PowerUpType = 'widen' | 'multiball' | 'pierce' | 'slow' | 'life';

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  piercing: boolean;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  alive: boolean;
  color: string;
  row: number;
  /** 剩余血量（0=不可破坏钢铁砖 1=普通 2/3=多血） */
  hp: number;
  /** 是否不可破坏 */
  steel: boolean;
}

interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  dy: number;
}

const POWERUP_COLORS: Record<PowerUpType, string> = {
  widen: '#22c55e',
  multiball: '#3b82f6',
  pierce: '#f59e0b',
  slow: '#a78bfa',
  life: '#ec4899',
};

const POWERUP_LABELS: Record<PowerUpType, string> = {
  widen: 'W',
  multiball: 'M',
  pierce: 'P',
  slow: 'S',
  life: '♥',
};

// ── 关卡配置 ──
interface LevelConfig {
  rows: number;
  /** 随机缺失砖块比例 0~1 */
  holeProbability: number;
  /** 多血砖块比例 */
  multiHitProbability: number;
  /** 钢铁砖块比例 */
  steelProbability: number;
  /** 球速倍率 */
  speedMultiplier: number;
  /** 挡板宽度 */
  paddleWidth: number;
  /** 布局模式 */
  pattern: 'full' | 'checkerboard' | 'diamond' | 'zigzag' | 'fortress' | 'random' | 'spiral' | 'cross';
}

const LAYOUT_PATTERNS: LevelConfig['pattern'][] = ['full', 'checkerboard', 'diamond', 'zigzag', 'fortress', 'random', 'spiral', 'cross'];

const getLevelConfig = (level: number): LevelConfig => {
  const clampedLevel = Math.min(level, 30);
  return {
    rows: Math.min(BRICK_MAX_ROWS, 5 + Math.floor(level / 3)),
    holeProbability: Math.max(0, 0.08 + (clampedLevel - 1) * 0.015),
    multiHitProbability: Math.min(0.45, 0.05 + (clampedLevel - 1) * 0.04),
    steelProbability: Math.min(0.15, Math.max(0, (clampedLevel - 2) * 0.02)),
    speedMultiplier: 1 + (clampedLevel - 1) * 0.08,
    paddleWidth: Math.max(40, BASE_PADDLE_WIDTH - (clampedLevel - 1) * 1.5),
    pattern: LAYOUT_PATTERNS[(level - 1) % LAYOUT_PATTERNS.length],
  };
};

// ── 布局生成 ──
const shouldPlaceBrick = (row: number, col: number, rows: number, pattern: LevelConfig['pattern']): boolean => {
  switch (pattern) {
    case 'full':
      return true;
    case 'checkerboard':
      return (row + col) % 2 === 0;
    case 'diamond': {
      const centerRow = (rows - 1) / 2;
      const centerCol = (BRICK_COLS - 1) / 2;
      return Math.abs(row - centerRow) / rows + Math.abs(col - centerCol) / BRICK_COLS < 0.55;
    }
    case 'zigzag':
      return col % 3 !== (row % 3);
    case 'fortress':
      return row === 0 || row === rows - 1 || col === 0 || col === BRICK_COLS - 1 || (row === Math.floor(rows / 2) && col > 2 && col < BRICK_COLS - 3);
    case 'random':
      return Math.random() > 0.22;
    case 'spiral': {
      const centerR = rows / 2;
      const centerC = BRICK_COLS / 2;
      const angle = Math.atan2(row - centerR, col - centerC);
      const dist = Math.sqrt((row - centerR) ** 2 + ((col - centerC) * 0.6) ** 2);
      return Math.sin(angle * 3 + dist * 1.5) > -0.3;
    }
    case 'cross':
      return Math.abs(col - (BRICK_COLS - 1) / 2) < 2 || Math.abs(row - (rows - 1) / 2) < 1.5;
    default:
      return true;
  }
};

const createLevelBricks = (level: number): Brick[] => {
  const config = getLevelConfig(level);
  const bricks: Brick[] = [];

  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      if (!shouldPlaceBrick(row, col, config.rows, config.pattern)) continue;
      if (Math.random() < config.holeProbability) continue;

      const isSteel = Math.random() < config.steelProbability;
      const isMultiHit = !isSteel && Math.random() < config.multiHitProbability;
      const hitPoints = isSteel ? 0 : isMultiHit ? (Math.random() < 0.3 ? 3 : 2) : 1;

      bricks.push({
        x: BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_PADDING),
        y: BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        alive: true,
        color: isSteel ? STEEL_COLOR : ROW_COLORS[row % ROW_COLORS.length],
        row,
        hp: hitPoints,
        steel: isSteel,
      });
    }
  }

  // 确保至少有 10 个可破坏砖块
  const breakable = bricks.filter((b) => !b.steel);
  if (breakable.length < 10) {
    bricks.forEach((b) => { if (b.steel && breakable.length < 10) { b.steel = false; b.hp = 1; b.color = ROW_COLORS[b.row % ROW_COLORS.length]; breakable.push(b); } });
  }

  return bricks;
};

const Breakout: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => getHighScore('breakout'));
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover' | 'levelup'>('idle');

  const gameRef = useRef({
    paddleX: (CANVAS_WIDTH - BASE_PADDLE_WIDTH) / 2,
    paddleWidth: BASE_PADDLE_WIDTH,
    balls: [] as Ball[],
    bricks: [] as Brick[],
    powerUps: [] as PowerUp[],
    score: 0,
    lives: 3,
    level: 1,
    ballSpeed: BASE_BALL_SPEED,
  });

  const resetBall = useCallback((speed: number): Ball => ({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 30,
    dx: speed * (Math.random() > 0.5 ? 1 : -1),
    dy: -speed,
    piercing: false,
  }), []);

  const initLevel = useCallback((levelNum: number, keepScore = false) => {
    const config = getLevelConfig(levelNum);
    const game = gameRef.current;
    game.level = levelNum;
    game.ballSpeed = BASE_BALL_SPEED * config.speedMultiplier;
    game.paddleWidth = config.paddleWidth;
    game.paddleX = (CANVAS_WIDTH - config.paddleWidth) / 2;
    game.balls = [resetBall(game.ballSpeed)];
    game.bricks = createLevelBricks(levelNum);
    game.powerUps = [];
    if (!keepScore) { game.score = 0; game.lives = 3; }
    setScore(game.score);
    setLives(game.lives);
    setLevel(levelNum);
  }, [resetBall]);

  const startGame = useCallback(() => {
    initLevel(1);
    setGameState('playing');
  }, [initLevel]);

  const nextLevel = useCallback(() => {
    const game = gameRef.current;
    const nextLevelNum = game.level + 1;
    initLevel(nextLevelNum, true);
    setGameState('playing');
  }, [initLevel]);

  const togglePause = useCallback(() => {
    setGameState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
  }, []);

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (gameState === 'idle' || gameState === 'gameover') startGame();
        else if (gameState === 'levelup') nextLevel();
        else togglePause();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, startGame, nextLevel, togglePause]);

  // 鼠标/触摸控制
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMove = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const game = gameRef.current;
      game.paddleX = Math.max(0, Math.min(CANVAS_WIDTH - game.paddleWidth, relativeX - game.paddleWidth / 2));
    };
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); handleMove(e.touches[0].clientX); };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  // 游戏主循环
  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      const game = gameRef.current;
      const keys = keysRef.current;

      // 键盘移动挡板
      if (keys.has('ArrowLeft') || keys.has('a')) {
        game.paddleX = Math.max(0, game.paddleX - PADDLE_SPEED);
      }
      if (keys.has('ArrowRight') || keys.has('d')) {
        game.paddleX = Math.min(CANVAS_WIDTH - game.paddleWidth, game.paddleX + PADDLE_SPEED);
      }

      // 更新球
      const ballsToRemove: number[] = [];
      for (let ballIndex = 0; ballIndex < game.balls.length; ballIndex++) {
        const ball = game.balls[ballIndex];
        ball.x += ball.dx;
        ball.y += ball.dy;

        // 墙壁碰撞
        if (ball.x - BALL_RADIUS <= 0 || ball.x + BALL_RADIUS >= CANVAS_WIDTH) ball.dx = -ball.dx;
        if (ball.y - BALL_RADIUS <= 0) ball.dy = -ball.dy;

        // 挡板碰撞
        if (
          ball.dy > 0 &&
          ball.y + BALL_RADIUS >= CANVAS_HEIGHT - PADDLE_HEIGHT - 4 &&
          ball.y + BALL_RADIUS <= CANVAS_HEIGHT &&
          ball.x >= game.paddleX &&
          ball.x <= game.paddleX + game.paddleWidth
        ) {
          ball.dy = -Math.abs(ball.dy);
          const hitPos = (ball.x - game.paddleX) / game.paddleWidth - 0.5;
          ball.dx = hitPos * game.ballSpeed * 2.5;
          const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
          const normalizedSpeed = game.ballSpeed + 0.5;
          ball.dx = (ball.dx / speed) * normalizedSpeed;
          ball.dy = (ball.dy / speed) * normalizedSpeed;
        }

        // 球出界
        if (ball.y > CANVAS_HEIGHT + BALL_RADIUS) {
          ballsToRemove.push(ballIndex);
        }

        // 砖块碰撞
        for (const brick of game.bricks) {
          if (!brick.alive) continue;
          if (
            ball.x + BALL_RADIUS > brick.x &&
            ball.x - BALL_RADIUS < brick.x + brick.width &&
            ball.y + BALL_RADIUS > brick.y &&
            ball.y - BALL_RADIUS < brick.y + brick.height
          ) {
            if (brick.steel) {
              // 钢铁砖块：反弹但不破坏（穿透球可忽略）
              if (!ball.piercing) ball.dy = -ball.dy;
            } else {
              brick.hp--;
              if (brick.hp <= 0) {
                brick.alive = false;
                game.score += (BRICK_MAX_ROWS - brick.row) * 10 * game.level;
                // 随机掉落道具（15%概率）
                if (Math.random() < 0.15) {
                  const types: PowerUpType[] = ['widen', 'multiball', 'pierce', 'slow', 'life'];
                  game.powerUps.push({
                    x: brick.x + brick.width / 2,
                    y: brick.y + brick.height,
                    type: types[Math.floor(Math.random() * types.length)],
                    dy: 1.5,
                  });
                }
              } else {
                // 多血砖块变色
                brick.color = MULTI_HIT_COLORS[brick.hp] || brick.color;
              }
              if (!ball.piercing) ball.dy = -ball.dy;
              setScore(game.score);
            }
            break;
          }
        }
      }

      // 移除出界的球
      for (let i = ballsToRemove.length - 1; i >= 0; i--) {
        game.balls.splice(ballsToRemove[i], 1);
      }

      // 所有球都没了
      if (game.balls.length === 0) {
        game.lives--;
        setLives(game.lives);
        if (game.lives <= 0) {
          if (game.score > highScore) {
            setHighScore(game.score);
            updateHighScore('breakout', game.score);
          }
          setGameState('gameover');
          return;
        }
        game.balls = [resetBall(game.ballSpeed)];
        game.paddleWidth = getLevelConfig(game.level).paddleWidth;
      }

      // 更新道具
      game.powerUps = game.powerUps.filter((powerUp) => {
        powerUp.y += powerUp.dy;
        if (powerUp.y > CANVAS_HEIGHT) return false;

        if (
          powerUp.y + 6 >= CANVAS_HEIGHT - PADDLE_HEIGHT - 4 &&
          powerUp.y <= CANVAS_HEIGHT &&
          powerUp.x >= game.paddleX &&
          powerUp.x <= game.paddleX + game.paddleWidth
        ) {
          switch (powerUp.type) {
            case 'widen':
              game.paddleWidth = Math.min(CANVAS_WIDTH * 0.4, game.paddleWidth + 20);
              break;
            case 'multiball': {
              const baseBall = game.balls[0] || resetBall(game.ballSpeed);
              game.balls.push(
                { ...baseBall, dx: baseBall.dx + 1, dy: -Math.abs(baseBall.dy), piercing: false },
                { ...baseBall, dx: baseBall.dx - 1, dy: -Math.abs(baseBall.dy), piercing: false },
              );
              break;
            }
            case 'pierce':
              game.balls.forEach((b) => { b.piercing = true; });
              setTimeout(() => game.balls.forEach((b) => { b.piercing = false; }), 5000);
              break;
            case 'slow':
              game.balls.forEach((b) => {
                b.dx *= 0.7;
                b.dy *= 0.7;
              });
              break;
            case 'life':
              game.lives = Math.min(5, game.lives + 1);
              setLives(game.lives);
              break;
          }
          return false;
        }
        return true;
      });

      // 检测通关（所有可破坏砖块都消灭了）
      if (game.bricks.filter((b) => !b.steel).every((b) => !b.alive)) {
        if (game.score > highScore) {
          setHighScore(game.score);
          updateHighScore('breakout', game.score);
        }
        setGameState('levelup');
        return;
      }

      // ── 渲染 ──
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 砖块
      for (const brick of game.bricks) {
        if (!brick.alive) continue;
        ctx.fillStyle = brick.color;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 2);
        ctx.fill();
        // 钢铁砖块：加边框和对角线
        if (brick.steel) {
          ctx.strokeStyle = STEEL_BORDER;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(brick.x + 2, brick.y + 2);
          ctx.lineTo(brick.x + brick.width - 2, brick.y + brick.height - 2);
          ctx.moveTo(brick.x + brick.width - 2, brick.y + 2);
          ctx.lineTo(brick.x + 2, brick.y + brick.height - 2);
          ctx.strokeStyle = STEEL_BORDER + '88';
          ctx.stroke();
        }
        // 多血砖块：显示血量数字
        if (brick.hp > 1) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(brick.hp), brick.x + brick.width / 2, brick.y + brick.height / 2);
        }
      }

      // 挡板
      const paddleGradient = ctx.createLinearGradient(game.paddleX, 0, game.paddleX + game.paddleWidth, 0);
      paddleGradient.addColorStop(0, '#818cf8');
      paddleGradient.addColorStop(1, '#6366f1');
      ctx.fillStyle = paddleGradient;
      ctx.beginPath();
      ctx.roundRect(game.paddleX, CANVAS_HEIGHT - PADDLE_HEIGHT - 4, game.paddleWidth, PADDLE_HEIGHT, 4);
      ctx.fill();

      // 球
      for (const ball of game.balls) {
        ctx.fillStyle = ball.piercing ? '#f59e0b' : '#ffffff';
        ctx.shadowColor = ball.piercing ? '#f59e0b' : '#818cf8';
        ctx.shadowBlur = ball.piercing ? 10 : 6;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 道具
      for (const powerUp of game.powerUps) {
        ctx.fillStyle = POWERUP_COLORS[powerUp.type];
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(POWERUP_LABELS[powerUp.type], powerUp.x, powerUp.y);
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameState, highScore, resetBall]);

  // idle / gameover 画面
  useEffect(() => {
    if (gameState !== 'idle' && gameState !== 'gameover') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const previewBricks = createLevelBricks(1);
    for (const brick of previewBricks) {
      ctx.fillStyle = brick.color + '44';
      ctx.beginPath();
      ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 2);
      ctx.fill();
    }
  }, [gameState]);

  return (
    <div className="breakout">
      <div className="breakout-header">
        <span>关卡: <span className="breakout-score">{level}</span></span>
        <span>分数: <span className="breakout-score">{score}</span></span>
        <span>最高: <span className="breakout-score">{highScore}</span></span>
        <span className="breakout-lives">{'❤️'.repeat(Math.max(0, lives))}</span>
      </div>

      <div className="breakout-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="breakout-canvas"
          onClick={() => {
            if (gameState === 'idle' || gameState === 'gameover') startGame();
            else if (gameState === 'levelup') nextLevel();
          }}
        />
        {gameState === 'idle' && (
          <div className="breakout-overlay">
            <div className="breakout-overlay-title">🧱 打砖块</div>
            <button className="breakout-btn breakout-btn--primary" onClick={startGame}>开始游戏</button>
            <span className="breakout-hint">鼠标或方向键控制 · 无限关卡 · 每局随机布局</span>
          </div>
        )}
        {gameState === 'paused' && (
          <div className="breakout-overlay">
            <div className="breakout-overlay-title">⏸ 暂停</div>
            <button className="breakout-btn breakout-btn--primary" onClick={togglePause}>继续</button>
          </div>
        )}
        {gameState === 'gameover' && (
          <div className="breakout-overlay">
            <div className="breakout-overlay-title">💥 游戏结束</div>
            <div className="breakout-overlay-score">关卡 {level} · 得分 {score}</div>
            <button className="breakout-btn breakout-btn--primary" onClick={startGame}>再来一局</button>
          </div>
        )}
        {gameState === 'levelup' && (
          <div className="breakout-overlay">
            <div className="breakout-overlay-title">🎉 第 {level} 关通过！</div>
            <div className="breakout-overlay-score">当前得分: {score}</div>
            <button className="breakout-btn breakout-btn--primary" onClick={nextLevel}>进入第 {level + 1} 关</button>
          </div>
        )}
      </div>

      {gameState === 'playing' && (
        <div className="breakout-controls">
          <button className="breakout-btn" onClick={togglePause}>暂停</button>
          <span className="breakout-hint">W=加宽 M=多球 P=穿透 S=减速 ♥=加命</span>
        </div>
      )}
    </div>
  );
};

export default Breakout;
