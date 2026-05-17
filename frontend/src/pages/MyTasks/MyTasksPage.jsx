import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Skeleton, Tooltip, Avatar,
  IconButton, Tabs, Tab, Button, Divider,
} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer } from 'recharts';
import {
  CheckCircle, Assignment, Warning, Today, CalendarToday,
  AccessTime, Inbox, OpenInNew, Add, ChevronLeft, ChevronRight,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { myTasksAPI } from '../../services/api.js';
import TaskDetailModal from '../../components/Tasks/TaskDetailModal.jsx';

// ── timer fmt ─────────────────────────────────────────────────────────────────
function fmtSecs(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

// ── helpers ───────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const isOverdue  = (due) => due && new Date(due) < new Date() && new Date(due).toDateString() !== new Date().toDateString();
const isToday    = (due) => due && new Date(due).toDateString() === new Date().toDateString();
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
  const dt = new Date(d);
  const now = new Date();
  const diffDays = Math.round((dt - now) / 86400000);
  if (isToday(d)) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const PRIORITY_COLORS  = { critical: 'error', high: 'error', medium: 'warning', low: 'success' };
const PRIORITY_BG      = { critical: '#FEE2E2', high: '#FEE2E2', medium: '#FEF9C3', low: '#DCFCE7' };
const PRIORITY_TXT     = { critical: '#DC2626', high: '#DC2626', medium: '#92400E', low: '#166534' };
const PRIORITY_WEIGHT  = { critical: 4, high: 3, medium: 2, low: 1 };

const urgencyOf = (task) => {
  if (['done', 'cancelled', 'deployed'].includes(task.status)) return 5;
  if (!task.dueDate) return 4;
  if (isOverdue(task.dueDate))  return 0;
  if (isToday(task.dueDate))    return 1;
  if (isThisWeek(task.dueDate)) return 2;
  return 3;
};

const smartSort = (a, b) => {
  const ua = urgencyOf(a), ub = urgencyOf(b);
  if (ua !== ub) return ua - ub;
  if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
  return (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
};

const PROJECT_PALETTE = ['#6366F1','#8B5CF6','#EC4899','#F59E0B','#10B981','#3B82F6','#EF4444','#14B8A6'];
const projectColor = (name = '') => PROJECT_PALETTE[name.charCodeAt(0) % PROJECT_PALETTE.length];

const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT  = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, loading }) {
  return (
    <Card sx={{ flex: 1, minWidth: 140, borderRadius: 2.5, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.75, py: '14px !important', px: 2 }}>
        <Box sx={{ width: 42, height: 42, borderRadius: 2, backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon sx={{ color, fontSize: 21 }} />
        </Box>
        <Box>
          {loading
            ? <Skeleton width={36} height={26} />
            : <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1, fontSize: '1.45rem' }}>{value}</Typography>
          }
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.3 }}>{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── MiniCalendar ──────────────────────────────────────────────────────────────
function MiniCalendar({ tasks }) {
  const [cursor, setCursor] = useState(new Date());
  const year  = cursor.getFullYear();
  const month = cursor.getMonth();

  const taskDateSet = useMemo(() => {
    const s = new Set();
    tasks.forEach(t => { if (t.dueDate) s.add(new Date(t.dueDate).toDateString()); });
    return s;
  }, [tasks]);

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr    = new Date().toDateString();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <IconButton size="small" onClick={() => setCursor(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} sx={{ p: 0.5 }}>
          <ChevronLeft sx={{ fontSize: 18 }} />
        </IconButton>
        <Typography fontWeight={700} sx={{ fontSize: '0.88rem' }}>
          {MONTHS_LONG[month]} {year}
        </Typography>
        <IconButton size="small" onClick={() => setCursor(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} sx={{ p: 0.5 }}>
          <ChevronRight sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.25 }}>
        {DAYS_SHORT.map(d => (
          <Typography key={d} align="center" sx={{ fontSize: '0.64rem', color: 'text.disabled', fontWeight: 700, py: 0.4, textTransform: 'uppercase' }}>
            {d}
          </Typography>
        ))}
        {cells.map((day, i) => {
          if (!day) return <Box key={`empty-${i}`} />;
          const cellDate = new Date(year, month, day);
          const isT  = cellDate.toDateString() === todayStr;
          const hasT = taskDateSet.has(cellDate.toDateString());
          return (
            <Box key={day} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 0.5, borderRadius: 1.5, backgroundColor: isT ? '#6366F1' : 'transparent' }}>
              <Typography sx={{ fontSize: '0.73rem', fontWeight: isT ? 700 : 400, color: isT ? '#fff' : 'text.primary', lineHeight: 1.4 }}>
                {day}
              </Typography>
              {hasT && !isT && (
                <Box sx={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#6366F1', mt: 0.15 }} />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ── TaskDonut ─────────────────────────────────────────────────────────────────
const DONUT_DATA_EMPTY = [{ name: 'No tasks', value: 1, color: '#E2E8F0' }];

function TaskDonut({ tasks, loading }) {
  const data = useMemo(() => {
    if (!tasks.length) return DONUT_DATA_EMPTY;
    const done   = tasks.filter(t => ['done','deployed'].includes(t.status)).length;
    const inProg = tasks.filter(t => t.status === 'in_progress').length;
    const todo   = tasks.filter(t => ['planned','todo','backlog'].includes(t.status)).length;
    const other  = tasks.length - done - inProg - todo;
    return [
      { name: 'Done',        value: done,   color: '#10B981' },
      { name: 'In Progress', value: inProg, color: '#6366F1' },
      { name: 'To Do',       value: todo,   color: '#F59E0B' },
      { name: 'Other',       value: other,  color: '#94A3B8' },
    ].filter(d => d.value > 0);
  }, [tasks]);

  if (loading) return <Skeleton variant="circular" width={120} height={120} sx={{ mx: 'auto' }} />;

  const total = tasks.length;

  return (
    <Box>
      <Box sx={{ position: 'relative', height: 150 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={44} outerRadius={64} paddingAngle={2} dataKey="value" stroke="none">
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <RTooltip formatter={(val, name) => [`${val} task${val !== 1 ? 's' : ''}`, name]} />
          </PieChart>
        </ResponsiveContainer>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
          <Typography fontWeight={700} sx={{ fontSize: '1.35rem', lineHeight: 1 }}>{total}</Typography>
          <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary' }}>tasks</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 0.5 }}>
        {data.filter(d => d.color !== '#E2E8F0').map(g => (
          <Box key={g.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: g.color, flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>{g.name} <Box component="span" fontWeight={600} color="text.primary">({g.value})</Box></Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ── UpcomingTasksList (sidebar) ───────────────────────────────────────────────
function UpcomingTasksList({ tasks, onSelect }) {
  const upcoming = useMemo(() => {
    const in7 = new Date(); in7.setDate(in7.getDate() + 7);
    return tasks
      .filter(t => t.dueDate && !['done','cancelled','deployed'].includes(t.status) && new Date(t.dueDate) <= in7)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
  }, [tasks]);

  if (!upcoming.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <CalendarToday sx={{ fontSize: 32, color: 'action.disabled', mb: 0.5 }} />
        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>Nothing due soon</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {upcoming.map(task => {
        const projName = typeof task.project === 'object' ? task.project?.name : null;
        const pColor   = projectColor(projName || '');
        const overdue  = isOverdue(task.dueDate);
        return (
          <Box
            key={task._id}
            onClick={() => onSelect(task)}
            sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, p: 1, borderRadius: 1.5, cursor: 'pointer', transition: 'background 0.12s', '&:hover': { backgroundColor: 'action.hover' } }}
          >
            <Box sx={{ width: 3, height: '100%', minHeight: 36, borderRadius: 4, backgroundColor: overdue ? '#EF4444' : pColor, flexShrink: 0, mt: 0.25 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: '0.78rem', fontWeight: 600, color: overdue ? 'error.main' : 'text.primary' }}>{task.title}</Typography>
              {projName && (
                <Typography noWrap sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 0.2 }}>{projName}</Typography>
              )}
            </Box>
            <Typography sx={{ fontSize: '0.65rem', color: overdue ? 'error.main' : 'text.secondary', fontWeight: overdue ? 600 : 400, flexShrink: 0, pt: 0.2 }}>
              {formatDate(task.dueDate)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// ── TaskRow ───────────────────────────────────────────────────────────────────
function TaskRow({ task, onOpen, activeTimers, tick }) {
  const projName = typeof task.project === 'object' ? task.project?.name : null;
  const pColor   = projectColor(projName || '');
  const done     = ['done', 'cancelled', 'deployed'].includes(task.status);
  const overdue  = isOverdue(task.dueDate) && !done;
  const timer    = activeTimers.find(t => t.taskId === task._id);

  return (
    <Box
      onClick={onOpen}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 1.75,
        py: 1.1,
        borderRadius: 1.5,
        cursor: 'pointer',
        transition: 'background 0.12s',
        backgroundColor: overdue ? '#FFF5F5' : 'transparent',
        borderLeft: `3px solid ${overdue ? '#EF4444' : 'transparent'}`,
        '&:hover': { backgroundColor: overdue ? '#FEE2E2' : 'action.hover' },
      }}
    >
      {/* Status indicator */}
      {done
        ? <CheckCircle sx={{ fontSize: 19, color: '#10B981', flexShrink: 0 }} />
        : <RadioButtonUnchecked sx={{ fontSize: 19, color: overdue ? '#EF4444' : '#CBD5E1', flexShrink: 0 }} />
      }

      {/* Title + project */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'nowrap' }}>
          <Typography noWrap sx={{
            fontSize: '0.84rem', fontWeight: done ? 400 : 600,
            color: done ? 'text.disabled' : overdue ? '#DC2626' : 'text.primary',
            textDecoration: done ? 'line-through' : 'none',
            maxWidth: { xs: 160, sm: 240, md: 300 },
          }}>
            {task.title}
          </Typography>
          {overdue && (
            <Chip label="Overdue" size="small" sx={{ height: 15, fontSize: '0.58rem', fontWeight: 700, bgcolor: '#FEE2E2', color: '#DC2626', flexShrink: 0, px: 0.25 }} />
          )}
          {timer && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, px: 0.6, py: 0.15, borderRadius: '6px', bgcolor: '#FEF2F2', border: '1px solid #FECACA', flexShrink: 0 }}>
              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#EF4444', animation: 'blink 1s ease-in-out infinite', '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.2 } } }} />
              <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, color: '#EF4444', fontFamily: 'monospace' }}>
                {fmtSecs(Math.floor((Date.now() - timer.startedAt) / 1000))}
              </Typography>
            </Box>
          )}
        </Box>
        {projName && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: 0.5, backgroundColor: pColor, flexShrink: 0 }} />
            <Typography noWrap sx={{ fontSize: '0.68rem', color: 'text.secondary', maxWidth: 200 }}>{projName}</Typography>
          </Box>
        )}
      </Box>

      {/* Right metadata */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexShrink: 0 }}>
        {task.dueDate && (
          <Typography sx={{ fontSize: '0.72rem', color: dueDateColor(task.dueDate), fontWeight: overdue || isToday(task.dueDate) ? 600 : 400, whiteSpace: 'nowrap' }}>
            {formatDate(task.dueDate)}
          </Typography>
        )}

        {task.priority && (
          <Box sx={{ px: 0.75, py: 0.15, borderRadius: 1, backgroundColor: PRIORITY_BG[task.priority] || '#F1F5F9', flexShrink: 0 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: PRIORITY_TXT[task.priority] || '#64748B', textTransform: 'capitalize' }}>
              {task.priority}
            </Typography>
          </Box>
        )}

        {task.assignees?.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {task.assignees.slice(0, 3).map((a, i) => (
              <Tooltip key={i} title={a?.name || a?.email || 'Unknown'}>
                <Avatar src={a?.avatar || undefined} sx={{ width: 22, height: 22, fontSize: '0.6rem', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', border: '1.5px solid white', ml: i > 0 ? -0.75 : 0 }}>
                  {!a?.avatar && (a?.name?.[0] || '?').toUpperCase()}
                </Avatar>
              </Tooltip>
            ))}
            {task.assignees.length > 3 && (
              <Avatar sx={{ width: 22, height: 22, fontSize: '0.58rem', bgcolor: '#E2E8F0', color: '#64748B', border: '1.5px solid white', ml: -0.75 }}>
                +{task.assignees.length - 3}
              </Avatar>
            )}
          </Box>
        )}

        <Tooltip title="Open task">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onOpen(); }} sx={{ p: 0.4, color: '#94A3B8', '&:hover': { color: '#6366F1', bgcolor: '#EEF2FF' } }}>
            <OpenInNew sx={{ fontSize: 13 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

// ── SkeletonTask ──────────────────────────────────────────────────────────────
function SkeletonTask() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.75, py: 1.1 }}>
      <Skeleton variant="circular" width={19} height={19} sx={{ flexShrink: 0 }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="55%" height={16} />
        <Skeleton width="30%" height={12} sx={{ mt: 0.5 }} />
      </Box>
      <Skeleton width={60} height={14} />
      <Skeleton width={48} height={20} sx={{ borderRadius: 1 }} />
    </Box>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
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
    <Box sx={{ textAlign: 'center', py: 7 }}>
      <Icon sx={{ fontSize: 48, color: 'action.disabled', mb: 1.5 }} />
      <Typography color="text.secondary" sx={{ fontSize: '0.88rem' }}>{text}</Typography>
    </Box>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function MyTasksPage() {
  const user             = useSelector(s => s.auth.user);
  const dashboardRefresh = useSelector(s => s.ui.dashboardRefresh);
  const activeTimers     = useSelector(s => s.ui.activeTimers);
  const [tick, setTick]  = useState(0);

  useEffect(() => {
    if (!activeTimers.length) return;
    const id = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(id);
  }, [activeTimers.length]);

  const [tab, setTab]                   = useState('all');
  const [tasks, setTasks]               = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [stats, setStats]               = useState({ total: 0, dueToday: 0, overdue: 0, completedMonth: 0 });
  const [loading, setLoading]           = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [sortKey, setSortKey]           = useState('smart');
  const [sortDir, setSortDir]           = useState('asc');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await myTasksAPI.getTasks();
      const d    = res?.data;
      const list = d?.data?.tasks ?? d?.tasks ?? (Array.isArray(d) ? d : []);
      setTasks(list);
      setSelectedTask(prev => {
        if (!prev?._id) return prev;
        const fresh = list.find(t => t._id === prev._id);
        return fresh || prev;
      });
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
      const d   = res?.data?.data || res?.data || {};
      setStats(prev => ({
        ...prev,
        overdue:        d.overdueTasks      ?? 0,
        completedMonth: d.tasksCompleted    ?? 0,
      }));
    } catch {
      // derive from tasks
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); fetchStats(); }, [dashboardRefresh]);

  useEffect(() => {
    if (!loading) {
      setStats(prev => ({
        ...prev,
        total:    tasks.length,
        dueToday: tasks.filter(t => isToday(t.dueDate)).length,
      }));
    }
  }, [loading, tasks]);

  const filteredTasks = useMemo(() => {
    const base = tasks.filter(t => {
      if (tab === 'all')       return true;
      if (tab === 'today')     return isToday(t.dueDate);
      if (tab === 'this_week') return isThisWeek(t.dueDate);
      if (tab === 'overdue')   return isOverdue(t.dueDate) && t.status !== 'done';
      if (tab === 'upcoming')  return isUpcoming(t.dueDate);
      return true;
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...base].sort((a, b) => {
      if (sortKey === 'smart')    return smartSort(a, b) * dir;
      if (sortKey === 'title')    return a.title.localeCompare(b.title) * dir;
      if (sortKey === 'priority') return ((PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0)) * dir;
      if (sortKey === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1 * dir;
        if (!b.dueDate) return -1 * dir;
        return (new Date(a.dueDate) - new Date(b.dueDate)) * dir;
      }
      return 0;
    });
  }, [tasks, tab, sortKey, sortDir]);

  const TAB_COUNTS = {
    all:       tasks.length,
    today:     tasks.filter(t => isToday(t.dueDate)).length,
    this_week: tasks.filter(t => isThisWeek(t.dueDate)).length,
    overdue:   tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'done').length,
    upcoming:  tasks.filter(t => isUpcoming(t.dueDate)).length,
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>

      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: { xs: '1.5rem', md: '1.85rem' } }}>
          My Tasks
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: '0.9rem' }}>
          {getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
        </Typography>
      </Box>

      {/* ── Stats cards ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard label="Total Tasks"       value={stats.total}          icon={Assignment}  color="#6366F1" loading={statsLoading} />
        <StatCard label="Due Today"         value={stats.dueToday}       icon={Today}       color="#F59E0B" loading={statsLoading} />
        <StatCard label="Overdue"           value={stats.overdue}        icon={Warning}     color="#EF4444" loading={statsLoading} />
        <StatCard label="Completed (Month)" value={stats.completedMonth} icon={CheckCircle} color="#10B981" loading={statsLoading} />
      </Box>

      {/* ── Two-column layout ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 290px' }, gap: 3, alignItems: 'start' }}>

        {/* ── Left: Task List ── */}
        <Box>
          <Card sx={{ borderRadius: 2.5, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>

            {/* Filter tabs */}
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ minHeight: 44, '& .MuiTab-root': { minHeight: 44, py: 0, fontSize: '0.8rem', textTransform: 'none' } }}
              >
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        {label}
                        {!loading && TAB_COUNTS[value] > 0 && (
                          <Box sx={{
                            px: 0.7, py: 0.05, borderRadius: 1, minWidth: 18, textAlign: 'center',
                            backgroundColor: value === 'overdue' && TAB_COUNTS.overdue > 0 ? '#FEE2E2' : 'action.selected',
                          }}>
                            <Typography component="span" sx={{ fontSize: '0.64rem', fontWeight: 700, color: value === 'overdue' && TAB_COUNTS.overdue > 0 ? '#EF4444' : 'text.secondary' }}>
                              {TAB_COUNTS[value]}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                ))}
              </Tabs>
            </Box>

            {/* Sort bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'action.hover' }}>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
                {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {[
                  { key: 'smart',    label: 'Smart' },
                  { key: 'dueDate',  label: 'Due Date' },
                  { key: 'priority', label: 'Priority' },
                  { key: 'title',    label: 'Name' },
                ].map(s => (
                  <Box
                    key={s.key}
                    onClick={() => {
                      if (sortKey === s.key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                      else { setSortKey(s.key); setSortDir('asc'); }
                    }}
                    sx={{
                      px: 1, py: 0.3, borderRadius: 1, cursor: 'pointer',
                      backgroundColor: sortKey === s.key ? '#EEF2FF' : 'transparent',
                      color: sortKey === s.key ? '#6366F1' : 'text.secondary',
                      fontSize: '0.7rem', fontWeight: sortKey === s.key ? 700 : 400,
                      transition: 'all 0.12s',
                      '&:hover': { backgroundColor: sortKey === s.key ? '#EEF2FF' : 'action.selected' },
                    }}
                  >
                    {s.label}{sortKey === s.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Task rows */}
            <Box sx={{ py: 0.5 }}>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonTask key={i} />)
                : filteredTasks.length === 0
                ? <EmptyState tab={tab} />
                : filteredTasks.map(task => (
                    <TaskRow
                      key={task._id}
                      task={task}
                      onOpen={() => setSelectedTask(task)}
                      activeTimers={activeTimers}
                      tick={tick}
                    />
                  ))
              }
            </Box>

            {/* Add task button */}
            <Divider />
            <Box sx={{ px: 1.75, py: 1 }}>
              <Button
                startIcon={<Add sx={{ fontSize: 16 }} />}
                sx={{
                  color: 'text.disabled', fontSize: '0.8rem', textTransform: 'none', fontWeight: 400,
                  '&:hover': { color: '#6366F1', backgroundColor: '#EEF2FF' },
                  px: 1, py: 0.5, borderRadius: 1.5,
                }}
              >
                Add new task
              </Button>
            </Box>
          </Card>
        </Box>

        {/* ── Right: Sidebar ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Mini Calendar */}
          <Card sx={{ borderRadius: 2.5, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: '16px !important' }}>
              <Typography fontWeight={700} sx={{ fontSize: '0.88rem', mb: 1.5 }}>Calendar</Typography>
              <MiniCalendar tasks={tasks} />
            </CardContent>
          </Card>

          {/* Task Summary donut */}
          <Card sx={{ borderRadius: 2.5, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: '16px !important' }}>
              <Typography fontWeight={700} sx={{ fontSize: '0.88rem', mb: 0.5 }}>Task Summary</Typography>
              <TaskDonut tasks={tasks} loading={loading} />
            </CardContent>
          </Card>

          {/* Upcoming tasks */}
          <Card sx={{ borderRadius: 2.5, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: '16px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography fontWeight={700} sx={{ fontSize: '0.88rem' }}>Upcoming</Typography>
                <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>next 7 days</Typography>
              </Box>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Skeleton width={3} height={36} sx={{ borderRadius: 4 }} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton width="70%" height={14} />
                        <Skeleton width="40%" height={11} sx={{ mt: 0.4 }} />
                      </Box>
                    </Box>
                  ))
                : <UpcomingTasksList tasks={tasks} onSelect={setSelectedTask} />
              }
            </CardContent>
          </Card>
        </Box>
      </Box>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={fetchData}
        />
      )}
    </Box>
  );
}
