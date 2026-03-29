import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip, LinearProgress,
  Avatar, AvatarGroup, IconButton, Menu, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem as MuiMenuItem,
  InputAdornment, Tabs, Tab, CircularProgress, Alert, Accordion,
  AccordionSummary, AccordionDetails, Divider, Tooltip
} from '@mui/material';
import {
  Add, MoreVert, Search, AutoAwesome, FolderOff, Edit, Delete,
  OpenInNew, Psychology, CheckCircle, ExpandMore, Rocket,
  TuneRounded, GridViewRounded, ViewListRounded
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fetchProjects, createProject, deleteProject } from '../../store/slices/projectSlice.js';
import { generatePlan } from '../../store/slices/aiSlice.js';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import { usersAPI } from '../../services/api.js';
import StatusChip from '../../components/common/StatusChip.jsx';
import PriorityChip from '../../components/common/PriorityChip.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Projects' },
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
];

const COLORS = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const EXAMPLE_PROMPTS = [
  'Build a DevOps platform for cloud infrastructure management',
  'Launch an e-commerce mobile app for iOS and Android',
  'Develop a CRM system for a B2B sales team',
  'Create a marketing automation platform with analytics',
  'Build an HR management system with payroll integration',
];

const AI_STEPS = [
  'Analyzing project description...',
  'Detecting industry and tech stack...',
  'Creating project structure...',
  'Generating goals and milestones...',
  'Breaking down into tasks...',
  'Assigning team members...',
  'Calculating timeline...',
];

function CreateProjectDialog({ open, onClose, onCreated }) {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const { loading: aiLoading } = useSelector(s => s.ai);
  const [tab, setTab] = useState(0);
  const [step, setStep] = useState(0);
  const [aiResult, setAiResult] = useState(null);
  const [users, setUsers] = useState([]);

  // Manual form
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '', priority: 'medium', color: '#4F46E5' });

  // AI form
  const [prompt, setPrompt] = useState('');
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    if (open) {
      usersAPI.getAll().then(res => setUsers(res.data || [])).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    let interval;
    if (aiLoading) {
      interval = setInterval(() => setStep(prev => (prev + 1) % AI_STEPS.length), 1200);
    } else {
      setStep(0);
    }
    return () => clearInterval(interval);
  }, [aiLoading]);

  const handleClose = () => {
    setTab(0);
    setAiResult(null);
    setPrompt('');
    setStartDate('');
    setForm({ name: '', description: '', startDate: '', endDate: '', priority: 'medium', color: '#4F46E5' });
    onClose();
  };

  const handleManualSubmit = async e => {
    e.preventDefault();
    const res = await dispatch(createProject({ ...form, organization: user.organization?._id || user.organization, createdBy: user._id }));
    if (!res.error) {
      dispatch(showSnackbar({ message: 'Project created successfully!' }));
      onCreated?.();
      handleClose();
    } else {
      dispatch(showSnackbar({ message: res.error.message || 'Failed to create project', severity: 'error' }));
    }
  };

  const handleAIGenerate = async () => {
    if (!prompt.trim()) return;
    const res = await dispatch(generatePlan({
      prompt,
      startDate: startDate || new Date().toISOString(),
      teamUserIds: users.slice(0, 8).map(u => u._id)
    }));
    if (!res.error) {
      setAiResult(res.payload);
      dispatch(showSnackbar({ message: 'Project plan generated successfully!' }));
      onCreated?.();
    } else {
      dispatch(showSnackbar({ message: res.payload || 'AI generation failed', severity: 'error' }));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 0, pt: 2.5, px: 3 }}>
        <Typography variant="h6" fontWeight={700}>New Project</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.82rem' }}>
          Create manually or let AI generate a complete plan instantly
        </Typography>
      </DialogTitle>

      <Box sx={{ px: 3, pt: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, p: 0.5, backgroundColor: '#F1F5F9', borderRadius: 2.5 }}>
          <Box
            onClick={() => setTab(0)}
            sx={{
              flex: 1, py: 1, px: 1.5, borderRadius: 2, cursor: 'pointer', textAlign: 'center',
              backgroundColor: tab === 0 ? 'white' : 'transparent',
              boxShadow: tab === 0 ? '0 1px 4px rgba(15,23,42,0.08)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <Typography variant="caption" fontWeight={700} sx={{ color: tab === 0 ? '#0F172A' : '#64748B', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <Edit sx={{ fontSize: 14 }} /> Manual Setup
            </Typography>
          </Box>
          <Box
            onClick={() => { setTab(1); setAiResult(null); }}
            sx={{
              flex: 1, py: 1, px: 1.5, borderRadius: 2, cursor: 'pointer', textAlign: 'center',
              backgroundColor: tab === 1 ? 'white' : 'transparent',
              boxShadow: tab === 1 ? '0 1px 4px rgba(15,23,42,0.08)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <Typography variant="caption" fontWeight={700} sx={{ color: tab === 1 ? '#4F46E5' : '#64748B', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <AutoAwesome sx={{ fontSize: 14 }} /> AI Generate
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* MANUAL TAB */}
      {tab === 0 && (
        <form onSubmit={handleManualSubmit}>
          <DialogContent sx={{ pt: 2, px: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Project Name *" name="name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required fullWidth placeholder="e.g., Lumex Company Platform" />
            <TextField label="Description" name="description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} multiline rows={2} fullWidth placeholder="Brief description of the project..." />
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Start Date" name="startDate" type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6}><TextField label="End Date" name="endDate" type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
            </Grid>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={5}>
                <TextField select label="Priority" name="priority" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} fullWidth>
                  {PRIORITIES.map(p => <MuiMenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</MuiMenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={7}>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.75} fontWeight={600}>Project Color</Typography>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <Tooltip title={c} key={c}>
                      <Box
                        onClick={() => setForm(p => ({ ...p, color: c }))}
                        sx={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: c, cursor: 'pointer', transition: 'all 0.12s', transform: form.color === c ? 'scale(1.2)' : 'scale(1)', boxShadow: form.color === c ? `0 0 0 2px white, 0 0 0 3.5px ${c}` : 'none' }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ px: 3 }}>Create Project</Button>
          </DialogActions>
        </form>
      )}

      {/* AI TAB */}
      {tab === 1 && (
        <DialogContent sx={{ pt: 2, px: 3 }}>
          {!aiResult ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Example prompts */}
              <Box>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem', display: 'block', mb: 1 }}>
                  Quick Examples
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {EXAMPLE_PROMPTS.map((ex, i) => (
                    <Chip
                      key={i}
                      label={ex}
                      size="small"
                      onClick={() => setPrompt(ex)}
                      variant="outlined"
                      sx={{ fontSize: '0.72rem', cursor: 'pointer', borderColor: '#E2E8F0', color: '#475569', '&:hover': { backgroundColor: '#EEF2FF', borderColor: '#6366F1', color: '#4F46E5' }, transition: 'all 0.12s' }}
                    />
                  ))}
                </Box>
              </Box>

              <TextField
                fullWidth multiline rows={4}
                placeholder="Describe your project in detail... e.g., 'Build a DevOps platform for Lumex Company to manage cloud infrastructure, CI/CD pipelines, monitoring dashboards, and team collaboration tools.'"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.875rem' } }}
              />

              <TextField
                label="Start Date (optional)"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ maxWidth: 200 }}
              />

              {aiLoading && (
                <Box sx={{ p: 2, backgroundColor: '#EEF2FF', borderRadius: 2.5, border: '1px solid #C7D2FE' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <CircularProgress size={16} sx={{ color: '#4F46E5' }} />
                    <Typography variant="body2" fontWeight={600} color="primary.main" sx={{ fontSize: '0.82rem' }}>
                      {AI_STEPS[step]}
                    </Typography>
                  </Box>
                  <LinearProgress sx={{ borderRadius: 99, backgroundColor: '#C7D2FE', '& .MuiLinearProgress-bar': { backgroundColor: '#4F46E5' } }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontSize: '0.72rem' }}>
                    AI is building a complete project plan — goals, tasks, timeline, and team assignments...
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1, pb: 0.5 }}>
                <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
                <Button
                  fullWidth variant="contained" size="large"
                  disabled={aiLoading || !prompt.trim()}
                  onClick={handleAIGenerate}
                  startIcon={aiLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
                  sx={{ py: 1.25, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', fontWeight: 700, boxShadow: '0 4px 12px rgba(79,70,229,0.3)', '&:hover': { boxShadow: '0 6px 16px rgba(79,70,229,0.4)' } }}
                >
                  {aiLoading ? 'Generating Plan...' : 'Generate Full Project Plan'}
                </Button>
              </Box>
            </Box>
          ) : (
            /* AI Result */
            <Box sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, p: 1.5, backgroundColor: '#ECFDF5', borderRadius: 2, border: '1px solid #A7F3D0' }}>
                <CheckCircle sx={{ color: '#10B981', fontSize: 22 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#065F46', fontSize: '0.85rem' }}>Project Generated Successfully!</Typography>
                  <Typography variant="caption" sx={{ color: '#047857' }}>{aiResult.project?.name}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
                <Chip label={`Industry: ${aiResult.planAnalysis?.industry || 'Technology'}`} size="small" sx={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontWeight: 600, fontSize: '0.72rem' }} />
                <Chip label={`${aiResult.stats?.goalsCreated || 0} Goals`} size="small" sx={{ backgroundColor: '#F0FDF4', color: '#059669', fontWeight: 600, fontSize: '0.72rem' }} />
                <Chip label={`${aiResult.stats?.tasksCreated || 0} Tasks`} size="small" sx={{ backgroundColor: '#FFF7ED', color: '#D97706', fontWeight: 600, fontSize: '0.72rem' }} />
                <Chip label={`${aiResult.stats?.teamAssigned || 0} Assigned`} size="small" sx={{ backgroundColor: '#F5F3FF', color: '#7C3AED', fontWeight: 600, fontSize: '0.72rem' }} />
              </Box>

              <Box sx={{ maxHeight: 260, overflowY: 'auto', pr: 0.5 }}>
                {(aiResult.goals || []).map((goal, i) => (
                  <Box key={i} sx={{ mb: 1, border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1, backgroundColor: '#F8FAFC' }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: goal.color || '#4F46E5', flexShrink: 0 }} />
                      <Typography variant="body2" fontWeight={600} flex={1} sx={{ fontSize: '0.82rem' }}>{goal.title}</Typography>
                      <Chip label={`${goal.tasks?.length || 0} tasks`} size="small" sx={{ height: 18, fontSize: '0.65rem', backgroundColor: '#EEF2FF', color: '#4F46E5' }} />
                    </Box>
                    <Box sx={{ px: 1.5, py: 0.5 }}>
                      {(goal.tasks || []).slice(0, 3).map((task, j) => (
                        <Box key={j} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.4 }}>
                          <Box sx={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#CBD5E1', flexShrink: 0 }} />
                          <Typography variant="caption" sx={{ flex: 1, color: '#475569', fontSize: '0.75rem' }} noWrap>{task.title}</Typography>
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem', flexShrink: 0 }}>{task.estimatedHours}h</Typography>
                        </Box>
                      ))}
                      {(goal.tasks?.length || 0) > 3 && (
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem', pl: 1.5 }}>
                          +{goal.tasks.length - 3} more tasks
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button onClick={handleClose} variant="outlined" sx={{ flex: 1 }}>Close</Button>
                <Button
                  variant="contained"
                  startIcon={<OpenInNew />}
                  sx={{ flex: 1, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}
                  onClick={() => { handleClose(); }}
                >
                  View Project
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}

function ProjectCard({ project, onDelete, onOpen }) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const navigate = useNavigate();
  const accentColor = project.color || '#4F46E5';

  const progress = project.progress?.percentage || 0;
  const progressColor = progress >= 75 ? '#10B981' : progress >= 40 ? '#F59E0B' : '#4F46E5';

  return (
    <Card
      onClick={() => navigate(`/projects/${project._id}`)}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0px 12px 28px rgba(15,23,42,0.1)',
          borderColor: '#CBD5E1'
        }
      }}
    >
      {/* Top accent bar */}
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }} />

      <CardContent sx={{ p: 2.5 }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: accentColor, flexShrink: 0 }} />
              <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ fontSize: '0.92rem' }}>{project.name}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.78rem', display: 'block', pl: 2.25 }}>
              {project.description || 'No description'}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={e => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
            sx={{ mt: -0.25, width: 28, height: 28, '&:hover': { backgroundColor: '#F1F5F9' } }}
          >
            <MoreVert sx={{ fontSize: 16, color: '#94A3B8' }} />
          </IconButton>
        </Box>

        {/* Chips */}
        <Box sx={{ display: 'flex', gap: 0.6, mb: 2, flexWrap: 'wrap' }}>
          <StatusChip status={project.status} />
          <PriorityChip priority={project.priority} />
          {project.aiGenerated && (
            <Chip
              label="AI"
              size="small"
              icon={<AutoAwesome sx={{ fontSize: '11px !important' }} />}
              sx={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: '0.68rem', height: 20 }}
            />
          )}
        </Box>

        {/* Progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Progress
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" fontWeight={700} sx={{ color: progressColor, fontSize: '0.78rem' }}>
                {progress}%
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                ({project.progress?.completedTasks || 0}/{project.progress?.totalTasks || 0})
              </Typography>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 99,
              backgroundColor: '#F1F5F9',
              '& .MuiLinearProgress-bar': { borderRadius: 99, backgroundColor: progressColor }
            }}
          />
        </Box>

        {/* Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <AvatarGroup
            max={4}
            sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.65rem', border: '2px solid white', backgroundColor: accentColor } }}
          >
            {(project.team || []).map(t => (
              <Tooltip key={t.user?._id} title={t.user?.name || ''}>
                <Avatar>{t.user?.name?.[0]}</Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>
          {project.endDate && (
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 500 }}>
              Due {format(new Date(project.endDate), 'MMM d, yyyy')}
            </Typography>
          )}
        </Box>
      </CardContent>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        onClick={e => e.stopPropagation()}
      >
        <MenuItem onClick={() => { navigate(`/projects/${project._id}`); setMenuAnchor(null); }}>
          <OpenInNew sx={{ mr: 1.5, fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2">Open Project</Typography>
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <Edit sx={{ mr: 1.5, fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2">Edit Details</Typography>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => { onDelete(project); setMenuAnchor(null); }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1.5, fontSize: 16 }} />
          <Typography variant="body2" fontWeight={600}>Delete</Typography>
        </MenuItem>
      </Menu>
    </Card>
  );
}

export default function ProjectList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projects, loading } = useSelector(s => s.projects);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { dispatch(fetchProjects()); }, []);

  const filtered = projects.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async () => {
    await dispatch(deleteProject(deleteTarget._id));
    dispatch(showSnackbar({ message: 'Project deleted', severity: 'info' }));
    setDeleteTarget(null);
  };

  const statusCounts = FILTER_OPTIONS.reduce((acc, opt) => {
    acc[opt.value] = opt.value === 'all' ? projects.length : projects.filter(p => p.status === opt.value).length;
    return acc;
  }, {});

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>Projects</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {projects.length} projects · {projects.filter(p => p.status === 'active').length} active
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AutoAwesome />}
            onClick={() => setCreateOpen(true)}
            sx={{
              borderColor: '#C7D2FE', color: '#4F46E5', backgroundColor: '#EEF2FF',
              '&:hover': { backgroundColor: '#E0E7FF', borderColor: '#A5B4FC' }
            }}
          >
            AI Generate
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateOpen(true)}
          >
            New Project
          </Button>
        </Box>
      </Box>

      {/* Filters Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center', p: 2, backgroundColor: 'white', borderRadius: 3, border: '1px solid #E2E8F0' }}>
        <TextField
          size="small"
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: '#94A3B8' }} /></InputAdornment>
          }}
          sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { backgroundColor: '#F8FAFC' } }}
        />

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />

        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {FILTER_OPTIONS.map(opt => (
            <Chip
              key={opt.value}
              label={`${opt.label}${statusCounts[opt.value] > 0 ? ` · ${statusCounts[opt.value]}` : ''}`}
              onClick={() => setFilter(opt.value)}
              variant={filter === opt.value ? 'filled' : 'outlined'}
              color={filter === opt.value ? 'primary' : 'default'}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                backgroundColor: filter === opt.value ? '#4F46E5' : 'transparent',
                borderColor: filter === opt.value ? '#4F46E5' : '#E2E8F0',
                color: filter === opt.value ? 'white' : '#475569',
                '&:hover': { backgroundColor: filter === opt.value ? '#4338CA' : '#F1F5F9' }
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, px: 4 }}>
          {search || filter !== 'all' ? (
            <>
              <FolderOff sx={{ fontSize: 56, color: '#CBD5E1', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" fontWeight={600}>No matching projects</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>Try adjusting your search or filter</Typography>
              <Button variant="outlined" onClick={() => { setSearch(''); setFilter('all'); }}>Clear filters</Button>
            </>
          ) : (
            <>
              <Box sx={{ width: 72, height: 72, borderRadius: 4, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                <Rocket sx={{ fontSize: 34, color: 'white' }} />
              </Box>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Start your first project</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                Create a project manually or let AI generate a complete plan from a simple description.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
                <Button variant="outlined" startIcon={<Add />} size="large" onClick={() => setCreateOpen(true)}>Manual Setup</Button>
                <Button
                  variant="contained" startIcon={<AutoAwesome />} size="large"
                  onClick={() => setCreateOpen(true)}
                  sx={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}
                >
                  AI Generate
                </Button>
              </Box>
            </>
          )}
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map(project => (
            <Grid item xs={12} sm={6} lg={4} key={project._id}>
              <ProjectCard project={project} onDelete={setDeleteTarget} />
            </Grid>
          ))}
        </Grid>
      )}

      <CreateProjectDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => dispatch(fetchProjects())}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Project"
        message={`Delete "${deleteTarget?.name}"? This will permanently remove all tasks and goals.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
