import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  Link, CircularProgress, Tabs, Tab, InputAdornment, IconButton,
} from '@mui/material';
import {
  LockOutlined, Email, CheckCircle, Visibility, VisibilityOff,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loginUser, clearError, setCredentials } from '../../store/slices/authSlice.js';
import LanguageSwitcher from '../../components/common/LanguageSwitcher.jsx';
import api from '../../services/api.js';
import GoogleAuthButton from '../../components/common/GoogleAuthButton.jsx';

const btnSx = {
  borderRadius: 2, py: 1.5,
  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
  fontWeight: 700, fontSize: '0.9rem', textTransform: 'none',
  '&:disabled': { background: 'rgba(99,102,241,0.4)', color: 'rgba(255,255,255,0.5)' },
};

// ── Password login ─────────────────────────────────────────────────────────────
function PasswordForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(s => s.auth);
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  React.useEffect(() => { return () => dispatch(clearError()); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await dispatch(loginUser({ email, password }));
    if (!res.error) navigate('/dashboard');
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      <TextField
        fullWidth label={t('auth.login.email')} type="email"
        value={email} onChange={e => setEmail(e.target.value)}
        required sx={{ mb: 2 }}
      />
      <TextField
        fullWidth label={t('auth.login.password')}
        type={showPwd ? 'text' : 'password'}
        value={password} onChange={e => setPassword(e.target.value)}
        required sx={{ mb: 3 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setShowPwd(v => !v)} edge="end"
                aria-label={showPwd ? 'Hide password' : 'Show password'}>
                {showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Button
        fullWidth type="submit" variant="contained" size="large"
        disabled={loading}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockOutlined sx={{ fontSize: 16 }} />}
        sx={btnSx}
      >
        {loading ? t('auth.login.submitting') : t('auth.login.submit')}
      </Button>
    </form>
  );
}

// ── Email OTP login ─────────────────────────────────────────────────────────────
function OTPForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async e => {
    e.preventDefault();
    if (!email) return;
    setLoading(true); setError('');
    try {
      await api.post('/auth/otp/send', { email });
      setStep('code');
    } catch (err) {
      setError(err.message || 'Failed to send code. Try again.');
    } finally { setLoading(false); }
  };

  const handleVerify = async e => {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/otp/verify-login', { email, code });
      dispatch(setCredentials(res.data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid or expired code.');
    } finally { setLoading(false); }
  };

  if (step === 'code') {
    return (
      <form onSubmit={handleVerify}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Email sx={{ fontSize: 40, color: '#6366F1', mb: 1 }} />
          <Typography fontWeight={700} fontSize="1rem">Check your email</Typography>
          <Typography color="text.secondary" fontSize="0.85rem" mt={0.5}>
            We sent a 6-digit code to <strong>{email}</strong>
          </Typography>
        </Box>
        <TextField
          fullWidth label="Verification code" value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          required autoFocus placeholder="000000"
          inputProps={{ inputMode: 'numeric', style: { letterSpacing: '0.4em', fontSize: '1.5rem', textAlign: 'center', fontFamily: 'monospace' } }}
          sx={{ mb: 3 }}
        />
        <Button fullWidth type="submit" variant="contained" size="large"
          disabled={loading || code.length !== 6}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckCircle sx={{ fontSize: 16 }} />}
          sx={btnSx}>
          {loading ? 'Verifying…' : 'Verify & Sign In'}
        </Button>
        <Button fullWidth onClick={() => { setStep('email'); setCode(''); setError(''); }}
          sx={{ mt: 1.5, textTransform: 'none', color: 'text.secondary', fontSize: '0.8rem' }}>
          ← Go back
        </Button>
        <Button fullWidth onClick={handleSend} disabled={loading}
          sx={{ textTransform: 'none', color: '#6366F1', fontSize: '0.78rem' }}>
          Didn't receive it? Resend code
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSend} noValidate>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      <TextField
        fullWidth label={t('auth.login.email')} type="email"
        value={email} onChange={e => setEmail(e.target.value)}
        required autoFocus sx={{ mb: 3 }}
      />
      <Button fullWidth type="submit" variant="contained" size="large"
        disabled={loading}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Email sx={{ fontSize: 16 }} />}
        sx={btnSx}>
        {loading ? 'Sending code…' : 'Send verification code'}
      </Button>
    </form>
  );
}

// ── Main Login page ─────────────────────────────────────────────────────────────
export default function Login() {
  const { t } = useTranslation();
  const [authTab, setAuthTab] = useState('password');

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E1B4B 100%)',
      p: 2,
    }}>
      <Card sx={{ width: '100%', maxWidth: 480, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <LanguageSwitcher />
          </Box>

          {/* Logo + title */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box component="img" src="/julay-logo-full.png" alt="Julay.org" sx={{ height: 36, objectFit: 'contain' }} />
            <Typography variant="h5" fontWeight={700}>{t('auth.login.greeting')}</Typography>
          </Box>

          {/* Auth method tabs */}
          <Tabs
            value={authTab} onChange={(_, v) => setAuthTab(v)} variant="fullWidth"
            sx={{
              mb: 3,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' },
              '& .Mui-selected': { color: '#6366F1' },
              '& .MuiTabs-indicator': { backgroundColor: '#6366F1' },
            }}
          >
            <Tab value="password" label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <LockOutlined sx={{ fontSize: 15 }} /> {t('auth.register.tabPassword')}
              </Box>
            } />
            <Tab value="otp" label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Email sx={{ fontSize: 15 }} /> {t('auth.register.tabEmail')}
              </Box>
            } />
          </Tabs>

          {authTab === 'password' ? <PasswordForm /> : <OTPForm />}

          {/* OR divider */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 2 }}>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
            <Typography variant="caption" color="text.secondary">OR</Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
          </Box>
          <GoogleAuthButton />

          <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
            {t('auth.login.noAccount')}{' '}
            <Link component={RouterLink} to="/register" fontWeight={600} sx={{ color: '#6366F1' }}>
              {t('auth.login.createWorkspace')}
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
