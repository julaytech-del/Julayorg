import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, LinearProgress, Avatar, Chip, Skeleton, AvatarGroup, Divider, Button } from '@mui/material';
import { TrendingUp, Assignment, Group, CheckCircle, ArrowUpward, ArrowForward, Warning, AutoAwesome, FolderOpen } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { dashboardAPI } from '../services/api.js';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Snackbar } from '@mui/material';
import StatusChip from '../components/common/StatusChip.jsx';
import PriorityChip from '../components/common/PriorityChip.jsx';
import OnboardingWizard from '../components/common/OnboardingWizard.jsx';

const STATUS_COLORS = { planned: '#94A3B8', in_progress: '#4F46E5', blocked: '#EF4444', review: '#F59E0B', done: '#10B981' };
const PIE_COLORS = ['#4F46E5', '#0EA5E9', '#F59E0B', '#10B981', '#EF4444'];

const ACTION_MAP = {
  created: { icon: '✦', color: '#4F46E5', bg: '#EEF2FF' },
  completed: { icon: '✓', color: '#10B981', bg: '#ECFDF5' },
  updated: { icon: '↻', color: '#F59E0B', bg: '#FFFBEB' },
  assigned: { icon: '→', color: '#0EA5E9', bg: '#F0F9FF' },
  status_changed: { icon: '◈', color: '#8B5CF6', bg: '#F5F3FF' },
  commented: { icon: '◉', color: '#64748B', bg: '#F8FAFC' },
  ai_generated: { icon: '★', color: '#4F46E5', bg: '#EEF2FF' },
  deleted: { icon: '×', color: '#EF4444', bg: '#FEF2F2' },
};

function StatCard({ title, value, subtitle, icon, color, loading, badge }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem', display: 'block', mb: 0.75 }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color: 'text.primary', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
              {loading ? <Skeleton width={60} height={40} /> : value ?? '—'}
            </Typography>
            {subtitle && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
                {loading ? <Skeleton width={80} height={18} /> : (
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.76rem' }}>{subtitle}</Typography>
                )}
              </Box>
            )}
          </Box>
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, backgroundColor: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {React.cloneElement(icon, { sx: { color, fontSize: 20 } })}
          </Box>
        </Box>
        {badge && (
          <Chip label={badge} size="small" sx={{ mt: 1.5, height: 20, fontSize: '0.68rem', fontWeight: 700, backgroundColor: `${color}14`, color }} />
        )}
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <Box sx={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, p: 1.5, boxShadow: '0 4px 12px rgba(15,23,42,0.1)' }}>
        <Typography variant="caption" fontWeight={700} display="block" sx={{ textTransform: 'capitalize', mb: 0.25 }}>{label}</Typography>
        <Typography variant="caption" fontWeight={800} sx={{ color: payload[0]?.fill || '#4F46E5', fontSize: '1rem' }}>{payload[0]?.value}</Typography>
      </Box>
    );
  }
  return null;
};

export default function Dashboard() {
  const user = useSelector(s => s.auth.user);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgraded, setUpgraded] = useState(searchParams.get('upgraded') === '1');

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => { setStats(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('dashboard.greeting.morning') : hour < 17 ? t('dashboard.greeting.afternoon') : t('dashboard.greeting.evening');

  const taskBarData = stats
    ? Object.entries(stats.tasks.byStatus || {}).map(([k, v]) => ({ name: k.replace('_', ' '), value: v, fill: STATUS_COLORS[k] || '#94A3B8' }))
    : [];

  const projectPieData = stats
    ? Object.entries(stats.projects.byStatus || {}).filter(([, v]) => v > 0).map(([k, v], i) => ({ name: k.replace('_', ' '), value: v, color: PIE_COLORS[i] }))
    : [];

  return (
    <Box>
      <OnboardingWizard />
      <Snackbar open={upgraded} autoHideDuration={6000} onClose={() => setUpgraded(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setUpgraded(false)} sx={{ fontWeight: 700 }}>
          🎉 Welcome to Julay Pro! AI Studio is now unlocked.
        </Alert>
      </Snackbar>
      {/* Welcome Banner */}
      <Box sx={{
        mb: 3, p: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 45%, #4C1D95 100%)',
        color: 'white', position: 'relative', overflow: 'hidden'
      }}>
        <Box sx={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <Box sx={{ position: 'absolute', bottom: -40, right: 100, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>
              {greeting}, {user?.name?.split(' ')[0]} 👋
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.75, fontSize: '0.875rem' }}>
              {loading ? t('dashboard.loading') : (
                stats
                  ? `${t('dashboard.activeTasks', { count: stats.tasks.inProgress })} · ${stats.tasks.overdue > 0 ? `${t('dashboard.overdueCount', { count: stats.tasks.overdue })} · ` : ''}${t('dashboard.activeProjects', { count: stats.projects.active })}`
                  : t('dashboard.loading')
              )}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AutoAwesome sx={{ fontSize: 15 }} />}
              onClick={() => navigate('/ai')}
              size="small"
              sx={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.22)' }, fontWeight: 700, fontSize: '0.78rem' }}
            >
              {t('dashboard.aiStudio')}
            </Button>
            <Button
              variant="contained"
              startIcon={<FolderOpen sx={{ fontSize: 15 }} />}
              onClick={() => navigate('/projects')}
              size="small"
              sx={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }, fontWeight: 700, fontSize: '0.78rem' }}
            >
              {t('dashboard.projects')}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title={t('dashboard.stats.totalProjects')}
            value={stats?.projects.total}
            subtitle={t('dashboard.stats.activeCompleted', { active: stats?.projects.active || 0, completed: stats?.projects.completed || 0 })}
            icon={<TrendingUp />} color="#4F46E5" loading={loading}
            badge={stats?.projects.active ? t('dashboard.stats.running', { count: stats.projects.active }) : null}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title={t('dashboard.stats.activeTasks')}
            value={stats?.tasks.inProgress}
            subtitle={t('dashboard.stats.overdueTotal', { overdue: stats?.tasks.overdue || 0, total: stats?.tasks.total || 0 })}
            icon={<Assignment />} color="#0EA5E9" loading={loading}
            badge={stats?.tasks.overdue > 0 ? t('dashboard.stats.overdueBadge', { count: stats.tasks.overdue }) : null}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title={t('dashboard.stats.teamMembers')}
            value={stats?.team.total}
            subtitle={t('dashboard.stats.activeToday', { count: stats?.team.active || 0 })}
            icon={<Group />} color="#10B981" loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title={t('dashboard.stats.completionRate')}
            value={stats ? `${stats.completionRate}%` : null}
            subtitle={t('dashboard.stats.tasksCompleted', { count: stats?.tasks.completed || 0 })}
            icon={<CheckCircle />} color="#F59E0B" loading={loading}
            badge={stats?.completionRate >= 70 ? t('dashboard.stats.onTrack') : stats?.completionRate > 0 ? t('dashboard.stats.needsAttention') : null}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Tasks by Status Bar Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{t('dashboard.charts.taskDistribution')}</Typography>
                  <Typography variant="caption" color="text.secondary">{t('dashboard.charts.byStatus')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.75 }}>
                  {Object.entries(STATUS_COLORS).map(([k, v]) => (
                    <Chip key={k} label={k.replace('_', ' ')} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, backgroundColor: `${v}18`, color: v, textTransform: 'capitalize' }} />
                  ))}
                </Box>
              </Box>
              {loading ? <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={taskBarData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }} barSize={32}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B', textTransform: 'capitalize' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(15,23,42,0.03)' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {taskBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Projects Pie Chart */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={700}>{t('dashboard.charts.projectStatus')}</Typography>
                <Typography variant="caption" color="text.secondary">{t('dashboard.charts.portfolioBreakdown')}</Typography>
              </Box>
              {loading ? <Skeleton variant="circular" width={180} height={180} sx={{ mx: 'auto' }} /> : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={projectPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={3}>
                        {projectPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1 }}>
                    {projectPieData.map((entry, i) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color }} />
                          <Typography variant="caption" sx={{ textTransform: 'capitalize', color: 'text.secondary', fontSize: '0.75rem' }}>{entry.name}</Typography>
                        </Box>
                        <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.78rem' }}>{entry.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Activity + Deadlines */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>{t('dashboard.activity.title')}</Typography>
                <Typography variant="caption" color="text.secondary">{t('dashboard.activity.subtitle')}</Typography>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { background: '#E2E8F0', borderRadius: 2 } }}>
              {loading
                ? [1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={52} sx={{ mb: 0.5, borderRadius: 2 }} />)
                : (stats?.recentActivity || []).map((act, i) => {
                  const am = ACTION_MAP[act.action] || ACTION_MAP.updated;
                  return (
                    <Box key={i} sx={{ display: 'flex', gap: 1.5, py: 1.25, borderBottom: '1px solid #F8FAFC', '&:last-child': { borderBottom: 'none' }, alignItems: 'flex-start' }}>
                      <Box sx={{ width: 28, height: 28, borderRadius: 2, backgroundColor: am.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: am.color }}>{am.icon}</Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                          <b style={{ color: '#0F172A' }}>{act.userName}</b>
                          <span style={{ color: '#475569' }}> {act.action.replace('_', ' ')} </span>
                          <b style={{ color: '#0F172A' }}>{act.entityName}</b>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
                          {formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })
              }
              {!loading && !stats?.recentActivity?.length && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 6 }}>
                  <Typography color="text.secondary" variant="body2">{t('dashboard.activity.empty')}</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>{t('dashboard.deadlines.title')}</Typography>
                <Typography variant="caption" color="text.secondary">{t('dashboard.deadlines.subtitle')}</Typography>
              </Box>
              {stats?.upcomingDeadlines?.length > 0 && (
                <Chip icon={<Warning sx={{ fontSize: '13px !important' }} />} label={t('dashboard.deadlines.dueSoon', { count: stats.upcomingDeadlines.length })} size="small" sx={{ backgroundColor: '#FFF7ED', color: '#D97706', fontWeight: 700, fontSize: '0.72rem', height: 22, '& .MuiChip-icon': { color: '#D97706' } }} />
              )}
            </Box>
            <Divider />
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { background: '#E2E8F0', borderRadius: 2 } }}>
              {loading
                ? [1, 2, 3, 4].map(i => <Skeleton key={i} height={56} sx={{ mb: 0.5, borderRadius: 2 }} />)
                : (stats?.upcomingDeadlines || []).map((task, i) => {
                  const daysLeft = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                  const isUrgent = daysLeft <= 2;
                  return (
                    <Box
                      key={i}
                      onClick={() => navigate(`/projects/${task.project?._id || task.project}`)}
                      sx={{ display: 'flex', gap: 1.5, py: 1.5, borderBottom: '1px solid #F8FAFC', '&:last-child': { borderBottom: 'none' }, alignItems: 'center', cursor: 'pointer', borderRadius: 2, px: 1, mx: -1, '&:hover': { backgroundColor: '#F8FAFC' }, transition: 'background 0.12s' }}
                    >
                      <Box sx={{ width: 4, height: 36, borderRadius: 99, backgroundColor: isUrgent ? '#EF4444' : '#F59E0B', flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.82rem' }}>{task.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>{task.project?.name}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                        <Typography variant="caption" fontWeight={800} sx={{ color: isUrgent ? '#EF4444' : '#F59E0B', fontSize: '0.78rem', display: 'block' }}>
                          {daysLeft <= 0 ? t('dashboard.deadlines.today') : daysLeft === 1 ? t('dashboard.deadlines.tomorrow') : t('dashboard.deadlines.days', { count: daysLeft })}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem' }}>
                          {format(new Date(task.dueDate), 'MMM d')}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })
              }
              {!loading && !stats?.upcomingDeadlines?.length && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 6 }}>
                  <CheckCircle sx={{ fontSize: 40, color: '#10B981', mb: 1.5, opacity: 0.7 }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>{t('dashboard.deadlines.allClear')}</Typography>
                  <Typography variant="caption" color="text.secondary">{t('dashboard.deadlines.allClearSub')}</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Projects */}
      <Card>
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>{t('dashboard.recentProjects.title')}</Typography>
            <Typography variant="caption" color="text.secondary">{t('dashboard.recentProjects.subtitle')}</Typography>
          </Box>
          <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 14 }} />} onClick={() => navigate('/projects')} sx={{ color: '#4F46E5', fontWeight: 600, fontSize: '0.78rem' }}>
            {t('dashboard.recentProjects.viewAll')}
          </Button>
        </Box>
        <Divider />
        <Box sx={{ p: 2, display: 'flex', gap: 2, overflowX: 'auto', pb: 2.5, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { background: '#E2E8F0', borderRadius: 2 } }}>
          {loading
            ? [1, 2, 3, 4].map(i => <Skeleton key={i} variant="rectangular" width={220} height={110} sx={{ borderRadius: 2, flexShrink: 0 }} />)
            : (stats?.recentProjects || []).map(proj => (
              <Card
                key={proj._id} variant="outlined"
                onClick={() => navigate(`/projects/${proj._id}`)}
                sx={{ minWidth: 220, flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3, borderColor: '#CBD5E1' } }}
              >
                <Box sx={{ height: 4, background: `linear-gradient(90deg, ${proj.color || '#4F46E5'}, ${proj.color || '#4F46E5'}88)`, borderRadius: '12px 12px 0 0' }} />
                <CardContent sx={{ p: 1.75 }}>
                  <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ fontSize: '0.84rem', mb: 0.5 }}>{proj.name}</Typography>
                  <StatusChip status={proj.status} />
                  <Box sx={{ mt: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{t('common.progress')}</Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.72rem', color: proj.color || '#4F46E5' }}>{proj.progress?.percentage || 0}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={proj.progress?.percentage || 0} sx={{ height: 4, '& .MuiLinearProgress-bar': { backgroundColor: proj.color || '#4F46E5' } }} />
                  </Box>
                </CardContent>
              </Card>
            ))
          }
          {!loading && !stats?.recentProjects?.length && (
            <Box sx={{ py: 3, px: 2, color: 'text.secondary' }}>
              <Typography variant="body2">{t('dashboard.recentProjects.empty')}</Typography>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
}
