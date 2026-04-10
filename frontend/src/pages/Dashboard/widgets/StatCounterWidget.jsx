import React from 'react';
import { Box, Typography } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export default function StatCounterWidget({ config = {}, data = {} }) {
  const { label = 'Stat', color = '#6366F1', icon = '📊' } = config;
  const value = data.value ?? 0;
  const change = data.change ?? 0;
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography variant="body2" color="text.secondary" fontWeight={600} fontSize="0.78rem" textTransform="uppercase" letterSpacing="0.05em">{label}</Typography>
        <Box sx={{ fontSize: '1.4rem' }}>{icon}</Box>
      </Box>
      <Typography variant="h3" fontWeight={800} sx={{ color, lineHeight: 1 }}>{value}</Typography>
      {change !== 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {change > 0 ? <TrendingUp sx={{ fontSize: 16, color: '#16A34A' }} /> : <TrendingDown sx={{ fontSize: 16, color: '#DC2626' }} />}
          <Typography variant="caption" sx={{ color: change > 0 ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
            {Math.abs(change)}% from last week
          </Typography>
        </Box>
      )}
    </Box>
  );
}
