import React, { useState, useEffect } from 'react';
import { Drawer, Box, Typography, TextField, MenuItem, Chip, Button, Avatar, IconButton, Checkbox, LinearProgress, Divider, AvatarGroup } from '@mui/material';
import { Close, Delete, Add, AutoAwesome, OpenInNew, Send } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { updateTask, deleteTask, addComment } from '../../store/slices/taskSlice.js';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import { tasksAPI, usersAPI } from '../../services/api.js';
import { format } from 'date-fns';
import StatusChip from '../common/StatusChip.jsx';
import PriorityChip from '../common/PriorityChip.jsx';

const STATUSES = ['planned','in_progress','blocked','review','done'];
const PRIORITIES = ['critical','high','medium','low'];
const TYPES = ['feature','bug','research','design','planning','meeting','review','deployment','content','testing','other'];

export default function TaskDetailModal({ task, onClose, onUpdate }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const user = useSelector(s => s.auth.user);
  const [localTask, setLocalTask] = useState(task);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    setLocalTask(task);
    usersAPI.getAll().then(res => setUsers(res.data || [])).catch(() => {});
  }, [task]);

  const updateField = async (field, value) => {
    setLocalTask(p => ({ ...p, [field]: value }));
    setSaving(true);
    await dispatch(updateTask({ id: task._id, data: { [field]: value } }));
    setSaving(false);
    onUpdate?.();
  };

  const handleDelete = async () => {
    await dispatch(deleteTask(task._id));
    dispatch(showSnackbar({ message: t('common.delete'), severity: 'info' }));
    onClose();
    onUpdate?.();
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    await dispatch(addComment({ id: task._id, content: comment }));
    setComment('');
    onUpdate?.();
  };

  const handleSubtask = async (subtaskId, done) => {
    await tasksAPI.updateSubtask(task._id, subtaskId, { status: done ? 'done' : 'pending' });
    const updated = localTask.subtasks.map(s => s._id === subtaskId ? { ...s, status: done ? 'done' : 'pending' } : s);
    setLocalTask(p => ({ ...p, subtasks: updated }));
  };

  const completedSubtasks = (localTask.subtasks || []).filter(s => s.status === 'done').length;

  return (
    <Drawer anchor="right" open={Boolean(task)} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 520 }, p: 0 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {localTask.aiGenerated && <Chip size="small" icon={<AutoAwesome sx={{ fontSize: '12px !important' }} />} label="AI" sx={{ bgcolor: '#EEF2FF', color: '#6366F1', fontWeight: 600 }} />}
            {saving && <Typography variant="caption" color="text.secondary">{t('common.save')}...</Typography>}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small" color="error" onClick={handleDelete}><Delete fontSize="small" /></IconButton>
            <IconButton size="small" onClick={onClose}><Close /></IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
          {/* Title */}
          <TextField fullWidth variant="standard" value={localTask.title} onChange={e => setLocalTask(p => ({ ...p, title: e.target.value }))} onBlur={e => updateField('title', e.target.value)} inputProps={{ style: { fontSize: '1.1rem', fontWeight: 600 } }} sx={{ mb: 2, '& .MuiInput-underline:before': { borderBottom: 'none' }, '& .MuiInput-underline:hover:before': { borderBottom: '2px solid' } }} />

          {/* Status & Priority */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
            <TextField select label={t('task.detail.status')} value={localTask.status} onChange={e => updateField('status', e.target.value)} size="small" sx={{ minWidth: 140 }}>
              {STATUSES.map(s => <MenuItem key={s} value={s}><StatusChip status={s} /></MenuItem>)}
            </TextField>
            <TextField select label={t('task.detail.priority')} value={localTask.priority} onChange={e => updateField('priority', e.target.value)} size="small" sx={{ minWidth: 120 }}>
              {PRIORITIES.map(p => <MenuItem key={p} value={p}><PriorityChip priority={p} /></MenuItem>)}
            </TextField>
            <TextField select label={t('task.detail.type')} value={localTask.type} onChange={e => updateField('type', e.target.value)} size="small" sx={{ minWidth: 130 }}>
              {TYPES.map(type => <MenuItem key={type} value={type}>{t(`task.type.${type}`, { defaultValue: type })}</MenuItem>)}
            </TextField>
          </Box>

          {/* Dates & Hours */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
            <TextField label={t('projects.create.startDate')} type="date" value={localTask.startDate ? format(new Date(localTask.startDate), 'yyyy-MM-dd') : ''} onChange={e => updateField('startDate', e.target.value)} size="small" InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
            <TextField label={t('task.detail.dueDate')} type="date" value={localTask.dueDate ? format(new Date(localTask.dueDate), 'yyyy-MM-dd') : ''} onChange={e => updateField('dueDate', e.target.value)} size="small" InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
            <TextField label={t('task.detail.estimatedHours')} type="number" value={localTask.estimatedHours || ''} onChange={e => updateField('estimatedHours', parseInt(e.target.value))} size="small" sx={{ width: 100 }} />
          </Box>

          {/* Description */}
          <TextField fullWidth label={t('common.description')} multiline rows={3} value={localTask.description || ''} onChange={e => setLocalTask(p => ({ ...p, description: e.target.value }))} onBlur={e => updateField('description', e.target.value)} sx={{ mb: 2 }} />

          {/* Assignees */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" display="block" mb={1}>{t('task.detail.assignees')}</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {(localTask.assignees || []).map(a => (
                <Chip key={a._id} avatar={<Avatar>{a.name?.[0]}</Avatar>} label={a.name} size="small" onDelete={() => updateField('assignees', localTask.assignees.filter(x => x._id !== a._id).map(x => x._id))} />
              ))}
            </Box>
          </Box>

          {/* Tools */}
          {(localTask.tools || []).length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" display="block" mb={1}>{t('ai.tools.title')}</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {localTask.tools.map((tool, i) => (
                  <Chip key={i} label={tool.name} size="small" component="a" href={tool.url ? `https://${tool.url}` : '#'} target="_blank"
                    icon={<OpenInNew sx={{ fontSize: '12px !important' }} />}
                    sx={{ backgroundColor: '#F0FDF4', color: '#15803D', cursor: 'pointer', '& .MuiChip-icon': { color: '#15803D' } }} clickable />
                ))}
              </Box>
            </Box>
          )}

          {/* Subtasks */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">{t('task.detail.subtasks')}</Typography>
              <Typography variant="caption" color="text.secondary">{completedSubtasks}/{(localTask.subtasks || []).length}</Typography>
            </Box>
            {(localTask.subtasks || []).length > 0 && (
              <LinearProgress variant="determinate" value={(completedSubtasks / localTask.subtasks.length) * 100} sx={{ height: 4, borderRadius: 2, mb: 1, backgroundColor: 'grey.100' }} />
            )}
            {(localTask.subtasks || []).map((subtask, i) => (
              <Box key={subtask._id || i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                <Checkbox size="small" checked={subtask.status === 'done'} onChange={e => handleSubtask(subtask._id, e.target.checked)} />
                <Typography variant="body2" sx={{ textDecoration: subtask.status === 'done' ? 'line-through' : 'none', color: subtask.status === 'done' ? 'text.secondary' : 'text.primary' }}>{subtask.title}</Typography>
              </Box>
            ))}
            {(localTask.subtasks || []).length === 0 && (
              <Typography variant="caption" color="text.secondary">{t('task.detail.noSubtasks')}</Typography>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Comments */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" display="block" mb={1.5}>{t('task.detail.comments')} ({(localTask.comments || []).length})</Typography>
            {(localTask.comments || []).length === 0 && (
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>{t('task.detail.noComments')}</Typography>
            )}
            {(localTask.comments || []).map((c, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'secondary.main', flexShrink: 0 }}>{c.author?.name?.[0] || '?'}</Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
                    <Typography variant="caption" fontWeight={700}>{c.author?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{c.createdAt ? format(new Date(c.createdAt), 'MMM dd, HH:mm') : ''}</Typography>
                  </Box>
                  <Box sx={{ mt: 0.25, p: 1, backgroundColor: 'grey.50', borderRadius: 1.5 }}>
                    <Typography variant="body2">{c.content}</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.main', flexShrink: 0 }}>{user?.name?.[0]}</Avatar>
              <TextField size="small" fullWidth placeholder={t('task.detail.addComment')} value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment()} multiline maxRows={3}
                InputProps={{ endAdornment: <IconButton size="small" onClick={handleComment} disabled={!comment.trim()}><Send fontSize="small" /></IconButton> }} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
