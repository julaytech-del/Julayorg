/**
 * Analytics.jsx
 *
 * Consent-gated Plausible analytics controller.
 *
 * The Plausible script is loaded unconditionally from index.html so that
 * Plausible's verification crawler can detect it.  Tracking is blocked at
 * runtime via `localStorage.plausible_ignore = 'true'` (official Plausible
 * opt-out mechanism) until the user grants analytics consent.
 *
 * Flow:
 *   - No consent  → plausible_ignore = 'true'  → script loads but records nothing
 *   - Consent given → plausible_ignore removed  → pageviews + events tracked
 *   - Consent revoked → plausible_ignore = 'true' again
 */
import { useEffect } from 'react';

function getConsent() {
  try {
    const raw = localStorage.getItem('julay_consent_v1');
    if (!raw) return false;
    return JSON.parse(raw)?.analytics === true;
  } catch {
    return false;
  }
}

function applyConsent() {
  if (getConsent()) {
    localStorage.removeItem('plausible_ignore');
  } else {
    localStorage.setItem('plausible_ignore', 'true');
  }
}

/** Call this to track custom funnel events. Safe to call without consent (no-ops). */
export function trackEvent(name, props) {
  if (!getConsent()) return;
  if (typeof window.plausible === 'function') {
    window.plausible(name, { props });
  }
}

export default function Analytics() {
  useEffect(() => {
    applyConsent();

    // Sync when user changes consent in another tab
    const onStorage = (e) => {
      if (e.key !== 'julay_consent_v1') return;
      applyConsent();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return null;
}
