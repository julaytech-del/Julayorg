import React from 'react';
import { Chip } from '@mui/material';
import { KeyboardDoubleArrowUp, KeyboardArrowUp, Remove, KeyboardArrowDown } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const PRIORITY_CONFIG = {
  critical: { color: '#DC2626', bg: '#FEF2F2', icon: <KeyboardDoubleArrowUp sx={{ fontSize: 14 }} /> },
  high: { color: '#EA580C', bg: '#FFF7ED', icon: <KeyboardArrowUp sx={{ fontSize: 14 }} /> },
  medium: { color: '#D97706', bg: '#FFFBEB', icon: <Remove sx={{ fontSize: 14 }} /> },
  low: { color: '#65A30D', bg: '#F7FEE7', icon: <KeyboardArrowDown sx={{ fontSize: 14 }} /> }
};

export default function PriorityChip({ priority, size = 'small' }) {
  const { t } = useTranslation();
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const label = t(`task.priority.${priority}`, { defaultValue: priority });
  return (
    <Chip
      label={label}
      size={size}
      icon={config.icon}
      sx={{ backgroundColor: config.bg, color: config.color, fontWeight: 600, border: `1px solid ${config.color}30`, '& .MuiChip-icon': { color: config.color } }}
    />
  );
}
