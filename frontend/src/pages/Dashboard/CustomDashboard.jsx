import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogContent, DialogTitle, Divider, Grid, IconButton,
  LinearProgress, List, ListItem, Skeleton, Tooltip, Typography
} from '@mui/material';
import {
  Add, Assignment, AutoAwesome, BarChart, Cancel, CheckCircle,
  Close, DragIndicator, FolderOpen, Group, PieChart, Refresh,
  Remove, Schedule, TrendingUp, Warning
} from '@mui/icons-material';
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart as RePieChart, Pie as RePie, Cell, AreaChart, Area
} from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, isPast, isWithinInterval, addDays } from 'date-fns';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import { dashboardAPI, dashboardConfigAPI } from '../../services/api.js';

const DARK_CARD = { bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };
const STATUS_COLORS = { planned: '#94A3B8', in_progress: '#4F46E5', blocked: '#EF4444', review: '#F59E0B', done: '#10B981' };
const PIE_COLORS = ['#6366f1', '#0EA5E9', '#F59E0B', '#10B981', '#EF4444', '#A855F7'];

const WIDGET_CATALOG = [
  { type: 'stat_total_tasks',      label: 'Total Tasks',        icon: Assignment,  cols: 3 },
  { type: 'stat_active_projects',  label: 'Active Projects',    icon: FolderOpen,  cols: 3 },
  { type: 'stat_team_members',     label: 'Team Members',       icon: Group,       cols: 3 },
  { type: 'stat_completion_rate',  label: 'Completion Rate',    icon: CheckCircle, cols: 3 },
  { type: 'bar_tasks_by_status',   label: 'Tasks by Status',    icon: BarChart,    cols: 8 },
  { type: 'pie_projects_by_status',label: 'Projects by Status', icon: PieChart,    cols: 4 },
  { type: 'ai_insight',            label: 'AI Insight',         icon: AutoAwesome, cols: 12 },
  { type: 'task_list_overdue',     label: 'Overdue Tasks',      icon: Warning,     cols: 6 },
  { type: 'activity_feed',         label: 'Activity Feed',      icon: TrendingUp,  cols: 6 },
  { type: 'deadline_list',         label: 'Upcoming Deadlines', icon: Schedule,    cols: 12 },
];

const DEFAULT_LAYOUT = [
  { id: 'w1', type: 'stat_total_tasks',       cols: 3 },
  { id: 'w2', type: 'stat_active_projects',   cols: 3 },
  { id: 'w3', type: 'stat_team_members',      cols: 3 },
  { id: 'w4', type: 'stat_completion_rate',   cols: 3 },
  { id: 'w5', type: 'bar_tasks_by_status',    cols: 8 },
  { id: 'w6', type: 'pie_projects_by_status', cols: 4 },
  { id: 'w7', type: 'ai_insight',             cols: 12 },
  { id: 'w8', type: 'task_list_overdue',      cols: 6 },
  { id: 'w9', type: 'activity_feed',          cols: 6 },
  { id: 'w10', type: 'deadline_list',         cols: 12 },
];

const ACTION_ICONS = {
  created: '✦', completed: '✓', updated: '↻', assigned: '→',
  status_changed: '◈', commented: '◉', ai_generated: '★', deleted: '×',
};
const ACTION_COLORS = {
  created: '#4F46E5', completed: '#10B981', updated: '#F59E0B', assigned: '#0EA5E9',
  status_changed: '#8B5CF6', commented: '#64748B', ai_generated: '#4F46E5', deleted: '#EF4444',
};

// ─── Widget Implementations ─────────────────────────────────────────────────

function StatCounterWidget({ stats, loading, type }) {
  const cfg = {
    stat_total_tasks:      { title: 'Total Tasks',      valueKey: 'tasks.total',      sub: s => `${s?.tasks?.inProgress || 0} in progress`, icon: <Assignment />, color: '#4F46E5' },
    stat_active_projects:  { title: 'Active Projects',  valueKey: 'projects.active',  sub: s => `${s?.projects?.total || 0} total`, icon: <FolderOpen />, color: '#0EA5E9' },
    stat_team_members:     { title: 'Team Members',     valueKey: 'team.total',        sub: s => `${s?.team?.active || 0} active today`, icon: <Group />, color: '#10B981' },
    stat_completion_rate:  { title: 'Completion Rate',  valueKey: null,                sub: s => `${s?.tasks?.completed || 0} tasks done`, icon: <CheckCircle />, color: '#F59E0B', format: s => s ? `${s.completionRate}%` : null },
  }[type];
  if (!cfg) return null;

  const getValue = () => {
    if (cfg.format) return cfg.format(stats);
    const keys = cfg.valueKey.split('.');
    return keys.reduce((obj, k) => obj?.[k], stats);
  };

  return (
    <Box sx={{ p: 2.5, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem', display: 'block', mb: 0.75 }}>
            {cfg.title}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {loading ? <Skeleton width={60} height={40} /> : (getValue() ?? '—')}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block', fontSize: '0.76rem' }}>
            {loading ? <Skeleton width={80} /> : (stats ? cfg.sub(stats) : '')}
          </Typography>
        </Box>
        <Box sx={{ width: 42, height: 42, borderRadius: 2.5, bgcolor: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {React.cloneElement(cfg.icon, { sx: { color: cfg.color, fontSize: 20 } })}
        </Box>
      </Box>
    </Box>
  );
}

function BarChartWidget({ stats, loading }) {
  const data = stats ? Object.entries(stats.tasks?.byStatus || {}).map(([k, v]) => ({ name: k.replace('_', ' '), value: v, fill: STATUS_COLORS[k] || '#94A3B8' })) : [];
  return (
    <Box sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Tasks by Status</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>Distribution across all projects</Typography>
      {loading ? <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} /> : (
        <ResponsiveContainer width="100%" height={170}>
          <ReBarChart data={data} margin={{ left: -24, bottom: 0 }} barSize={28}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <ReTooltip contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </ReBarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}

function PieChartWidget({ stats, loading }) {
  const data = stats ? Object.entries(stats.projects?.byStatus || {}).filter(([, v]) => v > 0).map(([k, v], i) => ({ name: k.replace('_', ' '), value: v, color: PIE_COLORS[i] })) : [];
  return (
    <Box sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Projects by Status</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>Portfolio overview</Typography>
      {loading ? <Skeleton variant="circular" width={140} height={140} sx={{ mx: 'auto' }} /> : (
        <>
          <ResponsiveContainer width="100%" height={140}>
            <RePieChart>
              <RePie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" paddingAngle={3}>
                {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </RePie>
              <ReTooltip contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
            </RePieChart>
          </ResponsiveContainer>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
            {data.map((entry, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
                  <Typography variant="caption" sx={{ textTransform: 'capitalize', color: 'text.secondary', fontSize: '0.72rem' }}>{entry.name}</Typography>
                </Box>
                <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.75rem' }}>{entry.value}</Typography>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}

function AIInsightWidget({ dispatch }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [displayed, setDisplayed] = useState('');
  const [typing, setTyping] = useState(false);
  const timerRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setDisplayed('');
    try {
      const res = await dashboardConfigAPI.getAIInsight();
      const text = res?.data?.insight || res?.insight || 'AI insight not available at this time.';
      setInsight(text);
    } catch {
      setInsight('AI insight could not be loaded. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!insight) return;
    setTyping(true);
    let idx = 0;
    setDisplayed('');
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      idx++;
      setDisplayed(insight.slice(0, idx));
      if (idx >= insight.length) { clearInterval(timerRef.current); setTyping(false); }
    }, 12);
    return () => clearInterval(timerRef.current);
  }, [insight]);

  return (
    <Box sx={{ p: 2.5, background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.12))', borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AutoAwesome sx={{ fontSize: 18, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>AI Insight</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>Powered by Claude</Typography>
          </Box>
        </Box>
        <Tooltip title="Regenerate insight">
          <IconButton size="small" onClick={load} disabled={loading} sx={{ color: '#A855F7', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 1.5 }}>
            <Refresh sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={18} sx={{ color: '#A855F7' }} />
          <Typography variant="body2" color="text.secondary">Claude is analyzing your project data...</Typography>
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.8, fontSize: '0.875rem', flex: 1 }}>
          {displayed}
          {typing && <Box component="span" sx={{ display: 'inline-block', width: 2, height: 14, bgcolor: '#A855F7', ml: 0.25, animation: 'blink 0.8s step-end infinite', '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } } }} />}
        </Typography>
      )}
    </Box>
  );
}

function TaskListWidget({ stats, loading }) {
  const navigate = useNavigate();
  const overdue = stats?.overdueTasks || [];
  return (
    <Box sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={700}>Overdue Tasks</Typography>
        {overdue.length > 0 && <Chip label={overdue.length} size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(239,68,68,0.15)', color: '#EF4444', fontWeight: 700 }} />}
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 } }}>
        {loading ? [1,2,3].map(i => <Skeleton key={i} height={44} sx={{ mb: 0.5, borderRadius: 1.5 }} />) : overdue.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 1 }}>
            <CheckCircle sx={{ fontSize: 36, color: '#10B981', opacity: 0.5 }} />
            <Typography variant="body2" color="text.secondary">No overdue tasks</Typography>
          </Box>
        ) : overdue.map((task, i) => {
          const days = Math.ceil((new Date() - new Date(task.dueDate)) / 86400000);
          return (
            <Box key={i} onClick={() => navigate(`/projects/${task.project?._id || task.project}`)} sx={{ display: 'flex', gap: 1.5, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', borderRadius: 1.5, px: 0.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
              <Box sx={{ width: 4, height: 32, borderRadius: 99, bgcolor: '#EF4444', flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" fontWeight={600} noWrap sx={{ display: 'block', fontSize: '0.78rem' }}>{task.title}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{task.project?.name}</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 700, fontSize: '0.72rem', flexShrink: 0, alignSelf: 'center' }}>{days}d overdue</Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function ActivityFeedWidget({ stats, loading }) {
  const activity = stats?.recentActivity || [];
  return (
    <Box sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Recent Activity</Typography>
      <Box sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 } }}>
        {loading ? [1,2,3,4].map(i => <Skeleton key={i} height={48} sx={{ mb: 0.5, borderRadius: 1.5 }} />) : activity.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 1 }}>
            <Typography variant="body2" color="text.secondary">No recent activity</Typography>
          </Box>
        ) : activity.map((act, i) => {
          const color = ACTION_COLORS[act.action] || '#94A3B8';
          const icon = ACTION_ICONS[act.action] || '•';
          return (
            <Box key={i} sx={{ display: 'flex', gap: 1.25, py: 1, borderBottom: '1px solid rgba(255,255,255,0.04)', '&:last-child': { borderBottom: 'none' } }}>
              <Box sx={{ width: 26, height: 26, borderRadius: 1.5, bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color }}>{icon}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontSize: '0.76rem', lineHeight: 1.4 }}>
                  <b style={{ color: 'inherit' }}>{act.userName}</b>
                  <span style={{ color: '#64748B' }}> {act.action?.replace('_', ' ')} </span>
                  <b style={{ color: 'inherit' }}>{act.entityName}</b>
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem', display: 'block' }}>
                  {act.timestamp ? formatDistanceToNow(new Date(act.timestamp), { addSuffix: true }) : ''}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function DeadlineListWidget({ stats, loading }) {
  const navigate = useNavigate();
  const deadlines = stats?.upcomingDeadlines || [];
  return (
    <Box sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={700}>Upcoming Deadlines</Typography>
        {deadlines.length > 0 && <Chip icon={<Warning sx={{ fontSize: '12px !important' }} />} label={`${deadlines.length} due soon`} size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(245,158,11,0.12)', color: '#F59E0B', '& .MuiChip-icon': { color: '#F59E0B' } }} />}
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
          {[1,2,3,4].map(i => <Skeleton key={i} variant="rectangular" width={180} height={72} sx={{ borderRadius: 2, flexShrink: 0 }} />)}
        </Box>
      ) : deadlines.length === 0 ? (
        <Box sx={{ display: 'flex', alignItems: 'center', py: 3, gap: 2 }}>
          <CheckCircle sx={{ fontSize: 32, color: '#10B981', opacity: 0.6 }} />
          <Box>
            <Typography variant="body2" fontWeight={600} color="text.secondary">All clear!</Typography>
            <Typography variant="caption" color="text.secondary">No deadlines in the next 7 days</Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 } }}>
          {deadlines.map((task, i) => {
            const daysLeft = Math.ceil((new Date(task.dueDate) - new Date()) / 86400000);
            const isUrgent = daysLeft <= 2;
            return (
              <Box key={i} onClick={() => navigate(`/projects/${task.project?._id || task.project}`)} sx={{ minWidth: 170, flexShrink: 0, p: 1.5, borderRadius: 2, border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.2)'}`, bgcolor: isUrgent ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)', cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.15s' } }}>
                <Typography variant="caption" fontWeight={700} noWrap sx={{ display: 'block', mb: 0.25, fontSize: '0.78rem' }}>{task.title}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mb: 0.75, fontSize: '0.7rem' }}>{task.project?.name}</Typography>
                <Typography variant="caption" fontWeight={800} sx={{ color: isUrgent ? '#EF4444' : '#F59E0B', fontSize: '0.72rem' }}>
                  {daysLeft <= 0 ? 'Due today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d left`}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

// ─── Widget Wrapper ──────────────────────────────────────────────────────────

function WidgetCard({ widget, stats, loading, editMode, onRemove, dispatch }) {
  const type = widget.type;
  const renderContent = () => {
    if (type.startsWith('stat_')) return <StatCounterWidget stats={stats} loading={loading} type={type} />;
    if (type === 'bar_tasks_by_status') return <BarChartWidget stats={stats} loading={loading} />;
    if (type === 'pie_projects_by_status') return <PieChartWidget stats={stats} loading={loading} />;
    if (type === 'ai_insight') return <AIInsightWidget dispatch={dispatch} />;
    if (type === 'task_list_overdue') return <TaskListWidget stats={stats} loading={loading} />;
    if (type === 'activity_feed') return <ActivityFeedWidget stats={stats} loading={loading} />;
    if (type === 'deadline_list') return <DeadlineListWidget stats={stats} loading={loading} />;
    return <Box sx={{ p: 2.5 }}><Typography color="text.secondary">Unknown widget: {type}</Typography></Box>;
  };

  return (
    <Card sx={{ ...DARK_CARD, height: '100%', position: 'relative', overflow: 'hidden', transition: 'border-color 0.15s', ...(editMode && { borderColor: 'rgba(99,102,241,0.3)' }) }}>
      {editMode && (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #6366f1, #a855f7)', zIndex: 10 }} />
      )}
      {editMode && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', gap: 0.5 }}>
          <Tooltip title="Drag to reorder">
            <Box sx={{ width: 24, height: 24, borderRadius: 1.5, bgcolor: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab' }}>
              <DragIndicator sx={{ fontSize: 14, color: '#6366f1' }} />
            </Box>
          </Tooltip>
          <Tooltip title="Remove widget">
            <IconButton size="small" onClick={() => onRemove(widget.id)} sx={{ width: 24, height: 24, bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.2)' } }}>
              <Close sx={{ fontSize: 12 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      {renderContent()}
    </Card>
  );
}

// ─── Widget Picker Dialog ────────────────────────────────────────────────────

function AddWidgetDialog({ open, onClose, onAdd, currentTypes }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>Add Widget</Typography>
          <Typography variant="caption" color="text.secondary">Select a widget to add to your dashboard</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <Close sx={{ fontSize: 16 }} />
        </IconButton>
      </DialogTitle>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={1.5}>
          {WIDGET_CATALOG.map((wc) => {
            const alreadyAdded = currentTypes.includes(wc.type);
            const IconComp = wc.icon;
            return (
              <Grid item xs={6} key={wc.type}>
                <Box
                  onClick={() => !alreadyAdded && onAdd(wc)}
                  sx={{
                    p: 1.75, borderRadius: 2,
                    border: alreadyAdded ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.1)',
                    bgcolor: alreadyAdded ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                    cursor: alreadyAdded ? 'default' : 'pointer',
                    opacity: alreadyAdded ? 0.5 : 1,
                    transition: 'all 0.15s',
                    '&:hover': !alreadyAdded ? { bgcolor: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.4)' } : {},
                    display: 'flex', gap: 1.25, alignItems: 'center',
                  }}
                >
                  <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IconComp sx={{ fontSize: 16, color: '#6366f1' }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" fontWeight={600} noWrap sx={{ display: 'block', fontSize: '0.78rem' }}>{wc.label}</Typography>
                    {alreadyAdded && <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>Already added</Typography>}
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'julay_dashboard_layout';

export default function CustomDashboard() {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const loadLayout = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_LAYOUT;
  };

  const [layout, setLayout] = useState(loadLayout);

  const saveLayout = (newLayout) => {
    setLayout(newLayout);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout)); } catch {}
  };

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => { setStats(res?.data || res); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleRemoveWidget = (id) => {
    saveLayout(layout.filter(w => w.id !== id));
  };

  const handleAddWidget = (wc) => {
    const newWidget = { id: `w_${Date.now()}`, type: wc.type, cols: wc.cols };
    saveLayout([...layout, newWidget]);
    setAddDialogOpen(false);
  };

  const handleResetLayout = () => {
    saveLayout(DEFAULT_LAYOUT);
    dispatch(showSnackbar({ message: 'Dashboard reset to default layout', severity: 'info' }));
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Box>
      {/* Welcome Banner */}
      <Box sx={{ mb: 3, p: 3, borderRadius: 3, background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 45%, #4C1D95 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.03)' }} />
        <Box sx={{ position: 'absolute', bottom: -40, right: 100, width: 160, height: 160, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>
              {greeting}, {user?.name?.split(' ')[0]} 👋
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.75, fontSize: '0.875rem' }}>
              {loading ? 'Loading your dashboard...' : stats
                ? `${stats.tasks?.inProgress || 0} tasks in progress · ${stats.projects?.active || 0} active projects`
                : 'Welcome to your customizable dashboard'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small" variant="contained"
              startIcon={<Add sx={{ fontSize: 14 }} />}
              onClick={() => setAddDialogOpen(true)}
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' }, fontWeight: 700, fontSize: '0.78rem' }}
            >
              Add Widget
            </Button>
            <Button
              size="small" variant="contained"
              onClick={() => setEditMode(v => !v)}
              sx={{ bgcolor: editMode ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: `1px solid ${editMode ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.15)'}`, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }, fontWeight: 700, fontSize: '0.78rem' }}
            >
              {editMode ? 'Done Editing' : 'Edit Layout'}
            </Button>
          </Box>
        </Box>
      </Box>

      {editMode && (
        <Alert severity="info" sx={{ mb: 2, bgcolor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: 'text.primary', '& .MuiAlert-icon': { color: '#6366f1' } }} action={
          <Button size="small" color="inherit" onClick={handleResetLayout} sx={{ fontSize: '0.72rem' }}>Reset to Default</Button>
        }>
          Edit mode active — use the × button on each widget to remove it. Click "Add Widget" to add new ones.
        </Alert>
      )}

      {/* Widget Grid */}
      <Grid container spacing={2.5}>
        {layout.map((widget) => (
          <Grid item xs={12} sm={widget.cols <= 4 ? 6 : 12} md={widget.cols} key={widget.id} sx={{ minHeight: widget.type === 'ai_insight' ? 120 : widget.type === 'deadline_list' ? 140 : widget.type.startsWith('stat_') ? 120 : 280 }}>
            <WidgetCard
              widget={widget}
              stats={stats}
              loading={loading}
              editMode={editMode}
              onRemove={handleRemoveWidget}
              dispatch={dispatch}
            />
          </Grid>
        ))}
      </Grid>

      <AddWidgetDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={handleAddWidget}
        currentTypes={layout.map(w => w.type)}
      />
    </Box>
  );
}
