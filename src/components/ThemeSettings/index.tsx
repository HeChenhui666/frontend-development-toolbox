import React, { useState, useEffect } from 'react';
import { Modal, Card, Space, Typography, Button } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';
import { getSavedTheme, saveTheme, applyTheme, themes, ThemeName } from '../../utils/theme';
import './index.css';

const { Text } = Typography;

interface ThemeSettingsProps {
  onClose: () => void;
  embedded?: boolean;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ onClose, embedded = false }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(getSavedTheme());

  useEffect(() => {
    // 确保当前主题已应用
    applyTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (theme: ThemeName) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    saveTheme(theme);
    // 触发自定义事件，通知其他组件主题已更改
    window.dispatchEvent(new CustomEvent('themeChanged'));
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const content = (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <div className="theme-options" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '6px'}}>
        {Object.values(themes).map((theme) => (
          <Card
            key={theme.name}
            hoverable
            style={{
              cursor: 'pointer',
              borderColor: currentTheme === theme.name ? 'var(--theme-primary)' : undefined,
              borderWidth: currentTheme === theme.name ? 2 : 1,
              position: 'relative',
            }}
            onClick={() => handleThemeChange(theme.name)}
            bodyStyle={{ padding: '6px'}}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small" align="center">
              <div className="theme-preview" style={{ width: '100%' }}>
                <div
                  className="theme-preview-gradient"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.primaryGradient} 0%, ${theme.colors.primaryGradientEnd} 100%)`,
                    height: '40px',
                    borderRadius: '4px',
                  }}
                />
                <div
                  className="theme-preview-surface"
                  style={{
                    background: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderTop: 'none',
                    borderRadius: '4px',
                    padding: '6px',
                  }}
                >
                  <div
                    className="theme-preview-active"
                    style={{
                      background: theme.colors.activeBackground,
                      color: theme.colors.active,
                      boxShadow: `0 2px 8px ${theme.colors.active}40`,
                      padding: '6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      textAlign: 'center',
                    }}
                  >
                    示例
                  </div>
                </div>
              </div>
              <Text style={{ fontSize: '12px', textAlign: 'center', display: 'block', width: '100%' }}>
                {theme.displayName}
              </Text>
              {currentTheme === theme.name && (
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'var(--theme-primary)',
                    color: 'white',
                    borderRadius: '4px',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                  }}
                >
                  <CheckOutlined />
                </div>
              )}
            </Space>
          </Card>
        ))}
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

