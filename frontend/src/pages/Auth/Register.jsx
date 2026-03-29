import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Link, MenuItem } from '@mui/material';
import { Psychology } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { registerUser } from '../../store/slices/authSlice.js';

const INDUSTRIES = ['technology','healthcare','finance','education','construction','retail','media','consulting','manufacturing','other'];

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', organizationName: '', industry: 'technology' });

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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 3 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2.5, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Psychology sx={{ color: 'white', fontSize: 26 }} />
            </Box>
            <Typography variant="h5" fontWeight={700}>Create Account</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Full Name" name="name" value={form.name} onChange={handle} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Email" name="email" type="email" value={form.email} onChange={handle} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Password" name="password" type="password" value={form.password} onChange={handle} required inputProps={{ minLength: 6 }} sx={{ mb: 2 }} />
            <TextField fullWidth label="Organization Name" name="organizationName" value={form.organizationName} onChange={handle} required sx={{ mb: 2 }} />
            <TextField fullWidth select label="Industry" name="industry" value={form.industry} onChange={handle} sx={{ mb: 3 }}>
              {INDUSTRIES.map(i => <MenuItem key={i} value={i} sx={{ textTransform: 'capitalize' }}>{i}</MenuItem>)}
            </TextField>
            <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}
              sx={{ borderRadius: 2, py: 1.5, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', fontWeight: 600 }}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </form>
          <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
            Already have an account? <Link component={RouterLink} to="/login" fontWeight={600}>Sign in</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
