import React, { useState, useMemo, lazy, Suspense, useEffect, useRef, useCallback, useTransition, memo, useDeferredValue } from 'react';
import { ConfigProvider } from 'antd';
import './App.css';
import EasterEgg from './components/EasterEgg';
import Settings from './components/Settings';
import { getSavedTheme, applyTheme } from './utils/theme';
import { getDefaultTab, getTabOrder, getActiveTab, saveActiveTab } from './utils/userPreferences';

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
  | 'future1'
  | 'future2';

// 定义功能配置
interface FeatureConfig {
  id: FeatureTab;
  name: string;
  icon: string;
  component: React.ReactNode;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FeatureTab>(getDefaultTab() as FeatureTab);
  const [qrSubTab, setQrSubTab] = useState<'generate' | 'decode'>('generate');
  const [clickCount, setClickCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tabOrderVersion, setTabOrderVersion] = useState(0); // 用于触发重新计算
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollToActiveTab = useRef<boolean>(false); // 标记是否需要滚动到活动tab
  const [isPending, startTransition] = useTransition(); // React 18 并发特性
  
  // 使用 useDeferredValue 延迟非紧急的标签页更新，提升切换流畅度
  const deferredActiveTab = useDeferredValue(activeTab);

  // 初始化主题和标签页（优先使用上次活动的tab，否则使用默认tab）
  useEffect(() => {
    // 主题应用是同步的，必须立即执行
    const savedTheme = getSavedTheme();
    applyTheme(savedTheme);
    
    // 延迟非关键的标签页恢复，使用 requestIdleCallback 或 setTimeout 避免阻塞初始渲染
    const initTab = () => {
      startTransition(() => {
        const lastActiveTab = getActiveTab();
        if (lastActiveTab) {
          // 如果恢复了上次的tab，标记需要滚动
          shouldScrollToActiveTab.current = true;
          setActiveTab(lastActiveTab as FeatureTab);
        } else {
          const defaultTab = getDefaultTab();
          setActiveTab(defaultTab as FeatureTab);
        }
      });
    };

    // 使用 requestIdleCallback 延迟非关键操作，如果浏览器不支持则使用 setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initTab, { timeout: 100 });
    } else {
      setTimeout(initTab, 0);
    }
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

  const allFeatures: Partial<Record<FeatureTab, FeatureConfig>> = useMemo(
    () => ({
      qrcode: {
        id: 'qrcode',
        name: '二维码',
        icon: '🔲',
        component: qrCodeComponent,
      },
      urlparams: {
        id: 'urlparams',
        name: 'URL参数',
        icon: '🔗',
        component: <URLParamsEditor />,
      },
      timestamp: {
        id: 'timestamp',
        name: '时间戳',
        icon: '⏰',
        component: <TimestampConverter />,
      },
      randomimage: {
        id: 'randomimage',
        name: '图片工具',
        icon: '🖼️',
        component: <ImageTools />,
      },
      json: {
        id: 'json',
        name: 'JSON',
        icon: '📄',
        component: <JSONTools />,
      },
      gradient: {
        id: 'gradient',
        name: '颜色工具',
        icon: '🎨',
        component: <ColorTools />,
      },
      regex: {
        id: 'regex',
        name: '正则',
        icon: '🔤',
        component: <RegexTester />,
      },
      css: {
        id: 'css',
        name: 'CSS预设',
        icon: '🎨',
        component: <CSSTools />,
      },
      translator: {
        id: 'translator',
        name: '在线翻译',
        icon: '🌐',
        component: <Translator />,
      },
    }),
    [qrCodeComponent]
  );

  // 根据用户设置的顺序排列功能模块
  const features: FeatureConfig[] = useMemo(() => {
    const tabOrder = getTabOrder();
    const orderedFeatures = tabOrder
      .map((tab) => allFeatures[tab])
      .filter((feature): feature is FeatureConfig => feature !== undefined);
    return orderedFeatures;
  }, [allFeatures, tabOrderVersion]);

  // 使用 deferredActiveTab 来延迟非紧急的组件切换，提升切换流畅度
  const currentFeature = useMemo(() => {
    return features.find((f) => f.id === deferredActiveTab);
  }, [features, deferredActiveTab]);

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

  return (
    <ConfigProvider>
      <div className='app'>
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
        {showEasterEgg && <EasterEgg onClose={handleCloseEasterEgg} />}
        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
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
        </div>
        <div className='content'>
          <Suspense fallback={<div className='loading'>加载中...</div>}>
            {isPending && activeTab !== deferredActiveTab ? (
              <div className='loading'>切换中...</div>
            ) : (
              currentFeature?.component
            )}
          </Suspense>
        </div>
      </div>
    </ConfigProvider>
  );
};

// 优化：使用 memo 包装 Tab 按钮组件，避免不必要的重渲染
interface TabButtonProps {
  feature: FeatureConfig;
  isActive: boolean;
  onClick: (tab: FeatureTab) => void;
}

const TabButton = memo<TabButtonProps>(({ feature, isActive, onClick }) => {
  return (
    <button
      className={`tab ${isActive ? 'active' : ''}`}
      onClick={() => onClick(feature.id)}
      title={feature.name}
    >
      <span className='tab-icon'>{feature.icon}</span>
      <span className='tab-text'>{feature.name}</span>
    </button>
  );
});

TabButton.displayName = 'TabButton';

export default App;
