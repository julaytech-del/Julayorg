import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Link, Divider, CircularProgress } from '@mui/material';
import { Psychology, AutoAwesome, LockOutlined } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loginUser, clearError } from '../../store/slices/authSlice.js';
import LanguageSwitcher from '../../components/common/LanguageSwitcher.jsx';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector(s => s.auth);
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => { if (token) navigate('/'); }, [token]);
  useEffect(() => { return () => dispatch(clearError()); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await dispatch(loginUser({ email, password }));
    if (!res.error) navigate('/');
  };

  const fillDemo = () => { setEmail('admin@techcorp.com'); setPassword('password123'); };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', background: '#0F172A', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 50%, rgba(79,70,229,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.12) 0%, transparent 50%)' }} />
      <Box sx={{ position: 'absolute', top: '10%', left: '5%', width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(79,70,229,0.12)' }} />
      <Box sx={{ position: 'absolute', bottom: '15%', right: '8%', width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(124,58,237,0.1)' }} />

      {/* Left Panel */}
      <Box sx={{ flex: 1, display: { xs: 'none', lg: 'flex' }, flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', px: 8, py: 6, position: 'relative', zIndex: 1, maxWidth: 520 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 5 }}>
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Psychology sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 800, letterSpacing: '-0.02em' }}>Julay</Typography>
        </Box>

        <Typography variant="h2" sx={{ color: 'white', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, mb: 2 }}>
          {t('auth.login.tagline').split(' ').slice(0, 3).join(' ')}<br />
          <Box component="span" sx={{ background: 'linear-gradient(135deg, #818CF8, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t('auth.login.tagline').split(' ').slice(3).join(' ')}
          </Box>
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 380, mb: 4, fontSize: '1rem' }}>
          {t('auth.login.taglineDesc')}
        </Typography>

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
            <Box sx={{ width: 38, height: 38, borderRadius: 2, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Psychology sx={{ color: 'white', fontSize: 22 }} />
            </Box>
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

              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5', '& .MuiAlert-icon': { color: '#EF4444' } }}>{error}</Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.75 }}>{t('auth.login.email')}</Typography>
                  <TextField fullWidth type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={t('auth.login.emailPlaceholder')}
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366F1' }, '& input::placeholder': { color: 'rgba(255,255,255,0.25)' } } }} />
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.75 }}>{t('auth.login.password')}</Typography>
                  <TextField fullWidth type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder={t('auth.login.passwordPlaceholder')}
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366F1' }, '& input::placeholder': { color: 'rgba(255,255,255,0.25)' } } }} />
                </Box>

                <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockOutlined sx={{ fontSize: 16 }} />}
                  sx={{ py: 1.4, fontWeight: 700, fontSize: '0.9rem', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', boxShadow: '0 4px 16px rgba(79,70,229,0.4)', '&:hover': { boxShadow: '0 6px 20px rgba(79,70,229,0.5)', transform: 'translateY(-1px)' }, '&:disabled': { background: 'rgba(79,70,229,0.4)', color: 'rgba(255,255,255,0.5)' }, transition: 'all 0.15s' }}>
                  {loading ? t('auth.login.submitting') : t('auth.login.submit')}
                </Button>
              </form>

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
