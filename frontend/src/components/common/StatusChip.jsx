import React from 'react';
import { Chip } from '@mui/material';
import { CheckCircle, PlayArrow, Block, RateReview, Schedule } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const STATUS_CONFIG = {
  planned: { color: '#64748B', bg: '#F1F5F9', icon: <Schedule sx={{ fontSize: 14 }} /> },
  in_progress: { color: '#3B82F6', bg: '#EFF6FF', icon: <PlayArrow sx={{ fontSize: 14 }} /> },
  blocked: { color: '#EF4444', bg: '#FEF2F2', icon: <Block sx={{ fontSize: 14 }} /> },
  review: { color: '#F59E0B', bg: '#FFFBEB', icon: <RateReview sx={{ fontSize: 14 }} /> },
  done: { color: '#10B981', bg: '#ECFDF5', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
  not_started: { color: '#64748B', bg: '#F1F5F9', icon: <Schedule sx={{ fontSize: 14 }} /> },
  completed: { color: '#10B981', bg: '#ECFDF5', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
  planning: { color: '#6366F1', bg: '#EEF2FF', icon: <Schedule sx={{ fontSize: 14 }} /> },
  active: { color: '#3B82F6', bg: '#EFF6FF', icon: <PlayArrow sx={{ fontSize: 14 }} /> },
  on_hold: { color: '#F59E0B', bg: '#FFFBEB', icon: <Block sx={{ fontSize: 14 }} /> },
  cancelled: { color: '#EF4444', bg: '#FEF2F2', icon: <Block sx={{ fontSize: 14 }} /> }
};

export default function StatusChip({ status, size = 'small' }) {
  const { t } = useTranslation();
  const label = t(`task.status.${status}`, { defaultValue: t(`projects.filters.${status}`, { defaultValue: status }) });
  const config = STATUS_CONFIG[status] || { color: '#64748B', bg: '#F1F5F9' };
  return (
    <Chip
      label={label}
      size={size}
      icon={config.icon}
      sx={{ backgroundColor: config.bg, color: config.color, fontWeight: 600, border: `1px solid ${config.color}20`, '& .MuiChip-icon': { color: config.color } }}
    />
  );
}
