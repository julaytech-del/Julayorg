import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, Checkbox, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  FormControlLabel, FormGroup, IconButton, InputAdornment,
  Skeleton, Switch, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography
} from '@mui/material';
import {
  Add, Check, Close, ContentCopy, Delete, Edit, FiberManualRecord,
  Http, InfoOutlined, Refresh, Send, Visibility, VisibilityOff, Webhook
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { format, formatDistanceToNow } from 'date-fns';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import { webhooksAPI } from '../../services/api.js';

const DARK_CARD = { bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };

const WEBHOOK_EVENTS = [
  { value: 'task.created',        label: 'Task Created',        desc: 'Fired when a new task is created' },
  { value: 'task.status_changed', label: 'Task Status Changed',  desc: 'Fired when a task status updates' },
  { value: 'task.assigned',       label: 'Task Assigned',        desc: 'Fired when a task is assigned to a user' },
  { value: 'task.completed',      label: 'Task Completed',       desc: 'Fired when a task is marked done' },
  { value: 'task.due_soon',       label: 'Task Due Soon',        desc: 'Fired 24h before task deadline' },
  { value: 'project.created',     label: 'Project Created',      desc: 'Fired when a new project is created' },
  { value: 'project.status_changed', label: 'Project Updated',   desc: 'Fired when project status changes' },
  { value: 'comment.added',       label: 'Comment Added',        desc: 'Fired when a comment is posted' },
  { value: 'member.added',        label: 'Member Added',         desc: 'Fired when a member joins a project' },
];

const DELIVERY_STATUS_COLORS = { success: '#10B981', failed: '#EF4444', pending: '#F59E0B' };

function generateSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function WebhookFormDialog({ open, onClose, webhook, onSave }) {
  const [form, setForm] = useState({ name: '', url: '', events: [], secret: generateSecret(), active: true });
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (webhook) {
      setForm({ name: webhook.name || '', url: webhook.url || '', events: webhook.events || [], secret: webhook.secret || generateSecret(), active: webhook.active ?? true });
    } else {
      setForm({ name: '', url: '', events: [], secret: generateSecret(), active: true });
    }
    setErrors({});
    setShowSecret(false);
  }, [webhook, open]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.url.trim()) errs.url = 'URL is required';
    else if (!/^https?:\/\/.+/.test(form.url)) errs.url = 'Must be a valid HTTP(S) URL';
    if (!form.events.length) errs.events = 'Select at least one event';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const toggleEvent = (ev) => {
    setForm(f => ({ ...f, events: f.events.includes(ev) ? f.events.filter(e => e !== ev) : [...f.events, ev] }));
    setErrors(e => ({ ...e, events: undefined }));
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(form.secret).catch(() => {});
  };

  const regenerateSecret = () => setForm(f => ({ ...f, secret: generateSecret() }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>{webhook ? 'Edit Webhook' : 'Add Webhook'}</Typography>
          <Typography variant="caption" color="text.secondary">Configure endpoint and event subscriptions</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <Close sx={{ fontSize: 16 }} />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          label="Webhook Name" size="small" fullWidth value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          error={!!errors.name} helperText={errors.name}
          placeholder="e.g. Slack Notifications"
          sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem' } }}
        />

        <TextField
          label="Payload URL" size="small" fullWidth value={form.url}
          onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
          error={!!errors.url} helperText={errors.url}
          placeholder="https://example.com/webhook"
          InputProps={{ startAdornment: <InputAdornment position="start"><Http sx={{ fontSize: 16, color: 'text.secondary' }} /></InputAdornment> }}
          sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem' } }}
        />

        {/* Secret */}
        <Box>
          <TextField
            label="Secret (HMAC-SHA256)" size="small" fullWidth value={form.secret}
            type={showSecret ? 'text' : 'password'}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Copy secret"><IconButton size="small" onClick={handleCopySecret}><ContentCopy sx={{ fontSize: 14 }} /></IconButton></Tooltip>
                  <Tooltip title={showSecret ? 'Hide' : 'Show'}><IconButton size="small" onClick={() => setShowSecret(v => !v)}>{showSecret ? <VisibilityOff sx={{ fontSize: 14 }} /> : <Visibility sx={{ fontSize: 14 }} />}</IconButton></Tooltip>
                  <Tooltip title="Regenerate"><IconButton size="small" onClick={regenerateSecret}><Refresh sx={{ fontSize: 14 }} /></IconButton></Tooltip>
                </InputAdornment>
              ),
              sx: { fontFamily: 'monospace', fontSize: '0.78rem' },
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75 }}>
            <InfoOutlined sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
              Use this secret to verify webhook signatures: <code style={{ color: '#A855F7' }}>X-Julay-Signature: sha256=HMAC(secret, payload)</code>
            </Typography>
          </Box>
        </Box>

        {/* Events */}
        <Box>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.66rem', display: 'block', mb: 1 }}>
            Subscribe to events
          </Typography>
          {errors.events && <Alert severity="error" sx={{ mb: 1, py: 0.5, fontSize: '0.78rem' }}>{errors.events}</Alert>}
          <FormGroup>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
              {WEBHOOK_EVENTS.map(ev => (
                <Tooltip key={ev.value} title={ev.desc} placement="top">
                  <FormControlLabel
                    control={<Checkbox checked={form.events.includes(ev.value)} onChange={() => toggleEvent(ev.value)} size="small" sx={{ '&.Mui-checked': { color: '#6366f1' }, py: 0.5 }} />}
                    label={<Typography variant="caption" sx={{ fontSize: '0.75rem' }}>{ev.label}</Typography>}
                    sx={{ ml: 0, mr: 0 }}
                  />
                </Tooltip>
              ))}
            </Box>
          </FormGroup>
          {form.events.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
              {form.events.map(ev => (
                <Chip key={ev} label={ev} size="small" onDelete={() => toggleEvent(ev)} sx={{ height: 18, fontSize: '0.62rem', bgcolor: 'rgba(99,102,241,0.12)', color: '#818CF8' }} />
              ))}
            </Box>
          )}
        </Box>

        <FormControlLabel
          control={<Switch checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} size="small" sx={{ '& .Mui-checked': { color: '#6366f1' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#6366f1' } }} />}
          label={<Typography variant="body2" sx={{ fontSize: '0.82rem' }}>Active</Typography>}
        />
      </DialogContent>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>Cancel</Button>
        <Button
          variant="contained" onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={12} color="inherit" /> : <Check sx={{ fontSize: 14 }} />}
          sx={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', fontWeight: 700, fontSize: '0.8rem', px: 2.5 }}
        >
          {saving ? 'Saving...' : (webhook ? 'Save Changes' : 'Create Webhook')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeliveryLogRow({ delivery }) {
  const statusColor = DELIVERY_STATUS_COLORS[delivery.status] || '#94A3B8';
  return (
    <TableRow hover sx={{ '& td': { borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.76rem', py: 1 }, '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <FiberManualRecord sx={{ fontSize: 8, color: statusColor }} />
          <Typography variant="caption" sx={{ color: statusColor, fontWeight: 700, fontSize: '0.72rem', textTransform: 'capitalize' }}>{delivery.status}</Typography>
        </Box>
      </TableCell>
      <TableCell><Chip label={delivery.event} size="small" sx={{ height: 18, fontSize: '0.62rem', bgcolor: 'rgba(99,102,241,0.12)', color: '#818CF8' }} /></TableCell>
      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.72rem', color: delivery.responseCode >= 400 ? '#EF4444' : 'text.secondary' }}>{delivery.responseCode || '—'}</TableCell>
      <TableCell sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>{delivery.duration ? `${delivery.duration}ms` : '—'}</TableCell>
      <TableCell sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>{delivery.createdAt ? formatDistanceToNow(new Date(delivery.createdAt), { addSuffix: true }) : '—'}</TableCell>
    </TableRow>
  );
}

export default function WebhooksPage() {
  const dispatch = useDispatch();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [expandedLogs, setExpandedLogs] = useState({});
  const [testingId, setTestingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadWebhooks = async () => {
    setLoading(true);
    try {
      const res = await webhooksAPI.getAll();
      setWebhooks(res?.data || res || []);
    } catch {
      dispatch(showSnackbar({ message: 'Failed to load webhooks', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWebhooks(); }, []);

  const handleOpenCreate = () => { setEditingWebhook(null); setDialogOpen(true); };
  const handleOpenEdit = (wh) => { setEditingWebhook(wh); setDialogOpen(true); };

  const handleSave = async (formData) => {
    try {
      if (editingWebhook) {
        const res = await webhooksAPI.update(editingWebhook._id, formData);
        setWebhooks(prev => prev.map(w => w._id === editingWebhook._id ? (res?.data || res || w) : w));
        dispatch(showSnackbar({ message: 'Webhook updated', severity: 'success' }));
      } else {
        const res = await webhooksAPI.create(formData);
        setWebhooks(prev => [...prev, res?.data || res]);
        dispatch(showSnackbar({ message: 'Webhook created', severity: 'success' }));
      }
      setDialogOpen(false);
    } catch {
      dispatch(showSnackbar({ message: 'Failed to save webhook', severity: 'error' }));
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await webhooksAPI.delete(id);
      setWebhooks(prev => prev.filter(w => w._id !== id));
      dispatch(showSnackbar({ message: 'Webhook deleted', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete webhook', severity: 'error' }));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (wh) => {
    try {
      const res = await webhooksAPI.update(wh._id, { ...wh, active: !wh.active });
      setWebhooks(prev => prev.map(w => w._id === wh._id ? { ...w, active: !w.active } : w));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to update webhook', severity: 'error' }));
    }
  };

  const handleTest = async (id) => {
    setTestingId(id);
    try {
      await webhooksAPI.test(id);
      dispatch(showSnackbar({ message: 'Test payload sent successfully', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Test delivery failed', severity: 'error' }));
    } finally {
      setTestingId(null);
    }
  };

  const toggleLogs = (id) => setExpandedLogs(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2.5, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Webhook sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Typography variant="h6" fontWeight={700}>Webhooks</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 7 }}>
            Receive real-time HTTP POST notifications when events happen in Julay
          </Typography>
        </Box>
        <Button
          variant="contained" startIcon={<Add sx={{ fontSize: 15 }} />}
          onClick={handleOpenCreate}
          sx={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', fontWeight: 700, fontSize: '0.8rem' }}
        >
          Add Webhook
        </Button>
      </Box>

      {/* HMAC Info Banner */}
      <Alert
        icon={<InfoOutlined sx={{ fontSize: 18 }} />}
        severity="info"
        sx={{ mb: 3, bgcolor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'text.primary', '& .MuiAlert-icon': { color: '#818CF8' } }}
      >
        <Typography variant="caption" sx={{ fontSize: '0.78rem' }}>
          All webhook payloads are signed with HMAC-SHA256. Verify the <code style={{ color: '#A855F7', background: 'rgba(168,85,247,0.1)', padding: '1px 5px', borderRadius: 3 }}>X-Julay-Signature</code> header: <code style={{ color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '1px 5px', borderRadius: 3 }}>sha256=HMAC(YOUR_SECRET, raw_payload_body)</code>
        </Typography>
      </Alert>

      {/* Webhooks List */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1,2,3].map(i => <Skeleton key={i} height={80} sx={{ borderRadius: 2 }} />)}
        </Box>
      ) : webhooks.length === 0 ? (
        <Card sx={{ ...DARK_CARD, p: 6, textAlign: 'center' }}>
          <Webhook sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="subtitle1" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>No webhooks configured</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Add your first webhook to start receiving real-time event notifications</Typography>
          <Button variant="contained" startIcon={<Add sx={{ fontSize: 15 }} />} onClick={handleOpenCreate} sx={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', fontWeight: 700 }}>
            Add Webhook
          </Button>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {webhooks.map(wh => (
            <Card key={wh._id} sx={{ ...DARK_CARD, overflow: 'hidden', transition: 'border-color 0.15s', ...(wh.active ? {} : { opacity: 0.65 }) }}>
              {/* Top bar */}
              <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 2, gap: 2, flexWrap: 'wrap' }}>
                {/* Status indicator */}
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: wh.active ? '#10B981' : '#64748B', flexShrink: 0, boxShadow: wh.active ? '0 0 6px rgba(16,185,129,0.5)' : 'none' }} />

                {/* Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ fontSize: '0.875rem' }}>{wh.name}</Typography>
                    {wh.active ? (
                      <Chip label="Active" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(16,185,129,0.12)', color: '#10B981' }} />
                    ) : (
                      <Chip label="Inactive" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(100,116,139,0.15)', color: '#64748B' }} />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Http sx={{ fontSize: 13, color: 'text.disabled' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.72rem' }} noWrap>{wh.url}</Typography>
                  </Box>
                </Box>

                {/* Events */}
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 340 }}>
                  {(wh.events || []).slice(0, 4).map(ev => (
                    <Chip key={ev} label={ev.split('.')[1]?.replace('_', ' ') || ev} size="small" sx={{ height: 18, fontSize: '0.62rem', bgcolor: 'rgba(99,102,241,0.1)', color: '#818CF8' }} />
                  ))}
                  {(wh.events || []).length > 4 && (
                    <Chip label={`+${(wh.events || []).length - 4}`} size="small" sx={{ height: 18, fontSize: '0.62rem', bgcolor: 'rgba(255,255,255,0.05)', color: 'text.secondary' }} />
                  )}
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
                  <Tooltip title={wh.active ? 'Disable' : 'Enable'}>
                    <Switch
                      size="small" checked={wh.active}
                      onChange={() => handleToggleActive(wh)}
                      sx={{ '& .Mui-checked': { color: '#6366f1' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#6366f1' } }}
                    />
                  </Tooltip>
                  <Tooltip title="Send test payload">
                    <IconButton
                      size="small" onClick={() => handleTest(wh._id)} disabled={testingId === wh._id}
                      sx={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1.5, color: '#10B981', '&:hover': { bgcolor: 'rgba(16,185,129,0.1)' } }}
                    >
                      {testingId === wh._id ? <CircularProgress size={12} color="inherit" /> : <Send sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleOpenEdit(wh)} sx={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(99,102,241,0.1)' } }}>
                      <Edit sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small" onClick={() => handleDelete(wh._id)} disabled={deletingId === wh._id}
                      sx={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1.5, color: '#EF4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }}
                    >
                      {deletingId === wh._id ? <CircularProgress size={12} color="inherit" /> : <Delete sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={expandedLogs[wh._id] ? 'Hide delivery log' : 'View delivery log'}>
                    <Button
                      size="small" onClick={() => toggleLogs(wh._id)}
                      variant={expandedLogs[wh._id] ? 'contained' : 'outlined'}
                      sx={{ fontSize: '0.68rem', height: 28, px: 1.25, ...(expandedLogs[wh._id] ? { bgcolor: 'rgba(99,102,241,0.2)', color: '#818CF8', border: 'none' } : { borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary' }) }}
                    >
                      Delivery Log
                    </Button>
                  </Tooltip>
                </Box>
              </Box>

              {/* Delivery Log */}
              {expandedLogs[wh._id] && (
                <>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                  <Box sx={{ bgcolor: '#0A0F1E' }}>
                    <Box sx={{ px: 2.5, py: 1.25, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.64rem' }}>
                        Recent Deliveries
                      </Typography>
                      <Button size="small" startIcon={<Refresh sx={{ fontSize: 11 }} />} sx={{ fontSize: '0.66rem', color: 'text.disabled', px: 1 }}>
                        Refresh
                      </Button>
                    </Box>
                    {!wh.deliveries?.length ? (
                      <Box sx={{ px: 2.5, pb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FiberManualRecord sx={{ fontSize: 10, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.72rem' }}>No deliveries yet — activate the webhook and trigger an event to see logs here</Typography>
                      </Box>
                    ) : (
                      <TableContainer sx={{ px: 1, pb: 1 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              {['Status', 'Event', 'Response', 'Duration', 'Time'].map(h => (
                                <TableCell key={h} sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', color: 'text.disabled', letterSpacing: '0.05em', py: 1 }}>{h}</TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(wh.deliveries || []).map((d, i) => <DeliveryLogRow key={i} delivery={d} />)}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                </>
              )}
            </Card>
          ))}
        </Box>
      )}

      {/* Form Dialog */}
      <WebhookFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        webhook={editingWebhook}
        onSave={handleSave}
      />
    </Box>
  );
}
