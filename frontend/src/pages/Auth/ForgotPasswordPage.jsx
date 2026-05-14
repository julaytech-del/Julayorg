import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, Paper, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0F172A 0%,#1E1B4B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Paper elevation={0} sx={{ width: '100%', maxWidth: 400, p: 4, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Box component="img" src="/logo.png" alt="Julay" sx={{ width: 36, height: 36, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
          <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>Julay</Typography>
        </Box>

        {sent ? (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>Check your email — we sent you a reset link.</Alert>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', mb: 3 }}>
              Didn't receive it? Check your spam folder or try again.
            </Typography>
            <Button component={Link} to="/login" fullWidth variant="outlined"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)', '&:hover': { borderColor: 'rgba(255,255,255,0.4)' } }}>
              Back to Login
            </Button>
          </Box>
        ) : (
          <>
            <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.4rem', mb: 0.5 }}>Forgot password?</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', mb: 3 }}>
              Enter your email and we'll send you a reset link.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Email Address" type="email" value={email}
                onChange={e => setEmail(e.target.value)} required fullWidth autoFocus
                InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.4)' } }}
                InputProps={{ sx: { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' }, '&.Mui-focused fieldset': { borderColor: '#6366F1' } } }}
              />
              <Button type="submit" variant="contained" fullWidth disabled={loading || !email}
                sx={{ py: 1.5, fontWeight: 700, borderRadius: 2, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', '&:hover': { opacity: 0.9 } }}>
                {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Send Reset Link'}
              </Button>
              <Button component={Link} to="/login" fullWidth variant="text"
                sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'white' } }}>
                Back to Login
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
