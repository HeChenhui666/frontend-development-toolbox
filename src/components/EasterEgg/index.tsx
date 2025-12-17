import React from 'react';
import './index.css';
import Game2048 from './Game2048';

interface EasterEggProps {
  onClose: () => void;
}

const EasterEgg: React.FC<EasterEggProps> = ({ onClose }) => {
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
          <div className="game-section">
            <Game2048 />
          </div>
          <div className="easter-egg-footer">
            <p className="footer-text">感谢使用工具箱！</p>
            <p className="footer-subtext">使用方向键 ↑↓←→ 控制游戏</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EasterEgg;

