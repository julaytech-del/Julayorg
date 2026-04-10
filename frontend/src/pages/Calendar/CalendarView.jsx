import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Chip, Avatar, MenuItem, Select, FormControl,
  InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Popover, IconButton, Tooltip
} from '@mui/material';
import {
  ChevronLeft, ChevronRight, Today, AutoAwesome, Close, CalendarMonth, ViewWeek
} from '@mui/icons-material';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  addMonths, subMonths, addWeeks, subWeeks, isSameMonth, isSameDay,
  parseISO, isValid, startOfDay
} from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import { calendarAPI } from '../../services/api.js';

const PRIORITY_COLORS = {
  critical: { bg: '#DC2626', light: 'rgba(220,38,38,0.18)', text: '#FCA5A5' },
  high:     { bg: '#EA580C', light: 'rgba(234,88,12,0.18)',  text: '#FDBA74' },
  medium:   { bg: '#3B82F6', light: 'rgba(59,130,246,0.18)', text: '#93C5FD' },
  low:      { bg: '#64748B', light: 'rgba(100,116,139,0.18)', text: '#CBD5E1' }
};

const cardBase = {
  backgroundColor: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 2
};

function TaskPill({ task, onClick, onAIClick }) {
  const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.low;
  return (
    <Box
      onClick={(e) => { e.stopPropagation(); onClick(task); }}
      sx={{
        display: 'flex', alignItems: 'center', gap: 0.5,
        px: 0.75, py: 0.25, mb: 0.3, borderRadius: 1,
        backgroundColor: pc.light, border: `1px solid ${pc.bg}30`,
        cursor: 'pointer', transition: 'all 0.12s',
        '&:hover': { backgroundColor: `${pc.bg}35`, transform: 'translateY(-1px)' }
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: pc.bg, flexShrink: 0 }} />
      <Typography sx={{ color: pc.text, fontSize: '0.68rem', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {task.title}
      </Typography>
      <Tooltip title="AI Optimize Deadline">
        <AutoAwesome
          onClick={(e) => { e.stopPropagation(); onAIClick(e, task); }}
          sx={{ fontSize: 10, color: '#A78BFA', cursor: 'pointer', flexShrink: 0, '&:hover': { color: '#C4B5FD' } }}
        />
      </Tooltip>
    </Box>
  );
}

export default function CalendarView() {
  const dispatch = useDispatch();
  const { projects } = useSelector(s => s.projects);

  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [aiAnchor, setAiAnchor] = useState(null);
  const [aiTask, setAiTask] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [members, setMembers] = useState([]);

  const getDateRange = useCallback(() => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
      return { start, end };
    } else {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return { start, end };
    }
  }, [view, currentDate]);

  const loadTasks = useCallback(async () => {
    const { start, end } = getDateRange();
    setLoading(true);
    try {
      const res = await calendarAPI.getTasks({
        start: start.toISOString(),
        end: end.toISOString(),
        projectId: selectedProjectId || undefined
      });
      const taskList = res?.data || res || [];
      setTasks(Array.isArray(taskList) ? taskList : []);
      const allMembers = [];
      const seen = new Set();
      taskList.forEach(t => {
        (t.assignees || []).forEach(a => {
          if (!seen.has(a._id)) { seen.add(a._id); allMembers.push(a); }
        });
      });
      setMembers(allMembers);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [getDateRange, selectedProjectId]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const getTasksForDay = (day) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const d = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : new Date(task.dueDate);
      if (!isValid(d)) return false;
      if (selectedMemberId && !(task.assignees || []).some(a => a._id === selectedMemberId)) return false;
      return isSameDay(d, day);
    });
  };

  const isConflictDay = (day) => {
    const assigneeCounts = {};
    const dayTasks = getTasksForDay(day);
    dayTasks.forEach(task => {
      (task.assignees || []).forEach(a => {
        assigneeCounts[a._id] = (assigneeCounts[a._id] || 0) + 1;
      });
    });
    return Object.values(assigneeCounts).some(c => c > 2);
  };

  const handleAIOptimize = async (e, task) => {
    setAiAnchor(e.currentTarget);
    setAiTask(task);
    setAiSuggestion(null);
    setAiLoading(true);
    try {
      const res = await calendarAPI.optimizeDeadline({ taskId: task._id, currentDeadline: task.dueDate });
      setAiSuggestion(res?.suggestion || res?.data || 'No suggestion available.');
    } catch {
      setAiSuggestion('Could not generate AI suggestion at this time.');
    } finally {
      setAiLoading(false);
    }
  };

  const navigate = (dir) => {
    if (view === 'month') setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else setCurrentDate(dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
  };

  // ---- Month View Grid ----
  const renderMonthGrid = () => {
    const { start } = getDateRange();
    const weeks = [];
    let day = start;
    while (day <= endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(day);
        day = addDays(day, 1);
      }
      weeks.push(week);
    }
    const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return (
      <Box>
        {/* Day headers */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
          {DAY_HEADERS.map(d => (
            <Box key={d} sx={{ py: 1, textAlign: 'center' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d}</Typography>
            </Box>
          ))}
        </Box>
        {/* Weeks */}
        {weeks.map((week, wi) => (
          <Box key={wi} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
            {week.map((dayDate, di) => {
              const dayTasks = getTasksForDay(dayDate);
              const isToday = isSameDay(dayDate, new Date());
              const isCurrentMonth = isSameMonth(dayDate, currentDate);
              const conflict = isConflictDay(dayDate);
              return (
                <Box
                  key={di}
                  sx={{
                    minHeight: 100, p: 0.75, borderRadius: 1.5,
                    backgroundColor: conflict ? 'rgba(220,38,38,0.08)' : isToday ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid',
                    borderColor: conflict ? 'rgba(220,38,38,0.3)' : isToday ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)',
                    opacity: isCurrentMonth ? 1 : 0.4,
                    transition: 'background-color 0.15s'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Box sx={{
                      width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: isToday ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'transparent',
                      background: isToday ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'transparent'
                    }}>
                      <Typography sx={{ color: isToday ? 'white' : isCurrentMonth ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: isToday ? 700 : 400 }}>
                        {format(dayDate, 'd')}
                      </Typography>
                    </Box>
                    {conflict && (
                      <Tooltip title="Conflict: multiple tasks for same person">
                        <Typography sx={{ fontSize: '0.6rem', color: '#FCA5A5', fontWeight: 700 }}>!</Typography>
                      </Tooltip>
                    )}
                  </Box>
                  {dayTasks.slice(0, 3).map(task => (
                    <TaskPill key={task._id} task={task} onClick={setSelectedTask} onAIClick={handleAIOptimize} />
                  ))}
                  {dayTasks.length > 3 && (
                    <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem', pl: 0.5 }}>+{dayTasks.length - 3} more</Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    );
  };

  // ---- Week View Grid ----
  const renderWeekGrid = () => {
    const { start } = getDateRange();
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const HOURS = Array.from({ length: 24 }, (_, i) => i);

    return (
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', minWidth: 700 }}>
          {/* Header row */}
          <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }} />
          {days.map((d, i) => {
            const isToday = isSameDay(d, new Date());
            return (
              <Box key={i} sx={{ p: 1, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{format(d, 'EEE')}</Typography>
                <Box sx={{
                  width: 28, height: 28, borderRadius: '50%', mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isToday ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'transparent'
                }}>
                  <Typography sx={{ color: isToday ? 'white' : 'rgba(255,255,255,0.8)', fontSize: '0.8rem', fontWeight: isToday ? 700 : 400 }}>{format(d, 'd')}</Typography>
                </Box>
              </Box>
            );
          })}

          {/* Hour rows */}
          {HOURS.map(hour => (
            <React.Fragment key={hour}>
              <Box sx={{ py: 0.5, pr: 1, textAlign: 'right', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.62rem' }}>{hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`}</Typography>
              </Box>
              {days.map((d, di) => {
                const dayTasks = getTasksForDay(d);
                const conflict = isConflictDay(d);
                return (
                  <Box key={di} sx={{
                    minHeight: 44, p: 0.4,
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    borderLeft: '1px solid rgba(255,255,255,0.06)',
                    backgroundColor: conflict ? 'rgba(220,38,38,0.04)' : 'transparent'
                  }}>
                    {hour === 9 && dayTasks.map(task => (
                      <TaskPill key={task._id} task={task} onClick={setSelectedTask} onAIClick={handleAIOptimize} />
                    ))}
                  </Box>
                );
              })}
            </React.Fragment>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0F172A', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
          Calendar
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={view === 'month' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<CalendarMonth />}
            onClick={() => setView('month')}
            sx={view === 'month' ? { background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', border: 'none' } : { borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
          >
            Month
          </Button>
          <Button
            variant={view === 'week' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<ViewWeek />}
            onClick={() => setView('week')}
            sx={view === 'week' ? { background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', border: 'none' } : { borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
          >
            Week
          </Button>
        </Box>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center', ...cardBase, p: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel sx={{ color: 'rgba(255,255,255,0.4)', '&.Mui-focused': { color: '#A78BFA' } }}>Project</InputLabel>
          <Select
            value={selectedProjectId}
            label="Project"
            onChange={e => setSelectedProjectId(e.target.value)}
            sx={{ color: 'rgba(255,255,255,0.8)', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' }, '.MuiSvgIcon-root': { color: 'rgba(255,255,255,0.4)' } }}
          >
            <MenuItem value="">All Projects</MenuItem>
            {(projects || []).map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel sx={{ color: 'rgba(255,255,255,0.4)', '&.Mui-focused': { color: '#A78BFA' } }}>Member</InputLabel>
          <Select
            value={selectedMemberId}
            label="Member"
            onChange={e => setSelectedMemberId(e.target.value)}
            sx={{ color: 'rgba(255,255,255,0.8)', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' }, '.MuiSvgIcon-root': { color: 'rgba(255,255,255,0.4)' } }}
          >
            <MenuItem value="">All Members</MenuItem>
            {members.map(m => <MenuItem key={m._id} value={m._id}>{m.name}</MenuItem>)}
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {Object.entries(PRIORITY_COLORS).map(([key, val]) => (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: val.bg }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', textTransform: 'capitalize' }}>{key}</Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#DC2626', opacity: 0.6 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>Conflict</Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', '&:hover': { borderColor: '#6366f1', color: '#A78BFA' } }}>
          <ChevronLeft />
        </IconButton>
        <Button size="small" startIcon={<Today />} onClick={() => setCurrentDate(new Date())}
          sx={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 1.5, '&:hover': { borderColor: '#6366f1', color: '#A78BFA', backgroundColor: 'rgba(99,102,241,0.08)' } }}>
          Today
        </Button>
        <IconButton onClick={() => navigate(1)} size="small" sx={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', '&:hover': { borderColor: '#6366f1', color: '#A78BFA' } }}>
          <ChevronRight />
        </IconButton>
        <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>
          {view === 'month'
            ? format(currentDate, 'MMMM yyyy')
            : `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} – ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
          }
        </Typography>
        {loading && <CircularProgress size={16} sx={{ color: '#6366f1', ml: 1 }} />}
      </Box>

      {/* Calendar Grid */}
      <Box sx={{ ...cardBase, p: 1.5 }}>
        {view === 'month' ? renderMonthGrid() : renderWeekGrid()}
      </Box>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onClose={() => setSelectedTask(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3 } }}>
        {selectedTask && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 1 }}>
              <Box>
                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>{selectedTask.title}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.75 }}>
                  <Chip
                    label={selectedTask.priority}
                    size="small"
                    sx={{ bgcolor: PRIORITY_COLORS[selectedTask.priority]?.light, color: PRIORITY_COLORS[selectedTask.priority]?.text, fontSize: '0.68rem', height: 20, textTransform: 'capitalize' }}
                  />
                  <Chip
                    label={selectedTask.status?.replace('_', ' ')}
                    size="small"
                    sx={{ bgcolor: 'rgba(99,102,241,0.15)', color: '#A78BFA', fontSize: '0.68rem', height: 20, textTransform: 'capitalize' }}
                  />
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setSelectedTask(null)} sx={{ color: 'rgba(255,255,255,0.4)' }}><Close fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 0 }}>
              {selectedTask.description && (
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mb: 2 }}>{selectedTask.description}</Typography>
              )}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>Due Date</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
                    {selectedTask.dueDate ? format(new Date(selectedTask.dueDate), 'MMM dd, yyyy') : 'No due date'}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>Assignees</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {(selectedTask.assignees || []).length > 0
                      ? selectedTask.assignees.map(a => (
                        <Chip key={a._id} avatar={<Avatar sx={{ bgcolor: '#6366f1', fontSize: '0.6rem' }}>{a.name?.[0]}</Avatar>} label={a.name} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem' }} />
                      ))
                      : <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Unassigned</Typography>
                    }
                  </Box>
                </Box>
                {selectedTask.estimatedHours && (
                  <Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>Estimated Hours</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>{selectedTask.estimatedHours}h</Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                startIcon={<AutoAwesome />}
                variant="outlined"
                size="small"
                onClick={(e) => { setSelectedTask(null); setTimeout(() => handleAIOptimize(e, selectedTask), 100); }}
                sx={{ borderColor: 'rgba(167,139,250,0.4)', color: '#A78BFA', '&:hover': { borderColor: '#A78BFA', backgroundColor: 'rgba(167,139,250,0.08)' } }}
              >
                AI Optimize Deadline
              </Button>
              <Button onClick={() => setSelectedTask(null)} size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* AI Suggestion Popover */}
      <Popover
        open={Boolean(aiAnchor)}
        anchorEl={aiAnchor}
        onClose={() => { setAiAnchor(null); setAiSuggestion(null); setAiTask(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { bgcolor: '#1E293B', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 2, maxWidth: 320, p: 2 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Box sx={{ width: 28, height: 28, borderRadius: 1.5, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AutoAwesome sx={{ color: 'white', fontSize: 14 }} />
          </Box>
          <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>AI Deadline Optimizer</Typography>
        </Box>
        {aiTask && (
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mb: 1.5 }}>Task: <span style={{ color: 'rgba(255,255,255,0.8)' }}>{aiTask.title}</span></Typography>
        )}
        {aiLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
            <CircularProgress size={16} sx={{ color: '#A78BFA' }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Analyzing workload...</Typography>
          </Box>
        ) : (
          <Box sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', lineHeight: 1.5 }}>{aiSuggestion}</Typography>
          </Box>
        )}
      </Popover>
    </Box>
  );
}
