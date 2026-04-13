import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Select, FormControl, InputLabel, IconButton, Tooltip, LinearProgress,
  Divider, Avatar,
} from '@mui/material';
import {
  PlayArrow, Stop, Add, Delete, AccessTime, AttachMoney, CalendarToday,
  BarChart, Timer,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import api from '../../services/api.js';

function fmt(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function fmtMins(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function TimeTrackingPage() {
  const dispatch = useDispatch();

  // Timer state
  const [running, setRunning]       = useState(false);
  const [seconds, setSeconds]       = useState(0);
  const [timerTask, setTimerTask]   = useState('');
  const [timerDesc, setTimerDesc]   = useState('');
  const timerRef                    = useRef(null);
  const startedAt                   = useRef(null);

  // Data
  const [entries, setEntries]       = useState([]);
  const [tasks, setTasks]           = useState([]);
  const [report, setReport]         = useState(null);
  const [loading, setLoading]       = useState(true);

  // Manual entry dialog
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ taskId: '', description: '', startTime: '', endTime: '', billable: true });
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [entriesRes, tasksRes, reportRes] = await Promise.allSettled([
        api.get('/time-entries'),
        api.get('/tasks?limit=100'),
        api.get('/time-entries/my-report'),
      ]);
      if (entriesRes.status === 'fulfilled') setEntries(entriesRes.value?.data?.data || entriesRes.value?.data || []);
      if (tasksRes.status === 'fulfilled')   setTasks(tasksRes.value?.data?.data || tasksRes.value?.data || []);
      if (reportRes.status === 'fulfilled')  setReport(reportRes.value?.data?.data || null);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  // Timer tick
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  const handleStart = () => {
    if (!timerTask) { dispatch(showSnackbar({ message: 'Please select a task first', severity: 'warning' })); return; }
    startedAt.current = new Date();
    setSeconds(0);
    setRunning(true);
  };

  const handleStop = async () => {
    setRunning(false);
    if (seconds < 10) { setSeconds(0); return; }
    try {
      await api.post('/time-entries', {
        task: timerTask,
        description: timerDesc || 'Timer entry',
        startTime: startedAt.current,
        endTime: new Date(),
        billable: true,
      });
      dispatch(showSnackbar({ message: `Logged ${fmt(seconds)}`, severity: 'success' }));
      setSeconds(0);
      setTimerDesc('');
      loadData();
    } catch {
      dispatch(showSnackbar({ message: 'Failed to save time entry', severity: 'error' }));
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/time-entries/${id}`);
      setEntries(e => e.filter(x => x._id !== id));
      dispatch(showSnackbar({ message: 'Entry deleted', severity: 'info' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete entry', severity: 'error' }));
    }
  };

  const handleManualSave = async () => {
    if (!manualForm.taskId || !manualForm.startTime || !manualForm.endTime) {
      dispatch(showSnackbar({ message: 'Please fill in all required fields', severity: 'warning' }));
      return;
    }
    setSaving(true);
    try {
      await api.post('/time-entries', {
        task: manualForm.taskId,
        description: manualForm.description || 'Manual entry',
        startTime: new Date(manualForm.startTime),
        endTime: new Date(manualForm.endTime),
        billable: manualForm.billable,
      });
      dispatch(showSnackbar({ message: 'Time entry added', severity: 'success' }));
      setManualOpen(false);
      setManualForm({ taskId: '', description: '', startTime: '', endTime: '', billable: true });
      loadData();
    } catch {
      dispatch(showSnackbar({ message: 'Failed to add entry', severity: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const totalMins = Array.isArray(report) ? report.reduce((sum, r) => sum + (r.totalMinutes || 0), 0) : 0;
  const billableMins = Array.isArray(report) ? report.reduce((sum, r) => sum + (r.billableMinutes || 0), 0) : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Timer sx={{ color: '#6366F1' }} /> Time Tracking
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>Log and manage your work time</Typography>
        </Box>
        <Button variant="outlined" startIcon={<Add />} onClick={() => setManualOpen(true)} sx={{ borderRadius: 2 }}>
          Add Manual Entry
        </Button>
      </Box>

      {/* Stats Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,1fr)' }, gap: 2, mb: 3 }}>
        {[
          { icon: <AccessTime sx={{ color: '#6366F1' }} />, label: 'Total Logged', value: fmtMins(totalMins), color: '#6366F1' },
          { icon: <AttachMoney sx={{ color: '#10B981' }} />, label: 'Billable Time', value: fmtMins(billableMins), color: '#10B981' },
          { icon: <CalendarToday sx={{ color: '#F59E0B' }} />, label: 'Tasks Tracked', value: Array.isArray(report) ? report.length : 0, color: '#F59E0B' },
          { icon: <BarChart sx={{ color: '#8B5CF6' }} />, label: "Today's Entries", value: entries.filter(e => new Date(e.createdAt).toDateString() === new Date().toDateString()).length, color: '#8B5CF6' },
        ].map(s => (
          <Card key={s.label} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>{s.icon}<Typography variant="body2" color="text.secondary">{s.label}</Typography></Box>
              <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Timer */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: running ? '#6366F1' : 'divider', borderRadius: 2, mb: 3, transition: 'border-color 0.3s' }}>
        <CardContent>
          <Typography fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Timer fontSize="small" sx={{ color: '#6366F1' }} /> Live Timer
            {running && <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Select Task</InputLabel>
              <Select value={timerTask} onChange={e => setTimerTask(e.target.value)} label="Select Task" disabled={running}>
                {tasks.map(t => <MenuItem key={t._id} value={t._id}>{t.title}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="Description (optional)" value={timerDesc} onChange={e => setTimerDesc(e.target.value)} disabled={running} sx={{ flex: 1, minWidth: 180 }} />
            <Typography sx={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 800, color: running ? '#6366F1' : 'text.primary', minWidth: 110 }}>
              {fmt(seconds)}
            </Typography>
            {!running ? (
              <Button variant="contained" startIcon={<PlayArrow />} onClick={handleStart}
                sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 2, px: 3 }}>
                Start
              </Button>
            ) : (
              <Button variant="contained" color="error" startIcon={<Stop />} onClick={handleStop}
                sx={{ borderRadius: 2, px: 3 }}>
                Stop & Save
              </Button>
            )}
          </Box>
          {running && <LinearProgress sx={{ mt: 2, borderRadius: 1, '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#6366F1,#8B5CF6)' } }} />}
        </CardContent>
      </Card>

      {/* Entries List */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent>
          <Typography fontWeight={700} sx={{ mb: 2 }}>Recent Time Entries</Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : entries.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Timer sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No time entries yet. Start the timer or add a manual entry.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {entries.map((entry, i) => (
                <React.Fragment key={entry._id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, px: 1, borderRadius: 1.5, '&:hover': { background: 'action.hover' } }}>
                    <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', fontSize: '0.8rem' }}>
                      {entry.user?.name?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={600} noWrap sx={{ fontSize: '0.9rem' }}>{entry.task?.title || 'Unknown task'}</Typography>
                      <Typography variant="caption" color="text.secondary">{entry.description}</Typography>
                    </Box>
                    <Chip
                      label={fmtMins(entry.duration || 0)}
                      size="small"
                      sx={{ fontWeight: 700, background: 'rgba(99,102,241,0.1)', color: '#6366F1', minWidth: 60 }}
                    />
                    {entry.billable && <Chip label="Billable" size="small" color="success" variant="outlined" sx={{ fontSize: '0.68rem' }} />}
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90, textAlign: 'right' }}>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </Typography>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(entry._id)} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {i < entries.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Manual Entry Dialog */}
      <Dialog open={manualOpen} onClose={() => setManualOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Add Manual Time Entry</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Task *</InputLabel>
            <Select value={manualForm.taskId} onChange={e => setManualForm(f => ({ ...f, taskId: e.target.value }))} label="Task *">
              {tasks.map(t => <MenuItem key={t._id} value={t._id}>{t.title}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Description" value={manualForm.description} onChange={e => setManualForm(f => ({ ...f, description: e.target.value }))} fullWidth />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Start Time *" type="datetime-local" value={manualForm.startTime} onChange={e => setManualForm(f => ({ ...f, startTime: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="End Time *" type="datetime-local" value={manualForm.endTime} onChange={e => setManualForm(f => ({ ...f, endTime: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
          </Box>
          <FormControl fullWidth>
            <InputLabel>Billable</InputLabel>
            <Select value={manualForm.billable} onChange={e => setManualForm(f => ({ ...f, billable: e.target.value }))} label="Billable">
              <MenuItem value={true}>Yes - Billable</MenuItem>
              <MenuItem value={false}>No - Non-billable</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setManualOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleManualSave} disabled={saving}
            sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
            {saving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Save Entry'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
