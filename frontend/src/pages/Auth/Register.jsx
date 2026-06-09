import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  Link, MenuItem, CircularProgress, LinearProgress,
  Checkbox, FormControlLabel, InputAdornment, IconButton, Tooltip,
} from '@mui/material';
import {
  LockOutlined, Email, CheckCircle, Visibility, VisibilityOff,
  CheckCircleOutline, RadioButtonUnchecked, ArrowBack,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { registerUser, clearError, setCredentials } from '../../store/slices/authSlice.js';
import { trackEvent } from '../../components/common/Analytics.jsx';
import LanguageSwitcher from '../../components/common/LanguageSwitcher.jsx';
import api from '../../services/api.js';
import GoogleAuthButton from '../../components/common/GoogleAuthButton.jsx';

const INDUSTRIES = ['technology','healthcare','finance','education','construction','retail','media','consulting','manufacturing','other'];

const btnSx = {
  borderRadius: 2, py: 1.5,
  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
  fontWeight: 700, fontSize: '0.9rem', textTransform: 'none',
  '&:disabled': { background: 'rgba(99,102,241,0.4)', color: 'rgba(255,255,255,0.5)' },
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 1.5,
    outline: 'none !important',
    '& fieldset': { borderColor: '#E2E8F0', transition: 'border-color 0.15s' },
    '&:hover fieldset': { borderColor: '#CBD5E1' },
    '&.Mui-focused fieldset': { borderColor: '#E2E8F0 !important', borderWidth: '1px !important' },
    '&.Mui-focused': { outline: 'none !important', boxShadow: 'none !important' },
  },
  '& input:focus, & input:focus-visible, & textarea:focus, & textarea:focus-visible': {
    outline: 'none !important',
    boxShadow: 'none !important',
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#6366F1' },
};

// Password policy
const PWD_RULES = [
  { id: 'len',     label: 'At least 12 characters',         test: p => p.length >= 12 },
  { id: 'upper',   label: 'One uppercase letter (A–Z)',      test: p => /[A-Z]/.test(p) },
  { id: 'number',  label: 'One number (0–9)',                test: p => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character (!@#…)',    test: p => /[^A-Za-z0-9]/.test(p) },
];

const STRENGTH_COLORS = ['#EF4444','#F97316','#EAB308','#22C55E','#22C55E'];
const STRENGTH_LABELS = ['Very weak','Weak','Fair','Strong','Very strong'];

function pwdScore(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(s, 4);
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = useMemo(() => pwdScore(password), [password]);
  const rules = PWD_RULES.map(r => ({ ...r, pass: r.test(password) }));
  return (
    <Box sx={{ mt: 0.5, mb: 1.5 }}>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.75 }}>
        {[0,1,2,3].map(i => (
          <Box key={i} sx={{ flex: 1, height: 4, borderRadius: 2, background: i <= score ? STRENGTH_COLORS[score] : 'rgba(0,0,0,0.12)', transition: 'background 0.3s' }} />
        ))}
      </Box>
      <Typography sx={{ fontSize: '0.72rem', color: STRENGTH_COLORS[score], fontWeight: 600, mb: 1 }}>
        {STRENGTH_LABELS[score]}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {rules.map(r => (
          <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            {r.pass
              ? <CheckCircleOutline sx={{ fontSize: 13, color: '#22C55E' }} />
              : <RadioButtonUnchecked sx={{ fontSize: 13, color: 'rgba(0,0,0,0.3)' }} />}
            <Typography sx={{ fontSize: '0.68rem', color: r.pass ? '#16A34A' : 'rgba(0,0,0,0.45)' }}>{r.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ── Password registration ─────────────────────────────────────────────────────
function PasswordRegister() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    organizationName: '', industry: 'technology',
    website: '',   // honeypot
  });
  const [showPwd, setShowPwd] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  React.useEffect(() => { dispatch(clearError()); }, []);

  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const validatePwd = pwd => PWD_RULES.every(r => r.test(pwd));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.organizationName.trim()) errs.organizationName = 'Organization name is required';
    if (!form.password) errs.password = 'Password is required';
    else if (!validatePwd(form.password)) errs.password = 'Password does not meet requirements';
    if (!agreed) errs.agreed = 'You must accept the terms to continue';
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.website) return; // honeypot triggered
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    const refCode = searchParams.get('ref');
    const res = await dispatch(registerUser({ ...form, ...(refCode ? { referredBy: refCode } : {}) }));
    if (!res.error) {
      trackEvent('registration_completed', { method: 'password' });
      const plan = searchParams.get('plan');
      const LEMON_URLS = {
        starter:      'https://julay-org.lemonsqueezy.com/checkout/buy/1cbc841f-12c7-451f-8bb2-9be1015485ce',
        professional: 'https://julay-org.lemonsqueezy.com/checkout/buy/5cf9c419-6c46-4098-8754-a27316c90071',
        business:     'https://julay-org.lemonsqueezy.com/checkout/buy/3e535e8b-e2c0-4427-8de1-0f4e72390483',
      };
      if (plan && LEMON_URLS[plan]) {
        const orgId = res.payload?.user?.organization?._id || res.payload?.user?.organization || '';
        const email = encodeURIComponent(form.email);
        window.location.href = `${LEMON_URLS[plan]}?checkout[custom][org_id]=${orgId}&checkout[email]=${email}`;
        return;
      }
      const trialIdea = localStorage.getItem('julay_trial_idea');
      if (trialIdea) {
        navigate('/dashboard/projects?try_ai=1&idea=' + encodeURIComponent(trialIdea));
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Honeypot — hidden from humans */}
      <Box
        component="input" name="website" value={form.website}
        onChange={set} autoComplete="off" tabIndex={-1} aria-hidden="true"
        sx={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
      )}

      <TextField
        fullWidth label={t('auth.register.name')} name="name"
        value={form.name} onChange={set} required sx={{ mb: 2, ...fieldSx }}
        error={!!fieldErrors.name} helperText={fieldErrors.name}
        inputProps={{ 'aria-describedby': fieldErrors.name ? 'name-err' : undefined }}
      />

      <TextField
        fullWidth label={t('auth.register.email')} name="email"
        type="email" value={form.email} onChange={set} required sx={{ mb: 2, ...fieldSx }}
        error={!!fieldErrors.email} helperText={fieldErrors.email}
      />

      <TextField
        fullWidth label={t('auth.register.password')} name="password"
        type={showPwd ? 'text' : 'password'} value={form.password}
        onChange={set} required sx={{ mb: 0.5, ...fieldSx }}
        error={!!fieldErrors.password} helperText={fieldErrors.password}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setShowPwd(v => !v)} edge="end" aria-label={showPwd ? 'Hide password' : 'Show password'}>
                {showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <PasswordStrength password={form.password} />

      <TextField
        fullWidth label={t('auth.register.orgName')} name="organizationName"
        value={form.organizationName} onChange={set} required
        error={!!fieldErrors.organizationName} helperText={fieldErrors.organizationName}
        sx={{ mb: 2, ...fieldSx }}
      />

      <TextField
        fullWidth select label={t('auth.register.industry')} name="industry"
        value={form.industry} onChange={set} sx={{ mb: 2, ...fieldSx }}
      >
        {INDUSTRIES.map(i => <MenuItem key={i} value={i} sx={{ textTransform: 'capitalize' }}>{i}</MenuItem>)}
      </TextField>

      <FormControlLabel
        control={
          <Checkbox
            checked={agreed} onChange={e => setAgreed(e.target.checked)}
            sx={{ color: fieldErrors.agreed ? 'error.main' : undefined, '&.Mui-checked': { color: '#6366F1' } }}
          />
        }
        label={
          <Typography sx={{ fontSize: '0.8rem' }}>
            {t('auth.register.agreePrefix')}{' '}
            <Link component={RouterLink} to="/terms" target="_blank" rel="noopener" sx={{ color: '#6366F1', fontWeight: 600 }}>{t('auth.register.terms')}</Link>
            {' '}{t('auth.register.agreeAnd')}{' '}
            <Link component={RouterLink} to="/privacy" target="_blank" rel="noopener" sx={{ color: '#6366F1', fontWeight: 600 }}>{t('auth.register.privacy')}</Link>
          </Typography>
        }
        sx={{ mb: fieldErrors.agreed ? 0.5 : 2, alignItems: 'flex-start', '& .MuiFormControlLabel-label': { pt: 0.5 } }}
      />
      {fieldErrors.agreed && (
        <Typography sx={{ color: 'error.main', fontSize: '0.75rem', mb: 2, ml: 4 }}>{fieldErrors.agreed}</Typography>
      )}

      <Button
        fullWidth type="submit" variant="contained" size="large"
        disabled={loading}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockOutlined sx={{ fontSize: 16 }} />}
        sx={btnSx}
      >
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
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({ name: '', email: '', organizationName: '', industry: 'technology' });
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSendCode = async e => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    if (!agreed) { setError('You must accept the Terms of Service and Privacy Policy.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/otp/send', { email: form.email });
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
      const refCode = searchParams.get('ref');
      const res = await api.post('/auth/otp/verify-register', {
        email: form.email, code,
        name: form.name,
        organizationName: form.organizationName,
        industry: form.industry,
        ...(refCode ? { referredBy: refCode } : {}),
      });
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
            We sent a 6-digit code to <strong>{form.email}</strong>
          </Typography>
        </Box>
        <TextField
          fullWidth label="Verification code" value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          required autoFocus placeholder="000000"
          inputProps={{ inputMode: 'numeric', style: { letterSpacing: '0.4em', fontSize: '1.5rem', textAlign: 'center', fontFamily: 'monospace' } }}
          sx={{ mb: 3, ...fieldSx }}
        />
        <Button fullWidth type="submit" variant="contained" size="large"
          disabled={loading || code.length !== 6}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckCircle sx={{ fontSize: 16 }} />}
          sx={btnSx}>
          {loading ? 'Verifying…' : 'Verify & Create Workspace'}
        </Button>
        <Button fullWidth onClick={() => { setStep('form'); setCode(''); setError(''); }}
          sx={{ mt: 1.5, textTransform: 'none', color: 'text.secondary', fontSize: '0.8rem' }}>
          ← Go back
        </Button>
        <Button fullWidth onClick={handleSendCode} disabled={loading}
          sx={{ textTransform: 'none', color: '#6366F1', fontSize: '0.78rem' }}>
          Didn't receive it? Resend code
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode} noValidate>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      <TextField fullWidth label={t('auth.register.name')} name="name" value={form.name} onChange={set} required sx={{ mb: 2, ...fieldSx }} />
      <TextField fullWidth label={t('auth.register.email')} name="email" type="email" value={form.email} onChange={set} required sx={{ mb: 2, ...fieldSx }} />
      <TextField fullWidth label={t('auth.register.orgName')} name="organizationName" value={form.organizationName} onChange={set} sx={{ mb: 2, ...fieldSx }} />
      <TextField fullWidth select label={t('auth.register.industry')} name="industry" value={form.industry} onChange={set} sx={{ mb: 2, ...fieldSx }}>
        {INDUSTRIES.map(i => <MenuItem key={i} value={i} sx={{ textTransform: 'capitalize' }}>{i}</MenuItem>)}
      </TextField>
      <FormControlLabel
        control={<Checkbox checked={agreed} onChange={e => setAgreed(e.target.checked)} sx={{ '&.Mui-checked': { color: '#6366F1' } }} />}
        label={
          <Typography sx={{ fontSize: '0.8rem' }}>
            {t('auth.register.agreePrefix')}{' '}
            <Link component={RouterLink} to="/terms" target="_blank" rel="noopener" sx={{ color: '#6366F1', fontWeight: 600 }}>{t('auth.register.terms')}</Link>
            {' '}{t('auth.register.agreeAnd')}{' '}
            <Link component={RouterLink} to="/privacy" target="_blank" rel="noopener" sx={{ color: '#6366F1', fontWeight: 600 }}>{t('auth.register.privacy')}</Link>
          </Typography>
        }
        sx={{ mb: 3, alignItems: 'flex-start', '& .MuiFormControlLabel-label': { pt: 0.5 } }}
      />
      <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Email sx={{ fontSize: 16 }} />}
        sx={btnSx}>
        {loading ? 'Sending code…' : 'Send verification code'}
      </Button>
    </form>
  );
}

// ── Main Register page ─────────────────────────────────────────────────────
export default function Register() {
  const { t } = useTranslation();
  const [authTab, setAuthTab] = useState('password');

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E1B4B 100%)' }}>
      {/* Navbar */}
      <Box sx={{ borderBottom: '1px solid #E5E7EB', px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', zIndex: 100 }}>
        <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: '#1E1B4B' }}>
          <Box component="img" src="/julay-logo-full.png" alt="Julay.org" sx={{ height: 32, objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1E1B4B', letterSpacing: -0.3 }}>Julay</Typography>
        </Box>
        <LanguageSwitcher />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 480, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={700}>{t('auth.register.title')}</Typography>
          </Box>

          {/* Auth method toggle — pill style */}
          <Box sx={{ display: 'flex', background: '#F1F5F9', borderRadius: 2.5, p: 0.5, mb: 3 }}>
            {[
              { value: 'password', icon: <LockOutlined sx={{ fontSize: 14 }} />, label: t('auth.register.tabPassword') },
              { value: 'otp',      icon: <Email sx={{ fontSize: 14 }} />,        label: t('auth.register.tabEmail') },
            ].map(opt => (
              <Box
                key={opt.value}
                onClick={() => setAuthTab(opt.value)}
                sx={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 0.75, py: 1, px: 1.5, borderRadius: 2, cursor: 'pointer',
                  fontSize: '0.82rem', fontWeight: 600, userSelect: 'none',
                  transition: 'all 0.2s',
                  ...(authTab === opt.value
                    ? { background: 'white', color: '#6366F1', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                    : { color: '#64748B', '&:hover': { color: '#374151' } }
                  ),
                }}
              >
                {opt.icon}
                {opt.label}
              </Box>
            ))}
          </Box>

          {authTab === 'password' ? <PasswordRegister /> : <OTPRegister />}

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
    </Box>
  );
}
