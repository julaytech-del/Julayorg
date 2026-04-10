import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, Chip, CircularProgress, Divider,
  FormControl, Grid, IconButton, InputLabel, LinearProgress,
  MenuItem, Paper, Select, Skeleton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, ToggleButton, ToggleButtonGroup,
  Tooltip, Typography
} from '@mui/material';
import {
  Assignment, AutoAwesome, Download, FolderOpen, Group,
  PictureAsPdf, Print, Refresh, Schedule, TrendingUp
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { useDispatch } from 'react-redux';
import { format, subDays } from 'date-fns';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import { reportsAPI, projectsAPI } from '../../services/api.js';

const DARK_CARD = { bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };
const STATUS_COLORS = { planned: '#94A3B8', in_progress: '#4F46E5', blocked: '#EF4444', review: '#F59E0B', done: '#10B981' };
const PRIORITY_COLORS = { low: '#94A3B8', medium: '#F59E0B', high: '#F97316', critical: '#EF4444' };
const PIE_COLORS = ['#6366f1', '#0EA5E9', '#F59E0B', '#10B981', '#EF4444'];

const REPORT_TYPES = [
  { key: 'tasks',       label: 'Tasks Report',       icon: Assignment,   desc: 'Task status, priority & assignee breakdown' },
  { key: 'projects',    label: 'Projects Report',     icon: FolderOpen,   desc: 'Portfolio status & completion rates' },
  { key: 'team',        label: 'Team Performance',    icon: Group,        desc: 'Member productivity & velocity' },
  { key: 'timeline',    label: 'Timeline Report',     icon: Schedule,     desc: 'Planned vs actual dates analysis' },
];

const GROUP_BY_OPTIONS = {
  tasks:    [{ value: 'status', label: 'Status' }, { value: 'assignee', label: 'Assignee' }, { value: 'priority', label: 'Priority' }, { value: 'week', label: 'Week' }],
  projects: [{ value: 'status', label: 'Status' }, { value: 'owner', label: 'Owner' }],
  team:     [{ value: 'member', label: 'Member' }],
  timeline: [{ value: 'project', label: 'Project' }],
};

function StatusChipCell({ value }) {
  const color = STATUS_COLORS[value] || '#94A3B8';
  return (
    <Chip label={value?.replace('_', ' ')} size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600, bgcolor: `${color}18`, color, textTransform: 'capitalize' }} />
  );
}

function PriorityCell({ value }) {
  const color = PRIORITY_COLORS[value] || '#94A3B8';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
      <Typography variant="caption" sx={{ textTransform: 'capitalize', fontSize: '0.76rem', color }}>{value}</Typography>
    </Box>
  );
}

function ProgressCell({ value }) {
  const num = Number(value) || 0;
  const color = num >= 80 ? '#10B981' : num >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 120 }}>
      <LinearProgress variant="determinate" value={num} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)', '& .MuiLinearProgress-bar': { bgcolor: color } }} />
      <Typography variant="caption" fontWeight={700} sx={{ color, minWidth: 32, fontSize: '0.74rem' }}>{num}%</Typography>
    </Box>
  );
}

function renderCell(col, row) {
  const val = row[col.key];
  if (col.type === 'status') return <StatusChipCell value={val} />;
  if (col.type === 'priority') return <PriorityCell value={val} />;
  if (col.type === 'progress') return <ProgressCell value={val} />;
  if (col.type === 'date' && val) return format(new Date(val), 'MMM d, yyyy');
  return val ?? '—';
}

const COLUMNS_MAP = {
  tasks: [
    { key: 'title', label: 'Task', minWidth: 200 },
    { key: 'project', label: 'Project', minWidth: 140 },
    { key: 'status', label: 'Status', type: 'status' },
    { key: 'priority', label: 'Priority', type: 'priority' },
    { key: 'assignee', label: 'Assignee', minWidth: 130 },
    { key: 'dueDate', label: 'Due Date', type: 'date' },
  ],
  projects: [
    { key: 'name', label: 'Project', minWidth: 200 },
    { key: 'status', label: 'Status', type: 'status' },
    { key: 'progress', label: 'Progress', type: 'progress', minWidth: 160 },
    { key: 'tasksTotal', label: 'Tasks' },
    { key: 'tasksDone', label: 'Done' },
    { key: 'endDate', label: 'Deadline', type: 'date' },
  ],
  team: [
    { key: 'name', label: 'Member', minWidth: 160 },
    { key: 'department', label: 'Department' },
    { key: 'tasksCompleted', label: 'Completed' },
    { key: 'tasksOverdue', label: 'Overdue' },
    { key: 'tasksInProgress', label: 'In Progress' },
    { key: 'score', label: 'Score', type: 'progress', minWidth: 120 },
  ],
  timeline: [
    { key: 'title', label: 'Task', minWidth: 200 },
    { key: 'project', label: 'Project', minWidth: 140 },
    { key: 'plannedStart', label: 'Planned Start', type: 'date' },
    { key: 'actualStart', label: 'Actual Start', type: 'date' },
    { key: 'plannedEnd', label: 'Planned End', type: 'date' },
    { key: 'actualEnd', label: 'Actual End', type: 'date' },
    { key: 'variance', label: 'Variance (days)' },
  ],
};

function ReportChart({ type, data }) {
  if (!data?.length) return null;

  if (type === 'tasks' || type === 'team') {
    const chartData = type === 'tasks'
      ? Object.entries(data.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {})).map(([name, value]) => ({ name: name.replace('_',' '), value, fill: STATUS_COLORS[name] || '#94A3B8' }))
      : data.map(m => ({ name: m.name?.split(' ')[0], value: m.tasksCompleted || 0, fill: '#6366f1' }));
    return (
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} barSize={24} margin={{ left: -20 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <ReTooltip contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'projects') {
    const counts = data.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {});
    const pieData = Object.entries(counts).map(([k, v], i) => ({ name: k.replace('_',' '), value: v, color: PIE_COLORS[i] }));
    return (
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={68} dataKey="value" paddingAngle={3}>
            {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
          </Pie>
          <ReTooltip contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
}

export default function ReportsPage() {
  const dispatch = useDispatch();

  const [reportType, setReportType] = useState('tasks');
  const [filters, setFilters] = useState({ project: '', status: '', priority: '', dateFrom: subDays(new Date(), 30), dateTo: new Date() });
  const [groupBy, setGroupBy] = useState('status');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiNarrative, setAINarrative] = useState(null);
  const [aiLoading, setAILoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    projectsAPI.getAll().then(res => setProjects(res?.data || res || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setGroupBy(GROUP_BY_OPTIONS[reportType]?.[0]?.value || 'status');
    setReportData(null);
    setAINarrative(null);
  }, [reportType]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setAINarrative(null);
    try {
      const config = { type: reportType, filters: { ...filters, dateFrom: filters.dateFrom?.toISOString(), dateTo: filters.dateTo?.toISOString() }, groupBy };
      const res = await reportsAPI.generate(config);
      setReportData(res?.data || res);
    } catch {
      dispatch(showSnackbar({ message: 'Failed to generate report', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [reportType, filters, groupBy, dispatch]);

  const handleAINarrative = async () => {
    if (!reportData) return;
    setAILoading(true);
    try {
      const res = await reportsAPI.getAINarrative({ type: reportType, data: reportData });
      setAINarrative(res?.data?.narrative || res?.narrative || 'AI narrative not available.');
    } catch {
      dispatch(showSnackbar({ message: 'Failed to generate AI narrative', severity: 'error' }));
    } finally {
      setAILoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const config = { type: reportType, filters: { ...filters, dateFrom: filters.dateFrom?.toISOString(), dateTo: filters.dateTo?.toISOString() }, groupBy };
      const res = await reportsAPI.exportExcel(config);
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `julay-${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      dispatch(showSnackbar({ message: 'Report exported successfully', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to export report', severity: 'error' }));
    } finally {
      setExportLoading(false);
    }
  };

  const columns = COLUMNS_MAP[reportType] || [];
  const rows = reportData?.rows || reportData || [];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', gap: 2.5, height: 'calc(100vh - 80px)' }}>

        {/* Left Sidebar */}
        <Box sx={{ width: 230, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.66rem', px: 0.5, mb: 0.5 }}>
            Report Types
          </Typography>
          {REPORT_TYPES.map(rt => {
            const IconComp = rt.icon;
            const active = reportType === rt.key;
            return (
              <Box
                key={rt.key}
                onClick={() => setReportType(rt.key)}
                sx={{
                  p: 1.5, borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
                  border: active ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                  bgcolor: active ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                  '&:hover': { bgcolor: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)' },
                  display: 'flex', gap: 1.25, alignItems: 'flex-start',
                }}
              >
                <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IconComp sx={{ fontSize: 15, color: active ? '#818CF8' : 'text.secondary' }} />
                </Box>
                <Box>
                  <Typography variant="caption" fontWeight={active ? 700 : 500} sx={{ display: 'block', fontSize: '0.78rem', color: active ? 'primary.light' : 'text.primary' }}>{rt.label}</Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem', lineHeight: 1.3, display: 'block' }}>{rt.desc}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {REPORT_TYPES.find(r => r.key === reportType)?.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {REPORT_TYPES.find(r => r.key === reportType)?.desc}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Print / PDF">
                <IconButton size="small" onClick={() => window.print()} sx={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1.5 }}>
                  <Print sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Button
                size="small" variant="outlined"
                startIcon={exportLoading ? <CircularProgress size={12} /> : <Download sx={{ fontSize: 14 }} />}
                onClick={handleExportExcel}
                disabled={exportLoading || !reportData}
                sx={{ borderColor: 'rgba(255,255,255,0.12)', fontSize: '0.75rem', height: 32 }}
              >
                Export Excel
              </Button>
              {reportData && (
                <Button
                  size="small" variant="outlined"
                  startIcon={aiLoading ? <CircularProgress size={12} /> : <AutoAwesome sx={{ fontSize: 14 }} />}
                  onClick={handleAINarrative}
                  disabled={aiLoading}
                  sx={{ borderColor: 'rgba(168,85,247,0.4)', color: '#A855F7', fontSize: '0.75rem', height: 32, '&:hover': { borderColor: '#A855F7', bgcolor: 'rgba(168,85,247,0.08)' } }}
                >
                  AI Summary
                </Button>
              )}
            </Box>
          </Box>

          {/* Filter Bar */}
          <Card sx={{ ...DARK_CARD, p: 2, flexShrink: 0 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.78rem' }}>Project</InputLabel>
                  <Select value={filters.project} label="Project" onChange={e => setFilters(f => ({ ...f, project: e.target.value }))} sx={{ fontSize: '0.78rem' }}>
                    <MenuItem value="">All Projects</MenuItem>
                    {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3} md={1.5}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.78rem' }}>Status</InputLabel>
                  <Select value={filters.status} label="Status" onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} sx={{ fontSize: '0.78rem' }}>
                    <MenuItem value="">All</MenuItem>
                    {Object.keys(STATUS_COLORS).map(s => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              {reportType === 'tasks' && (
                <Grid item xs={6} sm={3} md={1.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.78rem' }}>Priority</InputLabel>
                    <Select value={filters.priority} label="Priority" onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))} sx={{ fontSize: '0.78rem' }}>
                      <MenuItem value="">All</MenuItem>
                      {Object.keys(PRIORITY_COLORS).map(p => <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={6} sm={3} md={1.5}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.78rem' }}>Group By</InputLabel>
                  <Select value={groupBy} label="Group By" onChange={e => setGroupBy(e.target.value)} sx={{ fontSize: '0.78rem' }}>
                    {(GROUP_BY_OPTIONS[reportType] || []).map(g => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3} md={1.75}>
                <DatePicker
                  label="From"
                  value={filters.dateFrom}
                  onChange={v => setFilters(f => ({ ...f, dateFrom: v }))}
                  slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiInputBase-input': { fontSize: '0.78rem' } } } }}
                />
              </Grid>
              <Grid item xs={6} sm={3} md={1.75}>
                <DatePicker
                  label="To"
                  value={filters.dateTo}
                  onChange={v => setFilters(f => ({ ...f, dateTo: v }))}
                  slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiInputBase-input': { fontSize: '0.78rem' } } } }}
                />
              </Grid>
              <Grid item xs={12} sm="auto">
                <Button
                  variant="contained" onClick={handleGenerate} disabled={loading} size="small"
                  startIcon={loading ? <CircularProgress size={12} color="inherit" /> : <Refresh sx={{ fontSize: 14 }} />}
                  sx={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', height: 36, px: 2.5, fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                >
                  {loading ? 'Generating...' : 'Generate'}
                </Button>
              </Grid>
            </Grid>
          </Card>

          {/* AI Narrative */}
          {aiNarrative && (
            <Card sx={{ ...DARK_CARD, background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))', flexShrink: 0 }}>
              <Box sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: 2, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AutoAwesome sx={{ fontSize: 16, color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>AI Executive Summary</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Generated by Claude · {format(new Date(), 'MMM d, yyyy HH:mm')}</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.8, fontSize: '0.875rem' }}>{aiNarrative}</Typography>
              </Box>
            </Card>
          )}

          {/* Chart + Table */}
          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {reportData && rows.length > 0 && (
              <Card sx={{ ...DARK_CARD, p: 2.5, flexShrink: 0 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.66rem', display: 'block', mb: 1.5 }}>
                  Visual Overview
                </Typography>
                <ReportChart type={reportType} data={rows} />
              </Card>
            )}

            <Card sx={{ ...DARK_CARD, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {!reportData && !loading ? (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 4 }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: 3, bgcolor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp sx={{ fontSize: 32, color: '#6366f1' }} />
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>No report generated yet</Typography>
                    <Typography variant="body2" color="text.secondary">Set your filters above and click "Generate" to see your data</Typography>
                  </Box>
                  <Button variant="contained" onClick={handleGenerate} sx={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', fontWeight: 700 }}>
                    Generate Report
                  </Button>
                </Box>
              ) : loading ? (
                <Box sx={{ p: 2.5 }}>
                  {[1,2,3,4,5].map(i => <Skeleton key={i} height={48} sx={{ mb: 0.5, borderRadius: 1.5 }} />)}
                </Box>
              ) : rows.length === 0 ? (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No data found for the selected filters</Typography>
                </Box>
              ) : (
                <TableContainer sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: 6, height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3 } }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {columns.map(col => (
                          <TableCell key={col.key} sx={{ bgcolor: '#0D1526', borderBottom: '1px solid rgba(255,255,255,0.08)', py: 1.5, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', minWidth: col.minWidth, whiteSpace: 'nowrap' }}>
                            {col.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row, i) => (
                        <TableRow key={i} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }, '& td': { borderBottom: '1px solid rgba(255,255,255,0.04)' } }}>
                          {columns.map(col => (
                            <TableCell key={col.key} sx={{ fontSize: '0.78rem', py: 1.25, color: 'text.primary' }}>
                              {renderCell(col, row)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {reportData && rows.length > 0 && (
                <Box sx={{ px: 2.5, py: 1.25, borderTop: '1px solid rgba(255,255,255,0.06)', bgcolor: '#0D1526', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                    {rows.length} {rows.length === 1 ? 'record' : 'records'} · Generated {format(new Date(), 'MMM d, HH:mm')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" startIcon={<Download sx={{ fontSize: 13 }} />} onClick={handleExportExcel} disabled={exportLoading} sx={{ fontSize: '0.72rem', color: '#10B981', px: 1 }}>
                      Excel
                    </Button>
                    <Button size="small" startIcon={<Print sx={{ fontSize: 13 }} />} onClick={() => window.print()} sx={{ fontSize: '0.72rem', color: 'text.secondary', px: 1 }}>
                      Print
                    </Button>
                  </Box>
                </Box>
              )}
            </Card>
          </Box>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
