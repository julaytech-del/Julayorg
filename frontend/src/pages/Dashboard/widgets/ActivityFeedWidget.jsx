import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';

export default function ActivityFeedWidget({ config = {}, data = {} }) {
  const { label = 'Activity Feed' } = config;
  const activities = data.activities || [];
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="body2" fontWeight={700} color="text.secondary" fontSize="0.78rem" textTransform="uppercase" letterSpacing="0.05em">{label}</Typography>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {activities.length === 0 ? (
          <Typography fontSize="0.82rem" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>No recent activity</Typography>
        ) : activities.map((a, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1.5, py: 0.75, borderBottom: i < activities.length - 1 ? '1px solid #F1F5F9' : 'none', alignItems: 'flex-start' }}>
            <Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', flexShrink: 0 }}>{a.user?.[0]?.toUpperCase()}</Avatar>
            <Box>
              <Typography fontSize="0.8rem" lineHeight={1.4}><strong>{a.user}</strong> {a.action}</Typography>
              <Typography fontSize="0.7rem" color="text.secondary">{a.time}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
