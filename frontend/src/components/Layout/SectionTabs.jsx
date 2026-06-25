import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePermissions } from '../../hooks/usePermissions.js';

// Sub-navigation tabs shown at the top of grouped pages. Replaces the sidebar
// "More" list: secondary features live as tabs under their parent section.
export default function SectionTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const accent   = useSelector(s => s.ui.accentColor) || '#4F46E5';
  const { canViewReports, canManageDepartment, isAdmin } = usePermissions();

  const groups = [
    [
      { label: 'Overview',         path: '/dashboard' },
      ...(canViewReports ? [{ label: 'Reports', path: '/dashboard/reports' }] : []),
      { label: 'Workload',         path: '/dashboard/workload' },
      { label: 'Custom Dashboard', path: '/dashboard/custom-dashboard' },
      { label: 'Activity',         path: '/dashboard/activity' },
    ],
    [
      { label: 'Projects',  path: '/dashboard/projects' },
      { label: 'Sprints',   path: '/dashboard/sprints' },
      { label: 'Portfolio', path: '/dashboard/portfolio' },
    ],
    [
      { label: 'My Tasks',      path: '/dashboard/my-tasks' },
      { label: 'Time Tracking', path: '/dashboard/time-tracking' },
    ],
    [
      { label: 'Team', path: '/dashboard/team' },
      ...(canManageDepartment ? [{ label: 'Departments', path: '/dashboard/departments' }] : []),
    ],
    ...(isAdmin ? [[
      { label: 'Automations', path: '/dashboard/automations' },
      { label: 'Form Views',  path: '/dashboard/views/forms' },
    ]] : []),
  ];

  const group = groups.find(g => g.some(tab => tab.path === location.pathname));
  if (!group || group.length < 2) return null;

  const current = group.find(tab => tab.path === location.pathname)?.path;

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
      <Tabs
        value={current}
        onChange={(e, v) => navigate(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          minHeight: 42,
          '& .MuiTab-root': { minHeight: 42, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' },
          '& .Mui-selected': { color: `${accent} !important` },
          '& .MuiTabs-indicator': { backgroundColor: accent },
        }}
      >
        {group.map(tab => <Tab key={tab.path} label={tab.label} value={tab.path} />)}
      </Tabs>
    </Box>
  );
}
