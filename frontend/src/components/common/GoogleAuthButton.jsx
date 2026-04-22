import React, { useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../../store/slices/authSlice.js';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import api from '../../services/api.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const REDIRECT_URI = window.location.origin; // https://julay.org

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export default function GoogleAuthButton({ dark = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (loading) return;

    const state = Math.random().toString(36).slice(2);
    sessionStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      state,
      prompt: 'select_account',
    });

    const w = 520, h = 640;
    const left = Math.max(0, (window.screen.width - w) / 2);
    const top = Math.max(0, (window.screen.height - h) / 2);

    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      'google_oauth',
      `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup || popup.closed) {
      dispatch(showSnackbar({ message: 'Please allow popups for Google sign-in and try again.', severity: 'warning' }));
      return;
    }

    setLoading(true);

    const pollTimer = setInterval(async () => {
      try {
        if (popup.closed) {
          clearInterval(pollTimer);
          setLoading(false);
          return;
        }

        const currentUrl = popup.location.href;
        if (!currentUrl || !currentUrl.includes(window.location.hostname)) return;

        // Popup landed on our domain — read code/error immediately before SPA nav
        clearInterval(pollTimer);
        const search = new URLSearchParams(popup.location.search);
        const hash = new URLSearchParams(popup.location.hash.replace('#', ''));
        popup.close();

        const error = search.get('error') || hash.get('error');
        if (error) {
          setLoading(false);
          dispatch(showSnackbar({ message: `Google sign-in failed: ${error}`, severity: 'error' }));
          return;
        }

        const code = search.get('code');
        const returnedState = search.get('state');
        const savedState = sessionStorage.getItem('oauth_state');
        sessionStorage.removeItem('oauth_state');

        if (!code) {
          setLoading(false);
          dispatch(showSnackbar({ message: 'Google sign-in cancelled.', severity: 'warning' }));
          return;
        }

        if (returnedState !== savedState) {
          setLoading(false);
          dispatch(showSnackbar({ message: 'Security check failed. Please try again.', severity: 'error' }));
          return;
        }

        try {
          const res = await api.post('/auth/google-code', { code, redirect_uri: REDIRECT_URI });
          dispatch(setCredentials(res.data));
          navigate('/dashboard');
        } catch (err) {
          const msg = err?.message || err?.data?.message || 'Google sign-in failed. Please try again.';
          dispatch(showSnackbar({ message: msg, severity: 'error' }));
        } finally {
          setLoading(false);
        }

      } catch {
        // Still on Google's domain (cross-origin) — keep polling
      }
    }, 200);
  };

  return (
    <Box
      onClick={handleLogin}
      sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
        py: 1.3, px: 2, borderRadius: 2, cursor: loading ? 'default' : 'pointer',
        border: dark ? '1px solid rgba(255,255,255,0.12)' : '1.5px solid #E2E8F0',
        background: dark ? 'rgba(255,255,255,0.04)' : 'white',
        transition: 'all 0.15s',
        '&:hover': loading ? {} : {
          background: dark ? 'rgba(255,255,255,0.08)' : '#F8FAFC',
          borderColor: dark ? 'rgba(255,255,255,0.25)' : '#CBD5E1',
        },
      }}
    >
      {loading ? (
        <CircularProgress size={18} sx={{ color: dark ? 'rgba(255,255,255,0.6)' : '#6366F1' }} />
      ) : (
        <GoogleIcon />
      )}
      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: dark ? 'rgba(255,255,255,0.8)' : '#0F172A' }}>
        {loading ? 'Signing in…' : 'Continue with Google'}
      </Typography>
    </Box>
  );
}
