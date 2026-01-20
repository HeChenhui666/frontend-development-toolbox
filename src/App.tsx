import React, { useState, useMemo, lazy, Suspense, useEffect, useRef, useCallback, useTransition, memo, useDeferredValue } from 'react';
import { ConfigProvider } from 'antd';
import './App.css';
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
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollToActiveTab = useRef<boolean>(initialShouldScroll); // 标记是否需要滚动到活动tab
  const [isPending, startTransition] = useTransition(); // React 18 并发特性
  
  // 使用 useDeferredValue 延迟非紧急的标签页更新，提升切换流畅度
  const deferredActiveTab = useDeferredValue(activeTab);

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
  const handleTabsWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (!tabsContainerRef.current) return;

    // 阻止默认垂直滚动，让滚轮用于横向滚动 tab
    event.preventDefault();

    const container = tabsContainerRef.current;
    const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX;
    container.scrollLeft += delta;
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
        <Suspense fallback={null}>
          {showEasterEgg && <EasterEgg onClose={handleCloseEasterEgg} />}
          {showSettings && <Settings onClose={() => setShowSettings(false)} />}
        </Suspense>
        <div className='tabs-container'>
          <div className='tabs' ref={tabsContainerRef} onWheel={handleTabsWheel}>
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
