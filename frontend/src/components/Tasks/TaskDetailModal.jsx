import React, { useState, useEffect, useRef } from 'react';
import {
  Drawer, Box, Typography, TextField, MenuItem, Chip, Button,
  Avatar, IconButton, Checkbox, LinearProgress, Divider,
  AvatarGroup, Autocomplete, Tooltip,
} from '@mui/material';
import {
  Close, Delete, Add, AutoAwesome, OpenInNew, Send,
  Repeat, AccountTree, AccessTime, PlayArrow, Stop,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { updateTask, deleteTask, addComment } from '../../store/slices/taskSlice.js';
import { showSnackbar, startGlobalTimer, stopGlobalTimer } from '../../store/slices/uiSlice.js';
import { tasksAPI, usersAPI } from '../../services/api.js';
import api from '../../services/api.js';
import { format, formatDistanceToNow } from 'date-fns';

function fmtSeconds(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

// ── constants ─────────────────────────────────────────────────────────────────

const STATUSES = [
  { value: 'backlog',     label: 'Backlog',     color: '#CBD5E1' },
  { value: 'todo',        label: 'Todo',        color: '#94A3B8' },
  { value: 'planned',     label: 'Planned',     color: '#6366F1' },
  { value: 'in_progress', label: 'In Progress', color: '#3B82F6' },
  { value: 'testing',     label: 'Testing',     color: '#8B5CF6' },
  { value: 'review',      label: 'Review',      color: '#F59E0B' },
  { value: 'blocked',     label: 'Blocked',     color: '#EF4444' },
  { value: 'on_hold',     label: 'On Hold',     color: '#F97316' },
  { value: 'cancelled',   label: 'Cancelled',   color: '#9CA3AF' },
  { value: 'deployed',    label: 'Deployed',    color: '#14B8A6' },
  { value: 'done',        label: 'Done',        color: '#22C55E' },
];

const STATUS_ORDER = STATUSES.map(s => s.value);

const PRIORITIES = [
  { value: 'critical', label: 'Critical', dot: '#EF4444' },
  { value: 'high',     label: 'High',     dot: '#F97316' },
  { value: 'medium',   label: 'Medium',   dot: '#F59E0B' },
  { value: 'low',      label: 'Low',      dot: '#94A3B8' },
];

const TYPES = [
  { value: 'feature',    label: 'Feature',    emoji: '✨' },
  { value: 'bug',        label: 'Bug',        emoji: '🐛' },
  { value: 'research',   label: 'Research',   emoji: '🔬' },
  { value: 'design',     label: 'Design',     emoji: '🎨' },
  { value: 'planning',   label: 'Planning',   emoji: '📋' },
  { value: 'meeting',    label: 'Meeting',    emoji: '📅' },
  { value: 'review',     label: 'Review',     emoji: '👀' },
  { value: 'deployment', label: 'Deployment', emoji: '🚀' },
  { value: 'content',    label: 'Content',    emoji: '📝' },
  { value: 'testing',    label: 'Testing',    emoji: '🧪' },
  { value: 'other',      label: 'Other',      emoji: '📌' },
];

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#6366F1,#8B5CF6)',
  'linear-gradient(135deg,#3B82F6,#06B6D4)',
  'linear-gradient(135deg,#10B981,#059669)',
  'linear-gradient(135deg,#F59E0B,#EF4444)',
  'linear-gradient(135deg,#EC4899,#8B5CF6)',
];
const avatarGradient = (name = '') =>
  AVATAR_GRADIENTS[(name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];

// ── section header style ──────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
  <Typography sx={{
    fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: '#94A3B8', mb: 1.25,
  }}>
    {children}
  </Typography>
);

// ── property row ──────────────────────────────────────────────────────────────

const PropRow = ({ label, children }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 1, py: 0.5 }}>
    <Typography sx={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>{label}</Typography>
    <Box sx={{ fontSize: '0.88rem', fontWeight: 500 }}>{children}</Box>
  </Box>
);

// ── main component ────────────────────────────────────────────────────────────

export default function TaskDetailModal({ task, onClose, onUpdate }) {
  const dispatch    = useDispatch();
  const { t }       = useTranslation();
  const user        = useSelector(s => s.auth.user);
  const activeTimers = useSelector(s => s.ui.activeTimers);
  const activeTimer  = activeTimers.find(t => t.taskId === task?._id) || null;

  const [localTask, setLocalTask] = useState(task);
  const [comment,   setComment]   = useState('');
  const [saving,    setSaving]    = useState(false);
  const [users,     setUsers]     = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [allTasks,   setAllTasks]   = useState([]);

  // time tracking
  const [logTimeOpen,  setLogTimeOpen]  = useState(false);
  const [timeHours,    setTimeHours]    = useState('');
  const [timeNote,     setTimeNote]     = useState('');
  const [tick,         setTick]         = useState(0);  // forces re-render every second
  const tickRef = useRef(null);

  // derive timer state from Redux (survives drawer close/reopen)
  const timerRunning = activeTimer?.taskId === task?._id;
  const timerSeconds = timerRunning
    ? Math.floor((Date.now() - activeTimer.startedAt) / 1000)
    : 0;

  useEffect(() => {
    if (!task?._id) return;
    setLocalTask(task);
    usersAPI.getAll().then(res => setUsers(res.data || [])).catch(() => {});
    if (task?.project?._id || task?.project) {
      const projectId = task.project?._id || task.project;
      tasksAPI
        .getAll({ projectId })
        .then(res => setAllTasks((res.data || []).filter(t => t._id !== task._id)))
        .catch(() => {});
    }
    // fetch fresh task data so actualHours is always up-to-date
    api.get(`/tasks/${task._id}`).then(res => {
      const fresh = res.data?.data;
      if (fresh) setLocalTask(t => ({ ...t, actualHours: fresh.actualHours ?? t.actualHours }));
    }).catch(() => {});
  }, [task?._id]);

  // tick every second while timer is running for this task
  useEffect(() => {
    if (timerRunning) {
      tickRef.current = setInterval(() => setTick(t => t + 1), 1000);
    } else {
      clearInterval(tickRef.current);
    }
    return () => clearInterval(tickRef.current);
  }, [timerRunning]);

  const handleTimerStart = () => {
    dispatch(startGlobalTimer({ taskId: task._id, taskTitle: task.title, startedAt: Date.now() }));
  };

  const handleTimerStop = async () => {
    if (!activeTimer) return;
    const startedAt = activeTimer.startedAt;
    const endTime   = new Date();
    const elapsed   = Math.floor((endTime.getTime() - startedAt) / 1000);
    dispatch(stopGlobalTimer(task._id));
    if (elapsed < 5) return;
    // update display immediately before any network call
    const hours     = Math.round((elapsed / 3600) * 100) / 100;
    setLocalTask(p => {
      const newActual = Math.round(((p.actualHours || 0) + hours) * 100) / 100;
      return { ...p, actualHours: newActual };
    });
    try {
      await api.post('/time-entries', {
        task:        task._id,
        description: 'Timer entry',
        startTime:   new Date(startedAt),
        endTime,
        billable:    true,
      });
      dispatch(showSnackbar({ message: `Logged ${fmtSeconds(elapsed)}`, severity: 'success' }));
      onUpdate?.();
    } catch {
      dispatch(showSnackbar({ message: 'Failed to save time entry', severity: 'error' }));
    }
  };

  // ── helpers ─────────────────────────────────────────────────────────────────

  const updateField = async (field, value) => {
    setLocalTask(p => ({ ...p, [field]: value }));
    setSaving(true);
    await dispatch(updateTask({ id: task._id, data: { [field]: value } }));
    setSaving(false);
    onUpdate?.();
  };

  const handleDelete = async () => {
    await dispatch(deleteTask(task._id));
    dispatch(showSnackbar({ message: t('common.delete'), severity: 'info' }));
    onClose();
    onUpdate?.();
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    await dispatch(addComment({ id: task._id, content: comment }));
    setComment('');
    onUpdate?.();
  };

  const handleSubtask = async (subtaskId, done) => {
    await tasksAPI.updateSubtask(task._id, subtaskId, { status: done ? 'done' : 'pending' });
    setLocalTask(p => ({
      ...p,
      subtasks: p.subtasks.map(s =>
        s._id === subtaskId ? { ...s, status: done ? 'done' : 'pending' } : s,
      ),
    }));
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    try {
      const res = await tasksAPI.addSubtask(task._id, { title: newSubtask });
      setLocalTask(p => ({ ...p, subtasks: [...(p.subtasks || []), res.data] }));
      setNewSubtask('');
    } catch {}
  };

  const handleLogTime = async () => {
    const hrs = parseFloat(timeHours);
    if (!hrs || hrs <= 0) return;
    const newActual = (localTask.actualHours || 0) + hrs;
    setLocalTask(p => ({ ...p, actualHours: newActual }));
    await dispatch(updateTask({ id: task._id, data: { actualHours: newActual } }));
    setTimeHours('');
    setTimeNote('');
    setLogTimeOpen(false);
    onUpdate?.();
  };

  // ── derived values ───────────────────────────────────────────────────────────

  const subtasks          = localTask.subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.status === 'done').length;
  const timeEntries       = localTask.timeEntries || [];
  const estimated         = localTask.estimatedHours || 0;
  const actual            = localTask.actualHours    || 0;
  const timePercent       = estimated > 0 ? Math.min((actual / estimated) * 100, 100) : 0;

  const currentStatusIdx  = STATUS_ORDER.indexOf(localTask.status);
  const isOverdue = localTask.dueDate && new Date(localTask.dueDate) < new Date() && localTask.status !== 'done';

  const currentPriority = PRIORITIES.find(p => p.value === localTask.priority);
  const currentType     = TYPES.find(t => t.value === localTask.type);
  const projectName     = localTask.project?.name || null;

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <Drawer
      anchor="right"
      open={Boolean(task)}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', md: 640 },
          p: 0,
          boxShadow: '-4px 0 32px rgba(0,0,0,0.10)',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <Box sx={{
        px: 3, py: 2,
        borderBottom: '1px solid #F1F5F9',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        flexShrink: 0,
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Breadcrumb */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75, flexWrap: 'wrap' }}>
            {projectName && (
              <>
                <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 500 }}>
                  {projectName}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#CBD5E1' }}>/</Typography>
              </>
            )}
            {currentType && (
              <Chip
                label={`${currentType.emoji} ${currentType.label}`}
                size="small"
                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600, bgcolor: '#F1F5F9', color: '#64748B' }}
              />
            )}
            {localTask.aiGenerated && (
              <Chip
                size="small"
                icon={<AutoAwesome sx={{ fontSize: '10px !important' }} />}
                label="AI"
                sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#EEF2FF', color: '#6366F1', fontWeight: 700 }}
              />
            )}
          </Box>

          {/* Editable title */}
          <TextField
            fullWidth
            variant="standard"
            value={localTask.title}
            onChange={e => setLocalTask(p => ({ ...p, title: e.target.value }))}
            onBlur={e => updateField('title', e.target.value)}
            inputProps={{ style: { fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.3, color: '#0F172A' } }}
            sx={{
              '& .MuiInput-underline:before': { borderBottom: 'none' },
              '& .MuiInput-underline:hover:before': { borderBottom: '2px solid #E2E8F0' },
              '& .MuiInput-underline:after': { borderBottom: '2px solid #6366F1' },
            }}
          />
        </Box>

        {/* Right actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, pt: 0.5 }}>
          {saving && (
            <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', mr: 0.5 }}>saving...</Typography>
          )}
          <Tooltip title="Delete task">
            <IconButton size="small" onClick={handleDelete} sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEF2F2' } }}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton size="small" onClick={onClose} sx={{ color: '#64748B', '&:hover': { bgcolor: '#F1F5F9' } }}>
              <Close fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── SCROLLABLE BODY ─────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>

        {/* ── STATUS WORKFLOW BAR ────────────────────────────────────────────── */}
        <Box sx={{ mb: 3 }}>
          <SectionLabel>Status</SectionLabel>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {STATUSES.map((s, idx) => {
              const isActive = localTask.status === s.value;
              const isPast   = currentStatusIdx > idx;
              return (
                <Box
                  key={s.value}
                  onClick={() => updateField('status', s.value)}
                  sx={{
                    px: 1.5, py: 0.4,
                    borderRadius: '999px',
                    fontSize: '0.75rem', fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    userSelect: 'none',
                    ...(isActive
                      ? { bgcolor: s.color, color: '#fff', boxShadow: `0 0 0 3px ${s.color}30` }
                      : isPast
                        ? { bgcolor: `${s.color}22`, color: s.color, border: `1px solid ${s.color}44` }
                        : { bgcolor: '#F1F5F9', color: '#94A3B8', '&:hover': { bgcolor: '#E2E8F0', color: '#64748B' } }
                    ),
                  }}
                >
                  {s.label}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* ── PROPERTIES GRID ───────────────────────────────────────────────── */}
        <Box sx={{ mb: 3 }}>
          <SectionLabel>Properties</SectionLabel>
          <Box sx={{ border: '1px solid #F1F5F9', borderRadius: 2, px: 2, py: 1 }}>
            {/* Priority */}
            <PropRow label="Priority">
              <TextField
                select
                variant="standard"
                value={localTask.priority || ''}
                onChange={e => updateField('priority', e.target.value)}
                InputProps={{ disableUnderline: true }}
                sx={{ minWidth: 120, '& .MuiSelect-select': { py: 0 } }}
              >
                {PRIORITIES.map(p => (
                  <MenuItem key={p.value} value={p.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.dot, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{p.label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </PropRow>

            <Divider sx={{ my: 0.25, borderColor: '#F8FAFC' }} />

            {/* Type */}
            <PropRow label="Type">
              <TextField
                select
                variant="standard"
                value={localTask.type || ''}
                onChange={e => updateField('type', e.target.value)}
                InputProps={{ disableUnderline: true }}
                sx={{ minWidth: 140, '& .MuiSelect-select': { py: 0 } }}
              >
                {TYPES.map(tp => (
                  <MenuItem key={tp.value} value={tp.value}>
                    <Typography sx={{ fontSize: '0.85rem' }}>{tp.emoji} {tp.label}</Typography>
                  </MenuItem>
                ))}
              </TextField>
            </PropRow>

            <Divider sx={{ my: 0.25, borderColor: '#F8FAFC' }} />

            {/* Assignees */}
            <PropRow label="Assignees">
              <Autocomplete
                multiple
                size="small"
                options={users}
                getOptionLabel={u => u.name || u.email || ''}
                value={users.filter(u => (localTask.assignees || []).some(a => (a._id || a) === u._id))}
                onChange={(_, val) => updateField('assignees', val.map(v => v._id))}
                renderInput={params => (
                  <TextField {...params} variant="standard" placeholder="Add assignee…" InputProps={{ ...params.InputProps, disableUnderline: true }} />
                )}
                renderTags={(val, getTagProps) =>
                  val.map((u, i) => (
                    <Chip
                      key={u._id}
                      avatar={
                        <Avatar sx={{ background: avatarGradient(u.name), fontSize: '0.6rem' }}>
                          {u.name?.[0] || '?'}
                        </Avatar>
                      }
                      label={u.name?.split(' ')[0]}
                      size="small"
                      {...getTagProps({ index: i })}
                      sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                  ))
                }
                sx={{ '& .MuiInput-underline:before': { border: 'none' } }}
              />
            </PropRow>

            <Divider sx={{ my: 0.25, borderColor: '#F8FAFC' }} />

            {/* Due Date */}
            <PropRow label="Due Date">
              <TextField
                type="date"
                variant="standard"
                value={localTask.dueDate ? format(new Date(localTask.dueDate), 'yyyy-MM-dd') : ''}
                onChange={e => updateField('dueDate', e.target.value)}
                InputProps={{ disableUnderline: true }}
                inputProps={{
                  style: {
                    fontSize: '0.85rem', fontWeight: 500,
                    color: isOverdue ? '#EF4444' : 'inherit',
                    padding: 0,
                  },
                }}
                InputLabelProps={{ shrink: true }}
              />
            </PropRow>

            <Divider sx={{ my: 0.25, borderColor: '#F8FAFC' }} />

            {/* Start Date */}
            <PropRow label="Start Date">
              <TextField
                type="date"
                variant="standard"
                value={localTask.startDate ? format(new Date(localTask.startDate), 'yyyy-MM-dd') : ''}
                onChange={e => updateField('startDate', e.target.value)}
                InputProps={{ disableUnderline: true }}
                inputProps={{ style: { fontSize: '0.85rem', fontWeight: 500, padding: 0 } }}
                InputLabelProps={{ shrink: true }}
              />
            </PropRow>

            <Divider sx={{ my: 0.25, borderColor: '#F8FAFC' }} />

            {/* Estimated */}
            <PropRow label="Estimated">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TextField
                  type="number"
                  variant="standard"
                  value={localTask.estimatedHours || ''}
                  onChange={e => updateField('estimatedHours', parseFloat(e.target.value) || 0)}
                  InputProps={{ disableUnderline: true }}
                  inputProps={{ style: { fontSize: '0.85rem', fontWeight: 500, padding: 0, width: 60 } }}
                />
                <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8' }}>h</Typography>
              </Box>
            </PropRow>

            <Divider sx={{ my: 0.25, borderColor: '#F8FAFC' }} />

            {/* Actual Hours */}
            <PropRow label="Actual Hours">
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: actual > estimated && estimated > 0 ? '#EF4444' : 'inherit' }}>
                {actual > 0 ? `${actual}h` : '—'}
              </Typography>
            </PropRow>

            {projectName && (
              <>
                <Divider sx={{ my: 0.25, borderColor: '#F8FAFC' }} />
                <PropRow label="Project">
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#6366F1' }}>{projectName}</Typography>
                </PropRow>
              </>
            )}
          </Box>
        </Box>

        {/* ── DESCRIPTION ───────────────────────────────────────────────────── */}
        <Box sx={{ mb: 3 }}>
          <SectionLabel>Description</SectionLabel>
          <TextField
            fullWidth
            multiline
            minRows={2}
            placeholder="Add a description…"
            variant="outlined"
            value={localTask.description || ''}
            onChange={e => setLocalTask(p => ({ ...p, description: e.target.value }))}
            onBlur={e => updateField('description', e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.88rem',
                borderRadius: 2,
                bgcolor: '#FAFAFA',
                '& fieldset': { borderColor: '#F1F5F9' },
                '&:hover fieldset': { borderColor: '#CBD5E1' },
                '&.Mui-focused fieldset': { borderColor: '#6366F1' },
              },
            }}
          />
        </Box>

        {/* ── TIME TRACKING ─────────────────────────────────────────────────── */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTime sx={{ fontSize: 13, color: '#94A3B8' }} />
              <SectionLabel>Time Tracking</SectionLabel>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Live timer display */}
              {timerRunning && (
                <Typography sx={{
                  fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace',
                  color: '#6366F1', letterSpacing: '0.05em',
                  animation: 'pulse 1s ease-in-out infinite',
                  '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
                }}>
                  {fmtSeconds(timerSeconds)}
                </Typography>
              )}

              {/* Start / Stop button */}
              <Button
                size="small"
                variant={timerRunning ? 'contained' : 'outlined'}
                startIcon={timerRunning
                  ? <Stop sx={{ fontSize: '14px !important' }} />
                  : <PlayArrow sx={{ fontSize: '14px !important' }} />
                }
                onClick={timerRunning ? handleTimerStop : handleTimerStart}
                sx={{
                  fontSize: '0.72rem', fontWeight: 700, textTransform: 'none',
                  borderRadius: '8px',
                  ...(timerRunning
                    ? { bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' }, border: 'none' }
                    : { color: '#6366F1', borderColor: '#C7D2FE', '&:hover': { bgcolor: '#EEF2FF' } }
                  ),
                }}
              >
                {timerRunning ? 'Stop' : 'Start Timer'}
              </Button>

              {/* Manual log */}
              <Tooltip title="Log manual hours">
                <IconButton size="small" onClick={() => setLogTimeOpen(v => !v)}
                  sx={{ color: '#94A3B8', '&:hover': { color: '#6366F1', bgcolor: '#EEF2FF' } }}>
                  <Add sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Progress bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <LinearProgress
              variant="determinate"
              value={timePercent}
              sx={{
                flex: 1, height: 6, borderRadius: 3,
                bgcolor: '#F1F5F9',
                '& .MuiLinearProgress-bar': {
                  bgcolor: timePercent >= 100 ? '#EF4444' : '#6366F1',
                  borderRadius: 3,
                },
              }}
            />
            <Typography sx={{ fontSize: '0.75rem', color: '#64748B', whiteSpace: 'nowrap', fontWeight: 500 }}>
              {actual}h / {estimated > 0 ? `${estimated}h` : '—'}
            </Typography>
          </Box>

          {/* Inline log form */}
          {logTimeOpen && (
            <Box sx={{
              display: 'flex', gap: 1, alignItems: 'center',
              p: 1.5, border: '1px solid #E2E8F0', borderRadius: 2,
              bgcolor: '#F8FAFC', mb: 1.5, flexWrap: 'wrap',
            }}>
              <TextField
                type="number"
                size="small"
                placeholder="Hours"
                value={timeHours}
                onChange={e => setTimeHours(e.target.value)}
                sx={{ width: 90 }}
                inputProps={{ min: 0, step: 0.25 }}
              />
              <TextField
                size="small"
                placeholder="Note (optional)"
                value={timeNote}
                onChange={e => setTimeNote(e.target.value)}
                sx={{ flex: 1, minWidth: 120 }}
              />
              <Button
                size="small"
                variant="contained"
                disabled={!timeHours || parseFloat(timeHours) <= 0}
                onClick={handleLogTime}
                sx={{ bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' }, textTransform: 'none', fontWeight: 600 }}
              >
                Log
              </Button>
              <IconButton size="small" onClick={() => setLogTimeOpen(false)}>
                <Close fontSize="small" />
              </IconButton>
            </Box>
          )}

          {/* Time entries list */}
          {timeEntries.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {timeEntries.map((entry, i) => (
                <Box
                  key={entry._id || i}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 0.5 }}
                >
                  <Avatar
                    sx={{
                      width: 26, height: 26, fontSize: '0.65rem',
                      background: avatarGradient(entry.user?.name || ''),
                    }}
                  >
                    {entry.user?.name?.[0] || '?'}
                  </Avatar>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, flex: 1 }}>
                    {entry.user?.name || 'Unknown'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: '#6366F1', fontWeight: 700 }}>
                    {entry.hours}h
                  </Typography>
                  {entry.note && (
                    <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', maxWidth: 160 }} noWrap>
                      {entry.note}
                    </Typography>
                  )}
                  <Typography sx={{ fontSize: '0.72rem', color: '#CBD5E1' }}>
                    {entry.createdAt ? format(new Date(entry.createdAt), 'MMM d') : ''}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* ── SUBTASKS ──────────────────────────────────────────────────────── */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
            <SectionLabel>Subtasks</SectionLabel>
            <Chip
              label={`${completedSubtasks}/${subtasks.length}`}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#F1F5F9', color: '#64748B', mb: 1.25 }}
            />
          </Box>

          {subtasks.length > 0 && (
            <LinearProgress
              variant="determinate"
              value={subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0}
              sx={{
                height: 4, borderRadius: 2, mb: 1.5, bgcolor: '#F1F5F9',
                '& .MuiLinearProgress-bar': { bgcolor: '#22C55E', borderRadius: 2 },
              }}
            />
          )}

          {subtasks.length === 0 && (
            <Typography sx={{ fontSize: '0.82rem', color: '#CBD5E1', mb: 1 }}>No subtasks yet</Typography>
          )}

          {subtasks.map((subtask, i) => (
            <Box
              key={subtask._id || i}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, py: 0.25 }}
            >
              <Checkbox
                size="small"
                checked={subtask.status === 'done'}
                onChange={e => handleSubtask(subtask._id, e.target.checked)}
                sx={{ color: '#CBD5E1', '&.Mui-checked': { color: '#22C55E' }, p: 0.5 }}
              />
              <Typography
                sx={{
                  fontSize: '0.85rem', flex: 1,
                  textDecoration: subtask.status === 'done' ? 'line-through' : 'none',
                  color: subtask.status === 'done' ? '#CBD5E1' : '#0F172A',
                }}
              >
                {subtask.title}
              </Typography>
              <Chip
                label={subtask.status === 'done' ? 'Done' : 'Pending'}
                size="small"
                sx={{
                  height: 18, fontSize: '0.62rem', fontWeight: 600,
                  bgcolor: subtask.status === 'done' ? '#F0FDF4' : '#F1F5F9',
                  color: subtask.status === 'done' ? '#22C55E' : '#94A3B8',
                }}
              />
            </Box>
          ))}

          {/* Add subtask */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Add subtask…"
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.85rem', borderRadius: 1.5,
                  '& fieldset': { borderColor: '#E2E8F0' },
                },
              }}
            />
            <IconButton
              size="small"
              onClick={handleAddSubtask}
              disabled={!newSubtask.trim()}
              sx={{
                bgcolor: '#6366F1', color: 'white', borderRadius: 1.5,
                '&:hover': { bgcolor: '#4F46E5' },
                '&:disabled': { bgcolor: '#F1F5F9', color: '#CBD5E1' },
              }}
            >
              <Add fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* ── DEPENDENCIES ──────────────────────────────────────────────────── */}
        {allTasks.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.25 }}>
              <AccountTree sx={{ fontSize: 13, color: '#94A3B8' }} />
              <SectionLabel>Dependencies</SectionLabel>
            </Box>
            <Autocomplete
              multiple
              size="small"
              options={allTasks}
              getOptionLabel={o => o.title}
              value={allTasks.filter(t => (localTask.dependencies || []).some(d => (d._id || d) === t._id))}
              onChange={(_, val) => updateField('dependencies', val.map(v => v._id))}
              renderInput={params => (
                <TextField {...params} placeholder="Add dependency…" />
              )}
              renderTags={(val, getTagProps) =>
                val.map((t, i) => (
                  <Chip key={t._id} label={t.title} size="small" {...getTagProps({ index: i })} />
                ))
              }
            />
          </Box>
        )}

        {/* ── TOOLS (ai-generated) ──────────────────────────────────────────── */}
        {(localTask.tools || []).length > 0 && (
          <Box sx={{ mb: 3 }}>
            <SectionLabel>AI Tools</SectionLabel>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {localTask.tools.map((tool, i) => (
                <Chip
                  key={i}
                  label={tool.name}
                  size="small"
                  component="a"
                  href={tool.url ? `https://${tool.url}` : '#'}
                  target="_blank"
                  icon={<OpenInNew sx={{ fontSize: '11px !important' }} />}
                  clickable
                  sx={{ bgcolor: '#F0FDF4', color: '#15803D', fontWeight: 600, '& .MuiChip-icon': { color: '#15803D' } }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* ── RECURRING ─────────────────────────────────────────────────────── */}
        {localTask.recurring?.enabled && (
          <Box sx={{ mb: 3, p: 1.5, bgcolor: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Repeat sx={{ fontSize: 14, color: '#94A3B8' }} />
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>
                Recurring · {localTask.recurring.frequency || 'weekly'}
                {localTask.recurring.interval > 1 ? ` every ${localTask.recurring.interval}` : ''}
              </Typography>
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2, borderColor: '#F1F5F9' }} />

        {/* ── COMMENTS ──────────────────────────────────────────────────────── */}
        <Box sx={{ mb: 2 }}>
          <SectionLabel>Comments ({(localTask.comments || []).length})</SectionLabel>

          {(localTask.comments || []).length === 0 && (
            <Typography sx={{ fontSize: '0.82rem', color: '#CBD5E1', mb: 1.5 }}>No comments yet</Typography>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75, mb: 2 }}>
            {(localTask.comments || []).map((c, i) => (
              <Box key={c._id || i} sx={{ display: 'flex', gap: 1.25 }}>
                <Avatar
                  sx={{
                    width: 30, height: 30, fontSize: '0.72rem', flexShrink: 0,
                    background: avatarGradient(c.author?.name || ''),
                  }}
                >
                  {c.author?.name?.[0] || '?'}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline', mb: 0.4 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                      {c.author?.name || 'Unknown'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#CBD5E1' }}>
                      {c.createdAt
                        ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })
                        : ''}
                    </Typography>
                  </Box>
                  <Box sx={{
                    p: 1.25, bgcolor: '#F8FAFC',
                    border: '1px solid #F1F5F9',
                    borderRadius: '4px 12px 12px 12px',
                  }}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
                      {c.content}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Comment input */}
          <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-end' }}>
            <Avatar
              sx={{
                width: 30, height: 30, fontSize: '0.72rem', flexShrink: 0,
                background: avatarGradient(user?.name || ''),
              }}
            >
              {user?.name?.[0] || '?'}
            </Avatar>
            <TextField
              size="small"
              fullWidth
              placeholder="Write a comment… (Enter to send)"
              value={comment}
              onChange={e => setComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment()}
              multiline
              maxRows={4}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.85rem', borderRadius: 2,
                  '& fieldset': { borderColor: '#E2E8F0' },
                  '&:hover fieldset': { borderColor: '#CBD5E1' },
                  '&.Mui-focused fieldset': { borderColor: '#6366F1' },
                },
              }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    size="small"
                    onClick={handleComment}
                    disabled={!comment.trim()}
                    sx={{ color: '#6366F1', '&:disabled': { color: '#CBD5E1' } }}
                  >
                    <Send fontSize="small" />
                  </IconButton>
                ),
              }}
            />
          </Box>
        </Box>

      </Box>
    </Drawer>
  );
}
