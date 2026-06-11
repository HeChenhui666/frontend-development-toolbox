import { createContext, useContext, useState, useCallback, useMemo, useEffect, useTransition } from 'react';
import type { ReactNode } from 'react';
import type { FeatureTab, SubTab } from '../types/feature';
import { getDefaultTab, getActiveTab, saveActiveTab } from '../utils/userPreferences';

type ExtendedFeatureTab = FeatureTab | 'future1' | 'future2';

const isPersistedTab = (tab: ExtendedFeatureTab): tab is FeatureTab =>
  tab !== 'future1' && tab !== 'future2';

interface AppStateContextValue {
  /** 当前激活的功能标签 */
  activeTab: ExtendedFeatureTab;
  /** 切换功能标签 */
  setActiveTab: (tab: ExtendedFeatureTab) => void;
  /** 标签切换是否正在过渡中 */
  isTabPending: boolean;
  /** 二维码/缓存管理子标签 */
  subTab: SubTab;
  /** 切换子标签 */
  setSubTab: (tab: SubTab) => void;
  /** 是否显示设置面板 */
  showSettings: boolean;
  /** 切换设置面板显示 */
  toggleSettings: () => void;
  /** 关闭设置面板 */
  closeSettings: () => void;
  /** 标签排序版本号（用于触发重新获取排序） */
  tabOrderVersion: number;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

/**
 * 应用运行状态 Provider。
 * 管理当前激活标签、子标签、设置面板显示等核心 UI 状态。
 */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTabRaw] = useState<ExtendedFeatureTab>(() => {
    const lastActiveTab = getActiveTab();
    return (lastActiveTab || getDefaultTab()) as ExtendedFeatureTab;
  });
  const [subTab, setSubTab] = useState<SubTab>('generate');
  const [showSettings, setShowSettings] = useState(false);
  const [tabOrderVersion, setTabOrderVersion] = useState(0);
  const [isTabPending, startTabTransition] = useTransition();
  const [, startDeferredUpdate] = useTransition();

  const setActiveTab = useCallback((tab: ExtendedFeatureTab) => {
    startTabTransition(() => setActiveTabRaw(tab));
    setShowSettings(false);
  }, []);

  const toggleSettings = useCallback(() => setShowSettings(v => !v), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  // 监听标签顺序变化
  useEffect(() => {
    const handleTabOrderChange = () => startDeferredUpdate(() => setTabOrderVersion(v => v + 1));
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-tab-order') startDeferredUpdate(() => setTabOrderVersion(v => v + 1));
    };
    window.addEventListener('tabOrderChanged', handleTabOrderChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('tabOrderChanged', handleTabOrderChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 保存活动 tab
  useEffect(() => {
    if (isPersistedTab(activeTab)) startDeferredUpdate(() => saveActiveTab(activeTab));
  }, [activeTab]);

  useEffect(() => {
    const save = () => { if (isPersistedTab(activeTab)) saveActiveTab(activeTab); };
    const onVisibility = () => { if (document.visibilityState === 'hidden') save(); };
    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', save);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [activeTab]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      activeTab,
      setActiveTab,
      isTabPending,
      subTab,
      setSubTab,
      showSettings,
      toggleSettings,
      closeSettings,
      tabOrderVersion,
    }),
    [activeTab, setActiveTab, isTabPending, subTab, showSettings, toggleSettings, closeSettings, tabOrderVersion],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

/** 获取应用状态上下文 */
export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}

export { AppStateContext };
