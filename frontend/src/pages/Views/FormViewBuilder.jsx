import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, IconButton, TextField, Select, MenuItem, FormControl, InputLabel, Stack, Chip, Drawer, Alert, CircularProgress, Divider, Switch, FormControlLabel, Tooltip, Snackbar } from '@mui/material';
import { Add, Delete, DragIndicator, ContentCopy, OpenInNew, Settings } from '@mui/icons-material';
import { formsAPI } from '../../services/api.js';

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
];

const MAP_TO_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'title', label: 'Task Title' },
  { value: 'description', label: 'Task Description' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'estimatedHours', label: 'Estimated Hours' },
];

function newField() {
  return { label: 'New Field', type: 'text', required: false, placeholder: '', options: [], mapTo: '' };
}

export default function FormViewBuilder() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await formsAPI.getAll(); setForms(res.data || []); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createForm = async () => {
    const res = await formsAPI.create({ name: 'New Form', description: '', fields: [newField()] });
    await load();
    setActiveForm(res.data);
    setDrawerOpen(true);
  };

  const openForm = (f) => { setActiveForm({ ...f }); setDrawerOpen(true); };

  const saveForm = async () => {
    if (!activeForm) return;
    setSaving(true);
    try {
      await formsAPI.update(activeForm._id, { name: activeForm.name, description: activeForm.description, fields: activeForm.fields });
      await load();
      const updated = (await formsAPI.getAll()).data?.find(f => f._id === activeForm._id);
      if (updated) setActiveForm(updated);
    } catch {}
    setSaving(false);
  };

  const deleteForm = async (id) => {
    if (!window.confirm('Delete this form?')) return;
    await formsAPI.delete(id);
    setForms(prev => prev.filter(f => f._id !== id));
    if (activeForm?._id === id) { setActiveForm(null); setDrawerOpen(false); }
  };

  const addField = () => setActiveForm(f => ({ ...f, fields: [...(f.fields || []), newField()] }));

  const updateField = (idx, key, val) => {
    setActiveForm(f => {
      const fields = [...f.fields];
      fields[idx] = { ...fields[idx], [key]: val };
      return { ...f, fields };
    });
  };

  const removeField = (idx) => setActiveForm(f => ({ ...f, fields: f.fields.filter((_, i) => i !== idx) }));

  const copyLink = () => {
    if (!activeForm?.publicToken) return;
    const url = `${window.location.origin}/forms/${activeForm.publicToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Form Views</Typography>
          <Typography variant="body2" color="text.secondary">Build public forms that create tasks automatically</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={createForm} sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 2 }}>
          New Form
        </Button>
      </Box>

      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box> :
        forms.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8, p: 6, border: '2px dashed #E2E8F0', borderRadius: 3 }}>
            <Settings sx={{ fontSize: 56, color: '#CBD5E1', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={600}>No Forms Yet</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Create shareable forms that auto-create tasks</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={createForm} sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 2 }}>Create Form</Button>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 2 }}>
            {forms.map(f => (
              <Card key={f._id} sx={{ borderRadius: 2, border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.15s', '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.1)', transform: 'translateY(-2px)' } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography fontWeight={700} fontSize="0.95rem">{f.name}</Typography>
                    <Chip label={`${f.fields?.length || 0} fields`} size="small" sx={{ fontSize: '0.68rem' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" fontSize="0.8rem" mt={0.5} mb={2}>{f.description || 'No description'}</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" startIcon={<Settings />} onClick={() => openForm(f)} sx={{ borderRadius: 1.5, flex: 1, fontSize: '0.78rem' }}>Edit</Button>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => deleteForm(f._id)} sx={{ color: '#EF4444', border: '1px solid #FCA5A5', borderRadius: 1.5 }}>
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )
      }

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 3 } }}>
        {activeForm && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={700}>Form Builder</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {activeForm.publicToken && (
                  <Tooltip title="Copy public link">
                    <IconButton size="small" onClick={copyLink} sx={{ border: '1px solid #E2E8F0', borderRadius: 1.5 }}><ContentCopy sx={{ fontSize: 16 }} /></IconButton>
                  </Tooltip>
                )}
                {activeForm.publicToken && (
                  <Tooltip title="Open form">
                    <IconButton size="small" onClick={() => window.open(`/forms/${activeForm.publicToken}`, '_blank')} sx={{ border: '1px solid #E2E8F0', borderRadius: 1.5 }}><OpenInNew sx={{ fontSize: 16 }} /></IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            <TextField label="Form Name" value={activeForm.name} onChange={e => setActiveForm(f => ({ ...f, name: e.target.value }))} fullWidth size="small" />
            <TextField label="Description (optional)" value={activeForm.description || ''} onChange={e => setActiveForm(f => ({ ...f, description: e.target.value }))} fullWidth size="small" multiline rows={2} />

            <Divider><Typography variant="caption" color="text.secondary" fontWeight={700}>FIELDS</Typography></Divider>

            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              <Stack spacing={1.5}>
                {(activeForm.fields || []).map((field, idx) => (
                  <Box key={idx} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, backgroundColor: '#FAFAFA' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <DragIndicator sx={{ fontSize: 18, color: '#CBD5E1', cursor: 'grab' }} />
                      <TextField value={field.label} onChange={e => updateField(idx, 'label', e.target.value)} size="small" placeholder="Field label" sx={{ flex: 1 }} inputProps={{ style: { fontSize: '0.85rem', fontWeight: 600 } }} />
                      <IconButton size="small" onClick={() => removeField(idx)} sx={{ color: '#EF4444' }}><Delete sx={{ fontSize: 16 }} /></IconButton>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
                      <FormControl size="small">
                        <InputLabel>Type</InputLabel>
                        <Select value={field.type} label="Type" onChange={e => updateField(idx, 'type', e.target.value)}>
                          {FIELD_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <FormControl size="small">
                        <InputLabel>Maps to</InputLabel>
                        <Select value={field.mapTo || ''} label="Maps to" onChange={e => updateField(idx, 'mapTo', e.target.value)}>
                          {MAP_TO_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <TextField value={field.placeholder || ''} onChange={e => updateField(idx, 'placeholder', e.target.value)} size="small" placeholder="Placeholder..." sx={{ flex: 1, mr: 1 }} inputProps={{ style: { fontSize: '0.78rem' } }} />
                      <FormControlLabel control={<Switch checked={field.required} onChange={e => updateField(idx, 'required', e.target.checked)} size="small" />} label={<Typography fontSize="0.75rem">Required</Typography>} />
                    </Box>
                  </Box>
                ))}
              </Stack>
              <Button startIcon={<Add />} onClick={addField} size="small" sx={{ mt: 1.5 }}>Add Field</Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => setDrawerOpen(false)} variant="outlined" sx={{ flex: 1, borderRadius: 2 }}>Cancel</Button>
              <Button onClick={saveForm} variant="contained" disabled={saving} sx={{ flex: 1, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 2 }}>
                {saving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Save Form'}
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      <Snackbar open={copied} autoHideDuration={2000} onClose={() => setCopied(false)} message="Link copied to clipboard!" anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
