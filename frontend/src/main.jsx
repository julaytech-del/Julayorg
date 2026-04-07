import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import App from './App.jsx';
import store from './store/index.js';
import './i18n/index.js';
import ThemeWrapper from './ThemeWrapper.jsx';

// Capacitor mobile init
async function initMobile() {
  if (window.Capacitor?.isNativePlatform()) {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    const { App: CapApp } = await import('@capacitor/app');

    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0F172A' });

    // Android back button → go back in history
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else CapApp.exitApp();
    });

    await SplashScreen.hide({ fadeOutDuration: 500 });
  }
}

initMobile();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeWrapper>
          <CssBaseline />
          <App />
        </ThemeWrapper>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
