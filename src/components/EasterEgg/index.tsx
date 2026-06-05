import React, { useState, memo, useCallback, useEffect } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import './index.css';
import { games, GameConfig } from './games/gamesConfig';

interface EasterEggProps {
  onClose: () => void;
}

const GAME_MODAL_WIDTH: Record<string, number> = {
  Snake: 520,
};

const EasterEgg: React.FC<EasterEggProps> = memo(({ onClose }) => {
  const [selectedGame, setSelectedGame] = useState<GameConfig | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 250);
  }, [onClose]);

  const handleGameClick = useCallback((game: GameConfig) => {
    setSelectedGame(game);
  }, []);

  const handleCloseGame = useCallback(() => {
    setSelectedGame(null);
  }, []);

  const GameComponent = selectedGame?.component;

  return (
    <>
      {/* 主彩蛋弹层 */}
      <div className={`ee-overlay${visible ? ' ee-visible' : ''}`} onClick={handleClose}>
        <div className="ee-panel" onClick={e => e.stopPropagation()}>
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
            <button className="ee-close" onClick={handleClose} aria-label="关闭">
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
      </div>

      {/* 游戏弹层 */}
      {selectedGame && GameComponent && (
        <div className="ee-game-overlay" onClick={handleCloseGame}>
          <div
            className="ee-game-modal"
            style={{ width: GAME_MODAL_WIDTH[selectedGame.id] ?? 720 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="ee-game-header">
              <span className="ee-game-header-icon">{selectedGame.icon}</span>
              <span className="ee-game-header-name">{selectedGame.name}</span>
              <button className="ee-close ee-game-close" onClick={handleCloseGame} aria-label="关闭游戏">
                <CloseOutlined />
              </button>
            </div>
            <div className="ee-game-body">
              <GameComponent />
            </div>
          </div>
        </div>
      )}
    </>
  );
});

EasterEgg.displayName = 'EasterEgg';
export default EasterEgg;
