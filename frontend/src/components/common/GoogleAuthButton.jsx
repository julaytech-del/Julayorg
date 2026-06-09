import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../../store/slices/authSlice.js';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import api from '../../services/api.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const REDIRECT_URI = `${window.location.origin}/oauth-callback`;

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
  const popupRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'GOOGLE_OAUTH_CALLBACK') return;

      const { code, state, error } = event.data;

      if (error) {
        setLoading(false);
        dispatch(showSnackbar({ message: `Google sign-in failed: ${error}`, severity: 'error' }));
        return;
      }

      const savedState = sessionStorage.getItem('oauth_state');
      sessionStorage.removeItem('oauth_state');

      if (!code) {
        setLoading(false);
        dispatch(showSnackbar({ message: 'Google sign-in cancelled.', severity: 'warning' }));
        return;
      }

      if (state !== savedState) {
        setLoading(false);
        dispatch(showSnackbar({ message: 'Security check failed. Please try again.', severity: 'error' }));
        return;
      }

      try {
        const res = await api.post('/auth/google-code', { code, redirect_uri: REDIRECT_URI }, { timeout: 15000 });
        dispatch(setCredentials(res.data));

        const LEMON_URLS = {
          starter:      'https://julay-org.lemonsqueezy.com/checkout/buy/1cbc841f-12c7-451f-8bb2-9be1015485ce',
          professional: 'https://julay-org.lemonsqueezy.com/checkout/buy/5cf9c419-6c46-4098-8754-a27316c90071',
          business:     'https://julay-org.lemonsqueezy.com/checkout/buy/3e535e8b-e2c0-4427-8de1-0f4e72390483',
        };
        const pendingPlan = localStorage.getItem('julay_pending_plan');
        if (pendingPlan && LEMON_URLS[pendingPlan]) {
          localStorage.removeItem('julay_pending_plan');
          const user = res.data?.user;
          const orgId = user?.organization?._id || user?.organization || '';
          const email = encodeURIComponent(user?.email || '');
          window.location.href = `${LEMON_URLS[pendingPlan]}?checkout[custom][org_id]=${orgId}&checkout[email]=${email}`;
          return;
        }
        navigate('/dashboard');
      } catch (err) {
        dispatch(showSnackbar({ message: err?.message || 'Google sign-in failed. Please try again.', severity: 'error' }));
      } finally {
        setLoading(false);
        clearTimeout(timeoutRef.current);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [dispatch, navigate]);

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

    popupRef.current = popup;
    setLoading(true);

    timeoutRef.current = setTimeout(() => {
      if (!popup.closed) popup.close();
      setLoading(false);
      dispatch(showSnackbar({ message: 'Google sign-in timed out. Please try again.', severity: 'warning' }));
    }, 3 * 60 * 1000);

    // Detect if user manually closes the popup
    const closedCheck = setInterval(() => {
      if (popup.closed) {
        clearInterval(closedCheck);
        clearTimeout(timeoutRef.current);
        setLoading(false);
      }
    }, 500);
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
