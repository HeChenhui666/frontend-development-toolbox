import React, { useRef, useEffect, useState, useCallback } from 'react';
import './index.css';
import { getHighScore, updateHighScore } from '../../../../../utils/gameScore';

const WIDTH = 320;
const HEIGHT = 400;
const GRAVITY = 0.45;
const JUMP_FORCE = -7;
const BIRD_SIZE = 18;
const PIPE_WIDTH = 40;
const PIPE_GAP = 110;
const PIPE_SPEED = 2.2;
const PIPE_INTERVAL = 110; // frames between pipes
const GROUND_HEIGHT = 40;

interface Pipe {
  x: number;
  topHeight: number;
  scored: boolean;
}

const FlappyBird: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => getHighScore('flappy'));
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'dead'>('idle');

  const gameRef = useRef({
    birdY: HEIGHT / 2 - 20,
    birdVelocity: 0,
    pipes: [] as Pipe[],
    frameCount: 0,
    score: 0,
    groundOffset: 0,
  });

  const jump = useCallback(() => {
    if (gameState === 'playing') {
      gameRef.current.birdVelocity = JUMP_FORCE;
    }
  }, [gameState]);

  const startGame = useCallback(() => {
    const game = gameRef.current;
    game.birdY = HEIGHT / 2 - 20;
    game.birdVelocity = JUMP_FORCE;
    game.pipes = [];
    game.frameCount = 0;
    game.score = 0;
    game.groundOffset = 0;
    setScore(0);
    setGameState('playing');
  }, []);

  // 输入事件
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'idle' || gameState === 'dead') startGame();
        else jump();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, startGame, jump]);

  const handleCanvasClick = useCallback(() => {
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

      // 物理
      game.birdVelocity += GRAVITY;
      game.birdY += game.birdVelocity;

      // 地面滚动
      game.groundOffset = (game.groundOffset + PIPE_SPEED) % 24;

      // 生成管道
      if (game.frameCount % PIPE_INTERVAL === 0) {
        const minTop = 50;
        const maxTop = HEIGHT - GROUND_HEIGHT - PIPE_GAP - 50;
        const topHeight = minTop + Math.random() * (maxTop - minTop);
        game.pipes.push({ x: WIDTH, topHeight, scored: false });
      }

      // 更新管道
      const birdLeft = WIDTH * 0.28 - BIRD_SIZE / 2;
      const birdRight = birdLeft + BIRD_SIZE;
      const birdTop = game.birdY - BIRD_SIZE / 2;
      const birdBottom = game.birdY + BIRD_SIZE / 2;

      let dead = false;
      game.pipes = game.pipes.filter((pipe) => {
        pipe.x -= PIPE_SPEED;
        // 计分
        if (!pipe.scored && pipe.x + PIPE_WIDTH < birdLeft) {
          pipe.scored = true;
          game.score++;
          setScore(game.score);
        }
        // 碰撞检测
        if (birdRight > pipe.x && birdLeft < pipe.x + PIPE_WIDTH) {
          if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
            dead = true;
          }
        }
        return pipe.x > -PIPE_WIDTH;
      });

      // 地面 / 天花板碰撞
      if (game.birdY + BIRD_SIZE / 2 > HEIGHT - GROUND_HEIGHT || game.birdY - BIRD_SIZE / 2 < 0) {
        dead = true;
      }

      if (dead) {
        if (game.score > bestScore) {
          setBestScore(game.score);
          updateHighScore('flappy', game.score);
        }
        setGameState('dead');
        return;
      }

      // ── 渲染 ──
      // 天空渐变
      const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT - GROUND_HEIGHT);
      skyGrad.addColorStop(0, '#87ceeb');
      skyGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT - GROUND_HEIGHT);

      // 远景云朵（静态装饰）
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      [[40, 60, 50], [180, 30, 35], [280, 80, 30], [100, 120, 40]].forEach(([cx, cy, r]) => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // 管道
      for (const pipe of game.pipes) {
        // 上管道
        const pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
        pipeGrad.addColorStop(0, '#22c55e');
        pipeGrad.addColorStop(0.5, '#4ade80');
        pipeGrad.addColorStop(1, '#16a34a');
        ctx.fillStyle = pipeGrad;
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        // 上管道帽
        ctx.fillStyle = '#15803d';
        ctx.fillRect(pipe.x - 3, pipe.topHeight - 16, PIPE_WIDTH + 6, 16);

        // 下管道
        ctx.fillStyle = pipeGrad;
        const bottomY = pipe.topHeight + PIPE_GAP;
        ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, HEIGHT - GROUND_HEIGHT - bottomY);
        // 下管道帽
        ctx.fillStyle = '#15803d';
        ctx.fillRect(pipe.x - 3, bottomY, PIPE_WIDTH + 6, 16);
      }

      // 地面
      ctx.fillStyle = '#92400e';
      ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, GROUND_HEIGHT);
      ctx.fillStyle = '#a16207';
      ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, 6);
      // 地面纹理
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      for (let i = -game.groundOffset; i < WIDTH + 24; i += 24) {
        ctx.beginPath();
        ctx.moveTo(i, HEIGHT - GROUND_HEIGHT + 8);
        ctx.lineTo(i + 12, HEIGHT - GROUND_HEIGHT + 18);
        ctx.stroke();
      }

      // 小鸟
      const birdX = WIDTH * 0.28;
      const rotation = Math.min(Math.max(game.birdVelocity * 0.08, -0.5), 1.2);
      ctx.save();
      ctx.translate(birdX, game.birdY);
      ctx.rotate(rotation);

      // 身体
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2 - 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 翅膀
      const wingY = Math.sin(game.frameCount * 0.3) * 3;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(-4, wingY, 7, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // 眼睛
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(5, -3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(6, -3, 2, 0, Math.PI * 2);
      ctx.fill();

      // 嘴巴
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(14, 1);
      ctx.lineTo(8, 4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // 分数（游戏中大字显示）
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText(String(game.score), WIDTH / 2, 50);
      ctx.fillText(String(game.score), WIDTH / 2, 50);

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
    const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    skyGrad.addColorStop(0, '#87ceeb');
    skyGrad.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, GROUND_HEIGHT);
  }, [gameState]);

  return (
    <div className="flappy">
      <div className="flappy-header">
        <span>分数: <span className="flappy-score">{score}</span></span>
        <span>最高: <span className="flappy-score">{bestScore}</span></span>
      </div>

      <div className="flappy-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="flappy-canvas"
          onClick={handleCanvasClick}
        />
        {gameState === 'idle' && (
          <div className="flappy-overlay">
            <div className="flappy-overlay-title">🐦 Flappy Bird</div>
            <button className="flappy-btn" onClick={startGame}>开始游戏</button>
            <span className="flappy-hint">点击 / 空格 / ↑ 跳跃</span>
          </div>
        )}
        {gameState === 'dead' && (
          <div className="flappy-overlay">
            <div className="flappy-overlay-title">💥 Game Over</div>
            <div className="flappy-overlay-score">得分: {score}</div>
            <button className="flappy-btn" onClick={startGame}>再来一局</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlappyBird;
