import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Avatar, AvatarGroup,
  CircularProgress, LinearProgress, IconButton, Button, Tooltip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel, Autocomplete,
} from '@mui/material';
import {
  Add, KeyboardDoubleArrowUp, KeyboardArrowUp, Remove, KeyboardArrowDown,
  CheckCircle, Warning, AccessTime, TrendingUp, CalendarToday,
  Refresh, Close,
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell, Tooltip as RTooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LTooltip,
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api.js';
import TaskDetailModal from '../../components/Tasks/TaskDetailModal.jsx';
import { showSnackbar } from '../../store/slices/uiSlice.js';

// ── Column config ─────────────────────────────────────────────────────────────
const COLUMNS = [
  { id: 'backlog',     label: 'Backlog',     color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', statuses: ['backlog'],       defaultStatus: 'backlog' },
  { id: 'todo',        label: 'To Do',       color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE', statuses: ['todo','planned'], defaultStatus: 'todo' },
  { id: 'in_progress', label: 'In Progress', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', statuses: ['in_progress'],   defaultStatus: 'in_progress' },
  { id: 'testing',     label: 'Testing',     color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8', statuses: ['testing'],       defaultStatus: 'testing' },
  { id: 'review',      label: 'Review',      color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', statuses: ['review'],        defaultStatus: 'review' },
  { id: 'blocked',     label: 'Blocked',     color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', statuses: ['blocked'],       defaultStatus: 'blocked' },
  { id: 'on_hold',     label: 'On Hold',     color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', statuses: ['on_hold'],       defaultStatus: 'on_hold' },
  { id: 'done',        label: 'Done',        color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', statuses: ['done','deployed','cancelled'], defaultStatus: 'done' },
];

const ALL_STATUSES = [
  { value: 'backlog',     label: 'Backlog' },
  { value: 'todo',        label: 'To Do' },
  { value: 'planned',     label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'testing',     label: 'Testing' },
  { value: 'review',      label: 'Review' },
  { value: 'blocked',     label: 'Blocked' },
  { value: 'on_hold',     label: 'On Hold' },
  { value: 'cancelled',   label: 'Cancelled' },
  { value: 'deployed',    label: 'Deployed' },
  { value: 'done',        label: 'Done' },
];

const ALL_PRIORITIES = [
  { value: 'critical', label: 'Critical' },
  { value: 'high',     label: 'High' },
  { value: 'medium',   label: 'Medium' },
  { value: 'low',      label: 'Low' },
];

// ── Priority config ───────────────────────────────────────────────────────────
const PRIORITY = {
  critical: { color: '#DC2626', label: 'Critical', Icon: KeyboardDoubleArrowUp },
  high:     { color: '#EA580C', label: 'High',     Icon: KeyboardArrowUp },
  medium:   { color: '#D97706', label: 'Medium',   Icon: Remove },
  low:      { color: '#65A30D', label: 'Low',      Icon: KeyboardArrowDown },
};
const PIE_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#22C55E'];

function avatarColor(name = '') {
  const p = ['#6366F1','#8B5CF6','#EC4899','#3B82F6','#10B981','#F59E0B','#EF4444'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return p[Math.abs(h) % p.length];
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onClick }) {
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && !['done','deployed','cancelled'].includes(task.status);
  const subs    = task.subtasks || [];
  const done    = subs.filter(s => s.status === 'done').length;
  const pct     = subs.length > 0 ? Math.round((done / subs.length) * 100) : 0;
  const pMeta   = PRIORITY[task.priority] || PRIORITY.medium;
  const PIcon   = pMeta.Icon;

  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: 'white', borderRadius: 2, p: 1.5, mb: 1.25,
        border: '1px solid #E2E8F0', cursor: 'pointer',
        transition: 'all 0.15s',
        '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)', transform: 'translateY(-1px)', borderColor: '#C7D2FE' },
        ...(overdue ? { borderLeft: '3px solid #EF4444', bgcolor: '#FFFAFA' } : {}),
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, flex: 1, lineHeight: 1.35, color: overdue ? '#DC2626' : '#0F172A' }}>
          {task.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 1, flexShrink: 0,
          color: pMeta.color, bgcolor: `${pMeta.color}15`, borderRadius: 1, px: 0.5, py: 0.1 }}>
          <PIcon sx={{ fontSize: 13 }} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: pMeta.color }}>{pMeta.label}</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: '0.6rem', border: '1.5px solid white' } }}>
          {(task.assignees || []).map((a, i) => (
            <Avatar key={i} sx={{ background: avatarColor(a.name || '') }}>
              {(a.name || '?')[0].toUpperCase()}
            </Avatar>
          ))}
        </AvatarGroup>
        {task.dueDate && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <CalendarToday sx={{ fontSize: 11, color: overdue ? '#EF4444' : '#94A3B8' }} />
            <Typography sx={{ fontSize: '0.68rem', color: overdue ? '#EF4444' : '#94A3B8', fontWeight: overdue ? 700 : 400 }}>
              {format(new Date(task.dueDate), 'MMM d')}
            </Typography>
          </Box>
        )}
      </Box>

      {(task.tags || []).length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
          {task.tags.slice(0, 2).map(tag => (
            <Chip key={tag} label={tag} size="small"
              sx={{ height: 18, fontSize: '0.62rem', bgcolor: '#F1F5F9', color: '#64748B' }} />
          ))}
        </Box>
      )}

      {subs.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography sx={{ fontSize: '0.62rem', color: '#94A3B8' }}>{done}/{subs.length} subtasks</Typography>
            <Typography sx={{ fontSize: '0.62rem', color: '#94A3B8' }}>{pct}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={pct} sx={{ height: 3, borderRadius: 2, bgcolor: '#F1F5F9',
            '& .MuiLinearProgress-bar': { bgcolor: pct === 100 ? '#10B981' : '#6366F1' } }} />
        </Box>
      )}
    </Box>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, flex: 1 }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mb: 0.5 }}>{label}</Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color, lineHeight: 1 }}>{value}</Typography>
            {sub && <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mt: 0.5 }}>{sub}</Typography>}
          </Box>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon sx={{ color, fontSize: 22 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

const BLANK_FORM = { title: '', status: 'todo', priority: 'medium', dueDate: '', assignees: [], project: '' };

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ExecutionBoard() {
  const dispatch  = useDispatch();
  const currentUser = useSelector(s => s.auth.user);
  const [tasks,       setTasks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [dlgOpen,     setDlgOpen]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [form,        setForm]        = useState(BLANK_FORM);
  const [users,       setUsers]       = useState([]);
  const [projects,    setProjects]    = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks?limit=500');
      const data = res.data?.data?.tasks || res.data?.data || res.data || [];
      setTasks(Array.isArray(data) ? data : []);
    } catch { setTasks([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    api.get('/users').then(r => setUsers(r.data?.data || r.data || [])).catch(() => {});
    api.get('/projects').then(r => setProjects(r.data?.data?.projects || r.data?.data || r.data || [])).catch(() => {});
  }, []);

  const openCreate = (defaultStatus = 'todo') => {
    // pre-assign to current user so task shows up in My Tasks
    const selfAssignee = currentUser ? [{ _id: currentUser._id, name: currentUser.name, email: currentUser.email }] : [];
    setForm({ ...BLANK_FORM, status: defaultStatus, assignees: selfAssignee });
    setDlgOpen(true);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const body = {
        title:     form.title.trim(),
        status:    form.status,
        priority:  form.priority,
        dueDate:   form.dueDate || undefined,
        assignees: form.assignees.map(u => u._id || u),
        project:   form.project || undefined,
      };
      await api.post('/tasks', body);
      dispatch(showSnackbar({ message: 'Task created!', severity: 'success' }));
      setDlgOpen(false);
      load();
    } catch {
      dispatch(showSnackbar({ message: 'Failed to create task', severity: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  // ── Kanban groups ──────────────────────────────────────────────────────────
  const columns = useMemo(() => COLUMNS.map(col => ({
    ...col,
    tasks: tasks.filter(t => col.statuses.includes(t.status)),
  })), [tasks]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalTasks = tasks.length;
  const completed  = tasks.filter(t => ['done','deployed'].includes(t.status)).length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const overdueCnt = tasks.filter(t =>
    t.dueDate && new Date(t.dueDate) < new Date() && !['done','deployed','cancelled'].includes(t.status)
  ).length;

  // ── Priority pie ───────────────────────────────────────────────────────────
  const priorityData = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    tasks.forEach(t => { if (counts[t.priority] !== undefined) counts[t.priority]++; });
    return [
      { name: 'Critical', value: counts.critical },
      { name: 'High',     value: counts.high },
      { name: 'Medium',   value: counts.medium },
      { name: 'Low',      value: counts.low },
    ].filter(d => d.value > 0);
  }, [tasks]);

  // ── Tasks over time (last 7 days) ──────────────────────────────────────────
  const timelineData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const day   = startOfDay(subDays(new Date(), 6 - i));
      const label = format(day, 'MMM d');
      const count = tasks.filter(t => t.createdAt && startOfDay(new Date(t.createdAt)) <= day).length;
      return { date: label, tasks: count };
    });
  }, [tasks]);

  // ── Team workload ──────────────────────────────────────────────────────────
  const teamWorkload = useMemo(() => {
    const map = {};
    tasks.filter(t => !['done','deployed','cancelled'].includes(t.status)).forEach(t => {
      (t.assignees || []).forEach(a => {
        const id   = a._id || a;
        const name = a.name || 'Unknown';
        if (!map[id]) map[id] = { name, count: 0 };
        map[id].count++;
      });
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [tasks]);

  const maxWorkload = Math.max(...teamWorkload.map(m => m.count), 1);

  const dueToday = tasks.filter(t => t.dueDate && format(new Date(t.dueDate),'yyyy-MM-dd') === format(new Date(),'yyyy-MM-dd') && !['done','deployed'].includes(t.status)).length;
  const dueWeek  = tasks.filter(t => {
    if (!t.dueDate || ['done','deployed'].includes(t.status)) return false;
    const d = new Date(t.dueDate); const now = new Date(); const end = new Date(); end.setDate(now.getDate() + 7);
    return d >= now && d <= end;
  }).length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{
            background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Execution Board
          </Typography>
          <Typography color="text.secondary" variant="body2">Plan, track and complete work in one place.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load} size="small"
            sx={{ borderRadius: 2, textTransform: 'none' }}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} size="small" onClick={() => openCreate()}
            sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
            New Task
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <CircularProgress sx={{ color: '#6366F1' }} />
        </Box>
      ) : (
        <>
          {/* ── Kanban Board ── */}
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, mb: 3 }}>
            {columns.map(col => (
              <Box key={col.id} sx={{ minWidth: 260, flex: '0 0 260px' }}>
                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  mb: 1.5, px: 1.5, py: 1,
                  bgcolor: col.bg, borderRadius: 2,
                  border: `1px solid ${col.border}`,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: col.color }} />
                    <Typography fontWeight={700} sx={{ fontSize: '0.85rem', color: col.color }}>{col.label}</Typography>
                    <Box sx={{ bgcolor: col.color, color: 'white', borderRadius: '999px', px: 0.75, py: 0.1, fontSize: '0.68rem', fontWeight: 800, lineHeight: 1.5 }}>
                      {col.tasks.length}
                    </Box>
                  </Box>
                  <Tooltip title={`Add task to ${col.label}`}>
                    <IconButton size="small" onClick={() => openCreate(col.defaultStatus)}
                      sx={{ color: col.color, opacity: 0.7, '&:hover': { opacity: 1, bgcolor: `${col.color}18` } }}>
                      <Add sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Box sx={{ minHeight: 120 }}>
                  {col.tasks.map(task => (
                    <TaskCard key={task._id} task={task} onClick={() => setSelected(task)} />
                  ))}
                  {col.tasks.length === 0 && (
                    <Box
                      onClick={() => openCreate(col.defaultStatus)}
                      sx={{
                        textAlign: 'center', py: 4, color: 'text.disabled',
                        border: '1.5px dashed', borderColor: 'divider', borderRadius: 2,
                        cursor: 'pointer', transition: 'all 0.15s',
                        '&:hover': { borderColor: col.color, color: col.color, bgcolor: col.bg },
                      }}
                    >
                      <Add sx={{ fontSize: 18, mb: 0.5 }} />
                      <Typography sx={{ fontSize: '0.78rem' }}>Add task</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>

          {/* ── Stats Row ── */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <StatCard label="Total Tasks"   value={totalTasks} icon={TrendingUp}  color="#6366F1" sub="All active tasks" />
            <StatCard label="Completed"     value={completed}  icon={CheckCircle} color="#10B981" sub={`${totalTasks > 0 ? Math.round((completed/totalTasks)*100) : 0}% completion rate`} />
            <StatCard label="In Progress"   value={inProgress} icon={AccessTime}  color="#3B82F6" sub="Currently active" />
            <StatCard label="Overdue"       value={overdueCnt} icon={Warning}     color="#EF4444" sub="Need attention" />
          </Box>

          {/* ── Bottom Section ── */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr 300px' }, gap: 2 }}>

            {/* Tasks by Priority */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography fontWeight={700} sx={{ mb: 2 }}>Tasks by Priority</Typography>
                {priorityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={priorityData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                        dataKey="value" paddingAngle={3}>
                        {priorityData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <RTooltip formatter={(v, n) => [v, n]} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.78rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 5, color: 'text.disabled' }}>
                    <Typography variant="body2">No data yet</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Tasks Over Time */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography fontWeight={700} sx={{ mb: 2 }}>Tasks Over Time</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={timelineData} margin={{ left: -20, right: 10, top: 5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} allowDecimals={false} />
                    <LTooltip contentStyle={{ borderRadius: 8, fontSize: '0.78rem', border: '1px solid #E2E8F0' }} />
                    <Line type="monotone" dataKey="tasks" stroke="#6366F1" strokeWidth={2.5}
                      dot={{ fill: '#6366F1', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, fill: '#4F46E5' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Right sidebar */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography fontWeight={700} sx={{ mb: 1.5, fontSize: '0.88rem' }}>Task Summary</Typography>
                  {[
                    { label: 'Due Today',     count: dueToday,  color: '#F59E0B' },
                    { label: 'Due This Week', count: dueWeek,   color: '#6366F1' },
                    { label: 'Overdue',       count: overdueCnt,color: '#EF4444' },
                  ].map(item => (
                    <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{item.label}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: item.color }}>{item.count}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography fontWeight={700} sx={{ mb: 1.5, fontSize: '0.88rem' }}>Team Workload</Typography>
                  {teamWorkload.length === 0 && (
                    <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled' }}>No assignments yet</Typography>
                  )}
                  {teamWorkload.map(member => (
                    <Box key={member.name} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem', background: avatarColor(member.name) }}>
                            {member.name[0]}
                          </Avatar>
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{member.name}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{member.count} tasks</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.round((member.count / maxWorkload) * 100)}
                        sx={{
                          height: 5, borderRadius: 3, bgcolor: '#F1F5F9',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: member.count / maxWorkload > 0.7 ? '#EF4444' : member.count / maxWorkload > 0.4 ? '#F59E0B' : '#10B981',
                          },
                        }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </>
      )}

      {/* ── Task Detail Modal ── */}
      {selected && (
        <TaskDetailModal
          task={selected}
          onClose={() => setSelected(null)}
          onUpdate={load}
        />
      )}

      {/* ── Create Task Dialog ── */}
      <Dialog open={dlgOpen} onClose={() => setDlgOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography fontWeight={700} fontSize="1rem">New Task</Typography>
          <IconButton size="small" onClick={() => setDlgOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <Divider />

        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Title */}
          <TextField
            label="Task title *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter' && form.title.trim()) handleCreate(); }}
            fullWidth size="small" autoFocus
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          {/* Status + Priority */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                sx={{ borderRadius: 2 }}>
                {ALL_STATUSES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select label="Priority" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                sx={{ borderRadius: 2 }}>
                {ALL_PRIORITIES.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          {/* Due Date + Project */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Due Date"
              type="date"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              size="small" fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Project</InputLabel>
              <Select label="Project" value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))}
                sx={{ borderRadius: 2 }}>
                <MenuItem value="">— None —</MenuItem>
                {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          {/* Assignees */}
          <Autocomplete
            multiple
            size="small"
            options={users}
            getOptionLabel={u => u.name || u.email || ''}
            value={form.assignees}
            onChange={(_, v) => setForm(f => ({ ...f, assignees: v }))}
            renderInput={params => <TextField {...params} label="Assignees" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
            renderTags={(val, getTagProps) =>
              val.map((u, i) => (
                <Chip key={u._id} label={u.name || u.email} size="small" {...getTagProps({ index: i })} />
              ))
            }
          />
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setDlgOpen(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!form.title.trim() || saving}
            sx={{ textTransform: 'none', borderRadius: 2, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', fontWeight: 700 }}
          >
            {saving ? 'Creating…' : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
