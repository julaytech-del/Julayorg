import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Switch, Divider, Collapse } from '@mui/material';
import { Cookie, Close, Settings, CheckCircle } from '@mui/icons-material';
import { Capacitor } from '@capacitor/core';

const CONSENT_KEY = 'julay_consent_v1';
const CONSENT_VERSION = 1;
const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 12 months

function getStoredConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj.timestamp) return null;
    if (Date.now() - new Date(obj.timestamp).getTime() > CONSENT_TTL_MS) return null;
    if ((obj.version || 0) < CONSENT_VERSION) return null;
    return obj;
  } catch { return null; }
}

function saveConsent(analytics, marketing) {
  const obj = {
    version: CONSENT_VERSION,
    necessary: true,
    analytics,
    marketing,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(obj));
  return obj;
}

export function useConsent() {
  const stored = getStoredConsent();
  return {
    analytics: stored?.analytics ?? false,
    marketing: stored?.marketing ?? false,
    given: !!stored,
  };
}

export default function CookieConsent() {
  if (Capacitor.isNativePlatform()) return null;
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) setVisible(true);
  }, []);

  const acceptAll = useCallback(() => {
    saveConsent(true, true);
    setVisible(false);
  }, []);

  const rejectAll = useCallback(() => {
    saveConsent(false, false);
    setVisible(false);
  }, []);

  const savePrefs = useCallback(() => {
    saveConsent(analytics, marketing);
    setVisible(false);
  }, [analytics, marketing]);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop for prefs modal */}
      {showPrefs && (
        <Box
          onClick={() => setShowPrefs(false)}
          sx={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998 }}
        />
      )}

      {/* Preferences modal */}
      {showPrefs && (
        <Box
          role="dialog"
          aria-modal="true"
          aria-label="Cookie preferences"
          sx={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: { xs: 'calc(100% - 32px)', sm: 480 },
            background: '#1E293B', borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            zIndex: 9999, p: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings sx={{ color: '#6366F1', fontSize: 20 }} />
              <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Cookie Preferences</Typography>
            </Box>
            <Box
              component="button"
              onClick={() => setShowPrefs(false)}
              aria-label="Close preferences"
              sx={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', p: 0.5, '&:hover': { color: 'white' } }}
            >
              <Close sx={{ fontSize: 20 }} />
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />

          {[
            {
              label: 'Strictly Necessary',
              desc: 'Required for the site to function (authentication, security). Cannot be disabled.',
              checked: true,
              disabled: true,
              onChange: null,
            },
            {
              label: 'Analytics',
              desc: 'Helps us understand how visitors use the site (Plausible — privacy-friendly, no personal data).',
              checked: analytics,
              disabled: false,
              onChange: e => setAnalytics(e.target.checked),
            },
            {
              label: 'Marketing',
              desc: 'Used to show relevant ads and track campaign performance. Currently no marketing cookies in use.',
              checked: marketing,
              disabled: false,
              onChange: e => setMarketing(e.target.checked),
            },
          ].map(({ label, desc, checked, disabled, onChange }) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, gap: 2 }}>
              <Box>
                <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.85rem', mb: 0.25 }}>{label}</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', lineHeight: 1.5 }}>{desc}</Typography>
              </Box>
              <Switch
                checked={checked}
                disabled={disabled}
                onChange={onChange}
                size="small"
                sx={{
                  flexShrink: 0,
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#6366F1' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#6366F1' },
                }}
              />
            </Box>
          ))}

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />

          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button
              onClick={savePrefs}
              variant="contained"
              size="small"
              sx={{ background: '#6366F1', '&:hover': { background: '#4F46E5' }, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
            >
              Save Preferences
            </Button>
          </Box>

          <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', mt: 1.5, textAlign: 'center' }}>
            <a href="/cookies" style={{ color: '#818CF8' }}>Full Cookie Policy</a> · <a href="/privacy" style={{ color: '#818CF8' }}>Privacy Policy</a>
          </Typography>
        </Box>
      )}

      {/* Main banner */}
      {!showPrefs && (
        <Box
          role="region"
          aria-label="Cookie consent"
          sx={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: '#0F172A',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
            zIndex: 9999,
            p: { xs: 2, sm: 2.5 },
          }}
        >
          <Box sx={{
            maxWidth: 1200, mx: 'auto',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: { xs: 2, md: 3 },
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1 }}>
              <Cookie sx={{ color: '#6366F1', fontSize: 22, flexShrink: 0, mt: 0.25 }} />
              <Box>
                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.88rem', mb: 0.25 }}>
                  We use cookies
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                  We use strictly necessary cookies to operate the site, and optional analytics cookies to improve your experience.
                  No marketing cookies without your consent.{' '}
                  <a href="/cookies" style={{ color: '#818CF8', textDecoration: 'none' }}>Cookie Policy</a>
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, flexWrap: 'wrap' }}>
              <Button
                onClick={() => setShowPrefs(true)}
                size="small"
                sx={{
                  color: 'rgba(255,255,255,0.6)', textTransform: 'none', fontWeight: 600,
                  fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.15)',
                  px: 1.5, py: 0.75,
                  '&:hover': { borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)' },
                }}
              >
                Manage Preferences
              </Button>
              <Button
                onClick={rejectAll}
                size="small"
                sx={{
                  color: 'rgba(255,255,255,0.6)', textTransform: 'none', fontWeight: 600,
                  fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.15)',
                  px: 1.5, py: 0.75,
                  '&:hover': { borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)' },
                }}
              >
                Reject Non-Essential
              </Button>
              <Button
                onClick={acceptAll}
                size="small"
                variant="contained"
                startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
                sx={{
                  background: '#6366F1', textTransform: 'none', fontWeight: 700,
                  fontSize: '0.8rem', px: 1.75, py: 0.75,
                  '&:hover': { background: '#4F46E5' },
                  boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
                }}
              >
                Accept All
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
}
