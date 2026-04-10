import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, Switch, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Stack, Alert, CircularProgress, Divider, Tooltip } from '@mui/material';
import { Add, Delete, Edit, PlayArrow, FlashOn, Bolt } from '@mui/icons-material';
import { automationsAPI } from '../../services/api.js';

const TRIGGER_EVENTS = [
  { value: 'task.created', label: 'Task Created' },
  { value: 'task.status_changed', label: 'Task Status Changed' },
  { value: 'task.due_soon', label: 'Task Due Soon (48h)' },
  { value: 'task.overdue', label: 'Task Overdue' },
  { value: 'task.assigned', label: 'Task Assigned' },
  { value: 'project.created', label: 'Project Created' },
];

const ACTION_TYPES = [
  { value: 'notify_user', label: 'Send Notification' },
  { value: 'change_status', label: 'Change Status' },
  { value: 'add_comment', label: 'Add Comment' },
  { value: 'create_subtask', label: 'Create Subtask' },
];

const STATUS_OPTIONS = ['todo', 'in_progress', 'review', 'done', 'blocked'];

const defaultRule = {
  name: '',
  trigger: { event: 'task.status_changed', conditions: [] },
  actions: [{ type: 'notify_user', params: { message: '' } }],
};

export default function AutomationsPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultRule);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try { const res = await automationsAPI.getAll(); setRules(res.data || []); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(defaultRule); setError(''); setOpen(true); };
  const openEdit = (r) => { setEditing(r._id); setForm({ name: r.name, trigger: r.trigger, actions: r.actions }); setError(''); setOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { setError('Rule name is required'); return; }
    setSaving(true);
    try {
      if (editing) await automationsAPI.update(editing, form);
      else await automationsAPI.create(form);
      setOpen(false); load();
    } catch (e) { setError(e.message || 'Save failed'); }
    setSaving(false);
  };

  const toggle = async (id) => {
    await automationsAPI.toggle(id);
    setRules(prev => prev.map(r => r._id === id ? { ...r, active: !r.active } : r));
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this automation?')) return;
    await automationsAPI.delete(id);
    setRules(prev => prev.filter(r => r._id !== id));
  };

  const updateAction = (idx, field, val) => {
    setForm(f => {
      const actions = [...f.actions];
      actions[idx] = { ...actions[idx], params: { ...actions[idx].params, [field]: val } };
      return { ...f, actions };
    });
  };

  const setActionType = (idx, type) => {
    setForm(f => {
      const actions = [...f.actions];
      actions[idx] = { type, params: {} };
      return { ...f, actions };
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Automations</Typography>
          <Typography variant="body2" color="text.secondary">Set trigger-based rules to automate your workflow</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 2 }}>
          New Rule
        </Button>
      </Box>

      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box> :
        rules.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8, p: 6, border: '2px dashed #E2E8F0', borderRadius: 3 }}>
            <Bolt sx={{ fontSize: 56, color: '#CBD5E1', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={600}>No Automation Rules</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Create rules to automate repetitive tasks</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 2 }}>
              Create First Rule
            </Button>
          </Box>
        ) : (
          <Stack spacing={2}>
            {rules.map(rule => (
              <Card key={rule._id} sx={{ borderRadius: 2, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', opacity: rule.active ? 1 : 0.6, transition: 'all 0.2s' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, background: rule.active ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FlashOn sx={{ color: rule.active ? 'white' : '#94A3B8', fontSize: 18 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={600} fontSize="0.9rem">{rule.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                      <Chip label={`When: ${TRIGGER_EVENTS.find(e => e.value === rule.trigger?.event)?.label || rule.trigger?.event}`} size="small" sx={{ fontSize: '0.7rem', backgroundColor: '#EEF2FF', color: '#4F46E5' }} />
                      {rule.actions?.map((a, i) => (
                        <Chip key={i} label={ACTION_TYPES.find(t => t.value === a.type)?.label || a.type} size="small" sx={{ fontSize: '0.7rem', backgroundColor: '#F0FDF4', color: '#16A34A' }} />
                      ))}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                    <Typography variant="caption" color="text.secondary">{rule.runCount || 0} runs</Typography>
                    <Tooltip title={rule.active ? 'Disable' : 'Enable'}>
                      <Switch checked={rule.active} onChange={() => toggle(rule._id)} size="small" color="primary" />
                    </Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(rule)}><Edit sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={() => remove(rule._id)} sx={{ color: '#EF4444' }}><Delete sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )
      }

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Edit Automation Rule' : 'New Automation Rule'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Rule Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth size="small" />
            <FormControl fullWidth size="small">
              <InputLabel>Trigger Event</InputLabel>
              <Select value={form.trigger.event} label="Trigger Event" onChange={e => setForm(f => ({ ...f, trigger: { ...f.trigger, event: e.target.value } }))}>
                {TRIGGER_EVENTS.map(ev => <MenuItem key={ev.value} value={ev.value}>{ev.label}</MenuItem>)}
              </Select>
            </FormControl>
            <Divider><Typography variant="caption" color="text.secondary">ACTIONS</Typography></Divider>
            {form.actions.map((action, idx) => (
              <Box key={idx} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                  <InputLabel>Action Type</InputLabel>
                  <Select value={action.type} label="Action Type" onChange={e => setActionType(idx, e.target.value)}>
                    {ACTION_TYPES.map(a => <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>)}
                  </Select>
                </FormControl>
                {action.type === 'notify_user' && (
                  <TextField label="Notification Message" value={action.params.message || ''} onChange={e => updateAction(idx, 'message', e.target.value)} fullWidth size="small" multiline rows={2} />
                )}
                {action.type === 'change_status' && (
                  <FormControl fullWidth size="small">
                    <InputLabel>New Status</InputLabel>
                    <Select value={action.params.status || ''} label="New Status" onChange={e => updateAction(idx, 'status', e.target.value)}>
                      {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                  </FormControl>
                )}
                {action.type === 'add_comment' && (
                  <TextField label="Comment Text" value={action.params.comment || ''} onChange={e => updateAction(idx, 'comment', e.target.value)} fullWidth size="small" multiline rows={2} />
                )}
                {action.type === 'create_subtask' && (
                  <TextField label="Subtask Title" value={action.params.title || ''} onChange={e => updateAction(idx, 'title', e.target.value)} fullWidth size="small" />
                )}
              </Box>
            ))}
            <Button size="small" startIcon={<Add />} onClick={() => setForm(f => ({ ...f, actions: [...f.actions, { type: 'notify_user', params: { message: '' } }] }))} sx={{ alignSelf: 'flex-start' }}>
              Add Action
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={save} variant="contained" disabled={saving} sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 2 }}>
            {saving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Save Rule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
