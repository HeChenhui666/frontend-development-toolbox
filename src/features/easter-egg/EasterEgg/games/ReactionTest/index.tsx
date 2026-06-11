import React, { useState, useCallback, useRef } from 'react';
import './index.css';
import { getHighScore, updateHighScore } from '../../../../../utils/gameScore';

type GamePhase = 'idle' | 'waiting' | 'ready' | 'result' | 'too-early';

const getRating = (ms: number): string => {
  if (ms < 150) return '⚡ 闪电反应！';
  if (ms < 200) return '🔥 极速！';
  if (ms < 250) return '✨ 优秀';
  if (ms < 300) return '👍 不错';
  if (ms < 400) return '😐 一般';
  return '🐢 需要练习';
};

const ReactionTest: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [reactionTime, setReactionTime] = useState<number>(0);
  const [bestTime, setBestTime] = useState<number>(() => getHighScore('reaction'));
  const [history, setHistory] = useState<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startWaiting = useCallback(() => {
    cleanup();
    setPhase('waiting');
    const delay = 1500 + Math.random() * 3500;
    timerRef.current = setTimeout(() => {
      startTimeRef.current = performance.now();
      setPhase('ready');
    }, delay);
  }, [cleanup]);

  const handleClick = useCallback(() => {
    switch (phase) {
      case 'idle':
      case 'result':
        startWaiting();
        break;

      case 'waiting':
        cleanup();
        setPhase('too-early');
        setTimeout(() => setPhase('idle'), 1200);
        break;

      case 'ready': {
        const elapsed = Math.round(performance.now() - startTimeRef.current);
        setReactionTime(elapsed);
        setPhase('result');
        setHistory((prev) => [...prev.slice(-9), elapsed]);
        if (bestTime === 0 || elapsed < bestTime) {
          setBestTime(elapsed);
          updateHighScore('reaction', elapsed);
        }
        break;
      }

      case 'too-early':
        break;
    }
  }, [phase, bestTime, startWaiting, cleanup]);

  const average = history.length > 0
    ? Math.round(history.reduce((sum, value) => sum + value, 0) / history.length)
    : 0;

  const currentBest = history.length > 0 ? Math.min(...history) : 0;

  return (
    <div className="reaction-test">
      <div
        className={`reaction-zone reaction-zone--${phase}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') handleClick(); }}
      >
        {phase === 'idle' && (
          <div>
            🎯 点击开始
            <div className="reaction-subtitle">测试你的反应速度</div>
          </div>
        )}
        {phase === 'waiting' && (
          <div>
            等待变绿…
            <div className="reaction-subtitle">看到绿色后立即点击</div>
          </div>
        )}
        {phase === 'ready' && (
          <div>立即点击！</div>
        )}
        {phase === 'too-early' && (
          <div>
            太早了！🙈
            <div className="reaction-subtitle">请等待屏幕变绿</div>
          </div>
        )}
        {phase === 'result' && (
          <div>
            <div className="reaction-time">
              {reactionTime}
              <span className="reaction-time-unit">ms</span>
            </div>
            <div className="reaction-rating">{getRating(reactionTime)}</div>
            <div className="reaction-subtitle">点击再试一次</div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <>
          <div className="reaction-stats">
            <div className="reaction-stat">
              <span className="reaction-stat-value">{average}ms</span>
              <span className="reaction-stat-label">平均</span>
            </div>
            <div className="reaction-stat">
              <span className="reaction-stat-value">{currentBest}ms</span>
              <span className="reaction-stat-label">本轮最佳</span>
            </div>
            <div className="reaction-stat">
              <span className="reaction-stat-value">{bestTime}ms</span>
              <span className="reaction-stat-label">历史最佳</span>
            </div>
            <div className="reaction-stat">
              <span className="reaction-stat-value">{history.length}</span>
              <span className="reaction-stat-label">次数</span>
            </div>
          </div>

          <div className="reaction-history">
            {history.map((time, index) => (
              <span
                key={index}
                className={`reaction-history-item${time === currentBest ? ' reaction-history-item--best' : ''}`}
              >
                {time}ms
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ReactionTest;
