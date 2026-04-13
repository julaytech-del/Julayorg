import React, { useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useGoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../../store/slices/authSlice.js';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import api from '../../services/api.js';

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

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        // Get user info from Google
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(r => r.json());

        // Get ID token via credential
        // We use the access token approach: send to backend for verification
        const res = await api.post('/auth/google-token', {
          access_token: tokenResponse.access_token,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        });
        dispatch(setCredentials(res.data.data));
        navigate('/');
      } catch (err) {
        dispatch(showSnackbar({ message: err.response?.data?.message || 'Google sign-in failed', severity: 'error' }));
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      dispatch(showSnackbar({ message: 'Google sign-in was cancelled', severity: 'warning' }));
    },
  });

  return (
    <Box
      onClick={() => !loading && login()}
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
