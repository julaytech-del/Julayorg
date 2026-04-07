import React, { useEffect, useState } from 'react';
import { Box, Typography, Breadcrumbs, Link, Card, CardContent, Chip, Avatar, AvatarGroup, IconButton, Button, TextField, MenuItem, CircularProgress } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Add, ChatBubbleOutline, CheckBoxOutlineBlank } from '@mui/icons-material';
import { format } from 'date-fns';
import { fetchTasks, updateTaskStatus, reorderTasks } from '../../store/slices/taskSlice.js';
import { fetchProject } from '../../store/slices/projectSlice.js';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import { tasksAPI } from '../../services/api.js';
import PriorityChip from '../../components/common/PriorityChip.jsx';
import TaskDetailModal from '../../components/Tasks/TaskDetailModal.jsx';

const COLUMN_DEFS = [
  { id: 'planned', color: '#94A3B8', bg: '#F8FAFC' },
  { id: 'in_progress', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'blocked', color: '#EF4444', bg: '#FEF2F2' },
  { id: 'review', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'done', color: '#10B981', bg: '#ECFDF5' }
];

const TYPE_ICONS = { design: '🎨', feature: '⚡', testing: '🧪', planning: '📋', meeting: '👥', deployment: '🚀', content: '✍️', research: '🔍', review: '👀', bug: '🐛', other: '📌' };
const PRIORITY_COLORS = { critical: '#DC2626', high: '#EA580C', medium: '#D97706', low: '#65A30D' };

function TaskCard({ task, index, onClick }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const completedSubs = (task.subtasks || []).filter(s => s.status === 'done').length;

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          sx={{
            mb: 1.5, cursor: 'pointer',
            borderLeft: `3px solid ${PRIORITY_COLORS[task.priority] || '#94A3B8'}`,
            opacity: snapshot.isDragging ? 0.9 : 1,
            transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
            transition: 'transform 0.1s, box-shadow 0.15s',
            '&:hover': { boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' },
            boxShadow: snapshot.isDragging ? '0 8px 25px rgb(0 0 0 / 0.15)' : 'none'
          }}
        >
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', gap: 0.5, mb: 0.75 }}>
              <Typography variant="caption">{TYPE_ICONS[task.type] || '📌'}</Typography>
              {task.aiGenerated && <Chip label="AI" size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: '#EEF2FF', color: '#6366F1' }} />}
            </Box>
            <Typography variant="body2" fontWeight={500} sx={{ mb: 1, lineHeight: 1.4 }}>{task.title}</Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 20, height: 20, fontSize: '0.6rem' } }}>
                {(task.assignees || []).map(a => <Avatar key={a._id} sx={{ bgcolor: 'primary.main' }}>{a.name?.[0]}</Avatar>)}
              </AvatarGroup>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {(task.subtasks || []).length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <CheckBoxOutlineBlank sx={{ fontSize: 12, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">{completedSubs}/{task.subtasks.length}</Typography>
                  </Box>
                )}
                {(task.comments || []).length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <ChatBubbleOutline sx={{ fontSize: 12, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">{task.comments.length}</Typography>
                  </Box>
                )}
                {task.dueDate && (
                  <Typography variant="caption" sx={{ color: isOverdue ? 'error.main' : 'text.secondary', fontWeight: isOverdue ? 600 : 400 }}>
                    {format(new Date(task.dueDate), 'MMM dd')}
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}

export default function KanbanBoard() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { tasks } = useSelector(s => s.tasks);
  const { currentProject } = useSelector(s => s.projects);
  const [selectedTask, setSelectedTask] = useState(null);
  const [addingTo, setAddingTo] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const user = useSelector(s => s.auth.user);
  const COLUMNS = COLUMN_DEFS.map(c => ({ ...c, label: t(`kanban.columns.${c.id}`) }));

  useEffect(() => {
    dispatch(fetchTasks({ projectId: id }));
    if (!currentProject || currentProject._id !== id) dispatch(fetchProject(id));
  }, [id]);

  const getColumnTasks = status => tasks.filter(t => t.status === status).sort((a, b) => a.position - b.position);

  const onDragEnd = async result => {
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    const newStatus = destination.droppableId;
    dispatch(updateTaskStatus({ id: draggableId, status: newStatus }));

    const columnTasks = getColumnTasks(newStatus);
    const updates = columnTasks.map((t, i) => ({ id: t._id, status: newStatus, position: i }));
    updates.splice(destination.index, 0, { id: draggableId, status: newStatus, position: destination.index });

    try { await tasksAPI.reorder(updates); }
    catch { dispatch(showSnackbar({ message: 'Failed to save order', severity: 'error' })); }
  };

  const handleAddTask = async (columnId) => {
    if (!newTitle.trim()) return;
    await tasksAPI.create({ title: newTitle, project: id, status: columnId, priority: 'medium', createdBy: user._id });
    setNewTitle('');
    setAddingTo(null);
    dispatch(fetchTasks({ projectId: id }));
  };

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/projects" color="inherit" underline="hover">{t('nav.projects')}</Link>
        <Link component={RouterLink} to={`/projects/${id}`} color="inherit" underline="hover">{currentProject?.name}</Link>
        <Typography color="text.primary">{t('kanban.title')}</Typography>
      </Breadcrumbs>

      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, minHeight: 'calc(100vh - 200px)' }}>
          {COLUMNS.map(col => {
            const colTasks = getColumnTasks(col.id);
            return (
              <Box key={col.id} sx={{ minWidth: 260, width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                {/* Column Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, px: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: col.color }} />
                  <Typography variant="subtitle2" fontWeight={700}>{col.label}</Typography>
                  <Chip label={colTasks.length} size="small" sx={{ height: 18, fontSize: '0.7rem', backgroundColor: col.bg, color: col.color, fontWeight: 700, ml: 'auto' }} />
                </Box>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{ flex: 1, minHeight: 200, p: 1, borderRadius: 2, backgroundColor: snapshot.isDraggingOver ? col.bg : 'grey.50', transition: 'background-color 0.2s', border: '1px solid', borderColor: snapshot.isDraggingOver ? col.color : 'transparent' }}
                    >
                      {colTasks.map((task, index) => (
                        <TaskCard key={task._id} task={task} index={index} onClick={setSelectedTask} />
                      ))}
                      {provided.placeholder}

                      {addingTo === col.id ? (
                        <Box sx={{ mt: 1 }}>
                          <TextField size="small" fullWidth placeholder={t('common.name') + '...'} value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTask(col.id)} autoFocus sx={{ mb: 1 }} />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" variant="contained" onClick={() => handleAddTask(col.id)}>{t('common.create')}</Button>
                            <Button size="small" onClick={() => setAddingTo(null)}>{t('common.cancel')}</Button>
                          </Box>
                        </Box>
                      ) : (
                        <Button size="small" startIcon={<Add />} fullWidth onClick={() => setAddingTo(col.id)}
                          sx={{ mt: 1, color: 'text.secondary', justifyContent: 'flex-start', '&:hover': { backgroundColor: 'grey.100' } }}>
                          {t('common.create')}
                        </Button>
                      )}
                    </Box>
                  )}
                </Droppable>
              </Box>
            );
          })}
        </Box>
      </DragDropContext>

      {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={() => dispatch(fetchTasks({ projectId: id }))} />}
    </Box>
  );
}
