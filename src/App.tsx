import React, { useState, useMemo, lazy, Suspense, useEffect, useRef } from 'react';
import { ConfigProvider } from 'antd';
import './App.css';
import EasterEgg from './components/EasterEgg';
import Settings from './components/Settings';
import { getSavedTheme, applyTheme } from './utils/theme';
import { getDefaultTab, getTabOrder } from './utils/userPreferences';

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

  // 初始化主题和默认标签页
  useEffect(() => {
    const savedTheme = getSavedTheme();
    applyTheme(savedTheme);
    const defaultTab = getDefaultTab();
    setActiveTab(defaultTab as FeatureTab);
  }, []);

  // 监听标签页顺序变化事件
  useEffect(() => {
    const handleTabOrderChange = () => {
      console.log('Tab order changed event received');
      setTabOrderVersion((prev) => prev + 1);
    };
    
    window.addEventListener('tabOrderChanged', handleTabOrderChange);
    // 也监听 storage 事件，以防跨标签页同步
    window.addEventListener('storage', (e) => {
      if (e.key === 'app-tab-order') {
        console.log('Tab order changed via storage event');
        setTabOrderVersion((prev) => prev + 1);
      }
    });
    
    return () => {
      window.removeEventListener('tabOrderChanged', handleTabOrderChange);
    };
  }, []);

  // 所有功能模块定义
  const allFeatures: Partial<Record<FeatureTab, FeatureConfig>> = useMemo(
    () => ({
      qrcode: {
        id: 'qrcode',
        name: '二维码',
        icon: '🔲',
        component: (
          <div className='feature-content'>
            <div className='sub-tabs'>
              <button
                className={`sub-tab ${qrSubTab === 'generate' ? 'active' : ''}`}
                onClick={() => setQrSubTab('generate')}
              >
                <span className='sub-tab-icon'>📱</span>
                <span>生成</span>
              </button>
              <button
                className={`sub-tab ${qrSubTab === 'decode' ? 'active' : ''}`}
                onClick={() => setQrSubTab('decode')}
              >
                <span className='sub-tab-icon'>🔍</span>
                <span>解码</span>
              </button>
            </div>
            <div className='sub-content'>{qrSubTab === 'generate' ? <QRCodeGenerator /> : <QRCodeDecoder />}</div>
          </div>
        ),
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
    }),
    [qrSubTab]
  );

  // 根据用户设置的顺序排列功能模块
  const features: FeatureConfig[] = useMemo(() => {
    const tabOrder = getTabOrder();
    console.log('Computing features with tab order:', tabOrder, 'version:', tabOrderVersion);
    const orderedFeatures = tabOrder
      .map((tab) => allFeatures[tab])
      .filter((feature): feature is FeatureConfig => feature !== undefined);
    console.log('Ordered features:', orderedFeatures.map(f => f.id));
    return orderedFeatures;
  }, [allFeatures, tabOrderVersion]); // 添加 tabOrderVersion 作为依赖

  const currentFeature = features.find((f) => f.id === activeTab);

  // 处理标题点击事件
  const handleTitleClick = () => {
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
  };

  // 关闭彩蛋页面
  const handleCloseEasterEgg = () => {
    setShowEasterEgg(false);
  };

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
          <div className='tabs'>
            {features.map((feature) => (
              <button
                key={feature.id}
                className={`tab ${activeTab === feature.id ? 'active' : ''}`}
                onClick={() => setActiveTab(feature.id)}
                title={feature.name}
              >
                <span className='tab-icon'>{feature.icon}</span>
                <span className='tab-text'>{feature.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className='content'>
          <Suspense fallback={<div className='loading'>加载中...</div>}>{currentFeature?.component}</Suspense>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default App;
