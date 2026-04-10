import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, FormControlLabel, Avatar, Tooltip, Divider, Chip
} from '@mui/material';
import { PlayArrow, Stop, Add, Delete, AccessTime, AttachMoney } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import api from '../../services/api.js';

export const timeEntriesAPI = {
  getForTask: (taskId) => api.get('/time-entries', { params: { taskId } }),
  create: (data) => api.post('/time-entries', data),
  delete: (id) => api.delete(`/time-entries/${id}`),
};

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatHours(seconds) {
  const h = (seconds / 3600).toFixed(1);
  return `${h}h`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function TimeTracker({ taskId }) {
  const user = useSelector(s => s.auth.user);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualBillable, setManualBillable] = useState(false);
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!taskId) return;
    setLoadingEntries(true);
    timeEntriesAPI.getForTask(taskId)
      .then(res => {
        const data = Array.isArray(res) ? res : (res?.data || []);
        setEntries(data);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoadingEntries(false));
  }, [taskId]);

  const startTimer = () => {
    setRunning(true);
    startTimeRef.current = Date.now() - elapsed * 1000;
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  const stopTimer = async () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    if (elapsed < 5) { setElapsed(0); return; }
    const duration = elapsed;
    setElapsed(0);
    try {
      const entry = await timeEntriesAPI.create({
        taskId,
        description: 'Timer session',
        duration,
        date: new Date().toISOString(),
        billable: false,
      });
      const newEntry = entry?.data || entry;
      if (newEntry?._id) setEntries(prev => [newEntry, ...prev]);
    } catch { /* silent */ }
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const handleManualSave = async () => {
    const h = parseInt(manualHours || '0', 10);
    const m = parseInt(manualMinutes || '0', 10);
    const totalSec = (h * 3600) + (m * 60);
    if (totalSec <= 0) return;
    setSaving(true);
    try {
      const entry = await timeEntriesAPI.create({
        taskId,
        description: manualDesc || 'Manual entry',
        duration: totalSec,
        date: new Date(manualDate).toISOString(),
        billable: manualBillable,
      });
      const newEntry = entry?.data || entry;
      if (newEntry?._id) setEntries(prev => [newEntry, ...prev]);
      setManualOpen(false);
      setManualHours('');
      setManualMinutes('');
      setManualDesc('');
      setManualBillable(false);
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await timeEntriesAPI.delete(id);
      setEntries(prev => prev.filter(e => e._id !== id));
    } catch { /* silent */ }
  };

  const totalSec = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const billableSec = entries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration || 0), 0);
  const recentEntries = entries.slice(0, 5);

  return (
    <Box>
      {/* Timer control */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 2 }}>
        <AccessTime sx={{ color: 'text.secondary', fontSize: 20 }} />
        <Typography fontWeight={700} fontSize="1.4rem" sx={{ fontFamily: 'monospace', letterSpacing: '0.05em', color: running ? '#6366f1' : 'text.primary', minWidth: 100 }}>
          {formatDuration(elapsed)}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          startIcon={running ? <Stop /> : <PlayArrow />}
          onClick={running ? stopTimer : startTimer}
          size="small"
          sx={{
            background: running ? '#EF4444' : 'linear-gradient(135deg, #6366f1, #a855f7)',
            fontWeight: 700, borderRadius: 2, textTransform: 'none', fontSize: '0.82rem',
            '&:hover': { opacity: 0.88 },
          }}
        >
          {running ? 'Stop' : 'Start'}
        </Button>
        <Button
          startIcon={<Add />}
          onClick={() => setManualOpen(true)}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600, borderRadius: 2, textTransform: 'none', fontSize: '0.82rem', borderWidth: '1.5px' }}
        >
          Log Time
        </Button>
      </Box>

      {/* Summary */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Chip
          icon={<AccessTime sx={{ fontSize: '14px !important' }} />}
          label={`${formatHours(totalSec)} logged`}
          size="small"
          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
        />
        {billableSec > 0 && (
          <Chip
            icon={<AttachMoney sx={{ fontSize: '14px !important' }} />}
            label={`${formatHours(billableSec)} billable`}
            size="small"
            color="success"
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          />
        )}
      </Box>

      {/* Entries list */}
      {!loadingEntries && recentEntries.length > 0 && (
        <Box>
          <Typography fontSize="0.75rem" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing="0.06em" mb={1}>
            Recent Entries
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {recentEntries.map(entry => {
              const isOwn = entry.user?._id === user?._id || entry.userId === user?._id;
              return (
                <Box key={entry._id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: 1.5, bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' }, transition: 'background 0.12s' }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem', bgcolor: '#6366f1', fontWeight: 700, flexShrink: 0 }}>
                    {(entry.user?.name || entry.userName || 'U')[0].toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontSize="0.8rem" fontWeight={600} noWrap color="text.primary">
                      {entry.description || 'Time entry'}
                    </Typography>
                    <Typography fontSize="0.7rem" color="text.secondary">
                      {entry.date ? formatDate(entry.date) : ''}
                      {entry.billable && <Box component="span" sx={{ color: '#10B981', ml: 0.75 }}>• billable</Box>}
                    </Typography>
                  </Box>
                  <Typography fontSize="0.8rem" fontWeight={700} color="text.primary" sx={{ flexShrink: 0, fontFamily: 'monospace' }}>
                    {formatHours(entry.duration || 0)}
                  </Typography>
                  {isOwn && (
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(entry._id)} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' }, opacity: 0.6, '&:hover': { opacity: 1 } }}>
                        <Delete sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {!loadingEntries && entries.length === 0 && (
        <Typography fontSize="0.82rem" color="text.secondary" textAlign="center" py={2}>
          No time logged yet. Start the timer or log manually.
        </Typography>
      )}

      {/* Manual log dialog */}
      <Dialog open={manualOpen} onClose={() => setManualOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Log Manual Time</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              label="Hours"
              type="number"
              value={manualHours}
              onChange={e => setManualHours(e.target.value)}
              inputProps={{ min: 0, max: 23 }}
              fullWidth
            />
            <TextField
              label="Minutes"
              type="number"
              value={manualMinutes}
              onChange={e => setManualMinutes(e.target.value)}
              inputProps={{ min: 0, max: 59 }}
              fullWidth
            />
          </Box>
          <TextField
            label="Description"
            value={manualDesc}
            onChange={e => setManualDesc(e.target.value)}
            placeholder="What did you work on?"
            fullWidth
          />
          <TextField
            label="Date"
            type="date"
            value={manualDate}
            onChange={e => setManualDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <FormControlLabel
            control={<Switch checked={manualBillable} onChange={e => setManualBillable(e.target.checked)} size="small" />}
            label={<Typography fontSize="0.875rem" fontWeight={600}>Billable</Typography>}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setManualOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleManualSave} disabled={saving || (!manualHours && !manualMinutes)}
            sx={{ textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 1.5 }}>
            {saving ? 'Saving...' : 'Save Entry'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
