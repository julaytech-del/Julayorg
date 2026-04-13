import React, { useState } from 'react';
import { Box, Typography, TextField, Button, MenuItem, Alert, Link, CircularProgress } from '@mui/material';
import { Send, Email, ArrowBack } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import api from '../services/api.js';

const SUBJECTS = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'sales', label: 'Sales' },
  { value: 'support', label: 'Technical Support' },
  { value: 'privacy', label: 'Privacy / Data Request' },
  { value: 'bug', label: 'Bug Report' },
];

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email address';
  if (!form.subject) errors.subject = 'Please select a subject';
  if (!form.message.trim()) errors.message = 'Message is required';
  else if (form.message.trim().length < 10) errors.message = 'Message must be at least 10 characters';
  return errors;
}

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: 'white',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366F1' },
    '& input, & textarea': { color: 'white' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#818CF8' },
  '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.5)' },
  '& .MuiFormHelperText-root': { color: '#FCA5A5' },
  '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.5)' },
};

const menuSx = {
  PaperProps: {
    sx: {
      background: '#1E293B',
      border: '1px solid rgba(255,255,255,0.1)',
      '& .MuiMenuItem-root': { color: 'white', '&:hover': { background: 'rgba(99,102,241,0.15)' }, '&.Mui-selected': { background: 'rgba(99,102,241,0.2)' } },
    },
  },
};

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    // Honeypot check (hidden field — bots fill it, humans don't)
    if (form.website) return;

    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setServerError('');
    try {
      await api.post('/contact', {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject,
        message: form.message.trim(),
      });
      setSuccess(true);
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) setServerError('Too many requests. Please wait a few minutes and try again.');
      else setServerError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#0F172A', py: { xs: 4, md: 8 }, px: 2 }}>
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Link component={RouterLink} to="/" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.85rem', mb: 3, '&:hover': { color: 'white' } }}>
            <ArrowBack sx={{ fontSize: 14 }} /> Back to home
          </Link>
          <Typography variant="h4" fontWeight={800} sx={{ color: 'white', letterSpacing: '-0.02em', mb: 1 }}>Contact Us</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem', lineHeight: 1.7 }}>
            Have a question? We typically respond within 24 hours.
          </Typography>
        </Box>

        {success ? (
          <Box sx={{ p: 4, borderRadius: 3, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', textAlign: 'center' }}>
            <Email sx={{ color: '#6366F1', fontSize: 48, mb: 2 }} />
            <Typography variant="h6" fontWeight={700} sx={{ color: 'white', mb: 1 }}>Message sent!</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.7 }}>
              Thank you for reaching out. We've sent a confirmation to <strong style={{ color: '#818CF8' }}>{form.email}</strong> and will get back to you shortly.
            </Typography>
            <Button onClick={() => { setSuccess(false); setForm({ name: '', email: '', subject: '', message: '', website: '' }); }} sx={{ mt: 2.5, color: '#818CF8', textTransform: 'none' }}>
              Send another message
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {serverError && (
              <Alert severity="error" sx={{ mb: 2.5, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5', '& .MuiAlert-icon': { color: '#EF4444' } }}>
                {serverError}
              </Alert>
            )}

            {/* Honeypot — hidden from humans, visible to bots */}
            <Box component="input"
              aria-hidden="true"
              tabIndex={-1}
              name="website"
              value={form.website}
              onChange={set('website')}
              sx={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden', opacity: 0 }}
              autoComplete="off"
            />

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, mb: 2.5 }}>
              <TextField
                fullWidth label="Full Name" value={form.name} onChange={set('name')}
                error={!!errors.name} helperText={errors.name}
                inputProps={{ 'aria-describedby': errors.name ? 'name-error' : undefined }}
                sx={inputSx}
              />
              <TextField
                fullWidth label="Email Address" type="email" value={form.email} onChange={set('email')}
                error={!!errors.email} helperText={errors.email}
                sx={inputSx}
              />
            </Box>

            <TextField
              fullWidth select label="Subject" value={form.subject} onChange={set('subject')}
              error={!!errors.subject} helperText={errors.subject}
              SelectProps={{ MenuProps: menuSx }}
              sx={{ ...inputSx, mb: 2.5 }}
            >
              {SUBJECTS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </TextField>

            <TextField
              fullWidth multiline rows={5} label="Message" value={form.message} onChange={set('message')}
              error={!!errors.message} helperText={errors.message}
              sx={{ ...inputSx, mb: 3 }}
            />

            <Button
              fullWidth type="submit" variant="contained" size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Send sx={{ fontSize: 16 }} />}
              sx={{ py: 1.4, fontWeight: 700, background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', boxShadow: '0 4px 16px rgba(79,70,229,0.4)', textTransform: 'none', fontSize: '0.95rem', '&:hover': { boxShadow: '0 6px 20px rgba(79,70,229,0.5)' }, '&:disabled': { background: 'rgba(79,70,229,0.4)', color: 'rgba(255,255,255,0.5)' } }}
            >
              {loading ? 'Sending…' : 'Send Message'}
            </Button>

            <noscript>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', mt: 2, textAlign: 'center' }}>
                Email us directly: <a href="mailto:hello@julay.org" style={{ color: '#818CF8' }}>hello@julay.org</a>
              </Typography>
            </noscript>
          </Box>
        )}

        <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {[
            { label: 'General', email: 'hello@julay.org' },
            { label: 'Support', email: 'support@julay.org' },
            { label: 'Privacy', email: 'privacy@julay.org' },
          ].map(({ label, email }) => (
            <Box key={email}>
              <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.25 }}>{label}</Typography>
              <a href={`mailto:${email}`} style={{ color: '#818CF8', fontSize: '0.85rem', textDecoration: 'none' }}>{email}</a>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
