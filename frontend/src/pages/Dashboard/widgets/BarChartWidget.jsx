import React from 'react';
import { Box, Typography } from '@mui/material';

export default function BarChartWidget({ config = {}, data = {} }) {
  const { label = 'Tasks by Status' } = config;
  const items = data.items || [
    { label: 'Todo', value: 12, color: '#94A3B8' },
    { label: 'In Progress', value: 8, color: '#6366F1' },
    { label: 'Review', value: 5, color: '#F59E0B' },
    { label: 'Done', value: 20, color: '#10B981' },
  ];
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="body2" fontWeight={700} color="text.secondary" fontSize="0.78rem" textTransform="uppercase" letterSpacing="0.05em">{label}</Typography>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', gap: 0.75 }}>
        {items.map((item, i) => (
          <Box key={i}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
              <Typography fontSize="0.75rem" fontWeight={500}>{item.label}</Typography>
              <Typography fontSize="0.75rem" fontWeight={700} color="text.secondary">{item.value}</Typography>
            </Box>
            <Box sx={{ height: 8, borderRadius: 4, backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
              <Box sx={{ height: '100%', width: `${(item.value / max) * 100}%`, backgroundColor: item.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
