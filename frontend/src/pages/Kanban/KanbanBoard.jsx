import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Breadcrumbs, Link, Avatar, AvatarGroup,
  IconButton, Button, TextField, Tooltip, LinearProgress, Chip,
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Add, ChatBubbleOutline, Close,
  KeyboardDoubleArrowUp, KeyboardArrowUp, Remove, KeyboardArrowDown,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fetchTasks, updateTaskStatus } from '../../store/slices/taskSlice.js';
import { fetchProject } from '../../store/slices/projectSlice.js';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import { tasksAPI } from '../../services/api.js';
import TaskDetailModal from '../../components/Tasks/TaskDetailModal.jsx';

const COLUMN_DEFS = [
  { id: 'planned',     color: '#64748B', accent: '#94A3B8', bg: '#F8FAFC', ring: '#E2E8F0' },
  { id: 'in_progress', color: '#2563EB', accent: '#3B82F6', bg: '#EFF6FF', ring: '#BFDBFE' },
  { id: 'blocked',     color: '#DC2626', accent: '#EF4444', bg: '#FEF2F2', ring: '#FECACA' },
  { id: 'review',      color: '#B45309', accent: '#F59E0B', bg: '#FFFBEB', ring: '#FDE68A' },
  { id: 'done',        color: '#15803D', accent: '#22C55E', bg: '#F0FDF4', ring: '#BBF7D0' },
];

const PRIORITY_META = {
  critical: { color: '#DC2626', bg: '#FEF2F2', Icon: KeyboardDoubleArrowUp },
  high:     { color: '#EA580C', bg: '#FFF7ED', Icon: KeyboardArrowUp },
  medium:   { color: '#D97706', bg: '#FFFBEB', Icon: Remove },
  low:      { color: '#65A30D', bg: '#F7FEE7', Icon: KeyboardArrowDown },
};

const TYPE_EMOJI = {
  design: '🎨', feature: '⚡', testing: '🧪', planning: '📋',
  meeting: '👥', deployment: '🚀', content: '✍️', research: '🔍',
  review: '👀', bug: '🐛', other: '📌',
};

// ── Task card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, index, onClick }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isToday   = task.dueDate && format(new Date(task.dueDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const totalSubs = (task.subtasks || []).length;
  const doneSubs  = (task.subtasks || []).filter(s => s.status === 'done').length;
  const pMeta = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const PIcon = pMeta.Icon;

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          sx={{
            mb: 1.5,
            bgcolor: 'white',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: snapshot.isDragging ? 'primary.light' : '#E8EDF2',
            boxShadow: snapshot.isDragging
              ? '0 12px 32px rgba(99,102,241,0.18), 0 2px 8px rgba(0,0,0,0.08)'
              : '0 1px 3px rgba(0,0,0,0.04)',
            cursor: 'grab',
            transition: 'box-shadow 0.15s ease, border-color 0.15s ease, transform 0.1s ease',
            transform: snapshot.isDragging ? 'rotate(1.5deg) scale(1.02)' : 'none',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
              borderColor: '#C7D2FE',
            },
            overflow: 'hidden',
          }}
        >
          {/* Priority accent bar at top */}
          <Box sx={{ height: '3px', bgcolor: pMeta.color, borderRadius: '10px 10px 0 0', opacity: 0.7 }} />

          <Box sx={{ p: '12px 14px 12px' }}>
            {/* Top row: type + AI badge + priority icon */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ fontSize: 13, lineHeight: 1 }}>{TYPE_EMOJI[task.type] || '📌'}</Typography>
                {task.aiGenerated && (
                  <Chip label="AI" size="small" sx={{
                    height: 15, fontSize: '0.6rem', fontWeight: 700,
                    bgcolor: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE',
                    '& .MuiChip-label': { px: 0.75 },
                  }} />
                )}
              </Box>
              <Tooltip title={task.priority}>
                <Box sx={{
                  display: 'flex', alignItems: 'center',
                  bgcolor: pMeta.bg, borderRadius: '5px', p: '2px 6px',
                }}>
                  <PIcon sx={{ fontSize: 13, color: pMeta.color }} />
                </Box>
              </Tooltip>
            </Box>

            {/* Title */}
            <Typography sx={{
              fontSize: '0.825rem', fontWeight: 500, lineHeight: 1.45, color: '#0F172A',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              mb: totalSubs > 0 ? 1.25 : 1,
            }}>
              {task.title}
            </Typography>

            {/* Subtask progress bar */}
            {totalSubs > 0 && (
              <Box sx={{ mb: 1.25 }}>
                <LinearProgress
                  variant="determinate"
                  value={(doneSubs / totalSubs) * 100}
                  sx={{
                    height: 4, borderRadius: 4, mb: 0.4,
                    bgcolor: '#F1F5F9',
                    '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: '#6366F1' },
                  }}
                />
                <Typography sx={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                  {doneSubs}/{totalSubs} subtasks
                </Typography>
              </Box>
            )}

            {/* Footer: avatars | date | comments */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.25 }}>
              <AvatarGroup max={3} sx={{
                '& .MuiAvatar-root': {
                  width: 22, height: 22, fontSize: '0.6rem',
                  bgcolor: '#6366F1', border: '1.5px solid white',
                },
              }}>
                {(task.assignees || []).map(a => (
                  <Tooltip key={a._id} title={a.name}>
                    <Avatar sx={{ bgcolor: stringToColor(a.name) }}>{a.name?.[0]?.toUpperCase()}</Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                {(task.comments || []).length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <ChatBubbleOutline sx={{ fontSize: 11, color: '#94A3B8' }} />
                    <Typography sx={{ fontSize: '0.68rem', color: '#94A3B8' }}>{task.comments.length}</Typography>
                  </Box>
                )}
                {task.dueDate && (
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 0.3,
                    bgcolor: isOverdue ? '#FEF2F2' : isToday ? '#FFFBEB' : 'transparent',
                    borderRadius: '4px', px: 0.5, py: 0.2,
                  }}>
                    <Typography sx={{
                      fontSize: '0.68rem', fontWeight: isOverdue || isToday ? 600 : 400,
                      color: isOverdue ? '#DC2626' : isToday ? '#D97706' : '#64748B',
                    }}>
                      {format(new Date(task.dueDate), 'MMM d')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Draggable>
  );
}

// deterministic color from name string
function stringToColor(str = '') {
  const palette = ['#6366F1','#8B5CF6','#EC4899','#3B82F6','#10B981','#F59E0B','#EF4444','#06B6D4'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

// ── Quick-add input card ───────────────────────────────────────────────────────
function AddCard({ onAdd, onCancel }) {
  const [title, setTitle] = useState('');
  return (
    <Box sx={{
      bgcolor: 'white', borderRadius: '10px', border: '1.5px solid #C7D2FE',
      boxShadow: '0 2px 12px rgba(99,102,241,0.12)', p: 1.5,
    }}>
      <TextField
        autoFocus fullWidth multiline maxRows={3}
        placeholder="Task title…"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onAdd(title); }
          if (e.key === 'Escape') onCancel();
        }}
        variant="standard"
        InputProps={{ disableUnderline: true }}
        sx={{ '& textarea': { fontSize: '0.82rem', fontWeight: 500, lineHeight: 1.5 }, mb: 1 }}
      />
      <Box sx={{ display: 'flex', gap: 0.75 }}>
        <Button size="small" variant="contained" onClick={() => onAdd(title)}
          sx={{ borderRadius: '6px', textTransform: 'none', fontSize: '0.78rem', px: 1.5, py: 0.5,
                bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' } }}>
          Add task
        </Button>
        <IconButton size="small" onClick={onCancel} sx={{ color: '#94A3B8' }}>
          <Close sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    </Box>
  );
}

// ── Main board ────────────────────────────────────────────────────────────────
export default function KanbanBoard() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { tasks } = useSelector(s => s.tasks);
  const { currentProject } = useSelector(s => s.projects);
  const user = useSelector(s => s.auth.user);
  const [selectedTask, setSelectedTask] = useState(null);
  const [addingTo, setAddingTo] = useState(null);

  const COLUMNS = COLUMN_DEFS.map(c => ({ ...c, label: t(`kanban.columns.${c.id}`) }));

  useEffect(() => {
    dispatch(fetchTasks({ projectId: id }));
    if (!currentProject || currentProject._id !== id) dispatch(fetchProject(id));
  }, [id]);

  const getColTasks = status => tasks.filter(t => t.status === status).sort((a, b) => a.position - b.position);

  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const newStatus = destination.droppableId;
    dispatch(updateTaskStatus({ id: draggableId, status: newStatus }));
    const colTasks = getColTasks(newStatus);
    const updates = colTasks.map((t, i) => ({ id: t._id, status: newStatus, position: i }));
    updates.splice(destination.index, 0, { id: draggableId, status: newStatus, position: destination.index });
    try { await tasksAPI.reorder(updates); }
    catch { dispatch(showSnackbar({ message: 'Failed to save order', severity: 'error' })); }
  };

  const handleAdd = async (colId, title) => {
    if (!title?.trim()) { setAddingTo(null); return; }
    await tasksAPI.create({ title: title.trim(), project: id, status: colId, priority: 'medium', createdBy: user._id });
    setAddingTo(null);
    dispatch(fetchTasks({ projectId: id }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Breadcrumb */}
      <Breadcrumbs separator="›" sx={{ mb: 2.5, '& .MuiBreadcrumbs-separator': { color: '#CBD5E1' } }}>
        <Link component={RouterLink} to="/dashboard/projects" underline="hover"
          sx={{ fontSize: '0.8rem', color: '#64748B', '&:hover': { color: '#6366F1' } }}>
          {t('nav.projects')}
        </Link>
        <Link component={RouterLink} to={`/dashboard/projects/${id}`} underline="hover"
          sx={{ fontSize: '0.8rem', color: '#64748B', '&:hover': { color: '#6366F1' } }}>
          {currentProject?.name}
        </Link>
        <Typography sx={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 600 }}>
          {t('kanban.title')}
        </Typography>
      </Breadcrumbs>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{
          display: 'flex', gap: 2, overflowX: 'auto', flex: 1,
          pb: 3, alignItems: 'flex-start',
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 3 },
        }}>
          {COLUMNS.map(col => {
            const colTasks = getColTasks(col.id);
            return (
              <Box key={col.id} sx={{ minWidth: 272, width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>

                {/* Column Header */}
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, px: 0.5,
                  borderBottom: `2px solid ${col.ring}`, pb: 1.25,
                }}>
                  <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: col.accent, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: col.color, letterSpacing: '0.02em', flex: 1 }}>
                    {col.label.toUpperCase()}
                  </Typography>
                  <Box sx={{
                    minWidth: 20, height: 20, px: 0.75, borderRadius: '5px',
                    bgcolor: colTasks.length > 0 ? col.bg : 'transparent',
                    border: colTasks.length > 0 ? `1px solid ${col.ring}` : '1px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: col.color, lineHeight: 1 }}>
                      {colTasks.length}
                    </Typography>
                  </Box>
                  <Tooltip title={`Add to ${col.label}`}>
                    <IconButton size="small" onClick={() => setAddingTo(col.id)}
                      sx={{ width: 22, height: 22, color: '#94A3B8', '&:hover': { color: col.color, bgcolor: col.bg } }}>
                      <Add sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Drop zone */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        flex: 1, minHeight: 180, p: 1, borderRadius: '12px',
                        bgcolor: snapshot.isDraggingOver ? col.bg : '#FAFBFC',
                        border: '1.5px dashed',
                        borderColor: snapshot.isDraggingOver ? col.accent : 'transparent',
                        transition: 'background-color 0.18s ease, border-color 0.18s ease',
                      }}
                    >
                      {colTasks.map((task, index) => (
                        <TaskCard key={task._id} task={task} index={index} onClick={setSelectedTask} />
                      ))}
                      {provided.placeholder}

                      {/* Empty state */}
                      {colTasks.length === 0 && addingTo !== col.id && (
                        <Box
                          onClick={() => setAddingTo(col.id)}
                          sx={{
                            border: '1.5px dashed #E2E8F0', borderRadius: '10px',
                            p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75,
                            cursor: 'pointer', color: '#94A3B8',
                            '&:hover': { borderColor: col.accent, color: col.color, bgcolor: col.bg },
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Add sx={{ fontSize: 20 }} />
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>Add a task</Typography>
                        </Box>
                      )}

                      {/* Quick-add card */}
                      {addingTo === col.id && (
                        <AddCard onAdd={title => handleAdd(col.id, title)} onCancel={() => setAddingTo(null)} />
                      )}
                    </Box>
                  )}
                </Droppable>

                {/* Add task button at bottom */}
                {colTasks.length > 0 && addingTo !== col.id && (
                  <Button
                    size="small" startIcon={<Add sx={{ fontSize: 15 }} />}
                    onClick={() => setAddingTo(col.id)}
                    sx={{
                      mt: 1, color: '#94A3B8', justifyContent: 'flex-start', textTransform: 'none',
                      fontSize: '0.78rem', fontWeight: 500, borderRadius: '8px', px: 1,
                      '&:hover': { color: col.color, bgcolor: col.bg },
                    }}
                  >
                    Add task
                  </Button>
                )}
              </Box>
            );
          })}
        </Box>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => dispatch(fetchTasks({ projectId: id }))}
        />
      )}
    </Box>
  );
}
