import React, { useState, useMemo, lazy, Suspense } from 'react';
import './App.css';

// 懒加载组件，按需加载
const QRCodeGenerator = lazy(() => import('./components/QRCodeGenerator'));
const QRCodeDecoder = lazy(() => import('./components/QRCodeDecoder'));
const URLParamsEditor = lazy(() => import('./components/URLParamsEditor'));
const TimestampConverter = lazy(() => import('./components/TimestampConverter'));
const GradientGenerator = lazy(() => import('./components/GradientGenerator'));
const JSONTools = lazy(() => import('./components/JSONTools'));
const RegexTester = lazy(() => import('./components/RegexTester'));

// 定义功能模块类型
type FeatureTab = 'qrcode' | 'urlparams' | 'timestamp' | 'gradient' | 'json' | 'regex' | 'future1' | 'future2';

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

  // 功能模块配置 - 使用useMemo缓存，避免每次渲染都重新创建
  const features: FeatureConfig[] = useMemo(() => [
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
  ], [qrSubTab]);

  const currentFeature = features.find((f) => f.id === activeTab);

  return (
    <div className='app'>
      <div className='header'>
        <div className='header-content'>
          <h1>工具箱</h1>
          <p className='header-subtitle'>实用工具集合</p>
        </div>
      </div>
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
        <Suspense fallback={<div className="loading">加载中...</div>}>
          {currentFeature?.component}
        </Suspense>
      </div>
    </div>
  );
};

export default App;
