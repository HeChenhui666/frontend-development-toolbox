import React, { useState, useMemo, lazy, Suspense, useEffect, useCallback, useTransition } from 'react';
import { ConfigProvider, Tooltip, Modal } from 'antd';
import {
  SettingOutlined,
  FireOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import './App.css';
import { getDefaultTab, getTabOrder, getActiveTab, saveActiveTab, DefaultTab } from './utils/userPreferences';
import { openChatWindow } from './utils/openChatWindow';
import ErrorBoundary from './components/ErrorBoundary';
// NOTE: ErrorBoundary + CompatibilityWarning + ExampleFeature remain in components/ (shared)
import TabRouter from './layouts/TabRouter';
import { SiderNavItem, SiderAction } from './layouts/SiderNav';
import { useRunMode } from './hooks/useRunMode';
import { useEasterEggTrigger } from './hooks/useEasterEggTrigger';
import { useAntdThemeConfig } from './hooks/useAntdThemeConfig';

// 懒加载：仅保留非路由级组件
const Settings = lazy(() => import('./features/settings/Settings'));
const EasterEgg = lazy(() => import('./features/easter-egg/EasterEgg'));

type FeatureTab = DefaultTab | 'future1' | 'future2';

const isPersistedTab = (tab: FeatureTab): tab is DefaultTab =>
  tab !== 'future1' && tab !== 'future2';

interface FeatureMeta {
  id: FeatureTab;
  name: string;
  icon: string;
}

const FEATURE_META_MAP: Record<FeatureTab, FeatureMeta> = {
  qrcode: { id: 'qrcode', name: '二维码', icon: '🔲' },
  urlparams: { id: 'urlparams', name: 'URL 参数', icon: '🔗' },
  timestamp: { id: 'timestamp', name: '时间戳', icon: '⏰' },
  randomimage: { id: 'randomimage', name: '图片工具', icon: '🖼️' },
  json: { id: 'json', name: 'JSON', icon: '📄' },
  gradient: { id: 'gradient', name: '颜色工具', icon: '🎨' },
  regex: { id: 'regex', name: '正则', icon: '🔤' },
  translator: { id: 'translator', name: '翻译', icon: '🌐' },
  apitester: { id: 'apitester', name: 'API 调试', icon: '🔌' },
  cachemanager: { id: 'cachemanager', name: '缓存管理', icon: '🧹' },
  redirector: { id: 'redirector', name: '请求重定向', icon: '🔄' },
  webactions: { id: 'webactions', name: '网页操作', icon: '🧭' },
  mousetrail: { id: 'mousetrail', name: '鼠标拖尾', icon: '✨' },
  codec: { id: 'codec', name: '编解码', icon: '🔣' },
  markdown: { id: 'markdown', name: 'Markdown', icon: '📝' },
  diff: { id: 'diff', name: 'Diff 对比', icon: '📊' },
  fontpreview: { id: 'fontpreview', name: '字体预览', icon: '🔤' },
  clipboard: { id: 'clipboard', name: '备忘录', icon: '📝' },
  asciiart: { id: 'asciiart', name: 'ASCII 画布', icon: '🎨' },
  future1: { id: 'future1', name: '未来功能1', icon: '🧪' },
  future2: { id: 'future2', name: '未来功能2', icon: '🧪' },
};

const HIDDEN_FEATURES = new Set<FeatureTab>(['future1', 'future2']);

// ── App ───────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const { initialActiveTab } = useMemo(() => {
    const lastActiveTab = getActiveTab();
    if (lastActiveTab) return { initialActiveTab: lastActiveTab as FeatureTab };
    return { initialActiveTab: getDefaultTab() as FeatureTab };
  }, []);

  const [activeTab, setActiveTab] = useState<FeatureTab>(initialActiveTab);
  const [qrSubTab, setQrSubTab] = useState<'generate' | 'decode' | 'barcode' | 'storage'>('generate');
  const [showSettings, setShowSettings] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [tabOrderVersion, setTabOrderVersion] = useState(0);
  const [isTabPending, startTabTransition] = useTransition();
  const [, startDeferredUpdate] = useTransition();

  // 提取的 Hooks
  const { isPopupMode, isSidePanelMode } = useRunMode();
  const { showEasterEgg, handleTriggerClick: handleTitleClick, closeEasterEgg: handleCloseEasterEgg } = useEasterEggTrigger();

  // 手动收起状态（null 表示跟随运行模式默认值）
  const [manualCollapsed, setManualCollapsed] = useState<boolean | null>(() => {
    try {
      const saved = localStorage.getItem('sider-collapsed');
      return saved !== null ? saved === 'true' : null;
    } catch {
      return null;
    }
  });

  const defaultCollapsed = isPopupMode || isSidePanelMode;
  const isCollapsed = manualCollapsed !== null ? manualCollapsed : defaultCollapsed;

  const handleToggleCollapse = useCallback(() => {
    setManualCollapsed(prev => {
      const next = !(prev !== null ? prev : defaultCollapsed);
      try { localStorage.setItem('sider-collapsed', String(next)); } catch { /* ignore */ }
      return next;
    });
  }, [defaultCollapsed]);

  // 标签顺序变化
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

  const handleQrSubTabChange = useCallback((tab: 'generate' | 'decode' | 'barcode' | 'storage') => setQrSubTab(tab), []);
  const handleOpenChat = useCallback(() => openChatWindow(), []);

  const features = useMemo(() => {
    const tabOrder = getTabOrder();
    return tabOrder
      .map(tab => FEATURE_META_MAP[tab])
      .filter((f): f is FeatureMeta => f !== undefined && !HIDDEN_FEATURES.has(f.id));
  }, [tabOrderVersion]);


  const handleTabChange = useCallback((tab: FeatureTab) => {
    startTabTransition(() => setActiveTab(tab));
    setShowSettings(false);
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

  // Antd 主题配置（从 CSS 变量动态生成，监听主题变化自动更新）
  const dynamicThemeConfig = useAntdThemeConfig();

  const activeFeatureName = FEATURE_META_MAP[activeTab as FeatureTab]?.name ?? '';

  return (
    <ConfigProvider theme={dynamicThemeConfig}>
      <div className={`app-layout${isPopupMode ? ' mode-popup' : ' mode-standalone'}${isSidePanelMode ? ' mode-sidepanel' : ''}${isCollapsed ? ' sider-collapsed' : ' sider-expanded'}`}>

        {/* ── 左侧导航栏 ─────────────────────────── */}
        <div className="app-sider-wrapper">
        <aside className="app-sider">
          {/* Logo */}
          <div className="sider-logo" onClick={handleTitleClick} title="你能找到彩蛋吗？">
            <FireOutlined className="sider-logo-icon" />
            <span className="sider-logo-text">工具箱</span>
          </div>

          {/* 导航列表 */}
          <nav className="sider-nav">
            {features.map(feature => (
              <SiderNavItem
                key={feature.id}
                feature={feature}
                isActive={activeTab === feature.id}
                onClick={handleTabChange}
                collapsed={isCollapsed}
              />
            ))}
          </nav>

          {/* 底部操作 */}
          <div className="sider-bottom">
            <SiderAction icon={<SettingOutlined />} label="设置" onClick={() => setShowSettings(v => !v)} collapsed={isCollapsed} isActive={showSettings} />
          </div>
        </aside>

        {/* 悬浮展开/收起按钮 */}
        <Tooltip title={isCollapsed ? '展开' : '收起'} placement="right" mouseEnterDelay={0.3}>
          <button
            type="button"
            className="sider-float-toggle"
            onClick={handleToggleCollapse}
            aria-label={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {isCollapsed ? <RightOutlined /> : <LeftOutlined />}
          </button>
        </Tooltip>
        </div>

        {/* ── 内容区 ──────────────────────────────── */}
        <main className="app-main">
          {!isCollapsed && (
            <div className="content-topbar">
              <span className="content-topbar-title">{showSettings ? '设置' : activeFeatureName}</span>
            </div>
          )}
          <div className="content">
            <ErrorBoundary componentName={showEasterEgg ? '彩蛋' : showSettings ? '设置' : activeFeatureName}>
              <Suspense fallback={<div className="loading">加载中…</div>}>
                {showEasterEgg ? (
                  <EasterEgg onClose={handleCloseEasterEgg} onOpenChat={handleOpenChat} onOpenChatSettings={() => setShowChatSettings(true)} />
                ) : showSettings ? (
                  <Settings onClose={() => setShowSettings(false)} embedded={true} />
                ) : isTabPending ? null : (
                  <TabRouter
                    tab={activeTab}
                    subTab={qrSubTab}
                    onSubTabChange={handleQrSubTabChange}
                  />
                )}
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>
      {showChatSettings && (
        <Modal
          open={true}
          title="聊天设置"
          onCancel={() => setShowChatSettings(false)}
          footer={null}
          width={480}
          centered
          destroyOnClose
        >
          <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>加载中…</div>}>
            <Settings embedded onlyTabs={['chat']} onClose={() => setShowChatSettings(false)} />
          </Suspense>
        </Modal>
      )}
    </ConfigProvider>
  );
};

export default App;
