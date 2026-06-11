import React, { useRef, useEffect, useState, useCallback } from 'react';
import './index.css';
import { getHighScore, updateHighScore } from '../../../../../utils/gameScore';

const WIDTH = 380;
const HEIGHT = 200;
const GROUND_Y = HEIGHT - 30;
const GRAVITY = 0.6;
const JUMP_FORCE = -10.5;
const BASE_SPEED = 4;
const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 30;
const PLAYER_X = 50;

// 障碍物类型
interface Obstacle {
  x: number;
  width: number;
  height: number;
  /** 'ground' 从地面升起；'air' 悬浮在空中 */
  type: 'ground' | 'air';
  emoji: string;
}

// Bug emoji 列表
const BUG_EMOJIS = ['🐛', '🐞', '🪲', '🦟', '🕷️', '💀', '⚠️', '🔥'];
const AIR_EMOJIS = ['🦇', '👾', '🐝'];

const InfiniteRunner: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => getHighScore('runner'));
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'dead'>('idle');

  const gameRef = useRef({
    playerY: GROUND_Y - PLAYER_HEIGHT,
    velocity: 0,
    isJumping: false,
    isDucking: false,
    obstacles: [] as Obstacle[],
    frameCount: 0,
    score: 0,
    speed: BASE_SPEED,
    nextObstacleFrame: 60,
    groundOffset: 0,
    runFrame: 0,
  });

  const jump = useCallback(() => {
    const game = gameRef.current;
    if (!game.isJumping) {
      game.velocity = JUMP_FORCE;
      game.isJumping = true;
    }
  }, []);

  const startGame = useCallback(() => {
    const game = gameRef.current;
    game.playerY = GROUND_Y - PLAYER_HEIGHT;
    game.velocity = 0;
    game.isJumping = false;
    game.isDucking = false;
    game.obstacles = [];
    game.frameCount = 0;
    game.score = 0;
    game.speed = BASE_SPEED;
    game.nextObstacleFrame = 80;
    game.groundOffset = 0;
    game.runFrame = 0;
    setScore(0);
    setGameState('playing');
  }, []);

  // 输入
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'idle' || gameState === 'dead') startGame();
        else jump();
      }
      if (e.key === 'ArrowDown' && gameState === 'playing') {
        gameRef.current.isDucking = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') gameRef.current.isDucking = false;
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, startGame, jump]);

  const handleClick = useCallback(() => {
    if (gameState === 'idle' || gameState === 'dead') startGame();
    else jump();
  }, [gameState, startGame, jump]);

  // 主循环
  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const game = gameRef.current;
      game.frameCount++;
      game.runFrame++;

      // 速度递增
      game.speed = BASE_SPEED + game.score * 0.003;
      game.groundOffset = (game.groundOffset + game.speed) % 20;

      // 物理
      game.velocity += GRAVITY;
      game.playerY += game.velocity;
      const effectiveHeight = game.isDucking ? PLAYER_HEIGHT * 0.5 : PLAYER_HEIGHT;

      if (game.playerY >= GROUND_Y - effectiveHeight) {
        game.playerY = GROUND_Y - effectiveHeight;
        game.velocity = 0;
        game.isJumping = false;
      }

      // 生成障碍物
      if (game.frameCount >= game.nextObstacleFrame) {
        const isAir = Math.random() < 0.25 && game.score > 5;
        if (isAir) {
          game.obstacles.push({
            x: WIDTH,
            width: 22,
            height: 22,
            type: 'air',
            emoji: AIR_EMOJIS[Math.floor(Math.random() * AIR_EMOJIS.length)],
          });
        } else {
          const bugHeight = 18 + Math.random() * 18;
          game.obstacles.push({
            x: WIDTH,
            width: 16 + Math.random() * 12,
            height: bugHeight,
            type: 'ground',
            emoji: BUG_EMOJIS[Math.floor(Math.random() * BUG_EMOJIS.length)],
          });
        }
        game.nextObstacleFrame = game.frameCount + 55 + Math.floor(Math.random() * 50);
      }

      // 更新障碍物 + 碰撞检测
      let dead = false;
      const playerLeft = PLAYER_X;
      const playerRight = PLAYER_X + PLAYER_WIDTH;
      const playerTop = game.playerY;
      const playerBottom = game.playerY + effectiveHeight;

      game.obstacles = game.obstacles.filter((obstacle) => {
        obstacle.x -= game.speed;

        // 碰撞
        const obstacleLeft = obstacle.x;
        const obstacleRight = obstacle.x + obstacle.width;
        let obstacleTop: number;
        let obstacleBottom: number;
        if (obstacle.type === 'ground') {
          obstacleTop = GROUND_Y - obstacle.height;
          obstacleBottom = GROUND_Y;
        } else {
          obstacleTop = GROUND_Y - PLAYER_HEIGHT - 15;
          obstacleBottom = obstacleTop + obstacle.height;
        }

        if (
          playerRight > obstacleLeft + 4 &&
          playerLeft < obstacleRight - 4 &&
          playerBottom > obstacleTop + 4 &&
          playerTop < obstacleBottom - 4
        ) {
          dead = true;
        }

        return obstacle.x > -50;
      });

      // 计分（每帧）
      game.score = Math.floor(game.frameCount / 6);
      setScore(game.score);

      if (dead) {
        if (game.score > bestScore) {
          setBestScore(game.score);
          updateHighScore('runner', game.score);
        }
        setGameState('dead');
        return;
      }

      // ── 渲染 ──
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // 背景渐变
      const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      bg.addColorStop(0, '#f8fafc');
      bg.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // 远景装饰
      ctx.fillStyle = '#cbd5e1';
      for (let i = 0; i < 5; i++) {
        const hillX = ((i * 100 - game.groundOffset * 0.3) % (WIDTH + 100)) - 50;
        ctx.beginPath();
        ctx.arc(hillX, GROUND_Y, 30 + i * 5, Math.PI, 0);
        ctx.fill();
      }

      // 地面
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, GROUND_Y, WIDTH, 2);

      // 地面纹理
      ctx.fillStyle = '#475569';
      for (let i = -game.groundOffset; i < WIDTH + 20; i += 20) {
        ctx.fillRect(i, GROUND_Y + 8, 8, 2);
      }

      // 角色（前端工程师 emoji 风格像素人）
      ctx.save();
      ctx.translate(PLAYER_X, game.playerY);

      if (game.isDucking) {
        // 蹲下：矮胖
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(2, 6, PLAYER_WIDTH - 4, 10);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(PLAYER_WIDTH / 2, 4, 7, 0, Math.PI * 2);
        ctx.fill();
        // 眼镜
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(7, 2, 5, 3);
        ctx.fillRect(14, 2, 5, 3);
      } else {
        // 身体
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(4, 12, PLAYER_WIDTH - 8, 14);
        // 头
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(PLAYER_WIDTH / 2, 8, 8, 0, Math.PI * 2);
        ctx.fill();
        // 眼镜
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(7, 5, 5, 4);
        ctx.fillRect(14, 5, 5, 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(8, 6, 3, 2);
        ctx.fillRect(15, 6, 3, 2);
        // 腿（跑步动画）
        const legOffset = game.isJumping ? 0 : Math.sin(game.runFrame * 0.4) * 4;
        ctx.fillStyle = '#334155';
        ctx.fillRect(7, 26, 4, 4 + legOffset);
        ctx.fillRect(14, 26, 4, 4 - legOffset);
      }
      ctx.restore();

      // 障碍物
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const obstacle of game.obstacles) {
        const drawY = obstacle.type === 'ground'
          ? GROUND_Y - obstacle.height + obstacle.height / 2
          : GROUND_Y - PLAYER_HEIGHT - 15 + obstacle.height / 2;
        ctx.fillText(obstacle.emoji, obstacle.x + obstacle.width / 2, drawY);
      }

      // HUD 分数
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(String(game.score).padStart(5, '0'), WIDTH - 10, 10);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameState, bestScore]);

  // idle 画面
  useEffect(() => {
    if (gameState !== 'idle') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bg.addColorStop(0, '#f8fafc');
    bg.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
  }, [gameState]);

  return (
    <div className="runner">
      <div className="runner-header">
        <span>分数: <span className="runner-score">{score}</span></span>
        <span>最高: <span className="runner-score">{bestScore}</span></span>
      </div>

      <div className="runner-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="runner-canvas"
          onClick={handleClick}
        />
        {gameState === 'idle' && (
          <div className="runner-overlay">
            <div className="runner-overlay-title">🏃 无尽跑酷</div>
            <button className="runner-btn" onClick={startGame}>开始游戏</button>
            <span className="runner-hint">空格/↑ 跳跃 · ↓ 蹲下 · 躲避 Bug 🐛</span>
          </div>
        )}
        {gameState === 'dead' && (
          <div className="runner-overlay">
            <div className="runner-overlay-title">💥 撞上 Bug 了！</div>
            <div className="runner-overlay-score">跑了 {score} 米</div>
            <button className="runner-btn" onClick={startGame}>再跑一次</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfiniteRunner;
