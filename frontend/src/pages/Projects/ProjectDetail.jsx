import React, { useEffect, useState } from 'react';
import { Box, Typography, Breadcrumbs, Link, Card, CardContent, LinearProgress, AvatarGroup, Avatar, Chip, Button, Tabs, Tab, Grid, Accordion, AccordionSummary, AccordionDetails, IconButton, Checkbox, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ExpandMore, Add, ViewKanban, Timeline, AutoAwesome, PsychologyAlt, Refresh, Edit } from '@mui/icons-material';
import { format } from 'date-fns';
import { fetchProject, fetchGoals, createGoal, createProject } from '../../store/slices/projectSlice.js';
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
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [addTaskGoal, setAddTaskGoal] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    dispatch(fetchProject(id));
    dispatch(fetchTasks({ projectId: id }));
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
              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <StatusChip status={project.status} />
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
              <Button size="small" variant="outlined" startIcon={<ViewKanban />} onClick={() => navigate(`/projects/${id}/kanban`)}>{t('kanban.title')}</Button>
              <Button size="small" variant="outlined" startIcon={<Timeline />} onClick={() => navigate(`/projects/${id}/timeline`)}>{t('timeline.title')}</Button>
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
          {addGoalOpen ? (
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <TextField size="small" placeholder={t('projectDetail.addGoal') + '...'} value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddGoal()} autoFocus sx={{ flex: 1 }} />
              <Button variant="contained" onClick={handleAddGoal}>{t('projectDetail.addGoal')}</Button>
              <Button onClick={() => setAddGoalOpen(false)}>{t('common.cancel')}</Button>
            </Box>
          ) : (
            <Button variant="outlined" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => setAddGoalOpen(true)}>{t('projectDetail.addGoal')}</Button>
          )}
        </Box>
      )}

      {/* Team Tab */}
      {tab === 2 && (
        <Grid container spacing={2}>
          {(project.team || []).map(member => (
            <Grid item xs={12} sm={6} md={4} key={member.user?._id}>
              <Card>
                <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Avatar sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontSize: '1.1rem' }}>{member.user?.name?.[0]}</Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>{member.user?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{member.user?.jobTitle}</Typography>
                    <Chip label={member.role} size="small" sx={{ display: 'block', mt: 0.5, textTransform: 'capitalize', width: 'fit-content' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
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
