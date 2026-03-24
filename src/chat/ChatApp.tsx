import React, { useMemo, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme } from 'antd';
import ChatShell from './ChatShell';
import MessagesPage from './MessagesPage';
import ProfilePage from './ProfilePage';
import SettingsPage from './SettingsPage';
import { LanRelayChatProvider } from './LanRelayChatProvider';
import { applyTheme, getSavedTheme } from '../utils/theme';

const getCSSVariable = (name: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || undefined;
};

const ChatApp: React.FC = () => {
  const [themeVersion, setThemeVersion] = useState(0);

  const dynamicThemeConfig = useMemo(() => {
    void themeVersion;
    return {
      algorithm: antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: getCSSVariable('--theme-primary') || getCSSVariable('--theme-buttonPrimary'),
        colorSuccess: getCSSVariable('--theme-success'),
        colorError: getCSSVariable('--theme-error'),
        colorWarning: '#faad14',
        colorInfo: getCSSVariable('--theme-primary') || getCSSVariable('--theme-buttonPrimary'),
        borderRadius: 6,
        colorBgContainer: getCSSVariable('--theme-background'),
        colorText: getCSSVariable('--theme-text'),
        colorTextSecondary: getCSSVariable('--theme-textSecondary'),
        colorBorder: getCSSVariable('--theme-border'),
        colorBorderSecondary: getCSSVariable('--theme-borderLight'),
      },
      components: {
        Button: {
          primaryColor: getCSSVariable('--theme-buttonText') || '#ffffff',
          colorPrimary: getCSSVariable('--theme-buttonPrimary') || getCSSVariable('--theme-primary'),
          colorPrimaryHover: getCSSVariable('--theme-buttonPrimaryHover'),
          colorPrimaryActive: getCSSVariable('--theme-buttonPrimaryHover'),
        },
        Input: {
          colorBgContainer: getCSSVariable('--theme-inputBackground') || getCSSVariable('--theme-background'),
          colorBorder: getCSSVariable('--theme-inputBorder') || getCSSVariable('--theme-border'),
          colorText: getCSSVariable('--theme-inputText') || getCSSVariable('--theme-text'),
          activeBorderColor: getCSSVariable('--theme-inputFocusBorder') || getCSSVariable('--theme-primary'),
        },
      },
    };
  }, [themeVersion]);

  useEffect(() => {
    const bump = () => {
      applyTheme(getSavedTheme());
      setThemeVersion((n) => n + 1);
    };
    bump();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'app-theme') bump();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', bump);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', bump);
    };
  }, []);

  return (
    <ConfigProvider theme={dynamicThemeConfig}>
      <LanRelayChatProvider>
        <Routes>
          <Route path="/" element={<ChatShell />}>
            <Route index element={<Navigate to="/messages" replace />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/messages" replace />} />
        </Routes>
      </LanRelayChatProvider>
    </ConfigProvider>
  );
};

export default ChatApp;
