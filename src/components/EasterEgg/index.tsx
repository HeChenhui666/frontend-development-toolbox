import React, { useState, memo, useCallback } from 'react';
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

  return (
    <div className="easter-egg">
      <div className="easter-egg-content">
        <div className="easter-egg-header">
          <h1>🎉 恭喜发现彩蛋！</h1>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="easter-egg-body">
          <div className="easter-egg-icon">🎊</div>
          <h2>你找到了隐藏页面！</h2>
          <p>看来你是一个细心的人，能够发现这个隐藏的彩蛋。</p>
          
          <div className="games-list-section">
            <h3 className="games-list-title">🎮 小游戏</h3>
            <div className="games-list">
              {games.map((game) => (
                <button
                  key={game.id}
                  className="game-card"
                  onClick={() => handleGameClick(game)}
                >
                  <div className="game-card-icon">{game.icon}</div>
                  <div className="game-card-info">
                    <div className="game-card-name">{game.name}</div>
                    <div className="game-card-description">{game.description}</div>
                  </div>
                  <div className="game-card-arrow">→</div>
                </button>
              ))}
            </div>
          </div>

          <div className="easter-egg-footer">
            <p className="footer-text">感谢使用工具箱！</p>
            <p className="footer-subtext">选择一个游戏开始吧~</p>
          </div>
        </div>
      </div>

      {/* 游戏弹窗 */}
      {selectedGame && GameComponent && (
        <div className="game-modal-overlay" onClick={handleCloseGame}>
          <div className="game-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="game-modal-header">
              <h3>
                <span className="game-modal-icon">{selectedGame.icon}</span>
                {selectedGame.name}
              </h3>
              <button className="game-modal-close" onClick={handleCloseGame}>
                ✕
              </button>
            </div>
            <div className={`game-modal-body ${selectedGame.id === 'Snake' ? 'no-scroll' : ''}`}>
              <GameComponent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

EasterEgg.displayName = 'EasterEgg';

export default EasterEgg;

