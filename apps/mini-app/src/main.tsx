import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';

// Initialize Telegram Mini App SDK
const tg = (window as any).Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  // Set theme color based on Telegram's theme
  document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor);
  document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
