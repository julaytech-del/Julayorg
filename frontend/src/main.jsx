import React from 'react';
import ReactDOM from 'react-dom/client';
import { initSentry } from './lib/sentry.js';

initSentry();
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import store from './store/index.js';
import './i18n/index.js';
import './styles/accessibility.css';
import ThemeWrapper from './ThemeWrapper.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Capacitor mobile init
async function initMobile() {
  if (window.Capacitor?.isNativePlatform()) {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    const { App: CapApp } = await import('@capacitor/app');

    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0F172A' });

    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else CapApp.exitApp();
    });

    await SplashScreen.hide({ fadeOutDuration: 500 });
  }
}

initMobile();

const rootElement = document.getElementById('root');

const app = (
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <BrowserRouter>
          <ThemeWrapper>
            <CssBaseline />
            <App />
          </ThemeWrapper>
        </BrowserRouter>
      </Provider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

// If the root already has HTML children (pre-rendered by react-snap),
// hydrate instead of creating a new root — preserves the pre-rendered HTML
// until React takes over, giving instant FCP with no layout shift.
if (rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(rootElement, app);
} else {
  ReactDOM.createRoot(rootElement).render(app);
}
