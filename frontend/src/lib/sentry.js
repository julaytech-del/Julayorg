/**
 * sentry.js — Sentry error tracking initialisation.
 *
 * Set VITE_SENTRY_DSN in .env to enable.
 * PII (email, IP) is stripped from every event in beforeSend.
 * Traces are sampled at 10% to stay within free-tier limits.
 */
import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!DSN) return; // no-op in dev or when DSN not configured

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || 'julay@1.0.0',

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,      // mask all text in session replays (PII protection)
        blockAllMedia: true,
      }),
    ],

    // Performance: 10% of transactions
    tracesSampleRate: 0.1,
    // Session replay: 5% of sessions, 100% of sessions with errors
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,

    beforeSend(event) {
      // Strip PII from all events
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
        delete event.user.username;
      }
      // Strip sensitive request data
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }
      // Don't send events for known non-errors
      if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) return null;
      if (event.exception?.values?.[0]?.value?.includes('ChunkLoadError')) return null;
      return event;
    },

    // Ignore common noisy errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      /Loading chunk \d+ failed/,
      'Non-Error exception captured',
      'Network request failed',
    ],

    // Don't send events for these URLs (bots/crawlers)
    denyUrls: [
      /googlebot/i,
      /bingbot/i,
    ],
  });
}

export { Sentry };
