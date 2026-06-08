import React, { useState, memo, useCallback } from 'react';
import { CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import './index.css';
import { games, GameConfig } from './games/gamesConfig';

interface EasterEggProps {
  onClose: () => void;
}

const EasterEgg: React.FC<EasterEggProps> = memo(({ onClose }) => {
  const [selectedGame, setSelectedGame] = useState<GameConfig | null>(null);

  const handleGameClick = useCallback((game: GameConfig) => {
    setSelectedGame(game);
  }, []);

  const handleCloseGame = useCallback(() => {
    setSelectedGame(null);
  }, []);

  const GameComponent = selectedGame?.component;

  if (selectedGame && GameComponent) {
    return (
      <div className="ee-page">
        <div className="ee-game-header">
          <button className="ee-back-btn" onClick={handleCloseGame} aria-label="返回游戏列表">
            <ArrowLeftOutlined />
          </button>
          <span className="ee-game-header-icon">{selectedGame.icon}</span>
          <span className="ee-game-header-name">{selectedGame.name}</span>
          <button className="ee-close" onClick={onClose} aria-label="关闭彩蛋">
            <CloseOutlined />
          </button>
        </div>
        <div className="ee-game-body">
          <GameComponent />
        </div>
      </div>
    );
  }

  return (
    <div className="ee-page">
      {/* 粒子装饰 */}
      <div className="ee-particles" aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="ee-particle" style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>

      {/* 头部 */}
      <div className="ee-header">
        <div className="ee-header-glow" aria-hidden />
        <div className="ee-trophy">🎉</div>
        <div className="ee-header-text">
          <h2 className="ee-title">发现彩蛋！</h2>
          <p className="ee-subtitle">你是一个细心的人 · 选一个游戏开始吧</p>
        </div>
        <button className="ee-close" onClick={onClose} aria-label="关闭">
          <CloseOutlined />
        </button>
      </div>

      {/* 游戏卡片网格 */}
      <div className="ee-games">
        {games.map((game) => (
          <button
            key={game.id}
            className="ee-game-card"
            onClick={() => handleGameClick(game)}
            type="button"
          >
            <span className="ee-game-icon">{game.icon}</span>
            <span className="ee-game-name">{game.name}</span>
            <span className="ee-game-desc">{game.description}</span>
            <span className="ee-game-play">开始 →</span>
          </button>
        ))}
      </div>

      {/* 底部签名 */}
      <div className="ee-footer">
        <span>感谢使用工具箱 ✨</span>
      </div>
    </div>
  );
});

EasterEgg.displayName = 'EasterEgg';
export default EasterEgg;
