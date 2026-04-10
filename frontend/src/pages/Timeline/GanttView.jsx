import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Avatar, Box, Breadcrumbs, Button, Card, Chip, CircularProgress,
  Divider, Drawer, IconButton, Link, Tooltip, Typography
} from '@mui/material';
import {
  AutoAwesome, Bookmark, BookmarkBorder, ChevronRight, Close,
  FiberManualRecord, InfoOutlined, Refresh, Today, Warning, ZoomIn, ZoomOut
} from '@mui/icons-material';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  format, addDays, differenceInDays, startOfWeek, addWeeks,
  startOfMonth, addMonths, startOfQuarter, addQuarters, eachDayOfInterval
} from 'date-fns';
import { fetchTasks } from '../../store/slices/taskSlice.js';
import { fetchProject } from '../../store/slices/projectSlice.js';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { ganttAPI } from '../../services/api.js';

const STATUS_COLORS = {
  planned: '#94A3B8',
  in_progress: '#3B82F6',
  blocked: '#EF4444',
  review: '#F59E0B',
  done: '#10B981',
};
const PRIORITY_COLORS = { low: '#94A3B8', medium: '#F59E0B', high: '#F97316', critical: '#EF4444' };

const ROW_HEIGHT = 44;
const LEFT_PANEL = 280;
const HEADER_HEIGHT = 56;

const ZOOM_CONFIG = {
  day:     { label: 'Day',     dayWidth: 60,  headerFn: d => format(d, 'EEE d'), unitFn: (s, e) => eachDayOfInterval({ start: s, end: e }), unitLabel: d => format(d, 'MMM yyyy'), unitDays: 1 },
  week:    { label: 'Week',    dayWidth: 28,  headerFn: d => `W${format(d, 'w')} · ${format(d, 'MMM d')}`, unitFn: (s, e) => { const r = []; let c = startOfWeek(s, { weekStartsOn: 1 }); while (c <= e) { r.push(c); c = addWeeks(c, 1); } return r; }, unitLabel: d => format(d, 'MMMM yyyy'), unitDays: 7 },
  month:   { label: 'Month',   dayWidth: 12,  headerFn: d => format(d, 'MMM yyyy'), unitFn: (s, e) => { const r = []; let c = startOfMonth(s); while (c <= e) { r.push(c); c = addMonths(c, 1); } return r; }, unitLabel: d => format(d, 'yyyy'), unitDays: 30 },
  quarter: { label: 'Quarter', dayWidth: 5,   headerFn: d => `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`, unitFn: (s, e) => { const r = []; let c = startOfQuarter(s); while (c <= e) { r.push(c); c = addQuarters(c, 1); } return r; }, unitLabel: d => String(d.getFullYear()), unitDays: 91 },
};

const RISK_COLORS = { High: '#EF4444', Medium: '#F59E0B', Low: '#22C55E' };

function DiamondMilestone({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ display: 'block' }}>
      <rect x="8" y="1" width="9" height="9" rx="1" transform="rotate(45 8 8)" fill={color} />
    </svg>
  );
}

function DependencyArrows({ tasks, barPositions, dayWidth }) {
  const paths = [];
  tasks.forEach(task => {
    if (!task.dependencies?.length) return;
    const to = barPositions[task._id];
    if (!to) return;
    task.dependencies.forEach(depId => {
      const from = barPositions[depId];
      if (!from) return;
      const x1 = from.left + from.width;
      const y1 = from.top + ROW_HEIGHT / 2;
      const x2 = to.left;
      const y2 = to.top + ROW_HEIGHT / 2;
      const mx = (x1 + x2) / 2;
      const isCritical = task._isCritical && tasks.find(t => t._id === depId)?._isCritical;
      paths.push({ x1, y1, x2, y2, mx, id: `${depId}-${task._id}`, isCritical });
    });
  });
  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 4 }}>
      <defs>
        <marker id="arrowNormal" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="rgba(148,163,184,0.7)" />
        </marker>
        <marker id="arrowCritical" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#EF4444" />
        </marker>
      </defs>
      {paths.map(p => (
        <path
          key={p.id}
          d={`M ${p.x1} ${p.y1} C ${p.mx} ${p.y1}, ${p.mx} ${p.y2}, ${p.x2} ${p.y2}`}
          fill="none"
          stroke={p.isCritical ? '#EF4444' : 'rgba(148,163,184,0.5)'}
          strokeWidth={p.isCritical ? 2 : 1.5}
          strokeDasharray={p.isCritical ? 'none' : '4 3'}
          markerEnd={p.isCritical ? 'url(#arrowCritical)' : 'url(#arrowNormal)'}
        />
      ))}
    </svg>
  );
}

export default function GanttView() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { tasks, loading } = useSelector(s => s.tasks);
  const { currentProject } = useSelector(s => s.projects);

  const [zoom, setZoom] = useState('week');
  const [ganttData, setGanttData] = useState(null);
  const [criticalTaskIds, setCriticalTaskIds] = useState([]);
  const [showAIRisks, setShowAIRisks] = useState(false);
  const [aiRisks, setAIRisks] = useState(null);
  const [aiRisksLoading, setAIRisksLoading] = useState(false);
  const [baselineVisible, setBaselineVisible] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [localTasks, setLocalTasks] = useState([]);

  const scrollRef = useRef(null);
  const timelineBodyRef = useRef(null);
  const today = new Date();
  const zoomCfg = ZOOM_CONFIG[zoom];

  useEffect(() => {
    dispatch(fetchTasks({ projectId: id }));
    if (!currentProject || currentProject._id !== id) dispatch(fetchProject(id));
    ganttAPI.getData(id)
      .then(res => {
        const data = res?.data || res;
        setGanttData(data);
        setCriticalTaskIds(data?.criticalTaskIds || []);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    const merged = (ganttData?.tasks || tasks).map(t => ({
      ...t,
      _isCritical: criticalTaskIds.includes(t._id),
    }));
    setLocalTasks(merged);
  }, [tasks, ganttData, criticalTaskIds]);

  const allTasks = localTasks.length ? localTasks : tasks.map(t => ({ ...t, _isCritical: false }));

  const projectStart = currentProject?.startDate
    ? new Date(currentProject.startDate)
    : allTasks.length
      ? new Date(Math.min(...allTasks.filter(t => t.startDate).map(t => new Date(t.startDate))))
      : addDays(today, -7);

  const projectEnd = currentProject?.endDate
    ? new Date(currentProject.endDate)
    : allTasks.length
      ? new Date(Math.max(...allTasks.filter(t => t.dueDate).map(t => new Date(t.dueDate))))
      : addDays(today, 60);

  const paddedStart = addDays(projectStart, -3);
  const paddedEnd = addDays(projectEnd, 14);
  const dayWidth = zoomCfg.dayWidth;
  const totalDays = Math.max(differenceInDays(paddedEnd, paddedStart) + 1, 60);
  const timelineWidth = totalDays * dayWidth;
  const todayOffset = differenceInDays(today, paddedStart) * dayWidth;

  const units = zoomCfg.unitFn(paddedStart, paddedEnd);

  const getBarPos = useCallback((task) => {
    if (!task.startDate || !task.dueDate) return null;
    const start = differenceInDays(new Date(task.startDate), paddedStart);
    const duration = Math.max(differenceInDays(new Date(task.dueDate), new Date(task.startDate)), 1);
    return { left: start * dayWidth, width: duration * dayWidth };
  }, [paddedStart, dayWidth]);

  const barPositions = {};
  allTasks.forEach((task, i) => {
    const pos = getBarPos(task);
    if (pos) barPositions[task._id] = { ...pos, top: i * ROW_HEIGHT };
  });

  // Drag to reschedule
  const handleDragStart = (e, task) => {
    const pos = getBarPos(task);
    if (!pos) return;
    setDragging({ task, startX: e.clientX, origLeft: pos.left, origDays: differenceInDays(new Date(task.startDate), paddedStart) });
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const delta = e.clientX - dragging.startX;
    const daysDelta = Math.round(delta / dayWidth);
    setLocalTasks(prev => prev.map(t => {
      if (t._id !== dragging.task._id) return t;
      const newStart = addDays(new Date(t.startDate), daysDelta);
      const newEnd = addDays(new Date(t.dueDate), daysDelta);
      return { ...t, startDate: newStart.toISOString(), dueDate: newEnd.toISOString() };
    }));
  }, [dragging, dayWidth]);

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      dispatch(showSnackbar({ message: 'Task rescheduled (not yet saved to server)', severity: 'info' }));
      setDragging(null);
    }
  }, [dragging, dispatch]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleLoadAIRisks = async () => {
    setAIRisksLoading(true);
    setShowAIRisks(true);
    try {
      const res = await ganttAPI.getAIRisks(id);
      setAIRisks(res?.data || res);
    } catch {
      dispatch(showSnackbar({ message: 'Failed to load AI risks', severity: 'error' }));
    } finally {
      setAIRisksLoading(false);
    }
  };

  const handleSaveBaseline = async () => {
    try {
      await ganttAPI.saveBaseline(id);
      dispatch(showSnackbar({ message: 'Baseline saved successfully', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to save baseline', severity: 'error' }));
    }
  };

  // Sync scroll between header and body
  const handleTimelineScroll = (e) => {
    if (scrollRef.current) scrollRef.current.scrollLeft = e.target.scrollLeft;
  };

  if (loading && !allTasks.length) return <LoadingSpinner fullPage message="Loading timeline..." />;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', userSelect: dragging ? 'none' : 'auto' }}>
      {/* Breadcrumbs + Controls */}
      <Box sx={{ mb: 2, flexShrink: 0 }}>
        <Breadcrumbs sx={{ mb: 1.5 }}>
          <Link component={RouterLink} to="/projects" color="inherit" underline="hover">Projects</Link>
          <Link component={RouterLink} to={`/projects/${id}`} color="inherit" underline="hover">{currentProject?.name}</Link>
          <Typography color="text.primary">Timeline</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" fontWeight={700}>Gantt Chart</Typography>
            <Chip label={`${allTasks.length} tasks`} size="small" sx={{ height: 22, fontSize: '0.72rem', bgcolor: 'rgba(255,255,255,0.07)' }} />
            {criticalTaskIds.length > 0 && (
              <Chip icon={<Warning sx={{ fontSize: '13px !important', color: '#EF4444 !important' }} />} label={`${criticalTaskIds.length} critical`} size="small" sx={{ height: 22, fontSize: '0.72rem', bgcolor: 'rgba(239,68,68,0.12)', color: '#EF4444' }} />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {/* Zoom Controls */}
            {Object.entries(ZOOM_CONFIG).map(([key, cfg]) => (
              <Button
                key={key}
                size="small"
                variant={zoom === key ? 'contained' : 'outlined'}
                onClick={() => setZoom(key)}
                sx={{
                  minWidth: 0, px: 1.5, height: 30, fontSize: '0.72rem', fontWeight: 700,
                  ...(zoom === key
                    ? { background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none' }
                    : { borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary' })
                }}
              >
                {cfg.label}
              </Button>
            ))}

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            <Tooltip title={baselineVisible ? 'Hide Baseline' : 'Show Baseline'}>
              <IconButton size="small" onClick={() => setBaselineVisible(v => !v)} sx={{ color: baselineVisible ? '#A855F7' : 'text.secondary', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1.5 }}>
                {baselineVisible ? <Bookmark sx={{ fontSize: 16 }} /> : <BookmarkBorder sx={{ fontSize: 16 }} />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Save Baseline">
              <Button size="small" variant="outlined" onClick={handleSaveBaseline} sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary', fontSize: '0.72rem', px: 1.5, height: 30 }}>
                Save Baseline
              </Button>
            </Tooltip>

            <Button
              size="small"
              variant="contained"
              startIcon={<AutoAwesome sx={{ fontSize: 14 }} />}
              onClick={handleLoadAIRisks}
              sx={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', fontSize: '0.72rem', px: 1.5, height: 30, fontWeight: 700 }}
            >
              AI Risks
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Main Gantt */}
      <Card sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.08)', bgcolor: '#0D1526' }}>
          {/* Left panel header */}
          <Box sx={{ width: LEFT_PANEL, flexShrink: 0, height: HEADER_HEIGHT, display: 'flex', alignItems: 'flex-end', px: 2, pb: 1.5, borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
              Task Name
            </Typography>
          </Box>

          {/* Timeline header (synced scroll) */}
          <Box ref={scrollRef} sx={{ flex: 1, overflowX: 'hidden', position: 'relative' }}>
            <Box sx={{ width: timelineWidth, height: HEADER_HEIGHT, position: 'relative' }}>
              {/* Month/Quarter top row */}
              {units.map((unit, i) => {
                const left = differenceInDays(unit, paddedStart) * dayWidth;
                const nextUnit = units[i + 1];
                const width = nextUnit
                  ? differenceInDays(nextUnit, unit) * dayWidth
                  : (totalDays - differenceInDays(unit, paddedStart)) * dayWidth;
                return (
                  <Box key={i} sx={{ position: 'absolute', left, width, height: 22, borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', px: 1.5 }}>
                    <Typography variant="caption" fontWeight={700} color="primary.main" noWrap sx={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                      {zoomCfg.unitLabel(unit)}
                    </Typography>
                  </Box>
                );
              })}
              {/* Unit labels bottom row */}
              {units.map((unit, i) => {
                const left = differenceInDays(unit, paddedStart) * dayWidth;
                const nextUnit = units[i + 1];
                const width = nextUnit
                  ? differenceInDays(nextUnit, unit) * dayWidth
                  : (totalDays - differenceInDays(unit, paddedStart)) * dayWidth;
                return (
                  <Box key={`lbl-${i}`} sx={{ position: 'absolute', top: 22, left, width, height: HEADER_HEIGHT - 22, borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', px: 1 }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>
                      {zoomCfg.headerFn(unit)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* Body */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left panel */}
          <Box sx={{ width: LEFT_PANEL, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.08)', overflowY: 'hidden' }}>
            {allTasks.map((task) => (
              <Box
                key={task._id}
                sx={{
                  height: ROW_HEIGHT, display: 'flex', alignItems: 'center', px: 1.5, gap: 1,
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  bgcolor: task._isCritical ? 'rgba(239,68,68,0.04)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                  transition: 'background 0.1s',
                }}
              >
                {task._isCritical && <Box sx={{ width: 3, height: 24, borderRadius: 99, bgcolor: '#EF4444', flexShrink: 0 }} />}
                {!task._isCritical && <Box sx={{ width: 3, height: 24, borderRadius: 99, bgcolor: STATUS_COLORS[task.status] || '#94A3B8', flexShrink: 0 }} />}
                {task.isMilestone ? (
                  <Box sx={{ flexShrink: 0 }}><DiamondMilestone color={STATUS_COLORS[task.status] || '#94A3B8'} /></Box>
                ) : null}
                <Typography variant="caption" fontWeight={500} noWrap sx={{ flex: 1, fontSize: '0.78rem', color: task._isCritical ? '#FCA5A5' : 'text.primary' }}>
                  {task.title}
                </Typography>
                {task.assignees?.[0] && (
                  <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem', bgcolor: '#6366f1', flexShrink: 0 }}>
                    {task.assignees[0].name?.[0] || '?'}
                  </Avatar>
                )}
              </Box>
            ))}
          </Box>

          {/* Timeline body */}
          <Box
            ref={timelineBodyRef}
            onScroll={handleTimelineScroll}
            sx={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', position: 'relative', '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-track': { bgcolor: 'rgba(255,255,255,0.02)' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 3 } }}
          >
            <Box sx={{ width: timelineWidth, height: allTasks.length * ROW_HEIGHT, position: 'relative', minHeight: '100%' }}>
              {/* Vertical grid lines per unit */}
              {units.map((unit, i) => {
                const left = differenceInDays(unit, paddedStart) * dayWidth;
                return (
                  <Box key={i} sx={{ position: 'absolute', left, top: 0, bottom: 0, width: 1, bgcolor: 'rgba(255,255,255,0.04)', zIndex: 0 }} />
                );
              })}

              {/* Today line */}
              {todayOffset >= 0 && todayOffset <= timelineWidth && (
                <Box sx={{ position: 'absolute', left: todayOffset, top: 0, bottom: 0, width: 2, bgcolor: '#EF4444', zIndex: 6, pointerEvents: 'none' }}>
                  <Box sx={{ position: 'absolute', top: 0, left: 3, bgcolor: '#EF4444', borderRadius: '0 4px 4px 0', px: 0.75, py: 0.25 }}>
                    <Typography sx={{ fontSize: '0.6rem', color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>TODAY</Typography>
                  </Box>
                </Box>
              )}

              {/* Row stripes */}
              {allTasks.map((task, i) => (
                <Box
                  key={`row-${task._id}`}
                  sx={{
                    position: 'absolute', top: i * ROW_HEIGHT, left: 0, right: 0, height: ROW_HEIGHT,
                    bgcolor: task._isCritical ? 'rgba(239,68,68,0.03)' : (i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'),
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    zIndex: 1,
                  }}
                />
              ))}

              {/* Baseline ghost bars */}
              {baselineVisible && currentProject?.ganttBaseline && allTasks.map((task, i) => {
                const baseline = currentProject.ganttBaseline.find(b => b.taskId === task._id);
                if (!baseline?.startDate || !baseline?.dueDate) return null;
                const s = differenceInDays(new Date(baseline.startDate), paddedStart);
                const dur = Math.max(differenceInDays(new Date(baseline.dueDate), new Date(baseline.startDate)), 1);
                return (
                  <Box
                    key={`baseline-${task._id}`}
                    sx={{
                      position: 'absolute',
                      top: i * ROW_HEIGHT + ROW_HEIGHT / 2 + 4,
                      left: s * dayWidth,
                      width: dur * dayWidth,
                      height: 6,
                      borderRadius: 1,
                      bgcolor: 'rgba(168,85,247,0.3)',
                      border: '1px dashed rgba(168,85,247,0.5)',
                      zIndex: 2,
                    }}
                  />
                );
              })}

              {/* Task bars */}
              {allTasks.map((task, i) => {
                const pos = getBarPos(task);
                const isCritical = task._isCritical;
                const barColor = isCritical ? '#EF4444' : (STATUS_COLORS[task.status] || '#94A3B8');
                const priorityColor = PRIORITY_COLORS[task.priority];

                if (task.isMilestone) {
                  if (!pos) return null;
                  return (
                    <Box
                      key={task._id}
                      sx={{ position: 'absolute', top: i * ROW_HEIGHT + (ROW_HEIGHT - 16) / 2, left: pos.left - 8, zIndex: 3 }}
                    >
                      <DiamondMilestone color={barColor} />
                    </Box>
                  );
                }

                return (
                  <Box
                    key={task._id}
                    sx={{
                      position: 'absolute',
                      top: i * ROW_HEIGHT + (ROW_HEIGHT - 26) / 2,
                      height: 26,
                      ...(pos ? { left: pos.left, width: Math.max(pos.width, dayWidth) } : { display: 'none' }),
                      zIndex: 3,
                    }}
                  >
                    {pos && (
                      <Tooltip title={`${task.title} · ${task.status?.replace('_', ' ')} · ${format(new Date(task.startDate), 'MMM d')} → ${format(new Date(task.dueDate), 'MMM d')}`} placement="top">
                        <Box
                          onMouseDown={(e) => handleDragStart(e, task)}
                          sx={{
                            height: '100%', width: '100%', borderRadius: 1.5,
                            bgcolor: barColor,
                            border: isCritical ? '2px solid rgba(239,68,68,0.8)' : '1px solid rgba(255,255,255,0.1)',
                            boxShadow: isCritical ? '0 0 8px rgba(239,68,68,0.4)' : '0 1px 4px rgba(0,0,0,0.3)',
                            display: 'flex', alignItems: 'center', px: 0.75, gap: 0.5,
                            cursor: 'grab', overflow: 'hidden',
                            transition: 'filter 0.15s, box-shadow 0.15s',
                            '&:hover': { filter: 'brightness(1.15)', boxShadow: isCritical ? '0 0 12px rgba(239,68,68,0.6)' : '0 2px 8px rgba(0,0,0,0.4)' },
                            '&:active': { cursor: 'grabbing' },
                          }}
                        >
                          {priorityColor && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: priorityColor, flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.5)' }} />}
                          <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, whiteSpace: 'nowrap', fontSize: '0.65rem', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }} noWrap>
                            {task.title}
                          </Typography>
                          {task.status === 'done' && <Box sx={{ ml: 'auto', flexShrink: 0, width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.6)' }} />}
                        </Box>
                      </Tooltip>
                    )}
                  </Box>
                );
              })}

              {/* Dependency arrows SVG overlay */}
              <DependencyArrows tasks={allTasks} barPositions={barPositions} dayWidth={dayWidth} />
            </Box>
          </Box>
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 2, px: 2, py: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', bgcolor: '#0D1526', flexShrink: 0 }}>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: color }} />
              <Typography variant="caption" sx={{ textTransform: 'capitalize', fontSize: '0.68rem', color: 'text.secondary' }}>{status.replace('_', ' ')}</Typography>
            </Box>
          ))}
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 28, height: 4, borderRadius: 1, bgcolor: 'rgba(239,68,68,0.6)', border: '1px solid rgba(239,68,68,0.5)' }} />
            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#FCA5A5' }}>Critical Path</Typography>
          </Box>
          {baselineVisible && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 28, height: 4, borderRadius: 1, bgcolor: 'rgba(168,85,247,0.3)', border: '1px dashed rgba(168,85,247,0.5)' }} />
              <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#C084FC' }}>Baseline</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <DiamondMilestone color="#94A3B8" />
            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>Milestone</Typography>
          </Box>
        </Box>
      </Card>

      {/* AI Risk Drawer */}
      <Drawer
        anchor="right"
        open={showAIRisks}
        onClose={() => setShowAIRisks(false)}
        PaperProps={{ sx: { width: 420, bgcolor: '#0F172A', borderLeft: '1px solid rgba(255,255,255,0.08)' } }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AutoAwesome sx={{ fontSize: 18, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>AI Risk Analysis</Typography>
                <Typography variant="caption" color="text.secondary">Claude's assessment of project risks</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={handleLoadAIRisks} sx={{ color: 'text.secondary' }}>
                  <Refresh sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={() => setShowAIRisks(false)} sx={{ color: 'text.secondary' }}>
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>

          {aiRisksLoading ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <CircularProgress size={36} sx={{ color: '#A855F7' }} />
              <Typography variant="body2" color="text.secondary">Analyzing project risks with AI...</Typography>
            </Box>
          ) : aiRisks ? (
            <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 } }}>
              {aiRisks.summary && (
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.75 }}>Executive Summary</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, fontSize: '0.82rem' }}>{aiRisks.summary}</Typography>
                </Box>
              )}
              {(aiRisks.risks || []).map((risk, i) => (
                <Box key={i} sx={{ borderRadius: 2, border: `1px solid ${RISK_COLORS[risk.level] || '#94A3B8'}22`, bgcolor: `${RISK_COLORS[risk.level] || '#94A3B8'}08`, overflow: 'hidden' }}>
                  <Box sx={{ px: 2, pt: 1.5, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.82rem' }}>{risk.taskName || risk.task}</Typography>
                    <Chip
                      label={risk.level}
                      size="small"
                      sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: `${RISK_COLORS[risk.level] || '#94A3B8'}22`, color: RISK_COLORS[risk.level] || '#94A3B8' }}
                    />
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                  <Box sx={{ px: 2, py: 1.25 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, lineHeight: 1.6, fontSize: '0.78rem' }}>{risk.explanation}</Typography>
                    {risk.recommendation && (
                      <Box sx={{ display: 'flex', gap: 0.75, mt: 1, p: 1, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.03)' }}>
                        <ChevronRight sx={{ fontSize: 14, color: '#A855F7', flexShrink: 0, mt: 0.1 }} />
                        <Typography variant="caption" sx={{ color: '#C084FC', fontSize: '0.76rem', lineHeight: 1.5 }}>{risk.recommendation}</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
              {(!aiRisks.risks || aiRisks.risks.length === 0) && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 1 }}>
                  <FiberManualRecord sx={{ fontSize: 40, color: '#10B981', opacity: 0.5 }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>No critical risks detected</Typography>
                  <Typography variant="caption" color="text.secondary">The project timeline looks healthy</Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
              <InfoOutlined sx={{ fontSize: 40, color: 'text.disabled' }} />
              <Typography variant="body2" color="text.secondary">Click the AI Risks button to analyze</Typography>
            </Box>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}
