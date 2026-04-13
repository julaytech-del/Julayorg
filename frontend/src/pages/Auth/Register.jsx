import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Link, MenuItem, CircularProgress, Tabs, Tab } from '@mui/material';
import { Psychology, LockOutlined, Email, CheckCircle } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { registerUser, clearError, setCredentials } from '../../store/slices/authSlice.js';
import LanguageSwitcher from '../../components/common/LanguageSwitcher.jsx';
import api from '../../services/api.js';
import GoogleAuthButton from '../../components/common/GoogleAuthButton.jsx';

const INDUSTRIES = ['technology','healthcare','finance','education','construction','retail','media','consulting','manufacturing','other'];

const btnSx = { borderRadius: 2, py: 1.5, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', fontWeight: 600, fontSize: '0.9rem', '&:disabled': { background: 'rgba(99,102,241,0.4)', color: 'rgba(255,255,255,0.5)' } };

// ── Password registration (original flow) ──────────────────────────────────
function PasswordRegister() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', organizationName: '', industry: 'technology' });

  React.useEffect(() => { dispatch(clearError()); }, []);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleSubmit = async e => {
    e.preventDefault();
    const res = await dispatch(registerUser(form));
    if (!res.error) navigate('/');
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField fullWidth label={t('auth.register.name')} name="name" value={form.name} onChange={handle} required sx={{ mb: 2 }} />
      <TextField fullWidth label={t('auth.register.email')} name="email" type="email" value={form.email} onChange={handle} required sx={{ mb: 2 }} />
      <TextField fullWidth label={t('auth.register.password')} name="password" type="password" value={form.password} onChange={handle} required inputProps={{ minLength: 6 }} sx={{ mb: 2 }} />
      <TextField fullWidth label={t('auth.register.orgName')} name="organizationName" value={form.organizationName} onChange={handle} required sx={{ mb: 2 }} />
      <TextField fullWidth select label={t('auth.register.industry')} name="industry" value={form.industry} onChange={handle} sx={{ mb: 3 }}>
        {INDUSTRIES.map(i => <MenuItem key={i} value={i} sx={{ textTransform: 'capitalize' }}>{i}</MenuItem>)}
      </TextField>
      <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockOutlined sx={{ fontSize: 16 }} />} sx={btnSx}>
        {loading ? t('common.loading') : t('auth.register.submit')}
      </Button>
    </form>
  );
}

// ── Email OTP registration ─────────────────────────────────────────────────
function OTPRegister() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState('form'); // 'form' | 'code'
  const [form, setForm] = useState({ name: '', email: '', organizationName: '', industry: 'technology' });
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSendCode = async e => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setLoading(true); setError('');
    try {
      await api.post('/auth/otp/send', { email: form.email });
      setStep('code');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send code. Try again.');
    } finally { setLoading(false); }
  };

  const handleVerify = async e => {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/otp/verify-register', {
        email: form.email,
        code,
        name: form.name,
        organizationName: form.organizationName,
        industry: form.industry,
      });
      dispatch(setCredentials(res.data.data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code.');
    } finally { setLoading(false); }
  };

  if (step === 'code') {
    return (
      <form onSubmit={handleVerify}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Email sx={{ fontSize: 40, color: '#6366F1', mb: 1 }} />
          <Typography fontWeight={700} fontSize="1rem">Check your email</Typography>
          <Typography color="text.secondary" fontSize="0.85rem" mt={0.5}>
            We sent a 6-digit code to <strong>{form.email}</strong>
          </Typography>
        </Box>
        <TextField
          fullWidth label="Verification code" value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          required autoFocus placeholder="000000"
          inputProps={{ inputMode: 'numeric', style: { letterSpacing: '0.4em', fontSize: '1.5rem', textAlign: 'center', fontFamily: 'monospace' } }}
          sx={{ mb: 3 }}
        />
        <Button fullWidth type="submit" variant="contained" size="large" disabled={loading || code.length !== 6}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckCircle sx={{ fontSize: 16 }} />} sx={btnSx}>
          {loading ? 'Verifying…' : 'Verify & Create Workspace'}
        </Button>
        <Button fullWidth onClick={() => { setStep('form'); setCode(''); setError(''); }} sx={{ mt: 1.5, textTransform: 'none', color: 'text.secondary', fontSize: '0.8rem' }}>
          ← Go back
        </Button>
        <Button fullWidth onClick={handleSendCode} disabled={loading} sx={{ textTransform: 'none', color: '#6366F1', fontSize: '0.78rem' }}>
          Didn't receive it? Resend code
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField fullWidth label={t('auth.register.name')} name="name" value={form.name} onChange={handle} required sx={{ mb: 2 }} />
      <TextField fullWidth label={t('auth.register.email')} name="email" type="email" value={form.email} onChange={handle} required sx={{ mb: 2 }} />
      <TextField fullWidth label={t('auth.register.orgName')} name="organizationName" value={form.organizationName} onChange={handle} sx={{ mb: 2 }} />
      <TextField fullWidth select label={t('auth.register.industry')} name="industry" value={form.industry} onChange={handle} sx={{ mb: 3 }}>
        {INDUSTRIES.map(i => <MenuItem key={i} value={i} sx={{ textTransform: 'capitalize' }}>{i}</MenuItem>)}
      </TextField>
      <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Email sx={{ fontSize: 16 }} />} sx={btnSx}>
        {loading ? 'Sending code…' : 'Send verification code'}
      </Button>
      <Typography color="text.secondary" fontSize="0.75rem" textAlign="center" mt={1}>
        We'll send a 6-digit code to verify your email
      </Typography>
    </form>
  );
}

// ── Main Register page ─────────────────────────────────────────────────────
export default function Register() {
  const { t } = useTranslation();
  const [authTab, setAuthTab] = useState('password');

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E1B4B 100%)', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 460, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <LanguageSwitcher />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 3 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2.5, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Psychology sx={{ color: 'white', fontSize: 26 }} />
            </Box>
            <Typography variant="h5" fontWeight={700}>{t('auth.register.title')}</Typography>
          </Box>

          {/* Auth method tabs */}
          <Tabs
            value={authTab}
            onChange={(_, v) => setAuthTab(v)}
            variant="fullWidth"
            sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' }, '& .Mui-selected': { color: '#6366F1' }, '& .MuiTabs-indicator': { backgroundColor: '#6366F1' } }}
          >
            <Tab value="password" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><LockOutlined sx={{ fontSize: 15 }} /> Password</Box>} />
            <Tab value="otp" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><Email sx={{ fontSize: 15 }} /> Email code</Box>} />
          </Tabs>

          {authTab === 'password' ? <PasswordRegister /> : <OTPRegister />}

          {/* Google */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 2 }}>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
            <Typography variant="caption" color="text.secondary">OR</Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
          </Box>
          <GoogleAuthButton />

          <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
            {t('auth.register.hasAccount')}{' '}
            <Link component={RouterLink} to="/login" fontWeight={600}>{t('auth.register.signIn')}</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
