import React, { useState, useMemo, lazy, Suspense, useEffect, useRef, useCallback, useTransition, memo } from 'react';
import { ConfigProvider, theme as antdTheme, Popover, Button } from 'antd';
import './App.css';
import { getDefaultTab, getTabOrder, getActiveTab, saveActiveTab, DefaultTab } from './utils/userPreferences';
import { openChatWindow } from './utils/openChatWindow';

// 懒加载组件，按需加载
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

// 定义功能模块类型
type FeatureTab = DefaultTab | 'future1' | 'future2';

const isPersistedTab = (tab: FeatureTab): tab is DefaultTab =>
  tab !== 'future1' && tab !== 'future2';

// 定义功能配置
interface FeatureMeta {
  id: FeatureTab;
  name: string;
  icon: string;
}

const FEATURE_META_MAP: Record<FeatureTab, FeatureMeta> = {
  qrcode: { id: 'qrcode', name: '二维码', icon: '🔲' },
  urlparams: { id: 'urlparams', name: 'URL参数', icon: '🔗' },
  timestamp: { id: 'timestamp', name: '时间戳', icon: '⏰' },
  randomimage: { id: 'randomimage', name: '图片工具', icon: '🖼️' },
  json: { id: 'json', name: 'JSON', icon: '📄' },
  gradient: { id: 'gradient', name: '颜色工具', icon: '🎨' },
  regex: { id: 'regex', name: '正则', icon: '🔤' },
  translator: { id: 'translator', name: '在线翻译', icon: '🌐' },
  apitester: { id: 'apitester', name: 'API调试', icon: '🔌' },
  cachemanager: { id: 'cachemanager', name: '缓存管理', icon: '🧹' },
  redirector: { id: 'redirector', name: '请求重定向', icon: '🔄' },
  webactions: { id: 'webactions', name: '网页操作', icon: '🧭' },
  mousetrail: { id: 'mousetrail', name: '鼠标拖尾', icon: '✨' },
  codec: { id: 'codec', name: '编码/解码', icon: '🔣' },
  future1: { id: 'future1', name: '未来功能1', icon: '🧪' },
  future2: { id: 'future2', name: '未来功能2', icon: '🧪' },
};

interface ActiveTabPanelProps {
  tab: FeatureTab;
  qrSubTab: 'generate' | 'decode';
  onQrSubTabChange: (next: 'generate' | 'decode') => void;
}

/** 只挂载当前 Tab 对应的懒加载子树，避免在内存里为所有 Tab 创建元素 */
const ActiveTabPanel = memo<ActiveTabPanelProps>(({ tab, qrSubTab, onQrSubTabChange }) => {
  switch (tab) {
    case 'qrcode':
      return (
        <div className='feature-content'>
          <div className='sub-tabs'>
            <button
              type='button'
              className={`sub-tab ${qrSubTab === 'generate' ? 'active' : ''}`}
              onClick={() => onQrSubTabChange('generate')}
            >
              <span className='sub-tab-icon'>📱</span>
              <span>生成</span>
            </button>
            <button
              type='button'
              className={`sub-tab ${qrSubTab === 'decode' ? 'active' : ''}`}
              onClick={() => onQrSubTabChange('decode')}
            >
              <span className='sub-tab-icon'>🔍</span>
              <span>解码</span>
            </button>
          </div>
          <div className='sub-content'>{qrSubTab === 'generate' ? <QRCodeGenerator /> : <QRCodeDecoder />}</div>
        </div>
      );
    case 'urlparams':
      return <URLParamsEditor />;
    case 'timestamp':
      return <TimestampConverter />;
    case 'randomimage':
      return <ImageTools />;
    case 'json':
      return <JSONTools />;
    case 'gradient':
      return <ColorTools />;
    case 'regex':
      return <RegexTester />;
    case 'translator':
      return <Translator />;
    case 'apitester':
      return <APITester />;
    case 'cachemanager':
      return <CacheManager />;
    case 'redirector':
      return <RequestRedirector />;
    case 'webactions':
      return <WebActions />;
    case 'mousetrail':
      return <MouseTrail />;
    case 'codec':
      return <CodecTools />;
    case 'future1':
    case 'future2':
      return null;
    default:
      return null;
  }
});

ActiveTabPanel.displayName = 'ActiveTabPanel';

const App: React.FC = () => {
  const { initialActiveTab, initialShouldScroll } = useMemo(() => {
    const lastActiveTab = getActiveTab();
    if (lastActiveTab) {
      return { initialActiveTab: lastActiveTab as FeatureTab, initialShouldScroll: true };
    }
    return { initialActiveTab: getDefaultTab() as FeatureTab, initialShouldScroll: false };
  }, []);
  const [activeTab, setActiveTab] = useState<FeatureTab>(initialActiveTab);
  const [qrSubTab, setQrSubTab] = useState<'generate' | 'decode'>('generate');
  const [clickCount, setClickCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tabOrderVersion, setTabOrderVersion] = useState(0); // 用于触发重新计算
  const [allTabsOpen, setAllTabsOpen] = useState(false);
  const [showAllTabsButton, setShowAllTabsButton] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollToActiveTab = useRef<boolean>(initialShouldScroll); // 标记是否需要滚动到活动tab
  // 标签切换单独用 isPending，避免与「保存 tab / 顺序更新」的低优先级 transition 混用导致内容区被误隐藏
  const [isTabPending, startTabTransition] = useTransition();
  const [, startDeferredUpdate] = useTransition();

  // 检测运行模式：popup / sidepanel / standalone
  const { isPopupMode, isSidePanelMode } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { isPopupMode: false, isSidePanelMode: false };
    }

    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const path = window.location.pathname;
    const isSidePanelEntry = /(^|\/)sidepanel\.html$/i.test(path);
    const isPopupEntry = /(^|\/)popup\.html$/i.test(path);
    const isStandaloneEntry = /(^|\/)standalone\.html$/i.test(path);

    // Chromium 系扩展页多为 chrome-extension:；部分国产浏览器内核可能使用其它 *-extension: 协议名
    const isExtensionProtocol = /-extension:$/i.test(window.location.protocol);
    const hasChromeRuntime =
      typeof (window as any).chrome !== 'undefined' &&
      (window as any).chrome.runtime &&
      (window as any).chrome.runtime.id;
    const isSmallWindow = window.innerWidth <= 500 && window.innerHeight <= 650;
    const isPopupHeuristic = (isExtensionProtocol || hasChromeRuntime) && isSmallWindow;

    if (mode === 'sidepanel' || isSidePanelEntry) {
      return { isPopupMode: false, isSidePanelMode: true };
    }
    if (mode === 'popup' || isPopupEntry) {
      return { isPopupMode: true, isSidePanelMode: false };
    }
    if (mode === 'standalone' || isStandaloneEntry) {
      return { isPopupMode: false, isSidePanelMode: false };
    }

    return { isPopupMode: isPopupHeuristic, isSidePanelMode: false };
  }, []);

  // 监听标签页顺序变化事件
  useEffect(() => {
    const handleTabOrderChange = () => {
      startDeferredUpdate(() => {
        setTabOrderVersion((prev) => prev + 1);
      });
    };
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-tab-order') {
        startDeferredUpdate(() => {
          setTabOrderVersion((prev) => prev + 1);
        });
      }
    };
    
    window.addEventListener('tabOrderChanged', handleTabOrderChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('tabOrderChanged', handleTabOrderChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 使用 useCallback 优化 qrSubTab 切换处理函数
  const handleQrSubTabChange = useCallback((tab: 'generate' | 'decode') => {
    setQrSubTab(tab);
  }, []);

  const handleOpenChat = useCallback(() => {
    openChatWindow();
  }, []);

  // 根据用户设置的顺序排列功能模块
  const features: FeatureMeta[] = useMemo(() => {
    const tabOrder = getTabOrder();
    const orderedFeatures = tabOrder
      .map((tab) => FEATURE_META_MAP[tab])
      .filter((feature): feature is FeatureMeta => feature !== undefined);
    return orderedFeatures;
  }, [tabOrderVersion]);

  // 处理标题点击事件
  const handleTitleClick = useCallback(() => {
    // 清除之前的超时定时器
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    const newCount = clickCount + 1;
    setClickCount(newCount);

    // 如果达到5次点击，显示彩蛋
    if (newCount >= 10) {
      setShowEasterEgg(true);
      setClickCount(0);
    } else {
      // 设置超时，如果2秒内没有继续点击，重置计数
      clickTimeoutRef.current = setTimeout(() => {
        setClickCount(0);
      }, 2000);
    }
  }, [clickCount]);

  // 关闭彩蛋页面
  const handleCloseEasterEgg = useCallback(() => {
    setShowEasterEgg(false);
  }, []);

  // Tab 切换处理函数
  const handleTabChange = useCallback((tab: FeatureTab) => {
    startTabTransition(() => {
      setActiveTab(tab);
    });
    setAllTabsOpen(false);
    shouldScrollToActiveTab.current = true;
  }, []);

  // 滚动活动tab到容器中间
  const scrollActiveTabToCenter = useCallback(() => {
    if (!tabsContainerRef.current) return;
    
    const container = tabsContainerRef.current;
    const activeTabElement = container.querySelector(`.tab.active`) as HTMLElement;
    
    if (activeTabElement) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTabElement.getBoundingClientRect();
      
      // 计算需要滚动的距离，使tab位于容器中间
      const scrollLeft = 
        activeTabElement.offsetLeft - 
        (containerRect.width / 2) + 
        (tabRect.width / 2);
      
      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      });
    }
  }, []);

  // 支持在 tab 区域通过鼠标滚轮横向滚动
  // 兼容 Windows 系统和所有主流浏览器（Chrome、Edge、Firefox）
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      // 检查事件是否可以被取消（兼容性处理）
      // 在 Windows 系统上，如果事件是 passive 的，cancelable 会是 false
      if (event.cancelable) {
        // 如果事件可取消，阻止默认垂直滚动行为
        event.preventDefault();
      }

      // 执行横向滚动（无论事件是否可取消都执行）
      const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX;
      container.scrollLeft += delta;
    };

    // 尝试使用 passive: false 添加事件监听器
    // 如果浏览器不支持 passive 选项，会忽略该选项，但事件监听器仍然正常工作
    // Windows 系统上的 Chrome、Edge、Firefox 都支持 passive 选项
    try {
      container.addEventListener('wheel', handleWheel, { passive: false });
    } catch (e) {
      // 如果添加失败（极少数旧版浏览器），使用传统方式
      container.addEventListener('wheel', handleWheel, false);
    }

    return () => {
      // 清理事件监听器
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // 只有在 tabs 可滚动时才显示“全部”按钮
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const updateScrollable = () => {
      const isScrollable = container.scrollWidth > container.clientWidth + 1;
      setShowAllTabsButton(isScrollable);
      if (!isScrollable) {
        setAllTabsOpen(false);
      }
    };

    const rafId = requestAnimationFrame(updateScrollable);
    window.addEventListener('resize', updateScrollable);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateScrollable);
      resizeObserver.observe(container);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateScrollable);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [features]);

  // 在恢复 tab 后滚动到中间（双 rAF：等布局稳定，避免固定 100ms 延迟）
  useEffect(() => {
    if (!shouldScrollToActiveTab.current) return;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;
        scrollActiveTabToCenter();
        shouldScrollToActiveTab.current = false;
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [activeTab, features, scrollActiveTabToCenter]);

  // 保存当前活动的tab（使用 startTransition 避免阻塞UI）
  useEffect(() => {
    if (isPersistedTab(activeTab)) {
      startDeferredUpdate(() => {
        saveActiveTab(activeTab);
      });
    }
  }, [activeTab]);

  // 页面关闭或隐藏时保存当前tab（同步保存，不使用 startTransition）
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isPersistedTab(activeTab)) {
        saveActiveTab(activeTab);
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (isPersistedTab(activeTab)) {
          saveActiveTab(activeTab);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeTab]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // 监听主题变化，动态更新 antd 主题
  const [themeVersion, setThemeVersion] = useState(0);
  useEffect(() => {
    const handleThemeChange = () => {
      setThemeVersion((prev) => prev + 1);
    };

    // 监听 storage 变化（主题切换时）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-theme') {
        handleThemeChange();
      }
    };

    // 监听自定义事件（主题切换时触发）
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChanged', handleThemeChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  // 每次主题版本变化时重新计算主题配置（单次 getComputedStyle，避免多次读样式树）
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
        paddingXXS: 6,
        paddingXS: 6,
        paddingSM: 6,
        paddingLG: 6,
        paddingXL: 6,
        colorBgContainer: v('--theme-background'),
        colorText: v('--theme-text'),
        colorTextSecondary: v('--theme-textSecondary'),
        colorBorder: v('--theme-border'),
        colorBorderSecondary: v('--theme-borderLight'),
      },
      components: {
        Button: {
          primaryColor: v('--theme-buttonText') || '#ffffff',
          colorPrimary: v('--theme-buttonPrimary') || v('--theme-primary'),
          colorPrimaryHover: v('--theme-buttonPrimaryHover'),
          colorPrimaryActive: v('--theme-buttonPrimaryHover'),
        },
        Card: {
          colorBgContainer: v('--theme-surface') || v('--theme-background'),
          colorBorderSecondary: v('--theme-border'),
        },
        Input: {
          colorBgContainer: v('--theme-inputBackground') || v('--theme-background'),
          colorBorder: v('--theme-inputBorder') || v('--theme-border'),
          colorText: v('--theme-inputText') || v('--theme-text'),
          activeBorderColor: v('--theme-inputFocusBorder') || v('--theme-primary'),
        },
        Switch: {
          colorPrimary: v('--theme-primary') || v('--theme-buttonPrimary'),
          colorPrimaryHover: v('--theme-buttonPrimaryHover'),
        },
        Tag: {
          colorPrimary: v('--theme-primary') || v('--theme-buttonPrimary'),
        },
      },
    };
  }, [themeVersion]);

  return (
    <ConfigProvider theme={dynamicThemeConfig}>
      <div className={`app ${isPopupMode ? 'app-popup' : 'app-standalone'} ${isSidePanelMode ? 'app-sidepanel' : ''}`}>
        <div className='header'>
          <div className='header-content'>
            <h1 className='header-title' onClick={handleTitleClick}>
              🇨🇳工具箱🇨🇳
            </h1>
            <p className='header-subtitle'>实用工具集合</p>
          </div>
          <button type='button' className='header-chat-btn' onClick={handleOpenChat} title='聊天室'>
            💬
          </button>
          <button className='header-settings-btn' onClick={() => setShowSettings(true)} title='设置'>
            ⚙️
          </button>
        </div>
        <Suspense fallback={null}>
          {showEasterEgg && <EasterEgg onClose={handleCloseEasterEgg} />}
          {showSettings && <Settings onClose={() => setShowSettings(false)} />}
        </Suspense>
        <div className='tabs-container'>
          <div className='tabs' ref={tabsContainerRef}>
            {features.map((feature) => (
              <TabButton
                key={feature.id}
                feature={feature}
                isActive={activeTab === feature.id}
                onClick={handleTabChange}
              />
            ))}
          </div>
          {showAllTabsButton && (
            <div className='tabs-all'>
              <Popover
                open={allTabsOpen}
                onOpenChange={setAllTabsOpen}
                placement="bottomRight"
                trigger="click"
                overlayClassName="tabs-all-overlay"
                overlayInnerStyle={{ padding: 0 }}
                content={
                  <div className="tabs-all-popover">
                    {features.map((feature) => (
                      <Button
                        key={feature.id}
                        type={activeTab === feature.id ? 'primary' : 'text'}
                        size="small"
                        className="tabs-all-item"
                        onClick={() => handleTabChange(feature.id)}
                      >
                        <span className="tabs-all-icon">{feature.icon}</span>
                        <span className="tabs-all-text">{feature.name}</span>
                      </Button>
                    ))}
                  </div>
                }
              >
                <Button className="tabs-all-button" size="small" type="text">
                  全部
                </Button>
              </Popover>
            </div>
          )}
        </div>
        <div className='content'>
          <Suspense fallback={<div className='loading'>加载中...</div>}>
            {isTabPending ? <div className='loading'>切换中...</div> : null}
            {!isTabPending ? (
              <ActiveTabPanel
                tab={activeTab}
                qrSubTab={qrSubTab}
                onQrSubTabChange={handleQrSubTabChange}
              />
            ) : null}
          </Suspense>
        </div>
      </div>
    </ConfigProvider>
  );
};

// 优化：使用 memo 包装 Tab 按钮组件，避免不必要的重渲染
interface TabButtonProps {
  feature: FeatureMeta;
  isActive: boolean;
  onClick: (tab: FeatureTab) => void;
}

const TabButton = memo<TabButtonProps>(({ feature, isActive, onClick }) => {
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(feature.id);
  }, [feature.id, onClick]);

  return (
    <button
      className={`tab ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      title={feature.name}
      type="button"
    >
      <span className='tab-icon'>{feature.icon}</span>
      <span className='tab-text'>{feature.name}</span>
    </button>
  );
});

TabButton.displayName = 'TabButton';

export default App;
