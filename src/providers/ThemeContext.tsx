import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';

interface ThemeContextValue {
  /** 当前主题版本号（用于触发重渲染） */
  themeVersion: number;
  /** 手动触发主题刷新 */
  refreshTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeVersion: 0,
  refreshTheme: () => {},
});

/**
 * 主题状态 Provider。
 * 监听 themeChanged 自定义事件和 storage 事件，统一管理主题版本号。
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeVersion, setThemeVersion] = useState(0);

  const refreshTheme = useCallback(() => {
    setThemeVersion(v => v + 1);
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-theme') refreshTheme();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChanged', refreshTheme);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChanged', refreshTheme);
    };
  }, [refreshTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ themeVersion, refreshTheme }),
    [themeVersion, refreshTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** 获取当前主题上下文 */
export function useThemeContext(): ThemeContextValue {
  return useContext(ThemeContext);
}

export { ThemeContext };
