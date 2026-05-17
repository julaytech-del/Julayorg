import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Skeleton, Tooltip, Avatar,
  IconButton, Tabs, Tab, Button, Divider, Checkbox,
  Menu, MenuItem, Popover, TextField,
} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer } from 'recharts';
import {
  CheckCircle, Assignment, Warning, Today, CalendarToday,
  AccessTime, Inbox, Add, ChevronLeft, ChevronRight,
  MoreHoriz, FilterList, Sort, Close, StarBorder, Star,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { myTasksAPI, tasksAPI } from '../../services/api.js';
import TaskDetailModal from '../../components/Tasks/TaskDetailModal.jsx';

function fmtSecs(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

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

const formatDueDate = (d) => {
  if (!d) return null;
  const dt   = new Date(d);
  const nowD = new Date(); nowD.setHours(0,0,0,0);
  const dtD  = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const diff = Math.round((dtD - nowD) / 86400000);
  const monthDay = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  let relative = '';
  if (diff < -1)     relative = `${Math.abs(diff)} days ago`;
  else if (diff === -1) relative = 'Yesterday';
  else if (diff === 0)  relative = 'Today';
  else if (diff === 1)  relative = 'Tomorrow';
  else                  relative = `In ${diff} days`;
  return { monthDay, relative, isOverdue: diff < 0, isToday: diff === 0 };
};

const PRIORITY_WEIGHT = { critical: 4, high: 3, medium: 2, low: 1 };

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: '#DC2626', bg: '#FEE2E2', icon: '↑' },
  high:     { label: 'High',     color: '#EA580C', bg: '#FFEDD5', icon: '↑' },
  medium:   { label: 'Medium',   color: '#D97706', bg: '#FEF3C7', icon: '↔' },
  low:      { label: 'Low',      color: '#16A34A', bg: '#DCFCE7', icon: '↓' },
};

const STATUS_DOT = {
  done:        { label: 'Done',        color: '#16A34A' },
  deployed:    { label: 'Deployed',    color: '#16A34A' },
  in_progress: { label: 'In Progress', color: '#6366F1' },
  review:      { label: 'In Review',   color: '#EAB308' },
  testing:     { label: 'Testing',     color: '#16A34A' },
  blocked:     { label: 'Blocked',     color: '#EF4444' },
  on_hold:     { label: 'On Hold',     color: '#F59E0B' },
  cancelled:   { label: 'Cancelled',   color: '#94A3B8' },
  planned:     { label: 'Planned',     color: '#6366F1' },
  todo:        { label: 'To Do',       color: '#94A3B8' },
  backlog:     { label: 'Backlog',     color: '#94A3B8' },
};

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
function StatCard({ label, value, sublabel, sublabelColor, icon: Icon, color, loading }) {
  return (
    <Card elevation={0} sx={{ flex: 1, minWidth: 150, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
      <CardContent sx={{ p: '20px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ width: 46, height: 46, borderRadius: 2.5, backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon sx={{ color: '#fff', fontSize: 23 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            {loading
              ? <Skeleton width={40} height={32} />
              : <Typography fontWeight={800} sx={{ fontSize: '1.9rem', lineHeight: 1, letterSpacing: '-1px' }}>{value}</Typography>
            }
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.25, fontWeight: 500 }}>{label}</Typography>
            {sublabel && (
              <Typography sx={{ fontSize: '0.72rem', color: sublabelColor || color, fontWeight: 600, mt: 0.5 }}>{sublabel}</Typography>
            )}
          </Box>
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
        <Typography fontWeight={700} sx={{ fontSize: '0.9rem' }}>{MONTHS_LONG[month]} {year}</Typography>
        <IconButton size="small" onClick={() => setCursor(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} sx={{ p: 0.5 }}>
          <ChevronRight sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.25 }}>
        {DAYS_SHORT.map(d => (
          <Typography key={d} align="center" sx={{ fontSize: '0.65rem', color: 'text.disabled', fontWeight: 700, py: 0.4 }}>{d}</Typography>
        ))}
        {cells.map((day, i) => {
          if (!day) return <Box key={`e-${i}`} />;
          const cellDate = new Date(year, month, day);
          const isT  = cellDate.toDateString() === todayStr;
          const hasT = taskDateSet.has(cellDate.toDateString());
          return (
            <Box key={day} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 0.5, borderRadius: 1.5, backgroundColor: isT ? '#6366F1' : 'transparent' }}>
              <Typography sx={{ fontSize: '0.73rem', fontWeight: isT ? 700 : 400, color: isT ? '#fff' : 'text.primary', lineHeight: 1.4 }}>{day}</Typography>
              {hasT && !isT && <Box sx={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#6366F1', mt: 0.15 }} />}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ── TaskDonut ─────────────────────────────────────────────────────────────────
const DONUT_EMPTY = [{ name: 'No tasks', value: 1, color: '#E2E8F0' }];
function TaskDonut({ tasks, loading }) {
  const data = useMemo(() => {
    if (!tasks.length) return DONUT_EMPTY;
    const done    = tasks.filter(t => ['done','deployed'].includes(t.status)).length;
    const inProg  = tasks.filter(t => t.status === 'in_progress').length;
    const todo    = tasks.filter(t => ['planned','todo','backlog'].includes(t.status)).length;
    const overdue = tasks.filter(t => isOverdue(t.dueDate) && !['done','cancelled','deployed'].includes(t.status)).length;
    return [
      { name: 'To Do',       value: todo,    color: '#6366F1' },
      { name: 'In Progress', value: inProg,  color: '#3B82F6' },
      { name: 'Completed',   value: done,    color: '#10B981' },
      { name: 'Overdue',     value: overdue, color: '#EF4444' },
    ].filter(d => d.value > 0);
  }, [tasks]);

  if (loading) return <Skeleton variant="circular" width={110} height={110} sx={{ mx: 'auto' }} />;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <RTooltip formatter={(val, name) => [`${val} task${val !== 1 ? 's' : ''}`, name]} />
          </PieChart>
        </ResponsiveContainer>
      </Box>
      <Box sx={{ flex: 1 }}>
        {data.filter(d => d.color !== '#E2E8F0').map(g => (
          <Box key={g.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.9 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: g.color, flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.75rem', color: 'text.primary', fontWeight: 500 }}>{g.value} {g.name}</Typography>
          </Box>
        ))}
        <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', mt: 0.5, pt: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
          Total: {tasks.length} tasks
        </Typography>
      </Box>
    </Box>
  );
}

// ── UpcomingTasksList ─────────────────────────────────────────────────────────
function UpcomingTasksList({ tasks, onSelect }) {
  const upcoming = useMemo(() => {
    const in30 = new Date(); in30.setDate(in30.getDate() + 30);
    return tasks
      .filter(t => t.dueDate && !['done','cancelled','deployed'].includes(t.status) && new Date(t.dueDate) >= new Date() && new Date(t.dueDate) <= in30)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 6);
  }, [tasks]);

  if (!upcoming.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <CalendarToday sx={{ fontSize: 28, color: 'action.disabled', mb: 0.5 }} />
        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>Nothing due soon</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {upcoming.map(task => {
        const sc  = STATUS_DOT[task.status] || STATUS_DOT.planned;
        const due = formatDueDate(task.dueDate);
        return (
          <Box key={task._id} onClick={() => onSelect(task)}
            sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, py: 1.1, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' }, cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' }, borderRadius: 1, px: 0.5 }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isOverdue(task.dueDate) ? '#EF4444' : sc.color, flexShrink: 0, mt: 0.55 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary' }}>{task.title}</Typography>
              {due && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.25 }}>
                  <CalendarToday sx={{ fontSize: 11, color: 'text.disabled' }} />
                  <Typography sx={{ fontSize: '0.68rem', color: due.isOverdue ? '#EF4444' : due.isToday ? '#F59E0B' : 'text.secondary', fontWeight: due.isOverdue || due.isToday ? 600 : 400 }}>
                    {due.monthDay} · {due.relative}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

// column grid: checkbox | star | task | project | priority | duedate | status | assignee | menu
const ROW_GRID = '32px 26px minmax(120px,1fr) 130px 100px 95px 115px 72px 30px';

// ── TaskRow ───────────────────────────────────────────────────────────────────
function TaskRow({ task, onOpen, activeTimers, tick, isFav, onToggleFav }) {
  const [hovered, setHovered] = useState(false);
  const projName = typeof task.project === 'object' ? task.project?.name : null;
  const pColor   = projectColor(projName || '');
  const done     = ['done', 'cancelled', 'deployed'].includes(task.status);
  const overdue  = isOverdue(task.dueDate) && !done;
  const timer    = activeTimers.find(t => t.taskId === task._id);
  const pc       = PRIORITY_CONFIG[task.priority];
  const sc       = overdue ? { label: 'Overdue', color: '#EF4444' } : (STATUS_DOT[task.status] || STATUS_DOT.planned);
  const due      = task.dueDate ? formatDueDate(task.dueDate) : null;

  return (
    <Box
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: 'grid', gridTemplateColumns: ROW_GRID,
        alignItems: 'center', px: 1.5, py: 0.65,
        cursor: 'pointer', transition: 'background 0.1s',
        borderBottom: '1px solid', borderColor: 'divider',
        '&:last-child': { borderBottom: 'none' },
        backgroundColor: hovered ? '#F8FAFF' : 'transparent',
      }}
    >
      {/* Checkbox */}
      <Checkbox size="small" checked={done} onClick={e => e.stopPropagation()}
        sx={{ p: 0.5, color: '#CBD5E1', '&.Mui-checked': { color: '#10B981' } }} />

      {/* Star */}
      <IconButton size="small" onClick={e => onToggleFav(task._id, e)}
        sx={{ p: 0.3, color: isFav ? '#F59E0B' : hovered ? '#9CA3AF' : '#D1D5DB', transition: 'color 0.15s', '&:hover': { color: '#F59E0B', bgcolor: 'transparent' } }}>
        {isFav ? <Star sx={{ fontSize: 15 }} /> : <StarBorder sx={{ fontSize: 15 }} />}
      </IconButton>

      {/* Task title */}
      <Box sx={{ minWidth: 0, pr: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography noWrap sx={{ fontSize: '0.87rem', fontWeight: done ? 400 : 600, color: done ? 'text.disabled' : 'text.primary', textDecoration: done ? 'line-through' : 'none' }}>
            {task.title}
          </Typography>
          {timer && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, px: 0.6, py: 0.1, borderRadius: '6px', bgcolor: '#FEF2F2', border: '1px solid #FECACA', flexShrink: 0 }}>
              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#EF4444', animation: 'blink 1s ease-in-out infinite', '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.2 } } }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#EF4444', fontFamily: 'monospace' }}>
                {fmtSecs(Math.floor((Date.now() - timer.startedAt) / 1000))}
              </Typography>
            </Box>
          )}
        </Box>
        {(task.description || projName) && (
          <Typography noWrap sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.1 }}>
            {task.description || projName}
          </Typography>
        )}
      </Box>

      {/* Project */}
      <Box sx={{ minWidth: 0, pr: 1 }}>
        {projName ? (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1, py: 0.3, borderRadius: 1.5, backgroundColor: `${pColor}15`, border: `1px solid ${pColor}35`, maxWidth: '100%', overflow: 'hidden' }}>
            <Typography noWrap sx={{ fontSize: '0.72rem', fontWeight: 600, color: pColor }}>{projName}</Typography>
          </Box>
        ) : <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>—</Typography>}
      </Box>

      {/* Priority */}
      <Box sx={{ minWidth: 0 }}>
        {pc ? (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, px: 0.9, py: 0.3, borderRadius: 1.5, backgroundColor: pc.bg }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: pc.color, lineHeight: 1 }}>{pc.icon}</Typography>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: pc.color }}>{pc.label}</Typography>
          </Box>
        ) : <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>—</Typography>}
      </Box>

      {/* Due date */}
      <Box sx={{ minWidth: 0 }}>
        {due ? (
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'text.primary', lineHeight: 1.3 }}>{due.monthDay}</Typography>
            <Typography sx={{ fontSize: '0.68rem', color: due.isOverdue ? '#EF4444' : due.isToday ? '#F59E0B' : 'text.secondary', fontWeight: due.isOverdue || due.isToday ? 600 : 400, lineHeight: 1.3 }}>{due.relative}</Typography>
          </Box>
        ) : <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>—</Typography>}
      </Box>

      {/* Status */}
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: sc.color, flexShrink: 0 }} />
          <Typography noWrap sx={{ fontSize: '0.73rem', color: sc.color, fontWeight: 500 }}>{sc.label}</Typography>
        </Box>
      </Box>

      {/* Assignee */}
      <Box sx={{ width: 72, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {task.assignees?.length > 0 ? (
          <>
            {task.assignees.slice(0, 2).map((a, i) => (
              <Tooltip key={i} title={a?.name || a?.email || 'Unknown'}>
                <Avatar src={a?.avatar || undefined} sx={{ width: 28, height: 28, fontSize: '0.68rem', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', border: '2px solid white', ml: i > 0 ? -1 : 0 }}>
                  {!a?.avatar && (a?.name?.[0] || '?').toUpperCase()}
                </Avatar>
              </Tooltip>
            ))}
            {task.assignees.length > 2 && (
              <Avatar sx={{ width: 28, height: 28, fontSize: '0.62rem', bgcolor: '#E2E8F0', color: '#64748B', border: '2px solid white', ml: -1 }}>
                +{task.assignees.length - 2}
              </Avatar>
            )}
          </>
        ) : <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>—</Typography>}
      </Box>

      <Tooltip title="Open task">
        <IconButton size="small" onClick={e => { e.stopPropagation(); onOpen(); }} sx={{ p: 0.5, color: '#CBD5E1', '&:hover': { color: '#6366F1', bgcolor: '#EEF2FF' } }}>
          <MoreHoriz sx={{ fontSize: 17 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// ── SkeletonTask ──────────────────────────────────────────────────────────────
function SkeletonTask() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 0.8, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Skeleton variant="rectangular" width={16} height={16} sx={{ borderRadius: 0.5, flexShrink: 0 }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="45%" height={16} />
        <Skeleton width="25%" height={12} sx={{ mt: 0.4 }} />
      </Box>
      <Skeleton width={80}  height={22} sx={{ borderRadius: 1.5 }} />
      <Skeleton width={72}  height={22} sx={{ borderRadius: 1.5 }} />
      <Skeleton width={70}  height={30} sx={{ borderRadius: 0.5 }} />
      <Skeleton width={85}  height={22} sx={{ borderRadius: 1.5 }} />
      <Skeleton variant="circular" width={28} height={28} />
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
    <Box sx={{ textAlign: 'center', py: 8 }}>
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

  // Favorites (local state)
  const [favorites, setFavorites] = useState(new Set());
  const toggleFavorite = useCallback((taskId, e) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  // Add task
  const [addOpen, setAddOpen]     = useState(false);
  const [addTitle, setAddTitle]   = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const addInputRef = useRef(null);

  // Menus
  const [sortAnchor,   setSortAnchor]   = useState(null);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [moreAnchor,   setMoreAnchor]   = useState(null);

  // Filters
  const [filterStatus,   setFilterStatus]   = useState([]);
  const [filterPriority, setFilterPriority] = useState([]);

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
    } catch { setTasks([]); }
    finally { setLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await myTasksAPI.getStats();
      const d   = res?.data?.data || res?.data || {};
      setStats(prev => ({
        ...prev,
        overdue:        d.overdueTasks   ?? 0,
        completedMonth: d.tasksCompleted ?? 0,
      }));
    } catch { }
    finally { setStatsLoading(false); }
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

  // Add task handler
  const handleAddTask = async () => {
    if (!addTitle.trim() || addLoading) return;
    setAddLoading(true);
    try {
      await tasksAPI.create({ title: addTitle.trim(), assignees: [user._id], status: 'planned' });
      setAddTitle('');
      setAddOpen(false);
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setAddLoading(false);
    }
  };

  useEffect(() => {
    if (addOpen) setTimeout(() => addInputRef.current?.focus(), 50);
  }, [addOpen]);

  const filteredTasks = useMemo(() => {
    let base = tasks.filter(t => {
      if (tab === 'today')     return isToday(t.dueDate);
      if (tab === 'this_week') return isThisWeek(t.dueDate);
      if (tab === 'overdue')   return isOverdue(t.dueDate) && t.status !== 'done';
      if (tab === 'upcoming')  return isUpcoming(t.dueDate);
      return true;
    });
    if (filterStatus.length > 0)   base = base.filter(t => filterStatus.includes(t.status));
    if (filterPriority.length > 0) base = base.filter(t => filterPriority.includes(t.priority));

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
  }, [tasks, tab, sortKey, sortDir, filterStatus, filterPriority]);

  const TAB_COUNTS = {
    all:       tasks.length,
    today:     tasks.filter(t => isToday(t.dueDate)).length,
    this_week: tasks.filter(t => isThisWeek(t.dueDate)).length,
    overdue:   tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'done').length,
    upcoming:  tasks.filter(t => isUpcoming(t.dueDate)).length,
  };

  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const overdueCount    = tasks.filter(t => isOverdue(t.dueDate) && !['done','cancelled','deployed'].includes(t.status)).length;
  const hasActiveFilter = filterStatus.length > 0 || filterPriority.length > 0;

  const SORT_OPTIONS = [
    { key: 'smart',    label: 'Smart (urgency + priority)' },
    { key: 'dueDate',  label: 'Due Date' },
    { key: 'priority', label: 'Priority' },
    { key: 'title',    label: 'Name (A–Z)' },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.6rem', md: '1.9rem' }, letterSpacing: '-0.5px' }}>My Tasks</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.4, fontSize: '0.9rem' }}>
          {getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
        </Typography>
      </Box>

      {/* Stat cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard label="My Tasks" value={stats.total} icon={Assignment} color="#6366F1"
          sublabel={stats.dueToday > 0 ? `↑ ${stats.dueToday} due today` : undefined}
          sublabelColor="#F59E0B" loading={statsLoading} />
        <StatCard label="In Progress" value={inProgressCount} icon={AccessTime} color="#3B82F6"
          sublabel={inProgressCount > 0 ? `${inProgressCount} active` : undefined}
          sublabelColor="#64748B" loading={statsLoading} />
        <StatCard label="Completed" value={stats.completedMonth} icon={CheckCircle} color="#10B981"
          sublabel="This month" sublabelColor="#6B7280" loading={statsLoading} />
        <StatCard label="Overdue" value={overdueCount} icon={Warning} color="#EF4444"
          sublabel={overdueCount > 0 ? 'Needs attention' : 'All caught up'}
          sublabelColor={overdueCount > 0 ? '#EF4444' : '#10B981'} loading={statsLoading} />
      </Box>

      {/* Two-column layout */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 300px' }, gap: 3, alignItems: 'start' }}>

        {/* LEFT: Task list */}
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

          {/* Card header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography fontWeight={700} sx={{ fontSize: '1.05rem' }}>My Tasks</Typography>
              {hasActiveFilter && (
                <Chip
                  label={`${filterStatus.length + filterPriority.length} filter${filterStatus.length + filterPriority.length > 1 ? 's' : ''}`}
                  size="small"
                  onDelete={() => { setFilterStatus([]); setFilterPriority([]); }}
                  deleteIcon={<Close sx={{ fontSize: '14px !important' }} />}
                  sx={{ height: 22, fontSize: '0.68rem', fontWeight: 600, bgcolor: '#EEF2FF', color: '#6366F1', '& .MuiChip-deleteIcon': { color: '#6366F1' } }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Button size="small" startIcon={<FilterList sx={{ fontSize: 15 }} />}
                onClick={e => setFilterAnchor(e.currentTarget)}
                sx={{ textTransform: 'none', fontSize: '0.78rem', color: hasActiveFilter ? '#6366F1' : 'text.secondary', border: '1px solid', borderColor: hasActiveFilter ? '#6366F1' : 'divider', bgcolor: hasActiveFilter ? '#EEF2FF' : 'transparent', minWidth: 0, px: 1.25, py: 0.5, borderRadius: 1.5, '&:hover': { color: '#6366F1', borderColor: '#6366F1', bgcolor: '#EEF2FF' } }}>
                Filter
              </Button>
              <Button size="small" startIcon={<Sort sx={{ fontSize: 15 }} />}
                onClick={e => setSortAnchor(e.currentTarget)}
                sx={{ textTransform: 'none', fontSize: '0.78rem', color: sortKey !== 'smart' ? '#6366F1' : 'text.secondary', border: '1px solid', borderColor: sortKey !== 'smart' ? '#6366F1' : 'divider', bgcolor: sortKey !== 'smart' ? '#EEF2FF' : 'transparent', minWidth: 0, px: 1.25, py: 0.5, borderRadius: 1.5, '&:hover': { color: '#6366F1', borderColor: '#6366F1', bgcolor: '#EEF2FF' } }}>
                Sort
              </Button>
              <IconButton size="small" onClick={e => setMoreAnchor(e.currentTarget)} sx={{ color: 'text.secondary', p: 0.5 }}>
                <MoreHoriz sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
              sx={{ minHeight: 42, '& .MuiTab-root': { minHeight: 42, py: 0, fontSize: '0.82rem', textTransform: 'none', fontWeight: 500 } }}>
              {[
                { value: 'all',       label: 'All' },
                { value: 'today',     label: 'Today' },
                { value: 'this_week', label: 'This Week' },
                { value: 'overdue',   label: 'Overdue' },
                { value: 'upcoming',  label: 'Upcoming' },
              ].map(({ value, label }) => (
                <Tab key={value} value={value} label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    {label}
                    {!loading && TAB_COUNTS[value] > 0 && (
                      <Box sx={{ px: 0.65, borderRadius: 1, backgroundColor: value === 'overdue' && TAB_COUNTS.overdue > 0 ? '#FEE2E2' : 'action.selected' }}>
                        <Typography component="span" sx={{ fontSize: '0.64rem', fontWeight: 700, color: value === 'overdue' && TAB_COUNTS.overdue > 0 ? '#EF4444' : 'text.secondary' }}>
                          {TAB_COUNTS[value]}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                } />
              ))}
            </Tabs>
          </Box>

          {/* Column headers */}
          {!loading && filteredTasks.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: ROW_GRID, alignItems: 'center', px: 1.5, py: 0.6, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'action.hover' }}>
              <Box />{/* checkbox */}
              <Box />{/* star */}
              <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Task</Typography>
              <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Project</Typography>
              <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Priority</Typography>
              <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Due Date</Typography>
              <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Status</Typography>
              <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Assignee</Typography>
              <Box />
            </Box>
          )}

          {/* Rows */}
          <Box>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonTask key={i} />)
              : filteredTasks.length === 0
              ? <EmptyState tab={tab} />
              : filteredTasks.map(task => (
                  <TaskRow key={task._id} task={task} onOpen={() => setSelectedTask(task)} activeTimers={activeTimers} tick={tick} isFav={favorites.has(task._id)} onToggleFav={toggleFavorite} />
                ))
            }
          </Box>

          {/* Add task */}
          <Divider />
          {addOpen ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1 }}>
              <Checkbox size="small" disabled sx={{ p: 0.5, color: '#CBD5E1', flexShrink: 0 }} />
              <TextField
                inputRef={addInputRef}
                size="small" fullWidth
                placeholder="Task name…"
                value={addTitle}
                onChange={e => setAddTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter')  handleAddTask();
                  if (e.key === 'Escape') { setAddOpen(false); setAddTitle(''); }
                }}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.87rem', borderRadius: 1.5 } }}
              />
              <Button size="small" variant="contained" disabled={!addTitle.trim() || addLoading} onClick={handleAddTask}
                sx={{ textTransform: 'none', fontSize: '0.8rem', px: 1.75, borderRadius: 1.5, flexShrink: 0, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow: 'none' }}>
                {addLoading ? 'Saving…' : 'Save'}
              </Button>
              <Button size="small" onClick={() => { setAddOpen(false); setAddTitle(''); }}
                sx={{ textTransform: 'none', fontSize: '0.8rem', color: 'text.secondary', flexShrink: 0, borderRadius: 1.5 }}>
                Cancel
              </Button>
            </Box>
          ) : (
            <Box sx={{ px: 2, py: 0.75 }}>
              <Button startIcon={<Add sx={{ fontSize: 16 }} />} onClick={() => setAddOpen(true)}
                sx={{ color: 'text.disabled', fontSize: '0.8rem', textTransform: 'none', fontWeight: 400, px: 1, py: 0.5, borderRadius: 1.5, '&:hover': { color: '#6366F1', backgroundColor: '#EEF2FF' } }}>
                Add new task
              </Button>
            </Box>
          )}
        </Card>

        {/* RIGHT: Sidebar */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: '18px !important' }}>
              <Typography fontWeight={700} sx={{ fontSize: '0.95rem', mb: 1.5 }}>Calendar</Typography>
              <MiniCalendar tasks={tasks} />
            </CardContent>
          </Card>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: '18px !important' }}>
              <Typography fontWeight={700} sx={{ fontSize: '0.95rem', mb: 1.5 }}>Tasks Summary</Typography>
              <TaskDonut tasks={tasks} loading={loading} />
            </CardContent>
          </Card>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: '18px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography fontWeight={700} sx={{ fontSize: '0.95rem' }}>Upcoming</Typography>
                <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>next 30 days</Typography>
              </Box>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1.25 }}>
                      <Skeleton variant="circular" width={8} height={8} sx={{ mt: 0.5, flexShrink: 0 }} />
                      <Box sx={{ flex: 1 }}><Skeleton width="70%" height={14} /><Skeleton width="45%" height={11} sx={{ mt: 0.4 }} /></Box>
                    </Box>
                  ))
                : <UpcomingTasksList tasks={tasks} onSelect={setSelectedTask} />
              }
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* ── Sort Menu ── */}
      <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)}
        PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', minWidth: 210 } }}>
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography fontWeight={700} sx={{ fontSize: '0.82rem' }}>Sort by</Typography>
        </Box>
        {SORT_OPTIONS.map(s => (
          <MenuItem key={s.key} selected={sortKey === s.key} onClick={() => { setSortKey(s.key); setSortDir('asc'); setSortAnchor(null); }}
            sx={{ fontSize: '0.84rem', gap: 1, '&.Mui-selected': { color: '#6366F1', bgcolor: '#EEF2FF' } }}>
            {s.label}
            {sortKey === s.key && <CheckCircle sx={{ fontSize: 14, ml: 'auto', color: '#6366F1' }} />}
          </MenuItem>
        ))}
        {sortKey !== 'smart' && (
          <Box sx={{ px: 1, pb: 0.5, pt: 0.25 }}>
            <Button size="small" fullWidth onClick={() => { setSortKey('smart'); setSortDir('asc'); setSortAnchor(null); }}
              sx={{ textTransform: 'none', fontSize: '0.78rem', color: 'text.secondary', borderRadius: 1.5 }}>
              Reset to default
            </Button>
          </Box>
        )}
      </Menu>

      {/* ── Filter Popover ── */}
      <Popover anchorEl={filterAnchor} open={Boolean(filterAnchor)} onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { borderRadius: 2.5, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', width: 260, mt: 0.5 } }}>
        <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography fontWeight={700} sx={{ fontSize: '0.88rem' }}>Filters</Typography>
          {hasActiveFilter && (
            <Button size="small" onClick={() => { setFilterStatus([]); setFilterPriority([]); }}
              sx={{ textTransform: 'none', fontSize: '0.73rem', color: '#EF4444', p: 0, minWidth: 0 }}>
              Clear all
            </Button>
          )}
        </Box>
        <Box sx={{ p: 1.5 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75, px: 0.5 }}>Status</Typography>
          {Object.entries(STATUS_DOT).slice(0, 8).map(([key, val]) => (
            <Box key={key} onClick={() => setFilterStatus(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key])}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.3, px: 0.5, borderRadius: 1.5, cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}>
              <Checkbox size="small" checked={filterStatus.includes(key)} sx={{ p: 0.25 }} />
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: val.color, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.82rem' }}>{val.label}</Typography>
            </Box>
          ))}
          <Divider sx={{ my: 1 }} />
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75, px: 0.5 }}>Priority</Typography>
          {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
            <Box key={key} onClick={() => setFilterPriority(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key])}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.3, px: 0.5, borderRadius: 1.5, cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}>
              <Checkbox size="small" checked={filterPriority.includes(key)} sx={{ p: 0.25 }} />
              <Typography sx={{ fontSize: '0.82rem', color: val.color, fontWeight: 600 }}>{val.icon} {val.label}</Typography>
            </Box>
          ))}
        </Box>
      </Popover>

      {/* ── More Menu ── */}
      <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)}
        PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', minWidth: 180 } }}>
        <MenuItem onClick={() => { fetchData(); fetchStats(); setMoreAnchor(null); }} sx={{ fontSize: '0.84rem', gap: 1 }}>
          Refresh
        </MenuItem>
        <MenuItem onClick={() => { setFilterStatus([]); setFilterPriority([]); setSortKey('smart'); setSortDir('asc'); setMoreAnchor(null); }} sx={{ fontSize: '0.84rem', gap: 1 }}>
          Reset all filters & sort
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setTab('overdue'); setMoreAnchor(null); }} sx={{ fontSize: '0.84rem', gap: 1, color: '#EF4444' }}>
          Show overdue only
        </MenuItem>
      </Menu>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={fetchData} />
      )}
    </Box>
  );
}
