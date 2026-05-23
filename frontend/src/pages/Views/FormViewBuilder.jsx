import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, IconButton, TextField, Select, MenuItem,
  FormControl, InputLabel, Stack, Chip, Drawer, Alert, CircularProgress, Divider,
  Switch, FormControlLabel, Tooltip, Snackbar, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableHead, TableRow, TableCell, TableBody, Paper
} from '@mui/material';
import { Add, Delete, DragIndicator, ContentCopy, OpenInNew, Settings, Visibility, Code } from '@mui/icons-material';
import { formsAPI, projectsAPI } from '../../services/api.js';

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'url', label: 'URL / Website' },
  { value: 'rating', label: 'Rating (1-5)' },
];

const ALL_MAP_TO = [
  { value: 'title',          label: 'Task Title',       types: ['text','textarea','email','phone','url','select'] },
  { value: 'description',    label: 'Task Description', types: ['text','textarea','email','phone','url'] },
  { value: 'dueDate',        label: 'Due Date',         types: ['date'] },
  { value: 'priority',       label: 'Priority',         types: ['select'] },
  { value: 'estimatedHours', label: 'Estimated Hours',  types: ['number','rating'] },
  { value: 'notes',          label: 'Notes',            types: ['text','textarea'] },
];

const getMapToOptions = (fieldType) =>
  ALL_MAP_TO.filter(o => o.types.includes(fieldType));

function newField() {
  return { id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, label: 'New Field', type: 'text', required: false, placeholder: '', options: [], mapTo: 'title' };
}

export default function FormViewBuilder() {
  const [forms, setForms] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [newFormProject, setNewFormProject] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Submissions dialog state
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [submissionsForm, setSubmissionsForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [formsRes, projRes] = await Promise.all([formsAPI.getAll(), projectsAPI.getAll()]);
      setForms(formsRes.data || []);
      setProjects(projRes.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // --- Create form dialog ---
  const openCreateDialog = () => {
    setNewFormName('New Form');
    setNewFormProject('');
    setCreateError('');
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!newFormName.trim()) { setCreateError('Form name is required'); return; }
    if (!newFormProject) { setCreateError('Please select a project'); return; }
    setCreating(true);
    setCreateError('');
    try {
      const res = await formsAPI.create({ name: newFormName.trim(), project: newFormProject, description: '', fields: [newField()] });
      setCreateOpen(false);
      await load();
      setActiveForm(res.data);
      setDrawerOpen(true);
    } catch (e) {
      setCreateError(e?.message || 'Failed to create form');
    }
    setCreating(false);
  };

  const openForm = (f) => { setActiveForm({ ...f }); setDrawerOpen(true); };

  const saveForm = async () => {
    if (!activeForm) return;
    setSaving(true);
    try {
      await formsAPI.update(activeForm._id, {
        name: activeForm.name,
        description: activeForm.description,
        fields: activeForm.fields,
        successMessage: activeForm.successMessage,
        notifyEmail: activeForm.notifyEmail,
      });
      await load();
      setSnackMsg('Form saved!');
    } catch {}
    setSaving(false);
  };

  const deleteForm = async (id) => {
    if (!window.confirm('Delete this form?')) return;
    await formsAPI.delete(id);
    setForms(prev => prev.filter(f => f._id !== id));
    if (activeForm?._id === id) { setActiveForm(null); setDrawerOpen(false); }
  };

  const toggleActive = async (f) => {
    try {
      await formsAPI.update(f._id, { active: !f.active });
      setForms(prev => prev.map(x => x._id === f._id ? { ...x, active: !f.active } : x));
    } catch {}
  };

  const addField = () => setActiveForm(f => ({ ...f, fields: [...(f.fields || []), newField()] }));

  const updateField = (idx, key, val) => {
    setActiveForm(f => {
      const fields = [...f.fields];
      const updated = { ...fields[idx], [key]: val };
      if (key === 'type') {
        const compatible = getMapToOptions(val);
        if (!compatible.find(o => o.value === updated.mapTo)) {
          updated.mapTo = compatible[0]?.value || 'title';
        }
      }
      fields[idx] = updated;
      return { ...f, fields };
    });
  };

  const removeField = (idx) => setActiveForm(f => ({ ...f, fields: f.fields.filter((_, i) => i !== idx) }));

  const copyLink = () => {
    if (!activeForm?.publicToken) return;
    const url = `${window.location.origin}/forms/${activeForm.publicToken}`;
    navigator.clipboard.writeText(url);
    setSnackMsg('Link copied to clipboard!');
  };

  const copyEmbed = () => {
    if (!activeForm?.publicToken) return;
    const code = `<iframe src="${window.location.origin}/forms/${activeForm.publicToken}" width="100%" height="600" frameborder="0" style="border-radius:12px;border:1px solid #E2E8F0"></iframe>`;
    navigator.clipboard.writeText(code);
    setSnackMsg('Embed code copied!');
  };

  const openSubmissions = async (f) => {
    setSubmissionsForm(f);
    setSubmissionsOpen(true);
    setLoadingSubmissions(true);
    try {
      const res = await formsAPI.getSubmissions(f._id);
      setSubmissions(res.data || []);
    } catch { setSubmissions([]); }
    setLoadingSubmissions(false);
  };

  const embedCode = activeForm?.publicToken
    ? `<iframe src="${window.location.origin}/forms/${activeForm.publicToken}" width="100%" height="600" frameborder="0" style="border-radius:12px;border:1px solid #E2E8F0"></iframe>`
    : '';

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Form Views</Typography>
          <Typography variant="body2" color="text.secondary">Build public forms that create tasks automatically</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog} sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 2 }}>
          New Form
        </Button>
      </Box>

      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box> :
        forms.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8, p: 6, border: '2px dashed #E2E8F0', borderRadius: 3 }}>
            <Settings sx={{ fontSize: 56, color: '#CBD5E1', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={600}>No Forms Yet</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Create shareable forms that auto-create tasks</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog} sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 2 }}>Create Form</Button>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 2 }}>
            {forms.map(f => (
              <Card key={f._id} sx={{ borderRadius: 2, border: '1px solid #E2E8F0', transition: 'all 0.15s', '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.1)', transform: 'translateY(-2px)' } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                    <Typography fontWeight={700} fontSize="0.95rem">{f.name}</Typography>
                    <Chip label={`${f.fields?.length || 0} fields`} size="small" sx={{ fontSize: '0.68rem' }} />
                  </Box>

                  {f.project?.name && (
                    <Chip label={f.project.name} size="small" variant="outlined" sx={{ fontSize: '0.68rem', mb: 1, borderColor: '#6366F1', color: '#6366F1' }} />
                  )}

                  <Typography variant="body2" color="text.secondary" fontSize="0.8rem" mb={1}>{f.description || 'No description'}</Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Chip
                      label={`${f.submissionCount || 0} submissions`}
                      size="small"
                      sx={{ fontSize: '0.68rem', backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!f.active}
                          onChange={() => toggleActive(f)}
                          size="small"
                          sx={{ '& .MuiSwitch-thumb': { backgroundColor: f.active ? '#6366F1' : undefined } }}
                        />
                      }
                      label={<Typography fontSize="0.72rem" color={f.active ? '#22C55E' : '#94A3B8'}>{f.active ? 'Active' : 'Inactive'}</Typography>}
                      sx={{ mr: 0, ml: 0 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" startIcon={<Settings />} onClick={() => openForm(f)} sx={{ borderRadius: 1.5, flex: 1, fontSize: '0.76rem' }}>Edit</Button>
                    <Button size="small" variant="outlined" startIcon={<Visibility />} onClick={() => openSubmissions(f)} sx={{ borderRadius: 1.5, flex: 1, fontSize: '0.76rem', borderColor: '#6366F1', color: '#6366F1' }}>Submissions</Button>
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

      {/* Create Form Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Create New Form</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          {createError && <Alert severity="error">{createError}</Alert>}
          <TextField
            label="Form Name"
            value={newFormName}
            onChange={e => setNewFormName(e.target.value)}
            fullWidth
            size="small"
            autoFocus
          />
          <FormControl fullWidth size="small" required>
            <InputLabel>Project *</InputLabel>
            <Select value={newFormProject} label="Project *" onChange={e => setNewFormProject(e.target.value)}>
              {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={creating} sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 2 }}>
            {creating ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Create Form'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={submissionsOpen} onClose={() => setSubmissionsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>
          Submissions — {submissionsForm?.name}
          <Typography variant="body2" color="text.secondary">{submissions.length} total</Typography>
        </DialogTitle>
        <DialogContent>
          {loadingSubmissions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : submissions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: '#94A3B8' }}>
              <Typography fontSize="2rem">📭</Typography>
              <Typography fontWeight={600}>No submissions yet</Typography>
              <Typography variant="body2">Share your form link to start collecting responses.</Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Created Task</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Data Preview</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...submissions].reverse().map((sub, i) => (
                    <TableRow key={i} sx={{ '&:hover': { backgroundColor: '#F8FAFC' } }}>
                      <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {new Date(sub.submittedAt).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>
                        {sub.createdTaskId?.title || '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: '#64748B', maxWidth: 300 }}>
                        {sub.data
                          ? Object.entries(sub.data).slice(0, 3).map(([k, v]) => {
                              const field = submissionsForm?.fields?.find(f => f.id === k);
                              const label = field?.label || k;
                              return `${label}: ${v}`;
                            }).join(' · ')
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSubmissionsOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Form Builder Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 520 }, p: 3 } }}>
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
            <TextField
              label="Success Message shown after submit"
              value={activeForm.successMessage || ''}
              onChange={e => setActiveForm(f => ({ ...f, successMessage: e.target.value }))}
              fullWidth size="small"
              placeholder="Thank you! Your submission has been received."
            />
            <TextField
              label="Email to notify on submission (optional)"
              value={activeForm.notifyEmail || ''}
              onChange={e => setActiveForm(f => ({ ...f, notifyEmail: e.target.value }))}
              fullWidth size="small"
              type="email"
              placeholder="team@example.com"
            />

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
                          {getMapToOptions(field.type).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
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

            {activeForm.publicToken && (
              <>
                <Divider><Typography variant="caption" color="text.secondary" fontWeight={700}>EMBED CODE</Typography></Divider>
                <Box sx={{ backgroundColor: '#1E293B', borderRadius: 2, p: 2, position: 'relative' }}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#94A3B8', wordBreak: 'break-all', lineHeight: 1.6 }}>
                    {embedCode}
                  </Typography>
                  <Tooltip title="Copy embed code">
                    <IconButton
                      size="small"
                      onClick={copyEmbed}
                      sx={{ position: 'absolute', top: 8, right: 8, color: '#CBD5E1', '&:hover': { color: '#fff' } }}
                    >
                      <Code sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </>
            )}

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => setDrawerOpen(false)} variant="outlined" sx={{ flex: 1, borderRadius: 2 }}>Cancel</Button>
              <Button onClick={saveForm} variant="contained" disabled={saving} sx={{ flex: 1, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 2 }}>
                {saving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Save Form'}
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      <Snackbar open={!!snackMsg} autoHideDuration={2500} onClose={() => setSnackMsg('')} message={snackMsg} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
