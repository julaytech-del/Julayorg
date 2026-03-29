import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, TextField, Button, Grid, Chip, LinearProgress, MenuItem, Avatar, AvatarGroup, Accordion, AccordionSummary, AccordionDetails, Table, TableHead, TableRow, TableCell, TableBody, Alert, Divider, CircularProgress } from '@mui/material';
import { AutoAwesome, Psychology, ExpandMore, Rocket, CheckCircle, Person, AccessTime, OpenInNew } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { generatePlan, getStandup, analyzePerformance, replanProject } from '../../store/slices/aiSlice.js';
import { fetchProjects } from '../../store/slices/projectSlice.js';
import { usersAPI } from '../../services/api.js';
import { format } from 'date-fns';
import { showSnackbar } from '../../store/slices/uiSlice.js';

const STEPS = [
  'Analyzing project description...',
  'Detecting industry and complexity...',
  'Creating project structure...',
  'Generating goals and tasks...',
  'Assigning team members...',
  'Calculating timeline...',
  'Finalizing project plan...'
];

function StandupCard({ projects }) {
  const dispatch = useDispatch();
  const { standupReport, loading } = useSelector(s => s.ai);
  const [projectId, setProjectId] = useState('');
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    if (!projectId) return;
    await dispatch(getStandup(projectId));
    setGenerated(true);
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 2, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle sx={{ color: 'white', fontSize: 18 }} />
          </Box>
          <Typography variant="subtitle1" fontWeight={700}>Daily Standup</Typography>
        </Box>
        <TextField select fullWidth label="Select Project" value={projectId} onChange={e => setProjectId(e.target.value)} size="small" sx={{ mb: 1.5 }}>
          {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
        </TextField>
        <Button fullWidth variant="contained" onClick={generate} disabled={!projectId || loading}>{loading ? 'Generating...' : 'Generate Standup'}</Button>
        {generated && standupReport && (
          <Box sx={{ mt: 2, p: 1.5, backgroundColor: standupReport.overallHealth === 'green' ? '#ECFDF5' : standupReport.overallHealth === 'yellow' ? '#FFFBEB' : '#FEF2F2', borderRadius: 2 }}>
            <Chip label={standupReport.overallHealth?.toUpperCase()} size="small" sx={{ mb: 1, backgroundColor: standupReport.overallHealth === 'green' ? '#10B981' : standupReport.overallHealth === 'yellow' ? '#F59E0B' : '#EF4444', color: 'white', fontWeight: 700 }} />
            <Typography variant="body2" sx={{ mb: 1 }}>{standupReport.summary}</Typography>
            {standupReport.aiInsights?.map((ins, i) => <Typography key={i} variant="caption" display="block" color="text.secondary">• {ins}</Typography>)}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function PerformanceCard({ projects }) {
  const dispatch = useDispatch();
  const { performanceReport, loading } = useSelector(s => s.ai);
  const [projectId, setProjectId] = useState('');
  const [generated, setGenerated] = useState(false);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 2, background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AutoAwesome sx={{ color: 'white', fontSize: 18 }} />
          </Box>
          <Typography variant="subtitle1" fontWeight={700}>Performance Analysis</Typography>
        </Box>
        <TextField select fullWidth label="Select Project" value={projectId} onChange={e => setProjectId(e.target.value)} size="small" sx={{ mb: 1.5 }}>
          {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
        </TextField>
        <Button fullWidth variant="contained" color="success" onClick={() => { if (projectId) { dispatch(analyzePerformance(projectId)); setGenerated(true); } }} disabled={!projectId || loading}>Analyze</Button>
        {generated && performanceReport && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, backgroundColor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">Score</Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main">{performanceReport.overallScore}%</Typography>
            </Box>
            <Chip size="small" label={performanceReport.onTrack ? 'On Track' : 'At Risk'} sx={{ mt: 1, bgcolor: performanceReport.onTrack ? '#ECFDF5' : '#FEF2F2', color: performanceReport.onTrack ? '#10B981' : '#EF4444', fontWeight: 600 }} />
            {performanceReport.recommendations?.slice(0, 2).map((r, i) => <Typography key={i} variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>• {r}</Typography>)}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function ReplanCard({ projects }) {
  const dispatch = useDispatch();
  const { replanResult, loading } = useSelector(s => s.ai);
  const [projectId, setProjectId] = useState('');
  const [reason, setReason] = useState('');
  const [generated, setGenerated] = useState(false);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 2, background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AccessTime sx={{ color: 'white', fontSize: 18 }} />
          </Box>
          <Typography variant="subtitle1" fontWeight={700}>Auto Re-Plan</Typography>
        </Box>
        <TextField select fullWidth label="Select Project" value={projectId} onChange={e => setProjectId(e.target.value)} size="small" sx={{ mb: 1 }}>
          {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
        </TextField>
        <TextField fullWidth label="Reason for replan" value={reason} onChange={e => setReason(e.target.value)} size="small" placeholder="e.g., Resource unavailable, scope change" sx={{ mb: 1.5 }} />
        <Button fullWidth variant="contained" color="warning" onClick={() => { if (projectId) { dispatch(replanProject({ projectId, reason: reason || 'Schedule adjustment' })); setGenerated(true); } }} disabled={!projectId || loading}>Re-Plan Project</Button>
        {generated && replanResult && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">{replanResult.summary}</Typography>
            {replanResult.newEndDate && <Chip size="small" label={`New end: ${format(new Date(replanResult.newEndDate), 'MMM dd, yyyy')}`} sx={{ mt: 0.5 }} />}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function AIStudio() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, result, error } = useSelector(s => s.ai);
  const { projects } = useSelector(s => s.projects);
  const user = useSelector(s => s.auth.user);
  const [prompt, setPrompt] = useState('');
  const [startDate, setStartDate] = useState('');
  const [step, setStep] = useState(0);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    dispatch(fetchProjects());
    usersAPI.getAll().then(res => setUsers(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => setStep(prev => (prev + 1) % STEPS.length), 1200);
    } else {
      setStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const res = await dispatch(generatePlan({ prompt, startDate: startDate || new Date().toISOString(), teamUserIds: users.slice(0, 6).map(u => u._id) }));
    if (!res.error) dispatch(showSnackbar({ message: 'Project generated successfully!' }));
  };

  const EXAMPLE_PROMPTS = [
    'Build a company website with blog and CMS',
    'Launch an e-commerce mobile app for iOS and Android',
    'Develop a patient management system for a hospital',
    'Create a marketing campaign for a product launch'
  ];

  return (
    <Box>
      {/* Hero Header */}
      <Box sx={{ mb: 4, p: 4, borderRadius: 3, background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <Box sx={{ position: 'absolute', bottom: -30, right: 80, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 3, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Psychology sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>AI Project Brain</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>Describe any project and AI will build a complete work plan</Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Generator */}
        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={0.5}>Generate Full Project Plan</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>Describe your project in natural language. AI will detect the industry, create departments, generate tasks, assign team, and build a timeline.</Typography>

              {/* Example prompts */}
              <Box sx={{ mb: 2, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <Chip key={i} label={ex} size="small" onClick={() => setPrompt(ex)} variant="outlined" sx={{ cursor: 'pointer', fontSize: '0.75rem', '&:hover': { backgroundColor: 'primary.main', color: 'white', borderColor: 'primary.main' } }} />
                ))}
              </Box>

              <TextField fullWidth multiline rows={4} placeholder="Describe your project in detail... e.g., 'Build a company website with modern design, blog, contact form, and CMS for content management. Target audience is B2B clients.'" value={prompt} onChange={e => setPrompt(e.target.value)} sx={{ mb: 2 }} />

              <TextField label="Project Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} size="small" InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              {loading && (
                <Box sx={{ mb: 2, p: 2, backgroundColor: '#EEF2FF', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" fontWeight={600} color="primary.main">{STEPS[step]}</Typography>
                  </Box>
                  <LinearProgress sx={{ borderRadius: 2 }} />
                </Box>
              )}

              <Button fullWidth size="large" variant="contained" disabled={loading || !prompt.trim()} onClick={handleGenerate}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesome />}
                sx={{ py: 1.5, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', fontWeight: 700, fontSize: '1rem' }}>
                {loading ? 'Generating Plan...' : 'Generate Full Project Plan'}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && !loading && (
            <Card sx={{ mt: 3, border: '2px solid', borderColor: 'primary.main' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                      <Chip icon={<CheckCircle sx={{ fontSize: '14px !important' }} />} label="Plan Generated" size="small" sx={{ bgcolor: '#ECFDF5', color: '#10B981', fontWeight: 700 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>{result.project?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{result.project?.description}</Typography>
                  </Box>
                  <Button variant="contained" size="small" startIcon={<OpenInNew />} onClick={() => navigate(`/projects/${result.project?._id}`)}>Open Project</Button>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
                  <Chip label={`Industry: ${result.planAnalysis?.industry}`} size="small" variant="outlined" />
                  <Chip label={`Complexity: ${result.planAnalysis?.complexity}`} size="small" variant="outlined" />
                  <Chip label={`${result.stats?.goalsCreated} goals`} size="small" sx={{ bgcolor: '#EEF2FF', color: '#6366F1' }} />
                  <Chip label={`${result.stats?.tasksCreated} tasks`} size="small" sx={{ bgcolor: '#ECFDF5', color: '#10B981' }} />
                  <Chip label={`${result.stats?.teamAssigned} team members`} size="small" sx={{ bgcolor: '#FFF7ED', color: '#EA580C' }} />
                </Box>

                {/* Goals tree */}
                {(result.goals || []).map((goal, i) => (
                  <Accordion key={i} sx={{ mb: 0.5, '&:before': { display: 'none' }, border: '1px solid', borderColor: 'divider' }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: goal.color || '#6366F1' }} />
                        <Typography variant="body2" fontWeight={600}>{goal.title}</Typography>
                        <Chip label={`${goal.tasks?.length || 0} tasks`} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      {(goal.tasks || []).map((task, j) => (
                        <Box key={j} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, px: 1, borderRadius: 1, '&:hover': { backgroundColor: 'grey.50' } }}>
                          <Typography variant="caption" sx={{ minWidth: 16 }}>•</Typography>
                          <Typography variant="caption" flex={1}>{task.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{task.estimatedHours}h</Typography>
                          {task.assignees?.[0] && <Avatar sx={{ width: 18, height: 18, fontSize: '0.55rem', bgcolor: 'secondary.main' }}>{task.assignees[0].name?.[0] || '?'}</Avatar>}
                        </Box>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                ))}

                {/* Team Assignments */}
                {result.teamAssignments?.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>Team Assignments ({result.teamAssignments.length})</Typography>
                    <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                      {result.teamAssignments.slice(0, 8).map((a, i) => (
                        <Box key={i} sx={{ display: 'flex', gap: 1, py: 0.5, borderBottom: '1px solid', borderColor: 'grey.100', alignItems: 'center' }}>
                          <Avatar sx={{ width: 22, height: 22, fontSize: '0.6rem', bgcolor: 'primary.main' }}>{a.assigneeEmail?.[0]?.toUpperCase()}</Avatar>
                          <Typography variant="caption" flex={1} noWrap>{a.taskTitle}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 120 }}>{a.assigneeEmail}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Quick AI Tools */}
        <Grid item xs={12} lg={5}>
          <Typography variant="h6" fontWeight={700} mb={2}>Quick AI Tools</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}><StandupCard projects={projects} /></Grid>
            <Grid item xs={12}><PerformanceCard projects={projects} /></Grid>
            <Grid item xs={12}><ReplanCard projects={projects} /></Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
