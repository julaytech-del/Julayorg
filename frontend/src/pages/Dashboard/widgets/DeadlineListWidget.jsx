import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { AccessTime } from '@mui/icons-material';

export default function DeadlineListWidget({ config = {}, data = {} }) {
  const { label = 'Upcoming Deadlines' } = config;
  const tasks = data.tasks || [];
  const getDaysLeft = (date) => Math.ceil((new Date(date) - new Date()) / 86400000);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <AccessTime sx={{ fontSize: 14, color: '#F59E0B' }} />
        <Typography variant="body2" fontWeight={700} color="text.secondary" fontSize="0.78rem" textTransform="uppercase" letterSpacing="0.05em">{label}</Typography>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {tasks.length === 0 ? (
          <Typography fontSize="0.82rem" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>No upcoming deadlines</Typography>
        ) : tasks.map((t, i) => {
          const days = getDaysLeft(t.dueDate);
          const color = days < 0 ? '#EF4444' : days <= 2 ? '#F59E0B' : '#10B981';
          return (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75, borderBottom: i < tasks.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontSize="0.82rem" noWrap>{t.title}</Typography>
              </Box>
              <Chip label={days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`} size="small" sx={{ fontSize: '0.68rem', backgroundColor: `${color}20`, color, fontWeight: 700, height: 20 }} />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
