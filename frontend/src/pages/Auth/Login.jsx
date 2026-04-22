import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Link, CircularProgress, Tabs, Tab } from '@mui/material';
import { Psychology, LockOutlined, Email, CheckCircle } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loginUser, clearError, setCredentials } from '../../store/slices/authSlice.js';
import LanguageSwitcher from '../../components/common/LanguageSwitcher.jsx';
import api from '../../services/api.js';
import GoogleAuthButton from '../../components/common/GoogleAuthButton.jsx';

const inputSx = { '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366F1' }, '& input::placeholder': { color: 'rgba(255,255,255,0.25)' } } };
const labelSx = { color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.75, fontWeight: 700 };
const btnSx = { py: 1.4, fontWeight: 700, fontSize: '0.9rem', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', boxShadow: '0 4px 16px rgba(79,70,229,0.4)', '&:hover': { boxShadow: '0 6px 20px rgba(79,70,229,0.5)', transform: 'translateY(-1px)' }, '&:disabled': { background: 'rgba(79,70,229,0.4)', color: 'rgba(255,255,255,0.5)' }, transition: 'all 0.15s' };

function PasswordForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(s => s.auth);
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => { return () => dispatch(clearError()); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await dispatch(loginUser({ email, password }));
    if (!res.error) navigate('/dashboard');
  };

  const fillDemo = () => { setEmail('admin@techcorp.com'); setPassword('password123'); };

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5', '& .MuiAlert-icon': { color: '#EF4444' } }}>{error}</Alert>}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={labelSx}>{t('auth.login.email')}</Typography>
        <TextField fullWidth type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={t('auth.login.emailPlaceholder')} sx={inputSx} />
      </Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" sx={labelSx}>{t('auth.login.password')}</Typography>
        <TextField fullWidth type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder={t('auth.login.passwordPlaceholder')} sx={inputSx} />
      </Box>
      <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockOutlined sx={{ fontSize: 16 }} />} sx={btnSx}>
        {loading ? t('auth.login.submitting') : t('auth.login.submit')}
      </Button>
      <Box onClick={fillDemo} sx={{ mt: 2, p: 1.5, borderRadius: 2, border: '1px dashed rgba(255,255,255,0.12)', cursor: 'pointer', '&:hover': { borderColor: 'rgba(255,255,255,0.25)' }, transition: 'all 0.15s' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', textAlign: 'center', fontSize: '0.75rem' }}>
          {t('auth.login.demoTitle')} · <span style={{ color: '#818CF8' }}>{t('auth.login.demoSubtitle')}</span>
        </Typography>
      </Box>
    </form>
  );
}

function OTPForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = async e => {
    e.preventDefault();
    if (!email) return;
    setLoading(true); setError('');
    try {
      await api.post('/auth/otp/send', { email });
      setStep('code'); setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send code. Try again.');
    } finally { setLoading(false); }
  };

  const handleVerify = async e => {
    e.preventDefault();
    if (!code) return;
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/otp/verify-login', { email, code });
      dispatch(setCredentials(res.data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || err.data?.message || 'Invalid or expired code.');
    } finally { setLoading(false); }
  };

  if (step === 'code') {
    return (
      <form onSubmit={handleVerify}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5', '& .MuiAlert-icon': { color: '#EF4444' } }}>{error}</Alert>}
        <Box sx={{ mb: 2, p: 2, borderRadius: 2, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>Code sent to</Typography>
          <Typography sx={{ color: '#818CF8', fontWeight: 700, fontSize: '0.9rem' }}>{email}</Typography>
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={labelSx}>6-digit code</Typography>
          <TextField fullWidth value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required placeholder="000000" autoFocus
            inputProps={{ inputMode: 'numeric', style: { letterSpacing: '0.3em', fontSize: '1.4rem', textAlign: 'center', fontFamily: 'monospace' } }} sx={inputSx} />
        </Box>
        <Button fullWidth type="submit" variant="contained" size="large" disabled={loading || code.length !== 6} startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckCircle sx={{ fontSize: 16 }} />} sx={btnSx}>
          {loading ? 'Verifying…' : 'Verify & Sign In'}
        </Button>
        <Button fullWidth onClick={() => { setStep('email'); setCode(''); setError(''); }} sx={{ mt: 1.5, color: 'rgba(255,255,255,0.4)', textTransform: 'none', fontSize: '0.8rem' }}>
          ← Change email
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSend}>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5', '& .MuiAlert-icon': { color: '#EF4444' } }}>{error}</Alert>}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" sx={labelSx}>{t('auth.login.email')}</Typography>
        <TextField fullWidth type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={t('auth.login.emailPlaceholder')} autoFocus sx={inputSx} />
      </Box>
      <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Email sx={{ fontSize: 16 }} />} sx={btnSx}>
        {loading ? 'Sending code…' : 'Send verification code'}
      </Button>
      <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textAlign: 'center', mt: 1.5 }}>
        A 6-digit code will be sent to your email
      </Typography>
    </form>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { token } = useSelector(s => s.auth);
  const { t } = useTranslation();
  const [authTab, setAuthTab] = useState('password');

  useEffect(() => { if (token) navigate('/'); }, [token]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', background: '#0F172A', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 50%, rgba(79,70,229,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.12) 0%, transparent 50%)' }} />
      <Box sx={{ position: 'absolute', top: '10%', left: '5%', width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(79,70,229,0.12)' }} />
      <Box sx={{ position: 'absolute', bottom: '15%', right: '8%', width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(124,58,237,0.1)' }} />

      {/* Left Panel */}
      <Box sx={{ flex: 1, display: { xs: 'none', lg: 'flex' }, flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', px: 8, py: 6, position: 'relative', zIndex: 1, maxWidth: 520 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 5 }}>
          <svg width="36" height="42" viewBox="0 0 58 68" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs><linearGradient id="loginjg1" x1="29" y1="5" x2="29" y2="63" gradientUnits="userSpaceOnUse"><stop stopColor="#8B5CF6"/><stop offset="0.55" stopColor="#6366F1"/><stop offset="1" stopColor="#38BDF8"/></linearGradient></defs>
            <rect x="8" y="9" width="26" height="7" rx="3.5" fill="url(#loginjg1)"/>
            <rect x="25" y="16" width="7" height="39" rx="3.5" fill="url(#loginjg1)"/>
            <path d="M28.5 55 Q29 65 16.5 65 Q9.5 65 7 59.5" stroke="url(#loginjg1)" strokeWidth="7" strokeLinecap="round" fill="none"/>
            <circle cx="7" cy="59" r="3.5" fill="url(#loginjg1)"/>
            <circle cx="47" cy="21" r="5" fill="url(#loginjg1)"/>
            <rect x="43.5" y="27" width="7" height="30" rx="3.5" fill="url(#loginjg1)"/>
            <path d="M47 57 Q47 65 38 65" stroke="url(#loginjg1)" strokeWidth="7" strokeLinecap="round" fill="none"/>
          </svg>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 800, letterSpacing: '-0.02em' }}>Julay</Typography>
        </Box>
        <Typography variant="h2" sx={{ color: 'white', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, mb: 2 }}>
          {t('auth.login.tagline').split(' ').slice(0, 3).join(' ')}<br />
          <Box component="span" sx={{ background: 'linear-gradient(135deg, #818CF8, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t('auth.login.tagline').split(' ').slice(3).join(' ')}
          </Box>
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 380, mb: 4, fontSize: '1rem' }}>{t('auth.login.taglineDesc')}</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {['f1', 'f2', 'f3'].map((k, i) => (
            <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2, backgroundColor: 'rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                {['⚡', '🧠', '📊'][i]}
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem' }}>{t(`auth.login.features.${k}`)}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Right Panel */}
      <Box sx={{ flex: '0 0 auto', width: { xs: '100%', lg: 460 }, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, sm: 4 }, backgroundColor: { xs: 'transparent', lg: 'rgba(255,255,255,0.03)' }, borderLeft: { lg: '1px solid rgba(255,255,255,0.06)' }, position: 'relative', zIndex: 1 }}>
        <Box sx={{ width: '100%', maxWidth: 380 }}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 1.5, mb: 4, justifyContent: 'center' }}>
            <svg width="32" height="38" viewBox="0 0 58 68" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs><linearGradient id="loginjg2" x1="29" y1="5" x2="29" y2="63" gradientUnits="userSpaceOnUse"><stop stopColor="#8B5CF6"/><stop offset="0.55" stopColor="#6366F1"/><stop offset="1" stopColor="#38BDF8"/></linearGradient></defs>
              <rect x="8" y="9" width="26" height="7" rx="3.5" fill="url(#loginjg2)"/>
              <rect x="25" y="16" width="7" height="39" rx="3.5" fill="url(#loginjg2)"/>
              <path d="M28.5 55 Q29 65 16.5 65 Q9.5 65 7 59.5" stroke="url(#loginjg2)" strokeWidth="7" strokeLinecap="round" fill="none"/>
              <circle cx="7" cy="59" r="3.5" fill="url(#loginjg2)"/>
              <circle cx="47" cy="21" r="5" fill="url(#loginjg2)"/>
              <rect x="43.5" y="27" width="7" height="30" rx="3.5" fill="url(#loginjg2)"/>
              <path d="M47 57 Q47 65 38 65" stroke="url(#loginjg2)" strokeWidth="7" strokeLinecap="round" fill="none"/>
            </svg>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 800 }}>Julay</Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <LanguageSwitcher />
          </Box>

          <Card sx={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>
            <CardContent sx={{ p: 3.5 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={800} sx={{ color: 'white', letterSpacing: '-0.02em', mb: 0.5 }}>{t('auth.login.greeting')}</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>{t('auth.login.subtitle')}</Typography>
              </Box>

              {/* Auth method tabs */}
              <Tabs
                value={authTab}
                onChange={(_, v) => setAuthTab(v)}
                sx={{ mb: 3, minHeight: 36, '& .MuiTabs-root': { minHeight: 36 }, '& .MuiTab-root': { minHeight: 36, py: 0.5, px: 2, fontSize: '0.8rem', fontWeight: 600, textTransform: 'none', color: 'rgba(255,255,255,0.4)' }, '& .Mui-selected': { color: '#818CF8' }, '& .MuiTabs-indicator': { backgroundColor: '#6366F1', height: 2 }, borderBottom: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Tab value="password" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><LockOutlined sx={{ fontSize: 14 }} /> Password</Box>} />
                <Tab value="otp" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><Email sx={{ fontSize: 14 }} /> Email code</Box>} />
              </Tabs>

              {authTab === 'password' ? <PasswordForm /> : <OTPForm />}

              {/* Google */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 2.5 }}>
                <Box sx={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem' }}>OR</Typography>
                <Box sx={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              </Box>
              <GoogleAuthButton dark />

              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', mt: 2.5, fontSize: '0.8rem' }}>
                {t('auth.login.noAccount')}{' '}
                <Link component={RouterLink} to="/register" sx={{ color: '#818CF8', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>{t('auth.login.createWorkspace')}</Link>
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
