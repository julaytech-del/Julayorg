import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Avatar, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Tabs, Tab,
  Skeleton, Tooltip, Button, CircularProgress,
} from '@mui/material';
import {
  CheckCircle, Assignment, Warning, Today, CalendarToday,
  FolderOpen, AccessTime, Inbox,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { myTasksAPI } from '../../services/api.js';

// ── helpers ────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const isOverdue = (due) => due && new Date(due) < new Date() && new Date(due).toDateString() !== new Date().toDateString();
const isToday   = (due) => due && new Date(due).toDateString() === new Date().toDateString();
const isThisWeek = (due) => {
  if (!due) return false;
  const now = new Date();
  const start = new Date(now); start.setDate(now.getDate() - now.getDay());
  const end   = new Date(start); end.setDate(start.getDate() + 6);
  const d = new Date(due);
  return d >= start && d <= end;
};
const isUpcoming = (due) => due && new Date(due) > new Date() && !isThisWeek(due);

const dueDateColor = (due) => {
  if (!due) return 'text.secondary';
  if (isOverdue(due)) return 'error.main';
  if (isToday(due))   return 'warning.main';
  return 'text.secondary';
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const PRIORITY_COLORS = { high: 'error', medium: 'warning', low: 'success', urgent: 'error' };
const STATUS_COLORS   = { todo: 'default', in_progress: 'primary', done: 'success', review: 'warning' };
const STATUS_LABELS   = { todo: 'To Do', in_progress: 'In Progress', done: 'Done', review: 'Review' };

const PROJECT_PALETTE = ['#6366F1','#8B5CF6','#EC4899','#F59E0B','#10B981','#3B82F6','#EF4444','#14B8A6'];
const projectColor = (name = '') => PROJECT_PALETTE[name.charCodeAt(0) % PROJECT_PALETTE.length];

// ── stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, loading }) {
  return (
    <Card sx={{ flex: 1, minWidth: 150, borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon sx={{ color, fontSize: 22 }} />
        </Box>
        <Box>
          {loading ? <Skeleton width={40} height={28} /> : (
            <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1 }}>{value}</Typography>
          )}
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── skeleton rows ──────────────────────────────────────────────────────────
function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 6 }).map((__, j) => (
        <TableCell key={j}><Skeleton /></TableCell>
      ))}
    </TableRow>
  ));
}

// ── empty state ────────────────────────────────────────────────────────────
const EMPTY_MSGS = {
  all:       { icon: Inbox,         text: 'No tasks assigned to you yet.' },
  today:     { icon: Today,         text: 'Nothing due today — enjoy your day!' },
  this_week: { icon: CalendarToday, text: 'No tasks due this week.' },
  overdue:   { icon: CheckCircle,   text: "You're all caught up — no overdue tasks!" },
  upcoming:  { icon: AccessTime,    text: 'No upcoming tasks scheduled.' },
};

function EmptyState({ tab }) {
  const { icon: Icon, text } = EMPTY_MSGS[tab] || EMPTY_MSGS.all;
  return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Icon sx={{ fontSize: 56, color: 'action.disabled', mb: 2 }} />
      <Typography color="text.secondary">{text}</Typography>
    </Box>
  );
}

// ── main ───────────────────────────────────────────────────────────────────
export default function MyTasksPage() {
  const user = useSelector(s => s.auth.user);
  const navigate = useNavigate();

  const [tab, setTab]     = useState('all');
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, dueToday: 0, overdue: 0, completedMonth: 0 });
  const [loading, setLoading]     = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await myTasksAPI.getTasks();
      setTasks(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await myTasksAPI.getStats();
      const d = res?.data || res || {};
      setStats({
        total:          d.total          ?? 0,
        dueToday:       d.dueToday       ?? 0,
        overdue:        d.overdue        ?? 0,
        completedMonth: d.completedMonth ?? 0,
      });
    } catch {
      // derive from tasks when API unavailable — will recalc after tasks load
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); fetchStats(); }, []);

  // Derive stats from tasks when stats API fails (offline / not implemented yet)
  useEffect(() => {
    if (!loading && statsLoading === false && stats.total === 0 && tasks.length > 0) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      setStats({
        total:          tasks.length,
        dueToday:       tasks.filter(t => isToday(t.dueDate)).length,
        overdue:        tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'done').length,
        completedMonth: tasks.filter(t => t.status === 'done' && new Date(t.updatedAt) >= monthStart).length,
      });
    }
  }, [loading, tasks, statsLoading, stats.total]);

  const filteredTasks = tasks.filter(t => {
    if (tab === 'all')       return true;
    if (tab === 'today')     return isToday(t.dueDate);
    if (tab === 'this_week') return isThisWeek(t.dueDate);
    if (tab === 'overdue')   return isOverdue(t.dueDate) && t.status !== 'done';
    if (tab === 'upcoming')  return isUpcoming(t.dueDate);
    return true;
  });

  const TAB_COUNTS = {
    all:       tasks.length,
    today:     tasks.filter(t => isToday(t.dueDate)).length,
    this_week: tasks.filter(t => isThisWeek(t.dueDate)).length,
    overdue:   tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'done').length,
    upcoming:  tasks.filter(t => isUpcoming(t.dueDate)).length,
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          My Tasks
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
        </Typography>
      </Box>

      {/* Stat cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard label="Total Tasks"        value={stats.total}          icon={Assignment}    color="#6366F1" loading={statsLoading} />
        <StatCard label="Due Today"          value={stats.dueToday}       icon={Today}         color="#F59E0B" loading={statsLoading} />
        <StatCard label="Overdue"            value={stats.overdue}        icon={Warning}       color="#EF4444" loading={statsLoading} />
        <StatCard label="Completed (Month)"  value={stats.completedMonth} icon={CheckCircle}   color="#10B981" loading={statsLoading} />
      </Box>

      {/* Filter tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        {[
          { value: 'all',       label: 'All' },
          { value: 'today',     label: 'Today' },
          { value: 'this_week', label: 'This Week' },
          { value: 'overdue',   label: 'Overdue' },
          { value: 'upcoming',  label: 'Upcoming' },
        ].map(({ value, label }) => (
          <Tab
            key={value}
            value={value}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {label}
                {!loading && TAB_COUNTS[value] > 0 && (
                  <Chip label={TAB_COUNTS[value]} size="small" sx={{ height: 18, fontSize: '0.68rem', ...(value === 'overdue' && TAB_COUNTS.overdue > 0 ? { backgroundColor: '#FEE2E2', color: '#EF4444' } : {}) }} />
                )}
              </Box>
            }
          />
        ))}
      </Tabs>

      {/* Task table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
              {['Task', 'Project', 'Due Date', 'Priority', 'Status', ''].map(h => (
                <TableCell key={h} sx={{ fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary', py: 1.5 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? <SkeletonRows /> : filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ border: 0 }}>
                  <EmptyState tab={tab} />
                </TableCell>
              </TableRow>
            ) : filteredTasks.map(task => {
              const projName = typeof task.project === 'object' ? task.project?.name : task.projectName || 'Unknown';
              const projId   = typeof task.project === 'object' ? task.project?._id : task.projectId;
              const pColor   = projectColor(projName);
              return (
                <TableRow
                  key={task._id}
                  hover
                  sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                  onClick={() => projId && navigate(`/dashboard/projects/${projId}`)}
                >
                  <TableCell sx={{ fontWeight: 600, maxWidth: 280 }}>
                    <Tooltip title={task.title} placement="top-start">
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 260 }}>{task.title}</Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<FolderOpen sx={{ fontSize: '14px !important' }} />}
                      label={projName}
                      size="small"
                      sx={{ backgroundColor: `${pColor}18`, color: pColor, fontWeight: 600, fontSize: '0.72rem', border: `1px solid ${pColor}30` }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: dueDateColor(task.dueDate), fontWeight: isOverdue(task.dueDate) || isToday(task.dueDate) ? 600 : 400 }}>
                      {formatDate(task.dueDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {task.priority ? (
                      <Chip label={task.priority} size="small" color={PRIORITY_COLORS[task.priority] || 'default'} variant="outlined" sx={{ textTransform: 'capitalize', fontSize: '0.72rem' }} />
                    ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell>
                    <Chip label={STATUS_LABELS[task.status] || task.status || 'To Do'} size="small" color={STATUS_COLORS[task.status] || 'default'} sx={{ fontSize: '0.72rem' }} />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="text" sx={{ color: '#6366F1', fontSize: '0.72rem' }}
                      onClick={(e) => { e.stopPropagation(); projId && navigate(`/dashboard/projects/${projId}`); }}>
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
