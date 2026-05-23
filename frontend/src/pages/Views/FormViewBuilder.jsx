import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, Card, CardContent, IconButton, TextField, Select, MenuItem,
  FormControl, InputLabel, Stack, Chip, Drawer, Alert, CircularProgress, Divider,
  Switch, FormControlLabel, Tooltip, Snackbar, Dialog, DialogTitle, DialogContent,
  DialogActions, Paper, Collapse, InputAdornment
} from '@mui/material';
import {
  Add, Delete, DragIndicator, ContentCopy, OpenInNew, Settings, Visibility, Code,
  AutoAwesome, Close, ExpandMore, ExpandLess, CheckCircle, Archive, Block
} from '@mui/icons-material';
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

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#F59E0B', bg: '#FEF3C7' },
  converted: { label: 'Converted', color: '#22C55E', bg: '#DCFCE7' },
  backlog:   { label: 'Backlog',   color: '#3B82F6', bg: '#DBEAFE' },
  ignored:   { label: 'Ignored',   color: '#94A3B8', bg: '#F1F5F9' },
};

const SENTIMENT_CONFIG = {
  positive: { label: 'Positive', color: '#22C55E', bg: '#DCFCE7' },
  neutral:  { label: 'Neutral',  color: '#64748B', bg: '#F1F5F9' },
  negative: { label: 'Negative', color: '#EF4444', bg: '#FEE2E2' },
  mixed:    { label: 'Mixed',    color: '#F59E0B', bg: '#FEF3C7' },
};

const PRIORITY_COLOR = { high: '#EF4444', medium: '#F59E0B', low: '#94A3B8' };

function OptionsEditor({ options, onChange }) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  const addOption = () => {
    const trimmed = draft.trim();
    if (!trimmed || options.includes(trimmed)) return;
    onChange([...options, trimmed]);
    setDraft('');
    inputRef.current?.focus();
  };

  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
        Dropdown Options
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75 }}>
        <TextField
          inputRef={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
          size="small"
          placeholder="Type an option and press Enter"
          sx={{ flex: 1 }}
          inputProps={{ style: { fontSize: '0.8rem' } }}
        />
        <Button size="small" variant="outlined" onClick={addOption} disabled={!draft.trim()} sx={{ borderRadius: 1.5, minWidth: 56, fontSize: '0.75rem' }}>
          Add
        </Button>
      </Box>
      {options.length > 0 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {options.map((opt, i) => (
            <Chip
              key={i}
              label={opt}
              size="small"
              onDelete={() => onChange(options.filter((_, j) => j !== i))}
              sx={{ fontSize: '0.72rem', height: 22, backgroundColor: '#EEF2FF', color: '#4F46E5', '& .MuiChip-deleteIcon': { fontSize: 14 } }}
            />
          ))}
        </Box>
      ) : (
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>No options yet — add at least one</Typography>
      )}
    </Box>
  );
}

export default function FormViewBuilder() {
  const [forms, setForms] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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

  // AI analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  // Convert-to-task inline state: { subId, title, priority, status }
  const [convertForm, setConvertForm] = useState(null);
  const [converting, setConverting] = useState(false);

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
        mode: activeForm.mode || 'task',
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
    setAnalysis(null);
    setAnalysisOpen(false);
    setAnalysisError('');
    setConvertForm(null);
    try {
      const res = await formsAPI.getSubmissions(f._id);
      setSubmissions(res.data || []);
    } catch { setSubmissions([]); }
    setLoadingSubmissions(false);
  };

  const handleUpdateStatus = async (subId, status) => {
    try {
      await formsAPI.updateSubmissionStatus(submissionsForm._id, subId, status);
      setSubmissions(prev => prev.map(s => s._id === subId ? { ...s, status } : s));
      setSnackMsg(`Marked as ${status}`);
    } catch { setSnackMsg('Failed to update status'); }
  };

  const handleConvertToTask = async (subId) => {
    if (!convertForm || convertForm.subId !== subId) return;
    setConverting(true);
    try {
      await formsAPI.convertToTask(submissionsForm._id, subId, {
        title: convertForm.title,
        status: convertForm.status,
        priority: convertForm.priority,
      });
      setSubmissions(prev => prev.map(s => s._id === subId ? { ...s, status: 'converted' } : s));
      setConvertForm(null);
      setSnackMsg('Task created successfully!');
    } catch { setSnackMsg('Failed to create task'); }
    setConverting(false);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysisError('');
    try {
      const res = await formsAPI.analyze(submissionsForm._id);
      setAnalysis(res.data);
      setAnalysisOpen(true);
    } catch (e) {
      setAnalysisError(e?.message || 'AI analysis failed');
    }
    setAnalyzing(false);
  };

  const embedCode = activeForm?.publicToken
    ? `<iframe src="${window.location.origin}/forms/${activeForm.publicToken}" width="100%" height="600" frameborder="0" style="border-radius:12px;border:1px solid #E2E8F0"></iframe>`
    : '';

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Form Views</Typography>
          <Typography variant="body2" color="text.secondary">Build public forms that create tasks automatically or collect feedback</Typography>
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
            <Typography variant="body2" color="text.secondary" mb={3}>Create shareable forms that auto-create tasks or collect survey feedback</Typography>
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

                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                    {f.project?.name && (
                      <Chip label={f.project.name} size="small" variant="outlined" sx={{ fontSize: '0.68rem', borderColor: '#6366F1', color: '#6366F1' }} />
                    )}
                    {f.mode === 'survey' ? (
                      <Chip label="Survey Mode" size="small" sx={{ fontSize: '0.68rem', backgroundColor: '#F3E8FF', color: '#7C3AED' }} />
                    ) : (
                      <Chip label="Task Mode" size="small" sx={{ fontSize: '0.68rem', backgroundColor: '#EFF6FF', color: '#2563EB' }} />
                    )}
                  </Box>

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

      {/* Submissions Inbox Dialog */}
      <Dialog open={submissionsOpen} onClose={() => setSubmissionsOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography fontWeight={700} variant="h6">Submissions Inbox — {submissionsForm?.name}</Typography>
              <Typography variant="body2" color="text.secondary">{submissions.length} total submissions</Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={analyzing ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <AutoAwesome />}
              disabled={analyzing || submissions.length === 0}
              onClick={handleAnalyze}
              size="small"
              sx={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', borderRadius: 2, whiteSpace: 'nowrap' }}
            >
              {analyzing ? 'Analyzing...' : 'AI Analysis'}
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 0 }}>
          {analysisError && <Alert severity="error" sx={{ mb: 2 }}>{analysisError}</Alert>}

          {/* AI Analysis Panel */}
          {analysis && (
            <Collapse in={analysisOpen}>
              <Paper sx={{ p: 2.5, mb: 2, border: '1px solid #E9D5FF', backgroundColor: '#FAFAFF', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesome sx={{ color: '#7C3AED', fontSize: 18 }} />
                    <Typography fontWeight={700} fontSize="0.95rem" color="#7C3AED">AI Analysis</Typography>
                    {analysis.sentiment && (
                      <Chip
                        label={SENTIMENT_CONFIG[analysis.sentiment]?.label || analysis.sentiment}
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          color: SENTIMENT_CONFIG[analysis.sentiment]?.color,
                          backgroundColor: SENTIMENT_CONFIG[analysis.sentiment]?.bg,
                          fontWeight: 700,
                        }}
                      />
                    )}
                    {analysis.sentimentScore !== undefined && (
                      <Typography variant="caption" color="text.secondary">Score: {analysis.sentimentScore}/100</Typography>
                    )}
                  </Box>
                  <IconButton size="small" onClick={() => setAnalysisOpen(false)}><Close sx={{ fontSize: 16 }} /></IconButton>
                </Box>

                <Typography variant="body2" color="text.secondary" mb={1.5} sx={{ lineHeight: 1.6 }}>{analysis.summary}</Typography>

                {analysis.themes?.length > 0 && (
                  <Box mb={1.5}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Themes</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {analysis.themes.map((t, i) => (
                        <Tooltip key={i} title={t.description || ''}>
                          <Chip label={`${t.title} (${t.count})`} size="small" sx={{ fontSize: '0.72rem', backgroundColor: '#EDE9FE', color: '#5B21B6' }} />
                        </Tooltip>
                      ))}
                    </Box>
                  </Box>
                )}

                {analysis.actionItems?.length > 0 && (
                  <Box mb={1.5}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Action Items</Typography>
                    <Stack spacing={0.5} mt={0.5}>
                      {analysis.actionItems.map((item, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: PRIORITY_COLOR[item.priority] || '#94A3B8', mt: 0.7, flexShrink: 0 }} />
                          <Typography variant="body2" fontSize="0.8rem">{item.text}</Typography>
                          <Chip label={item.priority} size="small" sx={{ fontSize: '0.65rem', height: 18, color: PRIORITY_COLOR[item.priority], backgroundColor: `${PRIORITY_COLOR[item.priority]}20`, ml: 'auto', flexShrink: 0 }} />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}

                {analysis.keyInsights?.length > 0 && (
                  <Box mb={1}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Key Insights</Typography>
                    <Stack spacing={0.25} mt={0.5}>
                      {analysis.keyInsights.map((ins, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                          <Typography color="#7C3AED" sx={{ fontSize: '0.85rem', mt: 0.1 }}>•</Typography>
                          <Typography variant="body2" fontSize="0.8rem">{ins}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}

                {analysis.commonIssues?.length > 0 && (
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Common Issues</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {analysis.commonIssues.map((issue, i) => (
                        <Chip key={i} label={issue} size="small" sx={{ fontSize: '0.72rem', backgroundColor: '#FEE2E2', color: '#991B1B' }} />
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            </Collapse>
          )}

          {loadingSubmissions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : submissions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: '#94A3B8' }}>
              <Typography fontSize="2rem">📭</Typography>
              <Typography fontWeight={600}>No submissions yet</Typography>
              <Typography variant="body2">Share your form link to start collecting responses.</Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {[...submissions].reverse().map((sub) => {
                const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending;
                const isPending = !sub.status || sub.status === 'pending';
                const isConverting = convertForm?.subId === sub._id;

                return (
                  <Paper key={sub._id} variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: isPending ? '#FDE68A' : '#E2E8F0', backgroundColor: isPending ? '#FFFBEB' : '#FAFAFA' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(sub.submittedAt).toLocaleString()}
                      </Typography>
                      <Chip
                        label={cfg.label}
                        size="small"
                        sx={{ fontSize: '0.68rem', fontWeight: 700, color: cfg.color, backgroundColor: cfg.bg }}
                      />
                    </Box>

                    {/* Field data */}
                    <Box sx={{ mb: isPending ? 1.5 : 0 }}>
                      {sub.data && Object.entries(sub.data).map(([k, v]) => {
                        const field = submissionsForm?.fields?.find(f => f.id === k);
                        const label = field?.label || k;
                        return (
                          <Box key={k} sx={{ display: 'flex', gap: 1, mb: 0.25 }}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ minWidth: 100, flexShrink: 0 }}>{label}:</Typography>
                            <Typography variant="caption" color="text.primary">{String(v)}</Typography>
                          </Box>
                        );
                      })}
                    </Box>

                    {/* Action buttons for pending */}
                    {isPending && (
                      <Box>
                        {!isConverting ? (
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
                              onClick={() => setConvertForm({ subId: sub._id, title: '', priority: 'medium', status: 'todo' })}
                              sx={{ fontSize: '0.72rem', backgroundColor: '#22C55E', '&:hover': { backgroundColor: '#16A34A' }, borderRadius: 1.5, py: 0.5 }}
                            >
                              Create Task
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Archive sx={{ fontSize: 14 }} />}
                              onClick={() => handleUpdateStatus(sub._id, 'backlog')}
                              sx={{ fontSize: '0.72rem', borderColor: '#3B82F6', color: '#3B82F6', borderRadius: 1.5, py: 0.5 }}
                            >
                              Backlog
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Block sx={{ fontSize: 14 }} />}
                              onClick={() => handleUpdateStatus(sub._id, 'ignored')}
                              sx={{ fontSize: '0.72rem', borderColor: '#CBD5E1', color: '#94A3B8', borderRadius: 1.5, py: 0.5 }}
                            >
                              Ignore
                            </Button>
                          </Box>
                        ) : (
                          <Paper sx={{ p: 1.5, mt: 1, backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 2 }}>
                            <Typography variant="caption" fontWeight={700} color="#166534" mb={1} display="block">Create Task from this submission</Typography>
                            <Stack spacing={1}>
                              <TextField
                                label="Task Title"
                                value={convertForm.title}
                                onChange={e => setConvertForm(f => ({ ...f, title: e.target.value }))}
                                size="small"
                                fullWidth
                                placeholder="Enter task title..."
                                inputProps={{ style: { fontSize: '0.82rem' } }}
                              />
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <FormControl size="small" sx={{ flex: 1 }}>
                                  <InputLabel sx={{ fontSize: '0.8rem' }}>Priority</InputLabel>
                                  <Select value={convertForm.priority} label="Priority" onChange={e => setConvertForm(f => ({ ...f, priority: e.target.value }))} sx={{ fontSize: '0.82rem' }}>
                                    <MenuItem value="high">High</MenuItem>
                                    <MenuItem value="medium">Medium</MenuItem>
                                    <MenuItem value="low">Low</MenuItem>
                                  </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ flex: 1 }}>
                                  <InputLabel sx={{ fontSize: '0.8rem' }}>Status</InputLabel>
                                  <Select value={convertForm.status} label="Status" onChange={e => setConvertForm(f => ({ ...f, status: e.target.value }))} sx={{ fontSize: '0.82rem' }}>
                                    <MenuItem value="todo">To Do</MenuItem>
                                    <MenuItem value="in_progress">In Progress</MenuItem>
                                    <MenuItem value="planned">Planned</MenuItem>
                                  </Select>
                                </FormControl>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button size="small" variant="outlined" onClick={() => setConvertForm(null)} sx={{ borderRadius: 1.5, flex: 1, fontSize: '0.75rem' }}>Cancel</Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  disabled={converting || !convertForm.title.trim()}
                                  onClick={() => handleConvertToTask(sub._id)}
                                  sx={{ borderRadius: 1.5, flex: 1, fontSize: '0.75rem', backgroundColor: '#22C55E', '&:hover': { backgroundColor: '#16A34A' } }}
                                >
                                  {converting ? <CircularProgress size={14} sx={{ color: 'white' }} /> : 'Create Task'}
                                </Button>
                              </Box>
                            </Stack>
                          </Paper>
                        )}
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Stack>
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

            <FormControl fullWidth size="small">
              <InputLabel>Form Mode</InputLabel>
              <Select
                value={activeForm.mode || 'task'}
                label="Form Mode"
                onChange={e => setActiveForm(f => ({ ...f, mode: e.target.value }))}
              >
                <MenuItem value="task">Task Mode — auto-create task on submit</MenuItem>
                <MenuItem value="survey">Survey Mode — collect feedback, decide later</MenuItem>
              </Select>
            </FormControl>

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
                    {field.type === 'select' && (
                      <OptionsEditor
                        options={field.options || []}
                        onChange={opts => updateField(idx, 'options', opts)}
                      />
                    )}
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
