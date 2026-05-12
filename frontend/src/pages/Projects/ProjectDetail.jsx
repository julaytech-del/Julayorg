import React, { useEffect, useState } from 'react';
import { Box, Typography, Breadcrumbs, Link, Card, CardContent, LinearProgress, AvatarGroup, Avatar, Chip, Button, Tabs, Tab, Grid, Accordion, AccordionSummary, AccordionDetails, IconButton, Checkbox, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Menu, Select, FormControl, InputLabel, Autocomplete } from '@mui/material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ExpandMore, Add, ViewKanban, Timeline, AutoAwesome, PsychologyAlt, Refresh, Edit, PersonAdd, Delete } from '@mui/icons-material';
import { format } from 'date-fns';
import { fetchProject, fetchGoals, createGoal, createProject } from '../../store/slices/projectSlice.js';
import { projectsAPI, usersAPI } from '../../services/api.js';
import { fetchTasks, createTask, updateTaskStatus } from '../../store/slices/taskSlice.js';
import { getStandup, analyzePerformance, replanProject } from '../../store/slices/aiSlice.js';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import StatusChip from '../../components/common/StatusChip.jsx';
import PriorityChip from '../../components/common/PriorityChip.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import TaskDetailModal from '../../components/Tasks/TaskDetailModal.jsx';

export default function ProjectDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentProject, goals, loading } = useSelector(s => s.projects);
  const { tasks } = useSelector(s => s.tasks);
  const { loading: aiLoading, standupReport, performanceReport } = useSelector(s => s.ai);
  const [tab, setTab] = useState(0);
  const [selectedTask, setSelectedTask] = useState(null);
  const [aiDialog, setAiDialog] = useState(null);
  const [addGoalOpen,        setAddGoalOpen]        = useState(false);
  const [newGoalTitle,       setNewGoalTitle]        = useState('');
  const [addTaskGoal,        setAddTaskGoal]         = useState(null);
  const [newTaskTitle,       setNewTaskTitle]        = useState('');
  const [addStandaloneTask,  setAddStandaloneTask]   = useState(false);
  const [standaloneTitle,    setStandaloneTitle]     = useState('');
  const [statusAnchor, setStatusAnchor] = useState(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [orgUsers, setOrgUsers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberRole, setMemberRole] = useState('member');
  const [memberLoading, setMemberLoading] = useState(false);

  const PROJECT_STATUSES = [
    { value: 'planning',   label: 'Planning',   color: '#6366F1' },
    { value: 'active',     label: 'Active',     color: '#10B981' },
    { value: 'on_hold',    label: 'On Hold',    color: '#F59E0B' },
    { value: 'completed',  label: 'Completed',  color: '#3B82F6' },
    { value: 'cancelled',  label: 'Cancelled',  color: '#EF4444' },
  ];

  const handleStatusChange = async (newStatus) => {
    setStatusAnchor(null);
    try {
      await projectsAPI.update(id, { status: newStatus });
      dispatch(fetchProject(id));
      dispatch(showSnackbar({ message: 'Project status updated', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to update status', severity: 'error' }));
    }
  };

  useEffect(() => {
    dispatch(fetchProject(id));
    dispatch(fetchTasks({ projectId: id }));
    usersAPI.getAll().then(res => setOrgUsers(res.data?.data || [])).catch(() => {});
  }, [id]);

  const project = currentProject;
  if (loading || !project) return <LoadingSpinner fullPage message={t('common.loading')} />;

  const getTasksForGoal = goalId => tasks.filter(t => t.goal?._id === goalId || t.goal === goalId);
  const doneTasks = tasks.filter(t => t.status === 'done').length;

  const handleStandup = async () => {
    setAiDialog('standup');
    await dispatch(getStandup(id));
  };

  const handlePerformance = async () => {
    setAiDialog('performance');
    await dispatch(analyzePerformance(id));
  };

  const handleReplan = async () => {
    const reason = prompt(t('ai.tools.replan.reason'), t('ai.tools.replan.reasonPlaceholder'));
    if (!reason) return;
    await dispatch(replanProject({ projectId: id, reason }));
    dispatch(showSnackbar({ message: t('projects.snackbar.aiSuccess') }));
    dispatch(fetchProject(id));
  };

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) return;
    await dispatch(createGoal({ projectId: id, data: { title: newGoalTitle, project: id } }));
    setNewGoalTitle('');
    setAddGoalOpen(false);
  };

  const handleAddTask = async (goalId) => {
    if (!newTaskTitle.trim()) return;
    await dispatch(createTask({ title: newTaskTitle, project: id, goal: goalId, status: 'planned', priority: 'medium' }));
    setNewTaskTitle('');
    setAddTaskGoal(null);
    dispatch(fetchTasks({ projectId: id }));
  };

  const handleAddMember = async () => {
    if (!selectedMember) return;
    setMemberLoading(true);
    try {
      const currentTeam = (project.team || []).map(m => ({ user: m.user?._id || m.user, role: m.role }));
      const alreadyIn = currentTeam.some(m => m.user === selectedMember._id);
      if (alreadyIn) { dispatch(showSnackbar({ message: 'Member already in team', severity: 'warning' })); return; }
      await projectsAPI.update(id, { team: [...currentTeam, { user: selectedMember._id, role: memberRole }] });
      dispatch(fetchProject(id));
      dispatch(showSnackbar({ message: 'Member added successfully', severity: 'success' }));
      setAddMemberOpen(false);
      setSelectedMember(null);
      setMemberRole('member');
    } catch {
      dispatch(showSnackbar({ message: 'Failed to add member', severity: 'error' }));
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const newTeam = (project.team || [])
        .filter(m => (m.user?._id || m.user) !== userId)
        .map(m => ({ user: m.user?._id || m.user, role: m.role }));
      await projectsAPI.update(id, { team: newTeam });
      dispatch(fetchProject(id));
      dispatch(showSnackbar({ message: 'Member removed', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to remove member', severity: 'error' }));
    }
  };

  const handleAddStandaloneTask = async () => {
    if (!standaloneTitle.trim()) return;
    await dispatch(createTask({ title: standaloneTitle, project: id, status: 'planned', priority: 'medium' }));
    setStandaloneTitle('');
    setAddStandaloneTask(false);
    dispatch(fetchTasks({ projectId: id }));
  };

  const standaloneTask = tasks.filter(t => !t.goal);

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'done' ? 'planned' : 'done';
    await dispatch(updateTaskStatus({ id: task._id, status: newStatus }));
  };

  const TYPE_ICONS = { design: '🎨', feature: '⚡', testing: '🧪', planning: '📋', meeting: '👥', deployment: '🚀', content: '✍️', research: '🔍', review: '👀', bug: '🐛', other: '📌' };

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/projects" color="inherit" underline="hover">{t('nav.projects')}</Link>
        <Typography color="text.primary" fontWeight={500}>{project.name}</Typography>
      </Breadcrumbs>

      {/* Project Header */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ height: 6, background: project.color || '#6366F1' }} />
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Box onClick={e => setStatusAnchor(e.currentTarget)} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                  <StatusChip status={project.status} />
                </Box>
                <Menu anchorEl={statusAnchor} open={Boolean(statusAnchor)} onClose={() => setStatusAnchor(null)}
                  PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 160, py: 0.5 } }}>
                  {PROJECT_STATUSES.map(s => (
                    <MenuItem key={s.value} onClick={() => handleStatusChange(s.value)}
                      selected={project.status === s.value}
                      sx={{ borderRadius: 1, mx: 0.5, my: 0.15, gap: 1.5, fontSize: '0.83rem' }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
                      {s.label}
                    </MenuItem>
                  ))}
                </Menu>
                <PriorityChip priority={project.priority} />
                {project.aiGenerated && <Chip size="small" icon={<AutoAwesome sx={{ fontSize: '12px !important' }} />} label={t('projects.card.ai')} sx={{ bgcolor: '#EEF2FF', color: '#6366F1', fontWeight: 600 }} />}
              </Box>
              <Typography variant="h5" fontWeight={700}>{project.name}</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>{project.description}</Typography>
              <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
                {project.startDate && <Box><Typography variant="caption" color="text.secondary">{t('projects.create.startDate')}</Typography><Typography variant="body2" fontWeight={500}>{format(new Date(project.startDate), 'MMM dd, yyyy')}</Typography></Box>}
                {project.endDate && <Box><Typography variant="caption" color="text.secondary">{t('projects.create.endDate')}</Typography><Typography variant="body2" fontWeight={500}>{format(new Date(project.endDate), 'MMM dd, yyyy')}</Typography></Box>}
                <Box><Typography variant="caption" color="text.secondary">{t('projectDetail.totalTasks')}</Typography><Typography variant="body2" fontWeight={500}>{doneTasks}/{tasks.length}</Typography></Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button size="small" variant="outlined" startIcon={<ViewKanban />} onClick={() => navigate(`/dashboard/projects/${id}/kanban`)}>{t('kanban.title')}</Button>
              <Button size="small" variant="outlined" startIcon={<Timeline />} onClick={() => navigate(`/dashboard/projects/${id}/timeline`)}>{t('timeline.title')}</Button>
              <Button size="small" variant="outlined" startIcon={<PsychologyAlt />} onClick={handleStandup} disabled={aiLoading}>{t('ai.tools.standup.title')}</Button>
              <Button size="small" variant="outlined" startIcon={<AutoAwesome />} onClick={handlePerformance} disabled={aiLoading}>{t('ai.tools.performance.analyze')}</Button>
              <Button size="small" variant="outlined" startIcon={<Refresh />} onClick={handleReplan} color="warning">{t('ai.tools.replan.replan')}</Button>
            </Box>
          </Box>

          {/* Progress */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight={500}>{t('projectDetail.overallProgress')}</Typography>
              <Typography variant="body2" fontWeight={700} color="primary.main">{project.progress?.percentage || 0}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={project.progress?.percentage || 0} sx={{ height: 8, borderRadius: 4, backgroundColor: 'grey.100', '& .MuiLinearProgress-bar': { borderRadius: 4, background: project.color || '#6366F1' } }} />
          </Box>

          {/* Team */}
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AvatarGroup max={6} sx={{ '& .MuiAvatar-root': { width: 30, height: 30, fontSize: '0.75rem' } }}>
              {(project.team || []).map(member => <Avatar key={member.user?._id} sx={{ bgcolor: 'primary.main' }}>{member.user?.name?.[0]}</Avatar>)}
            </AvatarGroup>
            <Typography variant="caption" color="text.secondary">{t('team.stats.total')}: {project.team?.length || 0}</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .MuiTab-root': { fontWeight: 500 } }}>
        <Tab label={t('projectDetail.tabs.overview')} />
        <Tab label={t('projectDetail.tabs.goals')} />
        <Tab label={t('projectDetail.tabs.team')} />
      </Tabs>

      {/* Overview Tab */}
      {tab === 0 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} lg={3}>
            <Card><CardContent><Typography variant="caption" color="text.secondary">{t('projectDetail.totalTasks')}</Typography><Typography variant="h4" fontWeight={700}>{tasks.length}</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <Card><CardContent><Typography variant="caption" color="text.secondary">{t('projectDetail.completed')}</Typography><Typography variant="h4" fontWeight={700} color="success.main">{doneTasks}</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <Card><CardContent><Typography variant="caption" color="text.secondary">{t('projectDetail.inProgress')}</Typography><Typography variant="h4" fontWeight={700} color="info.main">{tasks.filter(task => task.status === 'in_progress').length}</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <Card><CardContent><Typography variant="caption" color="text.secondary">{t('projectDetail.blocked')}</Typography><Typography variant="h4" fontWeight={700} color="error.main">{tasks.filter(task => task.status === 'blocked').length}</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12}>
            <Card><CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>{t('projectDetail.goalsProgress')}</Typography>
              {goals.map(goal => (
                <Box key={goal._id} sx={{ mb: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>{goal.title}</Typography>
                    <StatusChip status={goal.status} />
                  </Box>
                  <LinearProgress variant="determinate" value={goal.progress || 0} sx={{ height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { backgroundColor: goal.color } }} />
                  <Typography variant="caption" color="text.secondary">{goal.progress || 0}%</Typography>
                </Box>
              ))}
            </CardContent></Card>
          </Grid>
        </Grid>
      )}

      {/* Goals & Tasks Tab */}
      {tab === 1 && (
        <Box>
          {goals.map(goal => {
            const goalTasks = getTasksForGoal(goal._id);
            return (
              <Accordion key={goal._id} defaultExpanded sx={{ mb: 1, '&:before': { display: 'none' }, borderRadius: '12px !important', border: '1px solid', borderColor: 'divider' }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, mr: 2 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: goal.color || '#6366F1' }} />
                    <Typography fontWeight={600}>{goal.title}</Typography>
                    <Chip label={`${goalTasks.filter(t => t.status === 'done').length}/${goalTasks.length}`} size="small" sx={{ backgroundColor: 'grey.100', fontWeight: 600 }} />
                    <StatusChip status={goal.status} />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  {goalTasks.map(task => (
                    <Box key={task._id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, px: 1, borderRadius: 2, cursor: 'pointer', '&:hover': { backgroundColor: 'grey.50' } }}
                      onClick={() => setSelectedTask(task)}>
                      <Checkbox size="small" checked={task.status === 'done'} onClick={e => { e.stopPropagation(); handleToggleTask(task); }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flex: 1, minWidth: 0 }}>
                        <Typography variant="caption">{TYPE_ICONS[task.type] || '📌'}</Typography>
                        <Typography variant="body2" fontWeight={500} noWrap sx={{ textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'text.secondary' : 'text.primary' }}>{task.title}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                        <PriorityChip priority={task.priority} />
                        {task.assignees?.[0] && <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: 'secondary.main' }}>{task.assignees[0].name?.[0]}</Avatar>}
                        {task.dueDate && <Typography variant="caption" color="text.secondary">{format(new Date(task.dueDate), 'MMM dd')}</Typography>}
                      </Box>
                    </Box>
                  ))}
                  {addTaskGoal === goal._id ? (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, pl: 4 }}>
                      <TextField size="small" placeholder={t('projectDetail.addTask') + '...'} value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTask(goal._id)} autoFocus sx={{ flex: 1 }} />
                      <Button size="small" onClick={() => handleAddTask(goal._id)} variant="contained">{t('projectDetail.addTask')}</Button>
                      <Button size="small" onClick={() => setAddTaskGoal(null)}>{t('common.cancel')}</Button>
                    </Box>
                  ) : (
                    <Button size="small" startIcon={<Add />} onClick={() => setAddTaskGoal(goal._id)} sx={{ mt: 1, ml: 3 }}>{t('projectDetail.addTask')}</Button>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
          {/* ── Standalone tasks (no goal) ── */}
          {standaloneTask.length > 0 && (
            <Accordion defaultExpanded sx={{ mb: 1, mt: 1, '&:before': { display: 'none' }, borderRadius: '12px !important', border: '1px solid', borderColor: 'divider' }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#94A3B8' }} />
                  <Typography fontWeight={600}>Tasks</Typography>
                  <Chip label={standaloneTask.length} size="small" sx={{ bgcolor: 'grey.100', fontWeight: 600 }} />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {standaloneTask.map(task => (
                  <Box key={task._id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, px: 1, borderRadius: 2, cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}
                    onClick={() => setSelectedTask(task)}>
                    <Checkbox size="small" checked={task.status === 'done'} onClick={e => { e.stopPropagation(); handleToggleTask(task); }} />
                    <Typography variant="body2" fontWeight={500} noWrap sx={{ flex: 1, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'text.secondary' : 'text.primary' }}>
                      {task.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                      <PriorityChip priority={task.priority} />
                      {task.dueDate && <Typography variant="caption" color="text.secondary">{format(new Date(task.dueDate), 'MMM dd')}</Typography>}
                    </Box>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          )}

          {/* ── Bottom action buttons ── */}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
            {addStandaloneTask ? (
              <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
                <TextField size="small" placeholder="Task title…" value={standaloneTitle}
                  onChange={e => setStandaloneTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddStandaloneTask()}
                  autoFocus sx={{ flex: 1 }} />
                <Button variant="contained" onClick={handleAddStandaloneTask} sx={{ bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' } }}>Add</Button>
                <Button onClick={() => setAddStandaloneTask(false)}>{t('common.cancel')}</Button>
              </Box>
            ) : (
              <Button variant="contained" startIcon={<Add />} onClick={() => setAddStandaloneTask(true)}
                sx={{ bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' }, textTransform: 'none', borderRadius: 2 }}>
                Add Task
              </Button>
            )}

            {!addStandaloneTask && (addGoalOpen ? (
              <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
                <TextField size="small" placeholder={t('projectDetail.addGoal') + '...'} value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddGoal()} autoFocus sx={{ flex: 1 }} />
                <Button variant="contained" onClick={handleAddGoal}>{t('projectDetail.addGoal')}</Button>
                <Button onClick={() => setAddGoalOpen(false)}>{t('common.cancel')}</Button>
              </Box>
            ) : (
              <Button variant="outlined" startIcon={<Add />} onClick={() => setAddGoalOpen(true)} sx={{ textTransform: 'none', borderRadius: 2 }}>{t('projectDetail.addGoal')}</Button>
            ))}
          </Box>
        </Box>
      )}

      {/* Team Tab */}
      {tab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Typography variant="h6" fontWeight={600}>Team Members ({project.team?.length || 0})</Typography>
            <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setAddMemberOpen(true)}
              sx={{ bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' }, textTransform: 'none', borderRadius: 2 }}>
              Add Member
            </Button>
          </Box>
          <Grid container spacing={2}>
            {(project.team || []).map(member => (
              <Grid item xs={12} sm={6} md={4} key={member.user?._id}>
                <Card sx={{ '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }, transition: 'box-shadow 0.2s' }}>
                  <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', position: 'relative', pr: 5 }}>
                    <Avatar sx={{ width: 48, height: 48, bgcolor: '#6366F1', fontSize: '1.15rem', fontWeight: 700 }}>
                      {member.user?.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={600} noWrap>{member.user?.name}</Typography>
                      {member.user?.jobTitle && <Typography variant="caption" color="text.secondary" noWrap display="block">{member.user.jobTitle}</Typography>}
                      <Chip label={member.role} size="small"
                        sx={{ mt: 0.5, textTransform: 'capitalize', width: 'fit-content',
                          bgcolor: member.role === 'owner' ? '#EEF2FF' : member.role === 'manager' ? '#FFF7ED' : '#F0FDF4',
                          color: member.role === 'owner' ? '#6366F1' : member.role === 'manager' ? '#F97316' : '#10B981',
                          fontWeight: 600 }} />
                    </Box>
                    <IconButton size="small" onClick={() => handleRemoveMember(member.user?._id)}
                      sx={{ position: 'absolute', top: 8, right: 8, color: 'text.disabled', '&:hover': { color: 'error.main', bgcolor: '#FEF2F2' } }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {(project.team || []).length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                  <PersonAdd sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body2">No team members yet. Add your first member!</Typography>
                </Box>
              </Grid>
            )}
          </Grid>

          {/* Add Member Dialog */}
          <Dialog open={addMemberOpen} onClose={() => { setAddMemberOpen(false); setSelectedMember(null); setMemberRole('member'); }} maxWidth="xs" fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Add Team Member</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '12px !important' }}>
              <Autocomplete
                options={orgUsers.filter(u => !(project.team || []).some(m => (m.user?._id || m.user) === u._id))}
                getOptionLabel={o => o.name + (o.email ? ` (${o.email})` : '')}
                value={selectedMember}
                onChange={(_, v) => setSelectedMember(v)}
                renderInput={params => <TextField {...params} label="Select Member" placeholder="Search by name or email" />}
                renderOption={(props, o) => (
                  <Box component="li" {...props} sx={{ gap: 1.5 }}>
                    <Avatar sx={{ width: 30, height: 30, fontSize: '0.8rem', bgcolor: '#6366F1' }}>{o.name?.[0]}</Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{o.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{o.email}</Typography>
                    </Box>
                  </Box>
                )}
                noOptionsText="No available members"
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select value={memberRole} onChange={e => setMemberRole(e.target.value)} label="Role">
                  <MenuItem value="member">Member</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="owner">Owner</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button onClick={() => { setAddMemberOpen(false); setSelectedMember(null); setMemberRole('member'); }} sx={{ textTransform: 'none' }}>Cancel</Button>
              <Button variant="contained" onClick={handleAddMember} disabled={!selectedMember || memberLoading}
                sx={{ bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' }, textTransform: 'none', minWidth: 100 }}>
                {memberLoading ? <CircularProgress size={18} color="inherit" /> : 'Add Member'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* Task Detail Modal */}
      {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={() => dispatch(fetchTasks({ projectId: id }))} />}

      {/* AI Dialogs */}
      <Dialog open={aiDialog === 'standup'} onClose={() => setAiDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome color="primary" /> {t('projectDetail.standup')}
        </DialogTitle>
        <DialogContent>
          {aiLoading ? <LoadingSpinner message={t('common.loading')} /> : standupReport && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ p: 2, backgroundColor: standupReport.overallHealth === 'green' ? '#ECFDF5' : standupReport.overallHealth === 'yellow' ? '#FFFBEB' : '#FEF2F2', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700}>Health: {standupReport.overallHealth?.toUpperCase()}</Typography>
                <Typography variant="body2">{standupReport.summary}</Typography>
              </Box>
              {standupReport.todayPriorities?.length > 0 && <Box><Typography variant="subtitle2" fontWeight={700} mb={1}>{t('ai.tools.standup.title')}</Typography>{standupReport.todayPriorities.map((p, i) => <Typography key={i} variant="body2">• {p.task} ({p.assignee}) — {p.reason}</Typography>)}</Box>}
              {standupReport.blockers?.length > 0 && <Box><Typography variant="subtitle2" fontWeight={700} color="error.main" mb={1}>{t('projectDetail.blocked')}</Typography>{standupReport.blockers.map((b, i) => <Typography key={i} variant="body2">• {b.issue}: {b.suggestion}</Typography>)}</Box>}
              {standupReport.aiInsights?.length > 0 && <Box><Typography variant="subtitle2" fontWeight={700} mb={1}>{t('ai.hero.title')}</Typography>{standupReport.aiInsights.map((ins, i) => <Typography key={i} variant="body2">💡 {ins}</Typography>)}</Box>}
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setAiDialog(null)}>{t('common.close')}</Button></DialogActions>
      </Dialog>

      <Dialog open={aiDialog === 'performance'} onClose={() => setAiDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome color="primary" /> {t('projectDetail.performance')}
        </DialogTitle>
        <DialogContent>
          {aiLoading ? <LoadingSpinner message={t('common.loading')} /> : performanceReport && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'grey.50', borderRadius: 2, flex: 1 }}>
                  <Typography variant="h3" fontWeight={700} color="primary.main">{performanceReport.overallScore}%</Typography>
                  <Typography variant="caption">{t('projectDetail.overallScore')}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: performanceReport.onTrack ? '#ECFDF5' : '#FEF2F2', borderRadius: 2, flex: 1 }}>
                  <Typography variant="h6" fontWeight={700} color={performanceReport.onTrack ? 'success.main' : 'error.main'}>{performanceReport.onTrack ? t('ai.tools.performance.onTrack') : t('ai.tools.performance.atRisk')}</Typography>
                  <Typography variant="caption">{t('projectDetail.riskLevel')}: {performanceReport.riskLevel}</Typography>
                </Box>
              </Box>
              {performanceReport.recommendations?.length > 0 && <Box><Typography variant="subtitle2" fontWeight={700} mb={1}>{t('ai.tools.performance.analyze')}</Typography>{performanceReport.recommendations.map((r, i) => <Typography key={i} variant="body2">• {r}</Typography>)}</Box>}
              {performanceReport.insights?.length > 0 && <Box><Typography variant="subtitle2" fontWeight={700} mb={1}>{t('ai.hero.title')}</Typography>{performanceReport.insights.map((r, i) => <Typography key={i} variant="body2">💡 {r}</Typography>)}</Box>}
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setAiDialog(null)}>{t('common.close')}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
