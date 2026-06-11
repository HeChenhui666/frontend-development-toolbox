import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Space, Typography, message } from 'antd';
import { CloseOutlined, CheckOutlined, CopyOutlined } from '@ant-design/icons';
import {
  getSavedTheme,
  saveTheme,
  applyTheme,
  themes,
  ThemeName,
  Theme,
  getCustomPrimaryColor,
  saveCustomPrimaryColor,
  serializeThemeColors,
} from '../../../utils/theme';
import { refreshCustomTheme } from '../../../themes';
import './index.css';

const { Text } = Typography;

const HISTORY_KEY = 'custom-theme-history';
const MAX_HISTORY = 5;

const loadColorHistory = (): string[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveColorHistory = (colors: string[]): void => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(colors.slice(0, MAX_HISTORY)));
  } catch { /* ignore */ }
};

const addToColorHistory = (color: string): string[] => {
  const normalized = color.toUpperCase();
  const history = loadColorHistory().filter((c) => c.toUpperCase() !== normalized);
  const updated = [normalized, ...history].slice(0, MAX_HISTORY);
  saveColorHistory(updated);
  return updated;
};

interface ThemeSettingsProps {
  onClose: () => void;
  embedded?: boolean;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ onClose, embedded = false }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(getSavedTheme());
  const [customColor, setCustomColor] = useState(getCustomPrimaryColor());
  const [colorInputValue, setColorInputValue] = useState(getCustomPrimaryColor());
  const [colorHistory, setColorHistory] = useState<string[]>(loadColorHistory);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeChange = useCallback((theme: ThemeName) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    saveTheme(theme);
    window.dispatchEvent(new CustomEvent('themeChanged'));
  }, []);

  /** 记录颜色到历史 */
  const commitToHistory = useCallback((color: string) => {
    setColorHistory(addToColorHistory(color));
  }, []);

  /** 应用自定义主题色（不记录历史，拖动时调用） */
  const applyCustomColorLive = useCallback((color: string) => {
    setCustomColor(color);
    setColorInputValue(color);
    saveCustomPrimaryColor(color);
    refreshCustomTheme(color);
    handleThemeChange('custom');
  }, [handleThemeChange]);

  /** 应用并记录历史（确定性选择时调用） */
  const applyCustomColor = useCallback((color: string) => {
    applyCustomColorLive(color);
    commitToHistory(color);
  }, [applyCustomColorLive, commitToHistory]);

  /** 颜色选择器拖动中（防抖，不记录历史） */
  const handleColorPickerChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    setCustomColor(color);
    setColorInputValue(color);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      applyCustomColorLive(color);
    }, 80);
  }, [applyCustomColorLive]);

  /** 颜色选择器关闭/松手时，记录最终颜色到历史 */
  const handleColorPickerCommit = useCallback(() => {
    commitToHistory(customColor);
  }, [commitToHistory, customColor]);

  /** Hex 输入框变化 */
  const handleColorInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setColorInputValue(value);
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      applyCustomColor(value);
    }
  }, [applyCustomColor]);

  /** 复制主题配色 JSON */
  const handleCopyTheme = useCallback((theme: Theme, event: React.MouseEvent) => {
    event.stopPropagation();
    const json = serializeThemeColors(theme);
    navigator.clipboard.writeText(json).then(() => {
      message.success(`已复制「${theme.displayName}」配色方案`);
    }).catch(() => {
      message.error('复制失败');
    });
  }, []);

  /** 预设主题列表（不含 custom） */
  const presetThemes = Object.values(themes).filter((t) => t.name !== 'custom');

  const content = (
    <Space direction="vertical" style={{ width: '100%' }} size={10}>
      {/* ── 自定义主题色 ── */}
      <div className="custom-theme-section">
        {/* 第一行：标题 + 状态 + 历史颜色（右对齐） */}
        <div className="custom-theme-top">
          <div className="custom-theme-title-group">
            <Text strong style={{ fontSize: 13 }}>🎨 自定义主题色</Text>
            {currentTheme === 'custom' && (
              <span className="custom-theme-active-hint">
                <CheckOutlined style={{ fontSize: 9 }} /> 使用中
              </span>
            )}
          </div>
          {colorHistory.length > 0 && (
            <div className="custom-color-history">
              {colorHistory.map((color) => (
                <button
                  key={color}
                  className={`custom-history-dot${customColor.toUpperCase() === color.toUpperCase() ? ' custom-history-dot--active' : ''}`}
                  style={{ background: color }}
                  onClick={() => applyCustomColor(color)}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>

        {/* 第二行：取色器 + Hex + 派生色预览条 */}
        <div className="custom-theme-picker-row">
          <label className="custom-color-picker-label">
            <input
              type="color"
              value={customColor}
              onChange={handleColorPickerChange}
              onBlur={handleColorPickerCommit}
              className="custom-color-picker-native"
            />
            <span className="custom-color-picker-swatch" style={{ background: customColor }} />
          </label>
          <input
            type="text"
            value={colorInputValue}
            onChange={handleColorInputChange}
            placeholder="#6366F1"
            className="custom-color-input"
            maxLength={7}
          />
          {/* 渐变预览条：展示完整派生色谱 */}
          <div className="custom-color-spectrum" style={{
            background: `linear-gradient(90deg, ${themes.custom.colors.primary} 0%, ${themes.custom.colors.secondary} 40%, ${themes.custom.colors.accent} 70%, ${themes.custom.colors.surface} 100%)`,
          }} />
        </div>
      </div>

      {/* ── 分隔线 ── */}
      <div className="theme-section-divider">
        <span className="theme-section-divider-text">预设主题</span>
      </div>

      {/* ── 预设主题：紧凑色条列表 ── */}
      <div className="preset-theme-list">
        {presetThemes.map((theme) => {
          const isActive = currentTheme === theme.name;
          return (
            <div
              key={theme.name}
              className={`preset-theme-item${isActive ? ' preset-theme-item--active' : ''}`}
              onClick={() => handleThemeChange(theme.name)}
            >
              {/* 色条预览 */}
              <div className="preset-theme-colors">
                <span className="preset-color-dot" style={{ background: theme.colors.primary }} />
                <span className="preset-color-dot" style={{ background: theme.colors.secondary }} />
                <span className="preset-color-dot" style={{ background: theme.colors.surface }} />
              </div>
              {/* 名称 */}
              <span className="preset-theme-name">{theme.displayName}</span>
              {/* 操作 */}
              <div className="preset-theme-actions">
                <span
                  className="preset-theme-copy"
                  onClick={(e) => handleCopyTheme(theme, e)}
                  title="复制配色"
                >
                  <CopyOutlined />
                </span>
                {isActive && (
                  <span className="preset-theme-check">
                    <CheckOutlined />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Space>
  );

  if (embedded) {
    return <div className="theme-settings-embedded">{content}</div>;
  }

  return (
    <Modal
      title="主题设置"
      open={true}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      destroyOnClose
      maskClosable={true}
      getContainer={() => document.body}
      closeIcon={<CloseOutlined />}
    >
      {content}
    </Modal>
  );
};

export default ThemeSettings;

