import React from 'react';
import { Box, Typography } from '@mui/material';

export default function PieChartWidget({ config = {}, data = {} }) {
  const { label = 'Team Workload' } = config;
  const items = data.items || [
    { label: 'Available', value: 40, color: '#10B981' },
    { label: 'At Capacity', value: 35, color: '#F59E0B' },
    { label: 'Overloaded', value: 25, color: '#EF4444' },
  ];
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  let cumulative = 0;
  const segments = items.map(item => {
    const pct = (item.value / total) * 100;
    const seg = { ...item, offset: cumulative, pct };
    cumulative += pct;
    return seg;
  });
  const r = 35, cx = 50, cy = 50;
  const polarToXY = (pct) => {
    const angle = (pct / 100) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="body2" fontWeight={700} color="text.secondary" fontSize="0.78rem" textTransform="uppercase" letterSpacing="0.05em">{label}</Typography>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flexShrink: 0 }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            {segments.map((seg, i) => {
              if (seg.pct === 0) return null;
              const start = polarToXY(seg.offset);
              const end = polarToXY(seg.offset + seg.pct);
              const largeArc = seg.pct > 50 ? 1 : 0;
              return (
                <path key={i} d={`M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`} fill={seg.color} />
              );
            })}
            <circle cx={cx} cy={cy} r="22" fill="white" />
          </svg>
        </Box>
        <Box sx={{ flex: 1 }}>
          {items.map((item, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 1, backgroundColor: item.color, flexShrink: 0 }} />
              <Typography fontSize="0.76rem" flex={1}>{item.label}</Typography>
              <Typography fontSize="0.76rem" fontWeight={700}>{item.value}%</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
