import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Link, MenuItem } from '@mui/material';
import { Psychology } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { registerUser, clearError } from '../../store/slices/authSlice.js';
import LanguageSwitcher from '../../components/common/LanguageSwitcher.jsx';

const INDUSTRIES = ['technology','healthcare','finance','education','construction','retail','media','consulting','manufacturing','other'];

export default function Register() {
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
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E1B4B 100%)', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 440, borderRadius: 3 }}>
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

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField fullWidth label={t('auth.register.name')} name="name" value={form.name} onChange={handle} required sx={{ mb: 2 }} />
            <TextField fullWidth label={t('auth.register.email')} name="email" type="email" value={form.email} onChange={handle} required sx={{ mb: 2 }} />
            <TextField fullWidth label={t('auth.register.password')} name="password" type="password" value={form.password} onChange={handle} required inputProps={{ minLength: 6 }} sx={{ mb: 2 }} />
            <TextField fullWidth label={t('auth.register.orgName')} name="organizationName" value={form.organizationName} onChange={handle} required sx={{ mb: 2 }} />
            <TextField fullWidth select label={t('auth.register.industry')} name="industry" value={form.industry} onChange={handle} sx={{ mb: 3 }}>
              {INDUSTRIES.map(i => <MenuItem key={i} value={i} sx={{ textTransform: 'capitalize' }}>{i}</MenuItem>)}
            </TextField>
            <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}
              sx={{ borderRadius: 2, py: 1.5, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', fontWeight: 600 }}>
              {loading ? t('common.loading') : t('auth.register.submit')}
            </Button>
          </form>
          <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
            {t('auth.register.hasAccount')}{' '}
            <Link component={RouterLink} to="/login" fontWeight={600}>{t('auth.register.signIn')}</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
