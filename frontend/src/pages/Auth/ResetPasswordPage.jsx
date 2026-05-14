import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, Paper, CircularProgress, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api.js';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setDone(true);
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

        {done ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircle sx={{ fontSize: 56, color: '#10B981', mb: 2 }} />
            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.2rem', mb: 1 }}>Password reset!</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', mb: 3 }}>You can now sign in with your new password.</Typography>
            <Button component={Link} to="/login" variant="contained" fullWidth
              sx={{ py: 1.5, fontWeight: 700, borderRadius: 2, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
              Go to Login
            </Button>
          </Box>
        ) : (
          <>
            <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.4rem', mb: 0.5 }}>Set new password</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', mb: 3 }}>Choose a strong password (at least 6 characters).</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { label: 'New Password', value: password, set: setPassword },
                { label: 'Confirm Password', value: confirm, set: setConfirm },
              ].map(({ label, value, set }) => (
                <TextField
                  key={label} label={label} value={value} onChange={e => set(e.target.value)}
                  type={showPwd ? 'text' : 'password'} required fullWidth
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.4)' } }}
                  InputProps={{
                    sx: { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' }, '&.Mui-focused fieldset': { borderColor: '#6366F1' } },
                    endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPwd(v => !v)} sx={{ color: 'rgba(255,255,255,0.4)' }}>{showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment>
                  }}
                />
              ))}
              <Button type="submit" variant="contained" fullWidth disabled={loading || !password || !confirm}
                sx={{ py: 1.5, fontWeight: 700, borderRadius: 2, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', '&:hover': { opacity: 0.9 } }}>
                {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Reset Password'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
