import React, { useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../../store/slices/authSlice.js';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import api from '../../services/api.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const REDIRECT_URI = 'https://julay.org';

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

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'token',
      scope: 'openid email profile',
      include_granted_scopes: 'true',
    });

    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      'google_oauth',
      'width=500,height=620,left=200,top=80,scrollbars=yes,resizable=yes'
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
        const url = popup.location.href;
        if (url && url.includes('julay.org')) {
          clearInterval(pollTimer);
          const hash = new URLSearchParams(popup.location.hash.replace('#', ''));
          const accessToken = hash.get('access_token');
          const error = hash.get('error') || new URLSearchParams(popup.location.search).get('error');
          popup.close();

          if (error) {
            setLoading(false);
            dispatch(showSnackbar({ message: `Google sign-in failed: ${error}`, severity: 'error' }));
            return;
          }

          if (!accessToken) {
            setLoading(false);
            dispatch(showSnackbar({ message: 'Google sign-in cancelled.', severity: 'warning' }));
            return;
          }

          try {
            const res = await api.post('/auth/google-token', { access_token: accessToken });
            dispatch(setCredentials(res.data.data));
            navigate('/');
          } catch (err) {
            dispatch(showSnackbar({ message: err.response?.data?.message || 'Google sign-in failed', severity: 'error' }));
          } finally {
            setLoading(false);
          }
        }
      } catch {
        // Cross-origin — still on Google's domain, keep polling
      }
    }, 300);
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
