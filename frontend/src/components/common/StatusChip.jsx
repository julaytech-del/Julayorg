import React from 'react';
import { Chip } from '@mui/material';
import { CheckCircle, PlayArrow, Block, RateReview, Schedule } from '@mui/icons-material';

const STATUS_CONFIG = {
  planned: { label: 'Planned', color: '#64748B', bg: '#F1F5F9', icon: <Schedule sx={{ fontSize: 14 }} /> },
  in_progress: { label: 'In Progress', color: '#3B82F6', bg: '#EFF6FF', icon: <PlayArrow sx={{ fontSize: 14 }} /> },
  blocked: { label: 'Blocked', color: '#EF4444', bg: '#FEF2F2', icon: <Block sx={{ fontSize: 14 }} /> },
  review: { label: 'Review', color: '#F59E0B', bg: '#FFFBEB', icon: <RateReview sx={{ fontSize: 14 }} /> },
  done: { label: 'Done', color: '#10B981', bg: '#ECFDF5', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
  not_started: { label: 'Not Started', color: '#64748B', bg: '#F1F5F9', icon: <Schedule sx={{ fontSize: 14 }} /> },
  completed: { label: 'Completed', color: '#10B981', bg: '#ECFDF5', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
  planning: { label: 'Planning', color: '#6366F1', bg: '#EEF2FF', icon: <Schedule sx={{ fontSize: 14 }} /> },
  active: { label: 'Active', color: '#3B82F6', bg: '#EFF6FF', icon: <PlayArrow sx={{ fontSize: 14 }} /> },
  on_hold: { label: 'On Hold', color: '#F59E0B', bg: '#FFFBEB', icon: <Block sx={{ fontSize: 14 }} /> },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#FEF2F2', icon: <Block sx={{ fontSize: 14 }} /> }
};

export default function StatusChip({ status, size = 'small' }) {
  const config = STATUS_CONFIG[status] || { label: status, color: '#64748B', bg: '#F1F5F9' };
  return (
    <Chip
      label={config.label}
      size={size}
      icon={config.icon}
      sx={{ backgroundColor: config.bg, color: config.color, fontWeight: 600, border: `1px solid ${config.color}20`, '& .MuiChip-icon': { color: config.color } }}
    />
  );
}
