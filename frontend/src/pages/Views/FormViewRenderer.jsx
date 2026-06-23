import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel, Button,
  CircularProgress, Alert, Checkbox, FormControlLabel, Paper, Rating
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { formsAPI } from '../../services/api.js';
import AppDateField from '../../components/common/AppDateField.jsx';

export default function FormViewRenderer() {
  const { token } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await formsAPI.getPublic(token);
        setForm(res.data);
      } catch { setError('Form not found or no longer available.'); }
      setLoading(false);
    })();
  }, [token]);

  // Values keyed by field.id for backend mapping; display keyed by idx
  const setValue = (fieldId, val) => setValues(v => ({ ...v, [fieldId]: val }));

  const submit = async (e) => {
    e.preventDefault();
    const missing = (form.fields || []).filter(f => f.required && !values[f.id]);
    if (missing.length) { setError(`Please fill in: ${missing.map(f => f.label).join(', ')}`); return; }
    setSubmitting(true); setError('');
    try {
      await formsAPI.submit(token, { data: values });
      setSubmitted(true);
      if (form.redirectUrl) {
        setTimeout(() => { window.location.href = form.redirectUrl; }, 2000);
      }
    } catch (e) { setError(e.message || 'Submission failed'); }
    setSubmitting(false);
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );

  if (submitted) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', p: 3 }}>
      <Paper sx={{ p: 5, maxWidth: 480, width: '100%', textAlign: 'center', borderRadius: 3 }}>
        <Box sx={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
          <Typography sx={{ color: 'white', fontSize: '1.8rem' }}>✓</Typography>
        </Box>
        <Typography variant="h5" fontWeight={700} mb={1}>Submitted!</Typography>
        <Typography color="text.secondary">
          {form?.successMessage || 'Your response has been recorded. Thank you!'}
        </Typography>
        {form?.redirectUrl && (
          <Typography variant="body2" color="text.secondary" mt={1}>Redirecting you shortly...</Typography>
        )}
      </Paper>
    </Box>
  );

  if (error && !form) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', p: 3 }}>
      <Alert severity="error" sx={{ maxWidth: 400, width: '100%' }}>{error}</Alert>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'center', py: 6, px: 2 }}>
      <Paper sx={{ p: { xs: 3, sm: 5 }, maxWidth: 560, width: '100%', borderRadius: 3, height: 'fit-content' }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2, px: 1.5, py: 0.5, borderRadius: 1.5, backgroundColor: '#EEF2FF' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#6366F1' }} />
            <Typography sx={{ fontSize: '0.72rem', color: '#4F46E5', fontWeight: 700, letterSpacing: '0.05em' }}>FORM</Typography>
          </Box>
          <Typography variant="h4" fontWeight={800} mb={0.5}>{form?.name}</Typography>
          {form?.description && <Typography color="text.secondary" fontSize="0.95rem">{form.description}</Typography>}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={submit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {(form?.fields || []).map((field, idx) => (
              <Box key={idx}>
                {field.type === 'textarea' && (
                  <TextField label={field.label + (field.required ? ' *' : '')} placeholder={field.placeholder} value={values[field.id] || ''} onChange={e => setValue(field.id, e.target.value)} fullWidth multiline rows={4} />
                )}
                {(field.type === 'text' || field.type === 'number' || field.type === 'email') && (
                  <TextField label={field.label + (field.required ? ' *' : '')} placeholder={field.placeholder} type={field.type} value={values[field.id] || ''} onChange={e => setValue(field.id, e.target.value)} fullWidth />
                )}
                {field.type === 'phone' && (
                  <TextField label={field.label + (field.required ? ' *' : '')} placeholder={field.placeholder || '+1 555 000 0000'} type="tel" value={values[field.id] || ''} onChange={e => setValue(field.id, e.target.value)} fullWidth />
                )}
                {field.type === 'url' && (
                  <TextField label={field.label + (field.required ? ' *' : '')} placeholder={field.placeholder || 'https://example.com'} type="url" value={values[field.id] || ''} onChange={e => setValue(field.id, e.target.value)} fullWidth />
                )}
                {field.type === 'date' && (
                  <AppDateField label={field.label + (field.required ? ' *' : '')} value={values[field.id] || ''} onChange={e => setValue(field.id, e.target.value)} fullWidth />
                )}
                {field.type === 'select' && (
                  <FormControl fullWidth>
                    <InputLabel>{field.label + (field.required ? ' *' : '')}</InputLabel>
                    <Select value={values[field.id] || ''} label={field.label} onChange={e => setValue(field.id, e.target.value)}>
                      {(field.options || []).map((opt, i) => <MenuItem key={i} value={opt}>{opt}</MenuItem>)}
                    </Select>
                  </FormControl>
                )}
                {field.type === 'checkbox' && (
                  <FormControlLabel control={<Checkbox checked={!!values[field.id]} onChange={e => setValue(field.id, e.target.checked)} />} label={field.label + (field.required ? ' *' : '')} />
                )}
                {field.type === 'rating' && (
                  <Box>
                    <Typography variant="body2" fontWeight={600} mb={0.5} color="text.primary">
                      {field.label}{field.required ? ' *' : ''}
                    </Typography>
                    <Rating
                      value={Number(values[field.id]) || 0}
                      onChange={(_, val) => setValue(field.id, val)}
                      size="large"
                    />
                  </Box>
                )}
              </Box>
            ))}

            <Button type="submit" variant="contained" size="large" disabled={submitting} sx={{ mt: 1, py: 1.5, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 2, fontWeight: 700, fontSize: '1rem' }}>
              {submitting ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Submit'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
