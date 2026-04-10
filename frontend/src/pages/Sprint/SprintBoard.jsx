import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Avatar, AvatarGroup,
  Button, IconButton, Select, MenuItem, FormControl, InputLabel,
  LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Drawer, List, ListItem, ListItemText, ListItemButton,
  Divider, Tooltip, Paper, Skeleton, Badge,
} from '@mui/material';
import {
  Add, Close, PlayArrow, CheckCircle, FilterTiltShift,
  FlagOutlined, PersonOutline, Speed, Event, Bolt,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import { projectsAPI, sprintsAPI, tasksAPI } from '../../services/api.js';

// ── constants ──────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'backlog',     label: 'Backlog',     color: '#94A3B8' },
  { key: 'todo',        label: 'To Do',       color: '#6366F1' },
  { key: 'in_progress', label: 'In Progress', color: '#F59E0B' },
  { key: 'review',      label: 'Review',      color: '#8B5CF6' },
  { key: 'done',        label: 'Done',        color: '#10B981' },
];

const PRIORITY_COLORS = { high: '#EF4444', medium: '#F59E0B', low: '#10B981', urgent: '#DC2626' };

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
const daysRemaining = (end) => {
  if (!end) return null;
  const diff = Math.ceil((new Date(end) - new Date()) / 86400000);
  return diff;
};

// ── task card ──────────────────────────────────────────────────────────────
function TaskCard({ task, onRemove }) {
  const assignees = Array.isArray(task.assignees) ? task.assignees : task.assignee ? [task.assignee] : [];
  return (
    <Card elevation={0} sx={{ mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderColor: '#6366F1' }, transition: 'all 0.15s' }}>
      <CardContent sx={{ py: '10px !important', px: '12px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
          <Typography variant="body2" fontWeight={600} sx={{ flex: 1, lineHeight: 1.3, mr: 1 }}>{task.title}</Typography>
          {onRemove && (
            <Tooltip title="Remove from sprint">
              <IconButton size="small" onClick={() => onRemove(task._id)} sx={{ p: 0.25 }}>
                <Close sx={{ fontSize: 14, color: 'text.disabled' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
          {task.priority && (
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: PRIORITY_COLORS[task.priority] || '#94A3B8', flexShrink: 0 }} />
          )}
          {task.estimatedHours != null && (
            <Chip label={`${task.estimatedHours} pts`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
          )}
          {assignees.length > 0 && (
            <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 18, height: 18, fontSize: '0.55rem', border: '1px solid white' } }}>
              {assignees.map((a, i) => (
                <Tooltip key={i} title={typeof a === 'object' ? a.name : a}>
                  <Avatar sx={{ width: 18, height: 18, fontSize: '0.55rem', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                    {(typeof a === 'object' ? a.name : a)?.[0]?.toUpperCase()}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// ── kanban column ──────────────────────────────────────────────────────────
function KanbanColumn({ column, tasks, onRemoveTask }) {
  return (
    <Box sx={{ flex: 1, minWidth: 200, maxWidth: 280 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, px: 0.5 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: column.color }} />
        <Typography variant="body2" fontWeight={700} sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.72rem' }}>
          {column.label}
        </Typography>
        <Chip label={tasks.length} size="small" sx={{ height: 18, fontSize: '0.65rem', ml: 'auto' }} />
      </Box>
      <Box sx={{ minHeight: 400, backgroundColor: '#F8FAFC', borderRadius: 2, p: 1, border: '1px solid', borderColor: 'divider' }}>
        {tasks.length === 0 ? (
          <Box sx={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="caption" color="text.disabled">No tasks</Typography>
          </Box>
        ) : tasks.map(t => <TaskCard key={t._id} task={t} onRemove={onRemoveTask} />)}
      </Box>
    </Box>
  );
}

// ── create sprint dialog ───────────────────────────────────────────────────
function CreateSprintDialog({ open, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({ name: '', goal: '', startDate: '', endDate: '', capacity: '' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSubmit = () => { onSubmit(form); setForm({ name: '', goal: '', startDate: '', endDate: '', capacity: '' }); };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Create Sprint</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <TextField label="Sprint Name" value={form.name} onChange={set('name')} fullWidth required />
        <TextField label="Sprint Goal" value={form.goal} onChange={set('goal')} fullWidth multiline rows={2} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField label="Start Date" type="date" value={form.startDate} onChange={set('startDate')} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="End Date"   type="date" value={form.endDate}   onChange={set('endDate')}   fullWidth InputLabelProps={{ shrink: true }} />
        </Box>
        <TextField label="Capacity (hours)" type="number" value={form.capacity} onChange={set('capacity')} fullWidth />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!form.name || loading}
          sx={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
          {loading ? 'Creating…' : 'Create Sprint'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── add to sprint drawer ───────────────────────────────────────────────────
function AddToSprintDrawer({ open, onClose, projectId, sprintId, onAdded }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!open || !projectId) return;
    setLoading(true);
    tasksAPI.getAll({ projectId, sprint: 'none' })
      .then(res => setTasks(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [open, projectId]);

  const handleAdd = async (taskId) => {
    try {
      await sprintsAPI.addTask(sprintId, taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      onAdded?.();
      dispatch(showSnackbar({ message: 'Task added to sprint', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to add task', severity: 'error' }));
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 360 } }}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>Add to Sprint</Typography>
          <IconButton onClick={onClose}><Close /></IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Tasks not yet in any sprint</Typography>
        {loading ? <Skeleton height={40} count={5} /> : tasks.length === 0 ? (
          <Typography color="text.disabled" sx={{ textAlign: 'center', mt: 4 }}>No unassigned tasks</Typography>
        ) : (
          <List disablePadding>
            {tasks.map(t => (
              <ListItem key={t._id} disablePadding>
                <ListItemButton onClick={() => handleAdd(t._id)} sx={{ borderRadius: 1.5, mb: 0.5 }}>
                  <ListItemText primary={t.title} secondary={t.priority} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.85rem' }} />
                  <Add sx={{ color: '#6366F1' }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
}

// ── simple SVG burndown ────────────────────────────────────────────────────
function BurndownMini({ total, done }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ flex: 1 }}>
        <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, backgroundColor: '#E2E8F0', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #6366F1, #10B981)', borderRadius: 3 } }} />
      </Box>
      <Typography variant="caption" fontWeight={600} color="text.secondary">{pct}%</Typography>
    </Box>
  );
}

// ── main ───────────────────────────────────────────────────────────────────
export default function SprintBoard() {
  const dispatch = useDispatch();
  const [projects, setProjects]       = useState([]);
  const [sprints, setSprints]         = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSprint, setSelectedSprint]   = useState('');
  const [sprintTasks, setSprintTasks] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingSprints, setLoadingSprints]   = useState(false);
  const [loadingTasks, setLoadingTasks]       = useState(false);
  const [createOpen, setCreateOpen]   = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [drawerOpen, setDrawerOpen]   = useState(false);

  // load projects
  useEffect(() => {
    projectsAPI.getAll()
      .then(res => {
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setProjects(list);
        if (list.length > 0) setSelectedProject(list[0]._id);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
  }, []);

  // load sprints when project changes
  useEffect(() => {
    if (!selectedProject) return;
    setLoadingSprints(true);
    sprintsAPI.getAll({ projectId: selectedProject })
      .then(res => {
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setSprints(list);
        const active = list.find(s => s.status === 'active');
        setSelectedSprint(active?._id || list[0]?._id || '');
      })
      .catch(() => setSprints([]))
      .finally(() => setLoadingSprints(false));
  }, [selectedProject]);

  // load tasks for sprint
  useEffect(() => {
    if (!selectedSprint) { setSprintTasks([]); return; }
    setLoadingTasks(true);
    tasksAPI.getAll({ sprintId: selectedSprint })
      .then(res => setSprintTasks(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []))
      .catch(() => setSprintTasks([]))
      .finally(() => setLoadingTasks(false));
  }, [selectedSprint]);

  const currentSprint = sprints.find(s => s._id === selectedSprint);
  const isActive = currentSprint?.status === 'active';

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = sprintTasks.filter(t => (t.status || 'todo') === col.key);
    return acc;
  }, {});

  const totalTasks = sprintTasks.length;
  const doneTasks  = sprintTasks.filter(t => t.status === 'done').length;
  const days       = currentSprint ? daysRemaining(currentSprint.endDate) : null;
  const velocity   = doneTasks > 0 ? sprintTasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.estimatedHours || 0), 0) : 0;
  const capacity   = currentSprint?.capacity || sprintTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);

  const handleCreateSprint = async (form) => {
    if (!selectedProject) return;
    setCreateLoading(true);
    try {
      const res = await sprintsAPI.create({ ...form, projectId: selectedProject });
      const newSprint = res?.data || res;
      setSprints(prev => [...prev, newSprint]);
      setSelectedSprint(newSprint._id);
      setCreateOpen(false);
      dispatch(showSnackbar({ message: 'Sprint created!', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to create sprint', severity: 'error' }));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCompleteSprint = async () => {
    if (!currentSprint) return;
    try {
      await sprintsAPI.update(currentSprint._id, { status: 'completed' });
      setSprints(prev => prev.map(s => s._id === currentSprint._id ? { ...s, status: 'completed' } : s));
      dispatch(showSnackbar({ message: 'Sprint completed!', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to complete sprint', severity: 'error' }));
    }
  };

  const handleRemoveTask = async (taskId) => {
    if (!selectedSprint) return;
    try {
      await sprintsAPI.removeTask(selectedSprint, taskId);
      setSprintTasks(prev => prev.filter(t => t._id !== taskId));
      dispatch(showSnackbar({ message: 'Task removed from sprint', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to remove task', severity: 'error' }));
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Sprint Board
          </Typography>
          <Typography color="text.secondary" variant="body2">Agile sprint management</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<Add />} onClick={() => setCreateOpen(true)} sx={{ borderColor: '#6366F1', color: '#6366F1' }}>New Sprint</Button>
          {currentSprint && (
            <Button variant="outlined" startIcon={<Add />} onClick={() => setDrawerOpen(true)} sx={{ borderColor: '#8B5CF6', color: '#8B5CF6' }}>Add Tasks</Button>
          )}
          {isActive && (
            <Button variant="contained" startIcon={<CheckCircle />} onClick={handleCompleteSprint}
              sx={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>Complete Sprint</Button>
          )}
        </Box>
      </Box>

      {/* Selectors */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Project</InputLabel>
          <Select value={selectedProject} label="Project" onChange={e => setSelectedProject(e.target.value)} disabled={loadingProjects}>
            {loadingProjects ? <MenuItem value="">Loading…</MenuItem> : projects.map(p => (
              <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Sprint</InputLabel>
          <Select value={selectedSprint} label="Sprint" onChange={e => setSelectedSprint(e.target.value)} disabled={loadingSprints || !selectedProject}>
            {loadingSprints ? <MenuItem value="">Loading…</MenuItem> :
              sprints.length === 0 ? <MenuItem value="" disabled>No sprints — create one</MenuItem> :
              sprints.map(s => (
                <MenuItem key={s._id} value={s._id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {s.name}
                    {s.status === 'active' && <Chip label="Active" size="small" color="success" sx={{ height: 18, fontSize: '0.65rem' }} />}
                  </Box>
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Box>

      {/* Sprint header */}
      {currentSprint && (
        <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>{currentSprint.name}</Typography>
                {currentSprint.goal && <Typography variant="body2" color="text.secondary">{currentSprint.goal}</Typography>}
                <Typography variant="caption" color="text.disabled">
                  {formatDate(currentSprint.startDate)} – {formatDate(currentSprint.endDate)}
                </Typography>
              </Box>
              {isActive && <Chip icon={<PlayArrow />} label="Active Sprint" color="success" size="small" />}
            </Box>
            <BurndownMini total={totalTasks} done={doneTasks} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {doneTasks} / {totalTasks} tasks completed
            </Typography>

            {/* Sprint stats */}
            <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
              {[
                { label: 'Velocity',       value: `${velocity} pts`,       icon: Bolt },
                { label: 'Capacity Used',  value: `${Math.round(capacity > 0 ? (velocity / capacity) * 100 : 0)}%`, icon: Speed },
                { label: 'Days Remaining', value: days != null ? `${Math.max(0, days)} days` : '—', icon: Event },
              ].map(({ label, value, icon: Icon }) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon sx={{ fontSize: 16, color: '#6366F1' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
                    <Typography variant="body2" fontWeight={700}>{value}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Kanban board */}
      {loadingTasks ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : !selectedSprint ? (
        <Box sx={{ textAlign: 'center', py: 12 }}>
          <FilterTiltShift sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
          <Typography color="text.secondary">Select a project and sprint to view the board</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)} sx={{ mt: 2, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
            Create First Sprint
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
          {COLUMNS.map(col => (
            <KanbanColumn key={col.key} column={col} tasks={tasksByStatus[col.key] || []} onRemoveTask={handleRemoveTask} />
          ))}
        </Box>
      )}

      {/* Dialogs */}
      <CreateSprintDialog open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreateSprint} loading={createLoading} />
      <AddToSprintDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} projectId={selectedProject} sprintId={selectedSprint} onAdded={() => {
        if (selectedSprint) {
          tasksAPI.getAll({ sprintId: selectedSprint })
            .then(res => setSprintTasks(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []))
            .catch(() => {});
        }
      }} />
    </Box>
  );
}
