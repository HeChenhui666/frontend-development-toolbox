import React, { lazy, Suspense, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';
import { getSavedTheme, applyTheme } from './utils/theme';
import './i18n'; // 国际化初始化
import { storage } from './services/StorageService';

// 启动时执行数据版本迁移
storage.runMigrations();

// 在首屏渲染前应用主题，减少闪动
applyTheme(getSavedTheme());

const ExtensionMouseTrail = lazy(() => import('./features/browser-tools/MouseTrail/ExtensionMouseTrail'));

/** 拖尾在 idle 后再挂载，避免与首屏 React 竞争 storage / 画布初始化 */
const DeferredExtensionMouseTrail: React.FC = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(() => setReady(true), { timeout: 2500 });
      return () => cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setReady(true), 1);
    return () => clearTimeout(id);
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <ExtensionMouseTrail />
    </Suspense>
  );
};

// ── 全局错误捕获 ──
window.onerror = (_message, source, lineno, colno, error) => {
  console.error('[GlobalError]', { source, lineno, colno, error });
};

window.addEventListener('unhandledrejection', (event) => {
  console.error('[UnhandledRejection]', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <DeferredExtensionMouseTrail />
    <App />
  </>
);

