import React, { useState, useMemo, lazy, Suspense, useEffect, useRef, useCallback, useTransition, memo, useDeferredValue } from 'react';
import { ConfigProvider, theme as antdTheme, Popover, Button } from 'antd';
import './App.css';
import { getDefaultTab, getTabOrder, getActiveTab, saveActiveTab } from './utils/userPreferences';
import { getSavedTheme } from './utils/theme';

// 懒加载组件，按需加载
const QRCodeGenerator = lazy(() => import('./components/QRCodeGenerator'));
const QRCodeDecoder = lazy(() => import('./components/QRCodeDecoder'));
const URLParamsEditor = lazy(() => import('./components/URLParamsEditor'));
const TimestampConverter = lazy(() => import('./components/TimestampConverter'));
const ColorTools = lazy(() => import('./components/ColorTools'));
const JSONTools = lazy(() => import('./components/JSONTools'));
const RegexTester = lazy(() => import('./components/RegexTester'));
const ImageTools = lazy(() => import('./components/ImageTools'));
const CSSTools = lazy(() => import('./components/CSSTools'));
const Translator = lazy(() => import('./components/Translator'));
const APITester = lazy(() => import('./components/APITester'));
const RequestRedirector = lazy(() => import('./components/RequestRedirector'));
const Settings = lazy(() => import('./components/Settings'));
const EasterEgg = lazy(() => import('./components/EasterEgg'));

// 定义功能模块类型
type FeatureTab =
  | 'qrcode'
  | 'urlparams'
  | 'timestamp'
  | 'gradient'
  | 'json'
  | 'regex'
  | 'randomimage'
  | 'css'
  | 'translator'
  | 'apitester'
  | 'redirector'
  | 'future1'
  | 'future2';

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
  css: { id: 'css', name: 'CSS预设', icon: '🎨' },
  translator: { id: 'translator', name: '在线翻译', icon: '🌐' },
  apitester: { id: 'apitester', name: 'API调试', icon: '🔌' },
  redirector: { id: 'redirector', name: '请求重定向', icon: '🔄' },
  future1: { id: 'future1', name: '未来功能1', icon: '🧪' },
  future2: { id: 'future2', name: '未来功能2', icon: '🧪' },
};

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
  const [isPending, startTransition] = useTransition(); // React 18 并发特性
  
  // 使用 useDeferredValue 延迟非紧急的标签页更新，提升切换流畅度
  const deferredActiveTab = useDeferredValue(activeTab);

  // 检测是否为插件popup环境
  const isPopupMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    
    // 检查URL协议：插件popup的URL是 chrome-extension://
    const isExtensionProtocol = window.location.protocol === 'chrome-extension:';
    
    // 检查是否有chrome.runtime.id（插件环境）
    const hasChromeRuntime = typeof (window as any).chrome !== 'undefined' && 
      (window as any).chrome.runtime && 
      (window as any).chrome.runtime.id;
    
    // 检查窗口大小是否接近插件popup的固定尺寸（450x580）
    // 如果窗口明显大于这个尺寸，说明是独立页面
    const isSmallWindow = window.innerWidth <= 500 && window.innerHeight <= 650;
    
    // 如果是插件协议且窗口大小接近固定尺寸，则认为是popup模式
    // 或者有chrome.runtime.id且窗口小，也认为是popup模式
    return (isExtensionProtocol || hasChromeRuntime) && isSmallWindow;
  }, []);

  // 监听标签页顺序变化事件
  useEffect(() => {
    const handleTabOrderChange = () => {
      startTransition(() => {
        setTabOrderVersion((prev) => prev + 1);
      });
    };
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-tab-order') {
        startTransition(() => {
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

  // 所有功能模块定义 - 优化：将 QRCode 子标签页组件提取出来，避免每次重新创建
  const qrCodeComponent = useMemo(
    () => (
      <div className='feature-content'>
        <div className='sub-tabs'>
          <button
            className={`sub-tab ${qrSubTab === 'generate' ? 'active' : ''}`}
            onClick={() => handleQrSubTabChange('generate')}
          >
            <span className='sub-tab-icon'>📱</span>
            <span>生成</span>
          </button>
          <button
            className={`sub-tab ${qrSubTab === 'decode' ? 'active' : ''}`}
            onClick={() => handleQrSubTabChange('decode')}
          >
            <span className='sub-tab-icon'>🔍</span>
            <span>解码</span>
          </button>
        </div>
        <div className='sub-content'>{qrSubTab === 'generate' ? <QRCodeGenerator /> : <QRCodeDecoder />}</div>
      </div>
    ),
    [qrSubTab, handleQrSubTabChange]
  );

  const featureComponents = useMemo<Record<FeatureTab, React.ReactNode>>(
    () => ({
      qrcode: qrCodeComponent,
      urlparams: <URLParamsEditor />,
      timestamp: <TimestampConverter />,
      randomimage: <ImageTools />,
      json: <JSONTools />,
      gradient: <ColorTools />,
      regex: <RegexTester />,
      css: <CSSTools />,
      translator: <Translator />,
      apitester: <APITester />,
      redirector: <RequestRedirector />,
      future1: null,
      future2: null,
    }),
    [qrCodeComponent]
  );

  // 根据用户设置的顺序排列功能模块
  const features: FeatureMeta[] = useMemo(() => {
    const tabOrder = getTabOrder();
    const orderedFeatures = tabOrder
      .map((tab) => FEATURE_META_MAP[tab])
      .filter((feature): feature is FeatureMeta => feature !== undefined);
    return orderedFeatures;
  }, [tabOrderVersion]);

  // 使用 deferredActiveTab 来延迟非紧急的组件切换，提升切换流畅度
  const currentFeature = useMemo(() => {
    return featureComponents[deferredActiveTab] ?? null;
  }, [featureComponents, deferredActiveTab]);

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
    startTransition(() => {
      setActiveTab(tab);
    });
    setAllTabsOpen(false);
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

  // 在恢复tab后滚动到中间
  useEffect(() => {
    if (shouldScrollToActiveTab.current) {
      // 延迟执行，确保DOM已渲染
      setTimeout(() => {
        scrollActiveTabToCenter();
        shouldScrollToActiveTab.current = false;
      }, 100);
    }
  }, [activeTab, features, scrollActiveTabToCenter]);

  // 保存当前活动的tab（使用 startTransition 避免阻塞UI）
  useEffect(() => {
    startTransition(() => {
      saveActiveTab(activeTab);
    });
  }, [activeTab]);

  // 页面关闭或隐藏时保存当前tab（同步保存，不使用 startTransition）
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveActiveTab(activeTab);
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveActiveTab(activeTab);
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

  // 获取 CSS 变量值的辅助函数
  const getCSSVariable = useCallback((varName: string) => {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || undefined;
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

  // 每次主题版本变化时重新计算主题配置
  const dynamicThemeConfig = useMemo(() => {
    return {
      algorithm: antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: getCSSVariable('--theme-primary') || getCSSVariable('--theme-buttonPrimary'),
        colorSuccess: getCSSVariable('--theme-success'),
        colorError: getCSSVariable('--theme-error'),
        colorWarning: '#faad14',
        colorInfo: getCSSVariable('--theme-primary') || getCSSVariable('--theme-buttonPrimary'),
        borderRadius: 4,
        borderRadiusSM: 4,
        borderRadiusLG: 4,
        padding: 6,
        paddingXXS: 6,
        paddingXS: 6,
        paddingSM: 6,
        paddingLG: 6,
        paddingXL: 6,
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
        Card: {
          colorBgContainer: getCSSVariable('--theme-surface') || getCSSVariable('--theme-background'),
          colorBorderSecondary: getCSSVariable('--theme-border'),
        },
        Input: {
          colorBgContainer: getCSSVariable('--theme-inputBackground') || getCSSVariable('--theme-background'),
          colorBorder: getCSSVariable('--theme-inputBorder') || getCSSVariable('--theme-border'),
          colorText: getCSSVariable('--theme-inputText') || getCSSVariable('--theme-text'),
          activeBorderColor: getCSSVariable('--theme-inputFocusBorder') || getCSSVariable('--theme-primary'),
        },
        Switch: {
          colorPrimary: getCSSVariable('--theme-primary') || getCSSVariable('--theme-buttonPrimary'),
          colorPrimaryHover: getCSSVariable('--theme-buttonPrimaryHover'),
        },
        Tag: {
          colorPrimary: getCSSVariable('--theme-primary') || getCSSVariable('--theme-buttonPrimary'),
        },
      },
    };
  }, [themeVersion, getCSSVariable]);

  return (
    <ConfigProvider theme={dynamicThemeConfig}>
      <div className={`app ${isPopupMode ? 'app-popup' : 'app-standalone'}`}>
        <div className='header'>
          <div className='header-content'>
            <h1 className='header-title' onClick={handleTitleClick}>
              🇨🇳工具箱🇨🇳
            </h1>
            <p className='header-subtitle'>实用工具集合</p>
          </div>
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
            {isPending && activeTab !== deferredActiveTab ? (
              <div className='loading'>切换中...</div>
            ) : (
              currentFeature
            )}
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
