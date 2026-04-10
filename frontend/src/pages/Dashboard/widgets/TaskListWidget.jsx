import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

const STATUS_COLORS = { todo: '#94A3B8', in_progress: '#6366F1', review: '#F59E0B', done: '#10B981', blocked: '#EF4444' };

export default function TaskListWidget({ config = {}, data = {} }) {
  const { label = 'Recent Tasks' } = config;
  const tasks = data.tasks || [];
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="body2" fontWeight={700} color="text.secondary" fontSize="0.78rem" textTransform="uppercase" letterSpacing="0.05em">{label}</Typography>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {tasks.length === 0 ? (
          <Typography fontSize="0.82rem" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>No tasks</Typography>
        ) : tasks.map((t, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75, borderBottom: i < tasks.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: STATUS_COLORS[t.status] || '#94A3B8', flexShrink: 0 }} />
            <Typography fontSize="0.82rem" flex={1} noWrap>{t.title}</Typography>
            {t.dueDate && <Typography fontSize="0.72rem" color="text.secondary">{new Date(t.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</Typography>}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
