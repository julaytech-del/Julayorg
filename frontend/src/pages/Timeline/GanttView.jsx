import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Breadcrumbs, Link, Card, Chip, Avatar, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format, addDays, differenceInDays, startOfWeek, addWeeks, startOfMonth, addMonths } from 'date-fns';
import { fetchTasks } from '../../store/slices/taskSlice.js';
import { fetchProject } from '../../store/slices/projectSlice.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

const STATUS_COLORS = { planned: '#94A3B8', in_progress: '#3B82F6', blocked: '#EF4444', review: '#F59E0B', done: '#10B981' };
const ROW_HEIGHT = 40;
const LEFT_PANEL = 250;
const DAY_WIDTH_WEEK = 40;
const DAY_WIDTH_MONTH = 16;

export default function GanttView() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector(s => s.tasks);
  const { currentProject } = useSelector(s => s.projects);
  const [zoom, setZoom] = useState('week');
  const scrollRef = useRef(null);
  const today = new Date();

  useEffect(() => {
    dispatch(fetchTasks({ projectId: id }));
    if (!currentProject || currentProject._id !== id) dispatch(fetchProject(id));
  }, [id]);

  const tasksWithDates = tasks.filter(t => t.startDate && t.dueDate);
  if (!tasksWithDates.length && !loading) {
    const noDateTasks = tasks.filter(t => !t.startDate || !t.dueDate);
    // Show all tasks but those without dates won't have bars
  }

  const allTasks = tasks;
  const projectStart = currentProject?.startDate ? new Date(currentProject.startDate) : (allTasks.length ? new Date(Math.min(...allTasks.filter(t => t.startDate).map(t => new Date(t.startDate)))) : addDays(today, -7));
  const projectEnd = currentProject?.endDate ? new Date(currentProject.endDate) : (allTasks.length ? new Date(Math.max(...allTasks.filter(t => t.dueDate).map(t => new Date(t.dueDate)))) : addDays(today, 60));

  const dayWidth = zoom === 'week' ? DAY_WIDTH_WEEK : DAY_WIDTH_MONTH;
  const totalDays = Math.max(differenceInDays(projectEnd, projectStart) + 14, 30);
  const timelineWidth = totalDays * dayWidth;
  const todayOffset = differenceInDays(today, projectStart) * dayWidth;

  const getBarStyle = task => {
    if (!task.startDate || !task.dueDate) return null;
    const start = differenceInDays(new Date(task.startDate), projectStart);
    const duration = Math.max(differenceInDays(new Date(task.dueDate), new Date(task.startDate)), 1);
    return { left: start * dayWidth, width: duration * dayWidth, backgroundColor: STATUS_COLORS[task.status] || '#94A3B8' };
  };

  // Generate header dates
  const headerDates = [];
  if (zoom === 'week') {
    let curr = startOfWeek(projectStart);
    while (curr <= addDays(projectEnd, 7)) {
      headerDates.push(curr);
      curr = addWeeks(curr, 1);
    }
  } else {
    let curr = startOfMonth(projectStart);
    while (curr <= addMonths(projectEnd, 1)) {
      headerDates.push(curr);
      curr = addMonths(curr, 1);
    }
  }

  if (loading) return <LoadingSpinner fullPage message="Loading timeline..." />;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/projects" color="inherit" underline="hover">Projects</Link>
        <Link component={RouterLink} to={`/projects/${id}`} color="inherit" underline="hover">{currentProject?.name}</Link>
        <Typography color="text.primary">Timeline</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Gantt Timeline</Typography>
        <ToggleButtonGroup value={zoom} exclusive onChange={(_, v) => v && setZoom(v)} size="small">
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Card sx={{ overflow: 'hidden' }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', borderBottom: '2px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
          {/* Task list header */}
          <Box sx={{ width: LEFT_PANEL, flexShrink: 0, p: 1.5, borderRight: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">Task</Typography>
          </Box>
          {/* Timeline header */}
          <Box ref={scrollRef} sx={{ flex: 1, overflowX: 'auto' }}>
            <Box sx={{ width: timelineWidth, display: 'flex', position: 'relative' }}>
              {headerDates.map((d, i) => {
                const left = differenceInDays(d, projectStart) * dayWidth;
                const width = zoom === 'week' ? 7 * dayWidth : (new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()) * dayWidth;
                return (
                  <Box key={i} sx={{ position: 'absolute', left, width, height: 36, borderRight: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', px: 1 }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" noWrap>{format(d, zoom === 'week' ? 'MMM dd' : 'MMM yyyy')}</Typography>
                  </Box>
                );
              })}
            </Box>
            <Box sx={{ height: 36 }} />
          </Box>
        </Box>

        {/* Task rows */}
        <Box sx={{ display: 'flex', maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
          {/* Left panel */}
          <Box sx={{ width: LEFT_PANEL, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider' }}>
            {allTasks.map((task, i) => (
              <Box key={task._id} sx={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', px: 1.5, gap: 1, borderBottom: '1px solid', borderColor: 'grey.100', '&:hover': { backgroundColor: 'grey.50' } }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: STATUS_COLORS[task.status] }} />
                <Typography variant="caption" fontWeight={500} noWrap sx={{ flex: 1 }}>{task.title}</Typography>
                {task.assignees?.[0] && <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem', bgcolor: 'primary.main', flexShrink: 0 }}>{task.assignees[0].name?.[0]}</Avatar>}
              </Box>
            ))}
          </Box>

          {/* Timeline rows */}
          <Box sx={{ flex: 1, overflowX: 'auto', position: 'relative' }}>
            <Box sx={{ width: timelineWidth, position: 'relative', minHeight: allTasks.length * ROW_HEIGHT }}>
              {/* Today line */}
              {todayOffset >= 0 && todayOffset <= timelineWidth && (
                <Box sx={{ position: 'absolute', left: todayOffset, top: 0, bottom: 0, width: 2, backgroundColor: '#EF4444', zIndex: 10, pointerEvents: 'none' }}>
                  <Chip label="Today" size="small" sx={{ position: 'absolute', top: 4, left: 4, height: 18, fontSize: '0.6rem', backgroundColor: '#EF4444', color: 'white' }} />
                </Box>
              )}

              {/* Grid lines */}
              {headerDates.map((d, i) => {
                const left = differenceInDays(d, projectStart) * dayWidth;
                return <Box key={i} sx={{ position: 'absolute', left, top: 0, bottom: 0, width: 1, backgroundColor: 'grey.100' }} />;
              })}

              {/* Task bars */}
              {allTasks.map((task, i) => {
                const bar = getBarStyle(task);
                return (
                  <Box key={task._id} sx={{ position: 'absolute', top: i * ROW_HEIGHT, height: ROW_HEIGHT, width: '100%', display: 'flex', alignItems: 'center', borderBottom: '1px solid', borderColor: 'grey.100' }}>
                    {bar && (
                      <Box sx={{ position: 'absolute', left: bar.left, width: Math.max(bar.width, dayWidth * 0.5), height: 22, borderRadius: 1.5, backgroundColor: bar.backgroundColor, opacity: 0.85, display: 'flex', alignItems: 'center', px: 0.75, cursor: 'pointer', '&:hover': { opacity: 1, zIndex: 5 }, overflow: 'hidden', transition: 'opacity 0.1s', boxShadow: '0 1px 3px rgb(0 0 0 / 0.15)' }}>
                        <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, whiteSpace: 'nowrap', fontSize: '0.65rem' }}>{task.title}</Typography>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: 1, backgroundColor: color }} />
            <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{status.replace('_', ' ')}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
