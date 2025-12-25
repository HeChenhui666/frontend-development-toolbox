import React, { useState, useMemo, lazy, Suspense, useEffect, useRef } from 'react';
import { ConfigProvider } from 'antd';
import './App.css';
import EasterEgg from './components/EasterEgg';
import ThemeSettings from './components/ThemeSettings';
import { getSavedTheme, applyTheme } from './utils/theme';

// 懒加载组件，按需加载
const QRCodeGenerator = lazy(() => import('./components/QRCodeGenerator'));
const QRCodeDecoder = lazy(() => import('./components/QRCodeDecoder'));
const URLParamsEditor = lazy(() => import('./components/URLParamsEditor'));
const TimestampConverter = lazy(() => import('./components/TimestampConverter'));
const GradientGenerator = lazy(() => import('./components/GradientGenerator'));
const JSONTools = lazy(() => import('./components/JSONTools'));
const RegexTester = lazy(() => import('./components/RegexTester'));
const RandomImageGenerator = lazy(() => import('./components/RandomImageGenerator'));

// 定义功能模块类型
type FeatureTab =
  | 'qrcode'
  | 'urlparams'
  | 'timestamp'
  | 'gradient'
  | 'json'
  | 'regex'
  | 'randomimage'
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
  const [activeTab, setActiveTab] = useState<FeatureTab>('qrcode');
  const [qrSubTab, setQrSubTab] = useState<'generate' | 'decode'>('generate');
  const [clickCount, setClickCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化主题
  useEffect(() => {
    const savedTheme = getSavedTheme();
    applyTheme(savedTheme);
  }, []);

  // 功能模块配置 - 使用useMemo缓存，避免每次渲染都重新创建
  const features: FeatureConfig[] = useMemo(
    () => [
      {
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
      {
        id: 'urlparams',
        name: 'URL参数',
        icon: '🔗',
        component: <URLParamsEditor />,
      },
      {
        id: 'timestamp',
        name: '时间戳',
        icon: '⏰',
        component: <TimestampConverter />,
      },
      {
        id: 'randomimage',
        name: '随机图片',
        icon: '🖼️',
        component: <RandomImageGenerator />,
      },
      {
        id: 'json',
        name: 'JSON',
        icon: '📄',
        component: <JSONTools />,
      },
      {
        id: 'gradient',
        name: '渐变背景',
        icon: '🎨',
        component: <GradientGenerator />,
      },
      {
        id: 'regex',
        name: '正则',
        icon: '🔤',
        component: <RegexTester />,
      },

      // 预留位置，方便后续添加新功能
      // {
      //   id: 'future1',
      //   name: '新功能1',
      //   icon: '✨',
      //   component: <FutureFeature1 />,
      // },
    ],
    [qrSubTab]
  );

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
          <button className='header-settings-btn' onClick={() => setShowThemeSettings(true)} title='主题设置'>
            ⚙️
          </button>
        </div>
        {showEasterEgg && <EasterEgg onClose={handleCloseEasterEgg} />}
        {showThemeSettings && <ThemeSettings onClose={() => setShowThemeSettings(false)} />}
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
