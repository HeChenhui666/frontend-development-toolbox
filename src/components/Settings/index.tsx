import React, { useState } from 'react';
import ThemeSettings from '../ThemeSettings';
import './index.css';

interface SettingsProps {
  onClose: () => void;
}

type SettingsTab = 'general' | 'theme';

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>设置</h3>
          <button className="settings-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="settings-content">
          <div className="settings-sidebar">
            <button
              className={`settings-sidebar-item ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <span className="settings-sidebar-icon">⚙️</span>
              <span>通用</span>
            </button>
            <button
              className={`settings-sidebar-item ${activeTab === 'theme' ? 'active' : ''}`}
              onClick={() => setActiveTab('theme')}
            >
              <span className="settings-sidebar-icon">🎨</span>
              <span>主题</span>
            </button>
          </div>
          <div className="settings-main">
            {activeTab === 'general' && (
              <div className="settings-section">
                <h4 className="settings-section-title">通用设置</h4>
                <div className="settings-section-content">
                  <p style={{ color: 'var(--theme-textSecondary)', fontSize: '12px' }}>
                    更多设置选项即将推出...
                  </p>
                </div>
              </div>
            )}
            {activeTab === 'theme' && (
              <div className="settings-section">
                <h4 className="settings-section-title">主题设置</h4>
                <div className="settings-section-content">
                  <ThemeSettings onClose={() => {}} embedded={true} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

