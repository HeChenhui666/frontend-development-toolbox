import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ExtensionMouseTrail from './components/MouseTrail/ExtensionMouseTrail';
import './App.css';
import { getSavedTheme, applyTheme } from './utils/theme';

// 在首屏渲染前应用主题，减少闪动
applyTheme(getSavedTheme());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <ExtensionMouseTrail />
    <App />
  </>
);

