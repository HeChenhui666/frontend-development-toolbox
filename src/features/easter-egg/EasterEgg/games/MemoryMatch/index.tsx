import React, { useState, useCallback, useEffect, useRef } from 'react';
import './index.css';
import { getHighScore, updateHighScore } from '../../../../../utils/gameScore';

// 前端框架 Logo + 编程 Emoji 做卡面
const CARD_POOLS = [
  '⚛️', '🅰️', '💚', '🟨', '🦊', '🎯', '⚡', '🔷',
  '🐍', '🦀', '☕', '🐹', '🐘', '🔥', '💎', '🌀',
  '🎨', '🧩', '📦', '🔧', '🛠️', '🚀', '🌐', '💡',
  '🎮', '🎲', '🃏', '🏆', '⭐', '🌟', '🎪', '🎭',
];

type Difficulty = '4x4' | '6x6';

const GRID_CONFIG: Record<Difficulty, { cols: number; rows: number }> = {
  '4x4': { cols: 4, rows: 4 },
  '6x6': { cols: 6, rows: 6 },
};

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const createCards = (difficulty: Difficulty): Card[] => {
  const { cols, rows } = GRID_CONFIG[difficulty];
  const pairCount = (cols * rows) / 2;
  const selectedEmojis = shuffleArray(CARD_POOLS).slice(0, pairCount);
  const pairs = [...selectedEmojis, ...selectedEmojis];
  const shuffled = shuffleArray(pairs);
  return shuffled.map((emoji, index) => ({
    id: index,
    emoji,
    flipped: false,
    matched: false,
  }));
};

const MemoryMatch: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('4x4');
  const [cards, setCards] = useState<Card[]>(() => createCards('4x4'));
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [bestMoves, setBestMoves] = useState<number>(() => getHighScore(`memory-${difficulty}`));
  const lockRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalPairs = GRID_CONFIG[difficulty].cols * GRID_CONFIG[difficulty].rows / 2;

  // 计时器
  useEffect(() => {
    if (startTime > 0 && !isComplete) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 500);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime, isComplete]);

  // 切换难度
  const changeDifficulty = useCallback((newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    setCards(createCards(newDifficulty));
    setFlippedIds([]);
    setMoves(0);
    setMatchedCount(0);
    setStartTime(0);
    setElapsed(0);
    setIsComplete(false);
    setBestMoves(getHighScore(`memory-${newDifficulty}`));
    lockRef.current = false;
  }, []);

  // 重新开始
  const restart = useCallback(() => {
    setCards(createCards(difficulty));
    setFlippedIds([]);
    setMoves(0);
    setMatchedCount(0);
    setStartTime(0);
    setElapsed(0);
    setIsComplete(false);
    lockRef.current = false;
  }, [difficulty]);

  // 翻牌
  const handleFlip = useCallback((cardId: number) => {
    if (lockRef.current) return;
    if (isComplete) return;

    const card = cards.find((c) => c.id === cardId);
    if (!card || card.flipped || card.matched) return;

    // 第一次翻牌开始计时
    if (startTime === 0) setStartTime(Date.now());

    const newFlipped = [...flippedIds, cardId];
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, flipped: true } : c)));
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      lockRef.current = true;

      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find((c) => c.id === firstId)!;
      const secondCard = cards.find((c) => c.id === secondId)!;

      if (firstCard.emoji === secondCard.emoji) {
        // 匹配成功
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, matched: true } : c
            )
          );
          setFlippedIds([]);
          lockRef.current = false;

          const newMatchedCount = matchedCount + 1;
          setMatchedCount(newMatchedCount);

          // 检查是否全部完成
          if (newMatchedCount === totalPairs) {
            setIsComplete(true);
            const finalMoves = moves + 1;
            const currentBest = getHighScore(`memory-${difficulty}`);
            // 最少步数为最佳（0表示未记录）
            if (currentBest === 0 || finalMoves < currentBest) {
              setBestMoves(finalMoves);
              updateHighScore(`memory-${difficulty}`, finalMoves);
            }
          }
        }, 400);
      } else {
        // 不匹配，翻回去
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, flipped: false } : c
            )
          );
          setFlippedIds([]);
          lockRef.current = false;
        }, 700);
      }
    }
  }, [cards, flippedIds, isComplete, startTime, moves, matchedCount, totalPairs, difficulty]);

  const { cols } = GRID_CONFIG[difficulty];
  const cardFontSize = difficulty === '6x6' ? 16 : 22;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <div className="memory">
      <div className="memory-difficulty">
        {(Object.keys(GRID_CONFIG) as Difficulty[]).map((diff) => (
          <button
            key={diff}
            className={`memory-diff-btn${difficulty === diff ? ' memory-diff-btn--active' : ''}`}
            onClick={() => changeDifficulty(diff)}
          >
            {diff}
          </button>
        ))}
        <button className="memory-diff-btn" onClick={restart}>🔄</button>
      </div>

      <div className="memory-header">
        <span>翻牌: <span className="memory-stat">{moves}</span></span>
        <span>配对: <span className="memory-stat">{matchedCount}/{totalPairs}</span></span>
        <span>时间: <span className="memory-stat">{formatTime(elapsed)}</span></span>
        {bestMoves > 0 && (
          <span className="memory-best">最佳: {bestMoves}步</span>
        )}
      </div>

      {isComplete ? (
        <div className="memory-result">
          <div className="memory-result-title">🎉 全部配对！</div>
          <div className="memory-result-stats">
            用了 {moves} 步 · 耗时 {formatTime(elapsed)}
          </div>
          <button className="memory-result-btn" onClick={restart}>再来一局</button>
        </div>
      ) : (
        <div
          className="memory-grid"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {cards.map((card) => (
            <div
              key={card.id}
              className={`memory-card${card.flipped ? ' memory-card--flipped' : ''}${card.matched ? ' memory-card--matched' : ''}`}
              onClick={() => handleFlip(card.id)}
            >
              <div className="memory-card-face memory-card-back">❓</div>
              <div className="memory-card-face memory-card-front" style={{ fontSize: cardFontSize }}>
                {card.emoji}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemoryMatch;
