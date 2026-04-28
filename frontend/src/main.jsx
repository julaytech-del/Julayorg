import React from 'react';
import ReactDOM from 'react-dom/client';
import { initSentry } from './lib/sentry.js';

initSentry();
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import App from './App.jsx';
import store from './store/index.js';
import './i18n/index.js';
import './styles/accessibility.css';
import ThemeWrapper from './ThemeWrapper.jsx';

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

window.__APP_VERSION__ = '2026-04-26';

// ── Analytics tracker ────────────────────────────────────────────────────────
(function () {
  const ENDPOINT = 'https://julay.org/api/analytics/track';
  const lang = navigator.language || '';
  const ua   = navigator.userAgent || '';
  const sessionStart = Date.now();

  function sid() {
    let id = sessionStorage.getItem('_asid');
    if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('_asid', id); }
    return id;
  }

  function beacon(payload) {
    try { navigator.sendBeacon(ENDPOINT, new Blob([JSON.stringify(payload)], { type: 'application/json' })); } catch {}
  }

  // pageview
  function sendPage(url) {
    beacon({ eventType: 'pageview', url, referrer: document.referrer, sessionId: sid(), language: lang });
  }

  // click tracking on CTA buttons
  function trackClick(e) {
    const el = e.target.closest('a,button');
    if (!el) return;
    const label = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('href') || '').trim().slice(0, 60);
    if (!label) return;
    beacon({ eventType: 'click', url: location.pathname, element: label, sessionId: sid(), language: lang, referrer: '' });
  }

  // scroll depth tracking (fires once per threshold)
  const fired = new Set();
  function trackScroll() {
    const pct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    [25, 50, 75, 100].forEach(t => {
      if (pct >= t && !fired.has(t)) {
        fired.add(t);
        beacon({ eventType: 'scroll', url: location.pathname, scrollDepth: t, sessionId: sid(), language: lang, referrer: '' });
      }
    });
  }

  // session end — send duration
  function sendSessionEnd() {
    const duration = Math.round((Date.now() - sessionStart) / 1000);
    beacon({ eventType: 'session_end', url: location.pathname, duration, sessionId: sid(), language: lang, referrer: '' });
  }

  // init
  sendPage(location.pathname + location.search);
  document.addEventListener('click', trackClick, { passive: true });
  document.addEventListener('scroll', trackScroll, { passive: true });
  addEventListener('beforeunload', sendSessionEnd);

  const orig = history.pushState.bind(history);
  history.pushState = (...a) => { orig(...a); sendPage(location.pathname + location.search); };
  addEventListener('popstate', () => sendPage(location.pathname + location.search));
})();
// ────────────────────────────────────────────────────────────────────────────

const rootElement = document.getElementById('root');

const app = (
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

// If the root already has HTML children (pre-rendered by react-snap),
// hydrate instead of creating a new root — preserves the pre-rendered HTML
// until React takes over, giving instant FCP with no layout shift.
if (rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(rootElement, app);
} else {
  ReactDOM.createRoot(rootElement).render(app);
}
