import React from 'react';
import { Box, Typography } from '@mui/material';

export default function BurndownWidget({ config = {}, data = {} }) {
  const { label = 'Sprint Burndown' } = config;
  const points = data.points || Array.from({ length: 10 }, (_, i) => ({ day: i + 1, ideal: 100 - i * 10, actual: 100 - i * 8 - Math.random() * 5 }));
  const w = 280, h = 140, padX = 30, padY = 15;
  const maxVal = 100;
  const scaleX = (i) => padX + (i / (points.length - 1)) * (w - padX * 2);
  const scaleY = (v) => padY + ((maxVal - v) / maxVal) * (h - padY * 2);

  const idealPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(p.ideal)}`).join(' ');
  const actualPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(p.actual)}`).join(' ');

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="body2" fontWeight={700} color="text.secondary" fontSize="0.78rem" textTransform="uppercase" letterSpacing="0.05em">{label}</Typography>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ flex: 1 }}>
          <line x1={padX} y1={padY} x2={padX} y2={h - padY} stroke="#E2E8F0" strokeWidth="1" />
          <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} stroke="#E2E8F0" strokeWidth="1" />
          <path d={idealPath} fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 3" />
          <path d={actualPath} fill="none" stroke="#6366F1" strokeWidth="2" />
          {points.map((p, i) => (
            <circle key={i} cx={scaleX(i)} cy={scaleY(p.actual)} r="3" fill="#6366F1" />
          ))}
        </svg>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 16, height: 2, backgroundColor: '#CBD5E1', borderTop: '2px dashed #CBD5E1' }} />
            <Typography fontSize="0.7rem" color="text.secondary">Ideal</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 16, height: 2, backgroundColor: '#6366F1', borderRadius: 1 }} />
            <Typography fontSize="0.7rem" color="text.secondary">Actual</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
