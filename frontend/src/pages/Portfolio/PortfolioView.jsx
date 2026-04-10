import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Avatar, AvatarGroup,
  Button, TextField, InputAdornment, Select, MenuItem, FormControl,
  InputLabel, LinearProgress, Tooltip, Skeleton, Grid, Divider,
} from '@mui/material';
import {
  Search, FolderOpen, Group, CheckCircle, Warning, Error as ErrorIcon,
  ArrowForward, TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { portfolioAPI } from '../../services/api.js';

// ── helpers ────────────────────────────────────────────────────────────────
const HEALTH_CONFIG = {
  on_track:  { label: 'On Track',  color: '#10B981', bg: '#D1FAE5', icon: CheckCircle },
  at_risk:   { label: 'At Risk',   color: '#F59E0B', bg: '#FEF3C7', icon: Warning },
  off_track: { label: 'Off Track', color: '#EF4444', bg: '#FEE2E2', icon: ErrorIcon },
};

const STATUS_COLORS = { active: 'success', completed: 'default', on_hold: 'warning', archived: 'default' };

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date';

const PROJECT_PALETTE = ['#6366F1','#8B5CF6','#EC4899','#F59E0B','#10B981','#3B82F6','#EF4444','#14B8A6'];
const projectColor = (name = '') => PROJECT_PALETTE[name.charCodeAt(0) % PROJECT_PALETTE.length];

// ── task breakdown mini bar ────────────────────────────────────────────────
function TaskBreakdownBar({ todo = 0, inProgress = 0, done = 0 }) {
  const total = todo + inProgress + done;
  if (total === 0) return <Box sx={{ height: 6, backgroundColor: '#F1F5F9', borderRadius: 3 }} />;
  const segments = [
    { pct: (done / total) * 100,       color: '#10B981' },
    { pct: (inProgress / total) * 100, color: '#F59E0B' },
    { pct: (todo / total) * 100,       color: '#E2E8F0' },
  ];
  return (
    <Tooltip title={`To Do: ${todo} · In Progress: ${inProgress} · Done: ${done}`}>
      <Box sx={{ height: 6, borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
        {segments.map((s, i) => s.pct > 0 && (
          <Box key={i} sx={{ width: `${s.pct}%`, backgroundColor: s.color, transition: 'width 0.3s' }} />
        ))}
      </Box>
    </Tooltip>
  );
}

// ── project card ───────────────────────────────────────────────────────────
function ProjectCard({ project }) {
  const navigate = useNavigate();
  const health = HEALTH_CONFIG[project.health || 'on_track'] || HEALTH_CONFIG.on_track;
  const HealthIcon = health.icon;
  const members = Array.isArray(project.members) ? project.members : [];
  const pColor = projectColor(project.name);

  const tasks = project.tasks || {};
  const totalTasks = project.totalTasks || (tasks.todo || 0) + (tasks.inProgress || 0) + (tasks.done || 0);
  const doneTasks  = project.completedTasks || tasks.done || 0;
  const progress   = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <Card elevation={0} sx={{ height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 2, transition: 'all 0.2s', '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.1)', transform: 'translateY(-2px)', borderColor: pColor } }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: '20px !important' }}>
        {/* Top */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: pColor, flexShrink: 0 }} />
            <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ flex: 1 }}>{project.name}</Typography>
          </Box>
          <Chip label={project.status || 'active'} size="small" color={STATUS_COLORS[project.status] || 'default'} sx={{ textTransform: 'capitalize', fontSize: '0.7rem', ml: 1 }} />
        </Box>

        {/* Health badge */}
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, borderRadius: 1, backgroundColor: health.bg, mb: 2, width: 'fit-content' }}>
          <HealthIcon sx={{ fontSize: 14, color: health.color }} />
          <Typography variant="caption" fontWeight={700} sx={{ color: health.color }}>{health.label}</Typography>
        </Box>

        {/* Description */}
        {project.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {project.description}
          </Typography>
        )}

        {/* Progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography variant="caption" color="text.secondary">Progress</Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color: '#6366F1' }}>{progress}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3, backgroundColor: '#E2E8F0', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', borderRadius: 3 } }} />
        </Box>

        {/* Task breakdown */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Task Breakdown</Typography>
          <TaskBreakdownBar todo={tasks.todo || 0} inProgress={tasks.inProgress || 0} done={doneTasks} />
        </Box>

        {/* Stats row */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircle sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">{doneTasks}/{totalTasks} tasks</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Group sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">{members.length} members</Typography>
          </Box>
        </Box>

        <Typography variant="caption" color="text.disabled" sx={{ mb: 2, display: 'block' }}>
          Due: {formatDate(project.dueDate || project.endDate)}
        </Typography>

        {/* Team avatars */}
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.7rem', border: '2px solid white' } }}>
            {members.slice(0, 6).map((m, i) => {
              const name = typeof m === 'object' ? m.name : m;
              return (
                <Tooltip key={i} title={name}>
                  <Avatar sx={{ width: 28, height: 28, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', fontSize: '0.7rem' }}>
                    {name?.[0]?.toUpperCase()}
                  </Avatar>
                </Tooltip>
              );
            })}
          </AvatarGroup>
          <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate(`/dashboard/projects/${project._id}`)}
            sx={{ color: '#6366F1', fontWeight: 600, fontSize: '0.78rem' }}>
            View Project
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── skeleton card ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5 }}>
      <Skeleton width="70%" height={24} sx={{ mb: 1 }} />
      <Skeleton width="40%" height={20} sx={{ mb: 2 }} />
      <Skeleton height={8} sx={{ mb: 1, borderRadius: 2 }} />
      <Skeleton width="90%" height={16} sx={{ mb: 0.5 }} />
      <Skeleton width="60%" height={16} sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Skeleton variant="circular" width={28} height={28} />
        <Skeleton variant="circular" width={28} height={28} />
        <Skeleton variant="circular" width={28} height={28} />
      </Box>
    </Card>
  );
}

// ── header stat ────────────────────────────────────────────────────────────
function HeaderStat({ label, value, color }) {
  return (
    <Box sx={{ textAlign: 'center', px: 2 }}>
      <Typography variant="h4" fontWeight={800} sx={{ color: color || 'white', lineHeight: 1 }}>{value}</Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>{label}</Typography>
    </Box>
  );
}

// ── main ───────────────────────────────────────────────────────────────────
export default function PortfolioView() {
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [search, setSearch]       = useState('');

  useEffect(() => {
    portfolioAPI.getPortfolio()
      .then(res => {
        const data = res?.data || res;
        setProjects(Array.isArray(data) ? data : data?.projects || []);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (healthFilter !== 'all' && p.health !== healthFilter) return false;
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const total    = projects.length;
  const onTrack  = projects.filter(p => p.health === 'on_track').length;
  const atRisk   = projects.filter(p => p.health === 'at_risk').length;
  const offTrack = projects.filter(p => p.health === 'off_track').length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Hero header */}
      <Box sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', p: { xs: 3, md: 4 }, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ color: 'white', mb: 0.5 }}>Portfolio Overview</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem' }}>
              Executive view across all active projects
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <TrendingUp sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 20 }} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mt: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
          <HeaderStat label="Total Projects" value={loading ? '—' : total} />
          <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
          <HeaderStat label="On Track"       value={loading ? '—' : onTrack}  color="#6EE7B7" />
          <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
          <HeaderStat label="At Risk"        value={loading ? '—' : atRisk}   color="#FCD34D" />
          <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
          <HeaderStat label="Off Track"      value={loading ? '—' : offTrack} color="#FCA5A5" />
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search projects…"
          size="small"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.disabled' }} /></InputAdornment> }}
          sx={{ minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="on_hold">On Hold</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Health</InputLabel>
          <Select value={healthFilter} label="Health" onChange={e => setHealthFilter(e.target.value)}>
            <MenuItem value="all">All Health</MenuItem>
            <MenuItem value="on_track">On Track</MenuItem>
            <MenuItem value="at_risk">At Risk</MenuItem>
            <MenuItem value="off_track">Off Track</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {filtered.length} project{filtered.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Grid */}
      {loading ? (
        <Grid container spacing={2.5}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} lg={4} key={i}><SkeletonCard /></Grid>
          ))}
        </Grid>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 12 }}>
          <FolderOpen sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
          <Typography color="text.secondary">
            {projects.length === 0 ? 'No projects found. Create your first project to get started.' : 'No projects match your filters.'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map(p => (
            <Grid item xs={12} sm={6} lg={4} key={p._id}>
              <ProjectCard project={p} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Summary footer */}
      {!loading && projects.length > 0 && (
        <Box sx={{ mt: 4, p: 3, borderRadius: 2, backgroundColor: '#F8FAFC', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Portfolio Summary</Typography>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Tasks', value: projects.reduce((s, p) => s + (p.totalTasks || 0), 0) },
              { label: 'Completed',   value: projects.reduce((s, p) => s + (p.completedTasks || 0), 0) },
              { label: 'Total Members', value: [...new Set(projects.flatMap(p => (p.members || []).map(m => (typeof m === 'object' ? m._id : m))))].length },
              { label: 'Avg. Progress', value: projects.length > 0 ? `${Math.round(projects.reduce((s, p) => {
                  const t = p.totalTasks || 1; return s + ((p.completedTasks || 0) / t) * 100;
                }, 0) / projects.length)}%` : '0%' },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography variant="h5" fontWeight={800} sx={{ color: '#6366F1', lineHeight: 1 }}>{value}</Typography>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

