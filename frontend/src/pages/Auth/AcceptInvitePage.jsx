import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, CircularProgress, Alert, Paper } from '@mui/material';
import { CheckCircle, Business } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice.js';
import api from '../../services/api.js';

export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [inviteInfo, setInviteInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState('');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/auth/invite/${token}`);
        setInviteInfo(res.data.data);
      } catch (e) {
        setInfoError(e.response?.data?.message || 'This invite link is invalid or has expired.');
      } finally {
        setLoadingInfo(false);
      }
    };
    load();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Please enter your name');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post(`/auth/accept-invite/${token}`, { name, password });
      const { token: jwt, user } = res.data.data;
      dispatch(setCredentials({ token: jwt, user }));
      setDone(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (e) {
      setError(e.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0F172A 0%,#1E1B4B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Paper elevation={0} sx={{ width: '100%', maxWidth: 420, p: 4, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}>

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Box component="img" src="/logo.png" alt="Julay" sx={{ width: 36, height: 36, objectFit: 'contain' }} />
          <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>Julay</Typography>
        </Box>

        {loadingInfo ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#6366F1' }} />
          </Box>
        ) : infoError ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>{infoError}</Alert>
            <Button onClick={() => navigate('/')} variant="outlined" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>Go to Homepage</Button>
          </Box>
        ) : done ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircle sx={{ fontSize: 56, color: '#10B981', mb: 2 }} />
            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.2rem', mb: 1 }}>Welcome to Julay!</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Redirecting to your dashboard…</Typography>
          </Box>
        ) : (
          <>
            {/* Org info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderRadius: 2, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', mb: 3 }}>
              <Business sx={{ color: '#818CF8', fontSize: 20 }} />
              <Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>You're invited to join</Typography>
                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{inviteInfo?.organization?.name}</Typography>
              </Box>
            </Box>

            <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.4rem', mb: 0.5 }}>Create your account</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', mb: 3 }}>
              Joining as <strong style={{ color: '#818CF8' }}>{inviteInfo?.email}</strong>
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Your full name" value={name} onChange={e => setName(e.target.value)}
                required fullWidth autoFocus
                InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.4)' } }}
                InputProps={{ sx: { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' }, '&.Mui-focused fieldset': { borderColor: '#6366F1' } } }}
              />
              <TextField
                label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                required fullWidth
                InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.4)' } }}
                InputProps={{ sx: { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' }, '&.Mui-focused fieldset': { borderColor: '#6366F1' } } }}
              />
              <TextField
                label="Confirm password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                required fullWidth
                InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.4)' } }}
                InputProps={{ sx: { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' }, '&.Mui-focused fieldset': { borderColor: '#6366F1' } } }}
              />
              <Button type="submit" variant="contained" fullWidth disabled={submitting}
                sx={{ py: 1.5, fontWeight: 700, borderRadius: 2, fontSize: '0.95rem', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)', '&:hover': { opacity: 0.9 } }}>
                {submitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Join the team'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
