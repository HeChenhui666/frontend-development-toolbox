import React, { useState, useMemo, lazy, Suspense, useEffect, useRef, useCallback, useTransition, memo } from 'react';
import { ConfigProvider, theme as antdTheme, Tooltip, Modal } from 'antd';
import {
  QrcodeOutlined,
  LinkOutlined,
  ClockCircleOutlined,
  PictureOutlined,
  CodeOutlined,
  BgColorsOutlined,
  SearchOutlined,
  GlobalOutlined,
  ApiOutlined,
  ClearOutlined,
  RetweetOutlined,
  CompassOutlined,
  StarOutlined,
  PartitionOutlined,
  SettingOutlined,
  FireOutlined,
  AppstoreOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import './App.css';
import { getDefaultTab, getTabOrder, getActiveTab, saveActiveTab, DefaultTab } from './utils/userPreferences';
import { openChatWindow } from './utils/openChatWindow';

// 懒加载组件
const QRCodeGenerator = lazy(() => import('./components/QRCodeGenerator'));
const QRCodeDecoder = lazy(() => import('./components/QRCodeDecoder'));
const URLParamsEditor = lazy(() => import('./components/URLParamsEditor'));
const TimestampConverter = lazy(() => import('./components/TimestampConverter'));
const ColorTools = lazy(() => import('./components/ColorTools'));
const JSONTools = lazy(() => import('./components/JSONTools'));
const RegexTester = lazy(() => import('./components/RegexTester'));
const ImageTools = lazy(() => import('./components/ImageTools'));
const Translator = lazy(() => import('./components/Translator'));
const APITester = lazy(() => import('./components/APITester'));
const CacheManager = lazy(() => import('./components/CacheManager'));
const RequestRedirector = lazy(() => import('./components/RequestRedirector'));
const WebActions = lazy(() => import('./components/WebActions'));
const MouseTrail = lazy(() => import('./components/MouseTrail'));
const CodecTools = lazy(() => import('./components/CodecTools'));
const Settings = lazy(() => import('./components/Settings'));
const EasterEgg = lazy(() => import('./components/EasterEgg'));

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
  future1: { id: 'future1', name: '未来功能1', icon: '🧪' },
  future2: { id: 'future2', name: '未来功能2', icon: '🧪' },
};

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  qrcode: <QrcodeOutlined />,
  urlparams: <LinkOutlined />,
  timestamp: <ClockCircleOutlined />,
  randomimage: <PictureOutlined />,
  json: <CodeOutlined />,
  gradient: <BgColorsOutlined />,
  regex: <SearchOutlined />,
  translator: <GlobalOutlined />,
  apitester: <ApiOutlined />,
  cachemanager: <ClearOutlined />,
  redirector: <RetweetOutlined />,
  webactions: <CompassOutlined />,
  mousetrail: <StarOutlined />,
  codec: <PartitionOutlined />,
  future1: <AppstoreOutlined />,
  future2: <AppstoreOutlined />,
};

const HIDDEN_FEATURES = new Set<FeatureTab>(['future1', 'future2']);

// ── 内容面板 ─────────────────────────────────────────────────────────────────

interface ActiveTabPanelProps {
  tab: FeatureTab;
  qrSubTab: 'generate' | 'decode';
  onQrSubTabChange: (next: 'generate' | 'decode') => void;
}

const ActiveTabPanel = memo<ActiveTabPanelProps>(({ tab, qrSubTab, onQrSubTabChange }) => {
  switch (tab) {
    case 'qrcode':
      return (
        <div className="feature-content">
          <div className="sub-tabs">
            <button
              type="button"
              className={`sub-tab ${qrSubTab === 'generate' ? 'active' : ''}`}
              onClick={() => onQrSubTabChange('generate')}
            >
              <span className="sub-tab-icon">📱</span>
              <span>生成</span>
            </button>
            <button
              type="button"
              className={`sub-tab ${qrSubTab === 'decode' ? 'active' : ''}`}
              onClick={() => onQrSubTabChange('decode')}
            >
              <span className="sub-tab-icon">🔍</span>
              <span>解码</span>
            </button>
          </div>
          <div className="sub-content">
            {qrSubTab === 'generate' ? <QRCodeGenerator /> : <QRCodeDecoder />}
          </div>
        </div>
      );
    case 'urlparams': return <URLParamsEditor />;
    case 'timestamp': return <TimestampConverter />;
    case 'randomimage': return <ImageTools />;
    case 'json': return <JSONTools />;
    case 'gradient': return <ColorTools />;
    case 'regex': return <RegexTester />;
    case 'translator': return <Translator />;
    case 'apitester': return <APITester />;
    case 'cachemanager': return <CacheManager />;
    case 'redirector': return <RequestRedirector />;
    case 'webactions': return <WebActions />;
    case 'mousetrail': return <MouseTrail />;
    case 'codec': return <CodecTools />;
    default: return null;
  }
});
ActiveTabPanel.displayName = 'ActiveTabPanel';

// ── 侧边栏导航项 ──────────────────────────────────────────────────────────────

interface SiderNavItemProps {
  feature: FeatureMeta;
  isActive: boolean;
  onClick: (tab: FeatureTab) => void;
  collapsed: boolean;
}

const SiderNavItem = memo<SiderNavItemProps>(({ feature, isActive, onClick, collapsed }) => {
  const handleClick = useCallback(() => onClick(feature.id), [feature.id, onClick]);

  const btn = (
    <button
      type="button"
      className={`sider-item${isActive ? ' active' : ''}`}
      onClick={handleClick}
      aria-label={feature.name}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="sider-item-icon">{FEATURE_ICONS[feature.id]}</span>
      <span className="sider-item-label">{feature.name}</span>
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip title={feature.name} placement="right" mouseEnterDelay={0.3}>
        {btn}
      </Tooltip>
    );
  }
  return btn;
});
SiderNavItem.displayName = 'SiderNavItem';

// ── 侧边栏底部操作按钮 ────────────────────────────────────────────────────────

interface SiderActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  collapsed: boolean;
  isActive?: boolean;
}

const SiderAction = memo<SiderActionProps>(({ icon, label, onClick, collapsed, isActive }) => {
  const btn = (
    <button
      type="button"
      className={`sider-action${isActive ? ' active' : ''}`}
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="sider-action-icon">{icon}</span>
      <span className="sider-action-label">{label}</span>
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip title={label} placement="right" mouseEnterDelay={0.3}>
        {btn}
      </Tooltip>
    );
  }
  return btn;
});
SiderAction.displayName = 'SiderAction';

// ── App ───────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const { initialActiveTab } = useMemo(() => {
    const lastActiveTab = getActiveTab();
    if (lastActiveTab) return { initialActiveTab: lastActiveTab as FeatureTab };
    return { initialActiveTab: getDefaultTab() as FeatureTab };
  }, []);

  const [activeTab, setActiveTab] = useState<FeatureTab>(initialActiveTab);
  const [qrSubTab, setQrSubTab] = useState<'generate' | 'decode'>('generate');
  const [clickCount, setClickCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [tabOrderVersion, setTabOrderVersion] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTabPending, startTabTransition] = useTransition();
  const [, startDeferredUpdate] = useTransition();

  // 运行模式检测
  const { isPopupMode, isSidePanelMode } = useMemo(() => {
    if (typeof window === 'undefined') return { isPopupMode: false, isSidePanelMode: false };

    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const path = window.location.pathname;
    const isSidePanelEntry = /(^|\/)sidepanel\.html$/i.test(path);
    const isPopupEntry = /(^|\/)popup\.html$/i.test(path);
    const isExtensionProtocol = /-extension:$/i.test(window.location.protocol);
    const hasChromeRuntime =
      typeof (window as any).chrome !== 'undefined' &&
      (window as any).chrome.runtime?.id;
    const isSmallWindow = window.innerWidth <= 500 && window.innerHeight <= 650;
    const isPopupHeuristic = (isExtensionProtocol || hasChromeRuntime) && isSmallWindow;

    if (mode === 'sidepanel' || isSidePanelEntry) return { isPopupMode: false, isSidePanelMode: true };
    if (mode === 'popup' || isPopupEntry) return { isPopupMode: true, isSidePanelMode: false };
    if (mode === 'standalone' || /(^|\/)standalone\.html$/i.test(path)) return { isPopupMode: false, isSidePanelMode: false };
    return { isPopupMode: isPopupHeuristic, isSidePanelMode: false };
  }, []);

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

  const handleQrSubTabChange = useCallback((tab: 'generate' | 'decode') => setQrSubTab(tab), []);
  const handleOpenChat = useCallback(() => openChatWindow(), []);

  const features = useMemo(() => {
    const tabOrder = getTabOrder();
    return tabOrder
      .map(tab => FEATURE_META_MAP[tab])
      .filter((f): f is FeatureMeta => f !== undefined && !HIDDEN_FEATURES.has(f.id));
  }, [tabOrderVersion]);

  const handleTitleClick = useCallback(() => {
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 10) {
      setShowEasterEgg(true);
      setClickCount(0);
    } else {
      clickTimeoutRef.current = setTimeout(() => setClickCount(0), 2000);
    }
  }, [clickCount]);

  const handleCloseEasterEgg = useCallback(() => setShowEasterEgg(false), []);

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

  useEffect(() => () => { if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current); }, []);

  // 主题变化
  const [themeVersion, setThemeVersion] = useState(0);
  useEffect(() => {
    const bump = () => setThemeVersion(v => v + 1);
    const onStorage = (e: StorageEvent) => { if (e.key === 'app-theme') bump(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('themeChanged', bump);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('themeChanged', bump);
    };
  }, []);

  const dynamicThemeConfig = useMemo(() => {
    const root = getComputedStyle(document.documentElement);
    const v = (name: string) => root.getPropertyValue(name).trim() || undefined;
    const appRadius = parseInt(root.getPropertyValue('--app-radius') || '6', 10);
    return {
      algorithm: antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: v('--theme-primary') || v('--theme-buttonPrimary'),
        colorSuccess: v('--theme-success'),
        colorError: v('--theme-error'),
        colorWarning: '#faad14',
        colorInfo: v('--theme-primary') || v('--theme-buttonPrimary'),
        borderRadius: appRadius,
        borderRadiusSM: Math.max(2, appRadius - 2),
        borderRadiusLG: appRadius + 2,
        padding: 6,
        paddingXXS: 4,
        paddingXS: 6,
        paddingSM: 8,
        paddingLG: 12,
        paddingXL: 16,
        colorBgContainer: v('--theme-inputBackground') || v('--theme-background'),
        colorText: v('--theme-text'),
        colorTextSecondary: v('--theme-textSecondary'),
        colorTextTertiary: v('--theme-textMuted'),
        colorBorder: v('--theme-border'),
        colorBorderSecondary: v('--theme-borderLight'),
        fontSizeSM: 11,
        fontSize: 12,
        fontSizeLG: 13,
        controlHeight: 28,
        controlHeightSM: 24,
        controlHeightLG: 32,
      },
      components: {
        Button: {
          primaryColor: v('--theme-buttonText') || '#ffffff',
          colorPrimary: v('--theme-buttonPrimary') || v('--theme-primary'),
          colorPrimaryHover: v('--theme-buttonPrimaryHover'),
          colorPrimaryActive: v('--theme-buttonPrimaryHover'),
          contentFontSizeSM: 11,
          contentFontSize: 12,
          paddingInlineSM: 8,
          paddingInline: 10,
        },
        Card: {
          colorBgContainer: v('--theme-surface') || v('--theme-background'),
          colorBorderSecondary: v('--theme-border'),
          paddingLG: 10,
          padding: 10,
        },
        Input: {
          colorBgContainer: v('--theme-inputBackground') || v('--theme-background'),
          colorBorder: v('--theme-inputBorder') || v('--theme-border'),
          colorText: v('--theme-inputText') || v('--theme-text'),
          activeBorderColor: v('--theme-inputFocusBorder') || v('--theme-primary'),
          fontSize: 12,
          paddingBlock: 4,
          paddingInline: 8,
        },
        Select: {
          colorBgContainer: v('--theme-inputBackground') || v('--theme-background'),
          colorBorder: v('--theme-inputBorder') || v('--theme-border'),
          colorText: v('--theme-text'),
          fontSize: 12,
        },
        Switch: {
          colorPrimary: v('--theme-primary') || v('--theme-buttonPrimary'),
          colorPrimaryHover: v('--theme-buttonPrimaryHover'),
        },
        Tag: {
          colorPrimary: v('--theme-primary') || v('--theme-buttonPrimary'),
          fontSize: 11,
        },
        Slider: {
          railBg: v('--theme-border'),
          trackBg: v('--theme-primary'),
          handleColor: v('--theme-primary'),
          handleActiveColor: v('--theme-primary'),
        },
        Radio: {
          colorPrimary: v('--theme-primary'),
          buttonBg: v('--theme-surface'),
          buttonSolidCheckedBg: v('--theme-primary'),
          buttonSolidCheckedColor: '#fff',
          buttonCheckedBg: v('--theme-primarySoft'),
          buttonColor: v('--theme-textSecondary'),
          fontSize: 12,
        },
        Tabs: {
          colorPrimary: v('--theme-primary'),
          itemSelectedColor: v('--theme-active'),
          itemHoverColor: v('--theme-active'),
          fontSize: 12,
        },
        Modal: {
          contentBg: v('--theme-surface'),
          headerBg: v('--theme-surface'),
          colorBgContainer: v('--theme-surface'),
          titleColor: v('--theme-text'),
          colorText: v('--theme-text'),
        },
        Tooltip: {
          colorBgSpotlight: v('--theme-surface'),
          colorTextLightSolid: v('--theme-text'),
          colorText: v('--theme-text'),
        },
        Typography: {
          colorText: v('--theme-text'),
          colorTextSecondary: v('--theme-textSecondary'),
          fontSize: 12,
        },
        Form: {
          labelColor: v('--theme-text'),
          labelFontSize: 12,
          verticalLabelPadding: '0 0 4px',
        },
        InputNumber: {
          colorBgContainer: v('--theme-inputBackground') || v('--theme-background'),
          colorBorder: v('--theme-inputBorder') || v('--theme-border'),
          colorText: v('--theme-text'),
          fontSize: 12,
          paddingBlock: 4,
          paddingInline: 8,
        },
      },
    };
  }, [themeVersion]);

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
            <Suspense fallback={<div className="loading">加载中…</div>}>
              {showEasterEgg ? (
                <EasterEgg onClose={handleCloseEasterEgg} onOpenChat={handleOpenChat} onOpenChatSettings={() => setShowChatSettings(true)} />
              ) : showSettings ? (
                <Settings onClose={() => setShowSettings(false)} embedded={true} />
              ) : isTabPending ? null : (
                <ActiveTabPanel
                  tab={activeTab}
                  qrSubTab={qrSubTab}
                  onQrSubTabChange={handleQrSubTabChange}
                />
              )}
            </Suspense>
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
