import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import ChatApp from './chat/ChatApp';
import { getSavedTheme, applyTheme } from './utils/theme';
import './chat/chat.css';

applyTheme(getSavedTheme());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <ChatApp />
    </HashRouter>
  </React.StrictMode>
);
