import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Avatar, AvatarGroup,
  Button, IconButton, Select, MenuItem, FormControl, InputLabel,
  LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Drawer, List, ListItem, ListItemButton, ListItemText,
  Divider, Tooltip, Paper, Skeleton, CircularProgress, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Add, Close, PlayArrow, CheckCircle, FilterTiltShift,
  FlagOutlined, Speed, Event, Bolt, TrendingDown, FilterList,
  AccessTime, Person,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, isPast, parseISO } from 'date-fns';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import { projectsAPI, sprintsAPI, tasksAPI } from '../../services/api.js';

// ── constants ─────────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'planned',     label: 'Planned',     color: '#94A3B8', bg: '#F8FAFC' },
  { key: 'todo',        label: 'To Do',       color: '#6366F1', bg: '#EEF2FF' },
  { key: 'in_progress', label: 'In Progress', color: '#F59E0B', bg: '#FFFBEB' },
  { key: 'review',      label: 'Review',      color: '#8B5CF6', bg: '#F5F3FF' },
  { key: 'done',        label: 'Done',        color: '#10B981', bg: '#F0FDF4' },
];

const PRIORITY_CONFIG = {
  critical: { color: '#DC2626', label: 'Critical' },
  high:     { color: '#EF4444', label: 'High' },
  medium:   { color: '#F59E0B', label: 'Medium' },
  low:      { color: '#10B981', label: 'Low' },
};

const STATUS_CONFIG = {
  planning:  { color: '#6366F1', label: 'Planning' },
  active:    { color: '#10B981', label: 'Active' },
  completed: { color: '#94A3B8', label: 'Completed' },
  cancelled: { color: '#EF4444', label: 'Cancelled' },
};

let _projectsCache = null;

// ── task card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, index, onRemove, onClick }) {
  const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const assignees = Array.isArray(task.assignees) ? task.assignees : [];
  const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && task.status !== 'done';

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          elevation={snapshot.isDragging ? 8 : 0}
          onClick={() => onClick(task)}
          sx={{
            mb: 1, cursor: 'grab', borderRadius: 2,
            border: '1px solid',
            borderColor: snapshot.isDragging ? p.color : 'rgba(0,0,0,0.08)',
            borderLeft: `3px solid ${p.color}`,
            transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
            transition: 'box-shadow 0.15s, border-color 0.15s',
            '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.12)', borderColor: p.color },
            userSelect: 'none',
          }}
        >
          <CardContent sx={{ py: '10px !important', px: '12px !important' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
              <Typography variant="body2" fontWeight={600} sx={{ flex: 1, lineHeight: 1.35, mr: 0.5, fontSize: '0.82rem' }}>
                {task.title}
              </Typography>
              <Tooltip title="Remove from sprint">
                <IconButton
                  size="small"
                  onClick={e => { e.stopPropagation(); onRemove(task._id); }}
                  sx={{ p: 0.25, opacity: 0, '.MuiCard-root:hover &': { opacity: 1 }, transition: 'opacity 0.15s' }}
                >
                  <Close sx={{ fontSize: 13, color: 'text.disabled' }} />
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip
                label={p.label}
                size="small"
                sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: `${p.color}15`, color: p.color, border: `1px solid ${p.color}30` }}
              />
              {task.estimatedHours != null && (
                <Chip label={`${task.estimatedHours} pts`} size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem' }} />
              )}
              {isOverdue && (
                <Chip label="Overdue" size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 700 }} />
              )}
              {task.dueDate && !isOverdue && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 'auto' }}>
                  <AccessTime sx={{ fontSize: 11, color: 'text.disabled' }} />
                  <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
                    {format(parseISO(task.dueDate), 'MMM d')}
                  </Typography>
                </Box>
              )}
            </Box>

            {assignees.length > 0 && (
              <Box sx={{ mt: 0.75 }}>
                <AvatarGroup max={4} sx={{ justifyContent: 'flex-end', '& .MuiAvatar-root': { width: 20, height: 20, fontSize: '0.6rem', border: '1.5px solid white' } }}>
                  {assignees.map((a, i) => (
                    <Tooltip key={i} title={typeof a === 'object' ? a.name : a}>
                      <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                        {(typeof a === 'object' ? a.name : a)?.[0]?.toUpperCase()}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}

// ── kanban column ─────────────────────────────────────────────────────────────
function KanbanColumn({ column, tasks, onRemoveTask, onTaskClick }) {
  const pts = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
  return (
    <Box sx={{ flex: 1, minWidth: 210, maxWidth: 300 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5, px: 0.5 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: column.color }} />
        <Typography variant="body2" fontWeight={700} sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', flex: 1 }}>
          {column.label}
        </Typography>
        <Chip label={tasks.length} size="small" sx={{ height: 18, fontSize: '0.62rem', bgcolor: `${column.color}15`, color: column.color, fontWeight: 700 }} />
        {pts > 0 && <Chip label={`${pts}pt`} size="small" sx={{ height: 18, fontSize: '0.6rem', color: 'text.disabled' }} />}
      </Box>

      <Droppable droppableId={column.key}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              minHeight: 420, borderRadius: 2, p: 1,
              border: '2px dashed',
              borderColor: snapshot.isDraggingOver ? column.color : 'rgba(0,0,0,0.06)',
              bgcolor: snapshot.isDraggingOver ? `${column.color}08` : column.bg,
              transition: 'all 0.15s',
            }}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <Box sx={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.72rem' }}>Drop tasks here</Typography>
              </Box>
            )}
            {tasks.map((t, i) => (
              <TaskCard key={t._id} task={t} index={i} onRemove={onRemoveTask} onClick={onTaskClick} />
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Box>
  );
}

// ── create sprint dialog ──────────────────────────────────────────────────────
function CreateSprintDialog({ open, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({ name: '', goal: '', startDate: '', endDate: '', capacity: '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSubmit = () => { if (!form.name) return; onSubmit(form); setForm({ name: '', goal: '', startDate: '', endDate: '', capacity: '' }); };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={700}>Create Sprint</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <TextField label="Sprint Name *" value={form.name} onChange={set('name')} fullWidth size="small" />
        <TextField label="Sprint Goal" value={form.goal} onChange={set('goal')} fullWidth size="small" multiline rows={2} placeholder="What do we want to achieve this sprint?" />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField label="Start Date" type="date" value={form.startDate} onChange={set('startDate')} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          <TextField label="End Date"   type="date" value={form.endDate}   onChange={set('endDate')}   fullWidth size="small" InputLabelProps={{ shrink: true }} />
        </Box>
        <TextField label="Capacity (story points)" type="number" value={form.capacity} onChange={set('capacity')} fullWidth size="small" />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!form.name || loading}
          sx={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
          {loading ? <CircularProgress size={16} color="inherit" /> : 'Create Sprint'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── add tasks drawer ──────────────────────────────────────────────────────────
function AddToSprintDrawer({ open, onClose, projectId, sprintId, sprintTaskIds, onAdded }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const dispatch = useDispatch();

  useEffect(() => {
    if (!open || !projectId) return;
    setLoading(true);
    tasksAPI.getAll({ projectId })
      .then(res => {
        const all = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setTasks(all.filter(t => !sprintTaskIds.includes(t._id)));
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [open, projectId, sprintTaskIds]);

  const handleAdd = async (taskId) => {
    setAdding(taskId);
    try {
      await sprintsAPI.addTask(sprintId, taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      onAdded?.();
      dispatch(showSnackbar({ message: 'Task added to sprint', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to add task', severity: 'error' }));
    } finally {
      setAdding(null);
    }
  };

  const filtered = priorityFilter === 'all' ? tasks : tasks.filter(t => t.priority === priorityFilter);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 380 } }}>
      <Box sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="h6" fontWeight={700}>Add to Sprint</Typography>
          <IconButton size="small" onClick={onClose}><Close /></IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>Tasks from this project not yet in any sprint</Typography>

        <ToggleButtonGroup value={priorityFilter} exclusive onChange={(_, v) => v && setPriorityFilter(v)} size="small" sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
          {['all', 'critical', 'high', 'medium', 'low'].map(p => (
            <ToggleButton key={p} value={p} sx={{ fontSize: '0.68rem', px: 1, py: 0.3, textTransform: 'capitalize', borderRadius: '6px !important', border: '1px solid rgba(0,0,0,0.12) !important' }}>
              {p === 'all' ? 'All' : <><Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: PRIORITY_CONFIG[p]?.color, display: 'inline-block', mr: 0.5 }} />{p}</>}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            [1,2,3,4].map(i => <Skeleton key={i} height={52} sx={{ borderRadius: 2, mb: 0.5 }} />)
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 6, color: 'text.disabled' }}>
              <FlagOutlined sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body2">No tasks available</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filtered.map(t => {
                const p = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                return (
                  <ListItem key={t._id} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', borderLeft: `3px solid ${p.color}`, '&:hover': { borderColor: p.color } }}
                      onClick={() => handleAdd(t._id)}
                      disabled={adding === t._id}
                    >
                      <ListItemText
                        primary={t.title}
                        secondary={`${p.label} · ${t.estimatedHours || 0} pts`}
                        primaryTypographyProps={{ fontWeight: 600, fontSize: '0.82rem' }}
                        secondaryTypographyProps={{ fontSize: '0.7rem' }}
                      />
                      {adding === t._id
                        ? <CircularProgress size={16} />
                        : <Add sx={{ color: '#6366F1', fontSize: 20 }} />
                      }
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}

// ── burndown chart ────────────────────────────────────────────────────────────
function BurndownChart({ sprintId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sprintId) return;
    setLoading(true);
    sprintsAPI.getBurndown(sprintId)
      .then(res => setData(res?.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [sprintId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>;
  if (!data.length) return <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', py: 2 }}>No burndown data yet</Typography>;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => format(parseISO(d), 'MMM d')} />
        <YAxis tick={{ fontSize: 10 }} />
        <ReTooltip contentStyle={{ fontSize: 12 }} labelFormatter={d => format(parseISO(d), 'MMM d')} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="planned" stroke="#94A3B8" strokeDasharray="4 2" dot={false} name="Ideal" />
        <Line type="monotone" dataKey="actual"  stroke="#6366F1" strokeWidth={2}    dot={false} name="Actual" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function SprintBoard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [projects, setProjects]       = useState(_projectsCache || []);
  const [sprints, setSprints]         = useState([]);
  const [selectedProject, setSelectedProject] = useState(_projectsCache?.[0]?._id || '');
  const [selectedSprint, setSelectedSprint]   = useState('');
  const [sprintTasks, setSprintTasks] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(!_projectsCache);
  const [loadingSprints, setLoadingSprints]   = useState(false);
  const [loadingTasks, setLoadingTasks]       = useState(false);
  const [createOpen, setCreateOpen]   = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [showBurndown, setShowBurndown] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // load projects
  useEffect(() => {
    projectsAPI.getAll()
      .then(res => {
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        _projectsCache = list;
        setProjects(list);
        if (list.length > 0 && !selectedProject) setSelectedProject(list[0]._id);
      })
      .catch(() => {})
      .finally(() => setLoadingProjects(false));
  }, []);

  // load sprints
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

  const loadSprintTasks = useCallback(async (sprintId) => {
    if (!sprintId) { setSprintTasks([]); return; }
    setLoadingTasks(true);
    try {
      const res = await sprintsAPI.getOne(sprintId);
      const tasks = res?.data?.tasks || res?.tasks || [];
      setSprintTasks(Array.isArray(tasks) ? tasks : []);
    } catch { setSprintTasks([]); }
    finally { setLoadingTasks(false); }
  }, []);

  useEffect(() => { loadSprintTasks(selectedSprint); }, [selectedSprint, loadSprintTasks]);

  const currentSprint = sprints.find(s => s._id === selectedSprint);
  const isPlanning = currentSprint?.status === 'planning';
  const isActive   = currentSprint?.status === 'active';

  // filter tasks
  const visibleTasks = sprintTasks.filter(t => {
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (assigneeFilter !== 'all') {
      const ids = (t.assignees || []).map(a => typeof a === 'object' ? a._id : a);
      if (!ids.includes(assigneeFilter)) return false;
    }
    return true;
  });

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = visibleTasks.filter(t => (t.status || 'todo') === col.key);
    return acc;
  }, {});

  const totalTasks = sprintTasks.length;
  const doneTasks  = sprintTasks.filter(t => t.status === 'done').length;
  const totalPts   = sprintTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
  const donePts    = sprintTasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.estimatedHours || 0), 0);
  const pct        = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const days       = currentSprint?.endDate ? Math.ceil((new Date(currentSprint.endDate) - new Date()) / 86400000) : null;
  const capacity   = currentSprint?.capacity || totalPts;
  const capacityPct = capacity > 0 ? Math.round((donePts / capacity) * 100) : 0;

  // unique assignees for filter
  const allAssignees = [...new Map(
    sprintTasks.flatMap(t => (t.assignees || []).map(a => [typeof a === 'object' ? a._id : a, a]))
  ).values()];

  // drag & drop
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId;
    setUpdatingStatus(draggableId);

    // optimistic update
    setSprintTasks(prev => prev.map(t => t._id === draggableId ? { ...t, status: newStatus } : t));

    try {
      await tasksAPI.updateStatus(draggableId, newStatus);
    } catch {
      // rollback
      setSprintTasks(prev => prev.map(t => t._id === draggableId ? { ...t, status: source.droppableId } : t));
      dispatch(showSnackbar({ message: 'Failed to update task status', severity: 'error' }));
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCreateSprint = async (form) => {
    if (!selectedProject) return;
    setCreateLoading(true);
    try {
      const res = await sprintsAPI.create({ ...form, project: selectedProject, capacity: form.capacity ? Number(form.capacity) : undefined });
      const s = res?.data || res;
      setSprints(prev => [...prev, s]);
      setSelectedSprint(s._id);
      setCreateOpen(false);
      dispatch(showSnackbar({ message: 'Sprint created!', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to create sprint', severity: 'error' }));
    } finally { setCreateLoading(false); }
  };

  const handleStartSprint = async () => {
    if (!currentSprint) return;
    try {
      await sprintsAPI.update(currentSprint._id, { status: 'active' });
      setSprints(prev => prev.map(s => s._id === currentSprint._id ? { ...s, status: 'active' } : s));
      dispatch(showSnackbar({ message: 'Sprint started!', severity: 'success' }));
    } catch { dispatch(showSnackbar({ message: 'Failed to start sprint', severity: 'error' })); }
  };

  const handleCompleteSprint = async () => {
    if (!currentSprint) return;
    try {
      await sprintsAPI.update(currentSprint._id, { status: 'completed' });
      setSprints(prev => prev.map(s => s._id === currentSprint._id ? { ...s, status: 'completed' } : s));
      dispatch(showSnackbar({ message: 'Sprint completed! 🎉', severity: 'success' }));
    } catch { dispatch(showSnackbar({ message: 'Failed to complete sprint', severity: 'error' })); }
  };

  const handleRemoveTask = async (taskId) => {
    try {
      await sprintsAPI.removeTask(selectedSprint, taskId);
      setSprintTasks(prev => prev.filter(t => t._id !== taskId));
      dispatch(showSnackbar({ message: 'Task removed from sprint', severity: 'success' }));
    } catch { dispatch(showSnackbar({ message: 'Failed to remove task', severity: 'error' })); }
  };

  const handleTaskClick = (task) => {
    navigate(`/dashboard/projects/${task.project?._id || task.project}`);
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
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<Add />} onClick={() => setCreateOpen(true)} sx={{ borderColor: '#6366F1', color: '#6366F1', borderRadius: 2 }}>
            New Sprint
          </Button>
          {currentSprint && (
            <Button variant="outlined" startIcon={<Add />} onClick={() => setDrawerOpen(true)} sx={{ borderColor: '#8B5CF6', color: '#8B5CF6', borderRadius: 2 }}>
              Add Tasks
            </Button>
          )}
          {currentSprint && (
            <Button
              variant="outlined"
              startIcon={<TrendingDown />}
              onClick={() => setShowBurndown(v => !v)}
              sx={{ borderColor: showBurndown ? '#10B981' : 'divider', color: showBurndown ? '#10B981' : 'text.secondary', borderRadius: 2 }}
            >
              Burndown
            </Button>
          )}
          {isPlanning && (
            <Button variant="contained" startIcon={<PlayArrow />} onClick={handleStartSprint}
              sx={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', borderRadius: 2 }}>
              Start Sprint
            </Button>
          )}
          {isActive && (
            <Button variant="contained" startIcon={<CheckCircle />} onClick={handleCompleteSprint}
              sx={{ background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: 2 }}>
              Complete Sprint
            </Button>
          )}
        </Box>
      </Box>

      {/* Selectors */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Project</InputLabel>
          <Select value={selectedProject} label="Project" onChange={e => setSelectedProject(e.target.value)} disabled={loadingProjects}>
            {loadingProjects ? <MenuItem value="">Loading…</MenuItem> : projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Sprint</InputLabel>
          <Select value={selectedSprint} label="Sprint" onChange={e => setSelectedSprint(e.target.value)} disabled={loadingSprints || !selectedProject}>
            {loadingSprints ? <MenuItem value="">Loading…</MenuItem> :
              sprints.length === 0 ? <MenuItem value="" disabled>No sprints — create one</MenuItem> :
              sprints.map(s => (
                <MenuItem key={s._id} value={s._id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {s.name}
                    <Chip label={STATUS_CONFIG[s.status]?.label || s.status} size="small"
                      sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700, bgcolor: `${STATUS_CONFIG[s.status]?.color}15`, color: STATUS_CONFIG[s.status]?.color }} />
                  </Box>
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        {/* Filters */}
        {currentSprint && sprintTasks.length > 0 && (
          <>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select value={priorityFilter} label="Priority" onChange={e => setPriorityFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
              </Select>
            </FormControl>
            {allAssignees.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Assignee</InputLabel>
                <Select value={assigneeFilter} label="Assignee" onChange={e => setAssigneeFilter(e.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  {allAssignees.map(a => {
                    const id = typeof a === 'object' ? a._id : a;
                    const name = typeof a === 'object' ? a.name : a;
                    return <MenuItem key={id} value={id}>{name}</MenuItem>;
                  })}
                </Select>
              </FormControl>
            )}
          </>
        )}
      </Box>

      {/* Sprint header card */}
      {currentSprint && (
        <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(139,92,246,0.06))' }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Typography variant="h6" fontWeight={700}>{currentSprint.name}</Typography>
                  <Chip
                    label={STATUS_CONFIG[currentSprint.status]?.label || currentSprint.status}
                    size="small"
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${STATUS_CONFIG[currentSprint.status]?.color}15`, color: STATUS_CONFIG[currentSprint.status]?.color }}
                  />
                </Box>
                {currentSprint.goal && <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>{currentSprint.goal}</Typography>}
                {currentSprint.startDate && currentSprint.endDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Event sx={{ fontSize: 13, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.disabled">
                      {format(parseISO(currentSprint.startDate), 'MMM d')} – {format(parseISO(currentSprint.endDate), 'MMM d, yyyy')}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {[
                  { icon: Bolt,   label: 'Velocity',     value: `${donePts} pts` },
                  { icon: Speed,  label: 'Capacity Used', value: `${capacityPct}%` },
                  { icon: Event,  label: 'Days Left',    value: days !== null ? (days <= 0 ? 'Ended' : `${days}d`) : '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <Box key={label} sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', mb: 0.25 }}>
                      <Icon sx={{ fontSize: 14, color: '#6366F1' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</Typography>
                    </Box>
                    <Typography fontWeight={700} fontSize="1rem" color={label === 'Days Left' && days !== null && days <= 2 ? '#EF4444' : 'text.primary'}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ mb: 0.75 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">{doneTasks} / {totalTasks} tasks completed</Typography>
                <Typography variant="caption" fontWeight={700} color={pct === 100 ? '#10B981' : 'text.secondary'}>{pct}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate" value={pct}
                sx={{ height: 8, borderRadius: 4, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { background: pct === 100 ? 'linear-gradient(90deg,#10B981,#059669)' : 'linear-gradient(90deg, #6366F1, #8B5CF6)', borderRadius: 4 } }}
              />
            </Box>

            {showBurndown && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem', display: 'block', mb: 1 }}>
                  Burndown Chart
                </Typography>
                <BurndownChart sprintId={selectedSprint} />
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Board */}
      {loadingTasks ? (
        <Box sx={{ display: 'flex', gap: 2 }}>
          {COLUMNS.map(c => <Skeleton key={c.key} variant="rectangular" sx={{ flex: 1, height: 400, borderRadius: 2 }} />)}
        </Box>
      ) : !selectedSprint ? (
        <Box sx={{ textAlign: 'center', py: 12 }}>
          <FilterTiltShift sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
          <Typography color="text.secondary" variant="h6" fontWeight={600}>Select a sprint to view the board</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}
            sx={{ mt: 2, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', borderRadius: 2 }}>
            Create First Sprint
          </Button>
        </Box>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, alignItems: 'flex-start' }}>
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.key}
                column={col}
                tasks={tasksByStatus[col.key] || []}
                onRemoveTask={handleRemoveTask}
                onTaskClick={handleTaskClick}
              />
            ))}
          </Box>
        </DragDropContext>
      )}

      {updatingStatus && (
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, bgcolor: '#1E293B', color: 'white', px: 2, py: 1, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <CircularProgress size={14} sx={{ color: '#6366F1' }} />
          <Typography variant="caption">Updating status…</Typography>
        </Box>
      )}

      <CreateSprintDialog open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreateSprint} loading={createLoading} />
      <AddToSprintDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        projectId={selectedProject}
        sprintId={selectedSprint}
        sprintTaskIds={sprintTasks.map(t => t._id)}
        onAdded={() => loadSprintTasks(selectedSprint)}
      />
    </Box>
  );
}
