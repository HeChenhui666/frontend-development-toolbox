import React, { useState, useEffect } from 'react';
import { getSavedTheme, saveTheme, applyTheme, themes, ThemeName } from '../../utils/theme';
import './index.css';

interface ThemeSettingsProps {
  onClose: () => void;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ onClose }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(getSavedTheme());

  useEffect(() => {
    // 确保当前主题已应用
    applyTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (theme: ThemeName) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    saveTheme(theme);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="theme-settings-overlay" onClick={handleOverlayClick}>
      <div className="theme-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="theme-settings-header">
          <h3>主题设置</h3>
          <button className="theme-settings-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="theme-settings-content">
          <div className="theme-options">
            {Object.values(themes).map((theme) => (
              <div
                key={theme.name}
                className={`theme-option ${currentTheme === theme.name ? 'active' : ''}`}
                onClick={() => handleThemeChange(theme.name)}
              >
                <div className="theme-preview">
                  <div
                    className="theme-preview-gradient"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.primaryGradient} 0%, ${theme.colors.primaryGradientEnd} 100%)`,
                    }}
                  />
                  <div
                    className="theme-preview-surface"
                    style={{
                      background: theme.colors.surface,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <div
                      className="theme-preview-active"
                      style={{
                        background: theme.colors.activeBackground,
                        color: theme.colors.active,
                        boxShadow: `0 2px 8px ${theme.colors.active}40`,
                      }}
                    >
                      <span style={{ fontSize: '10px' }}>示例</span>
                    </div>
                  </div>
                </div>
                <div className="theme-name">{theme.displayName}</div>
                {currentTheme === theme.name && (
                  <div className="theme-checkmark">✓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;

