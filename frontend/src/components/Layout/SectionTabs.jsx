import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '../../hooks/usePermissions.js';

// Sub-navigation tabs shown at the top of grouped pages. Replaces the sidebar
// "More" list: secondary features live as tabs under their parent section.
export default function SectionTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t }    = useTranslation();
  const accent   = useSelector(s => s.ui.accentColor) || '#4F46E5';
  const { canViewReports, canManageDepartment, isAdmin } = usePermissions();

  const groups = [
    [
      { label: t('nav.overview'),        path: '/dashboard' },
      ...(canViewReports ? [{ label: t('nav.reports'), path: '/dashboard/reports' }] : []),
      { label: t('nav.workload'),        path: '/dashboard/workload' },
      { label: t('nav.customDashboard'), path: '/dashboard/custom-dashboard' },
      { label: t('nav.activity'),        path: '/dashboard/activity' },
    ],
    [
      { label: t('nav.projects'),  path: '/dashboard/projects' },
      { label: t('nav.sprints'),   path: '/dashboard/sprints' },
      { label: t('nav.portfolio'), path: '/dashboard/portfolio' },
    ],
    [
      { label: t('nav.myTasks'),      path: '/dashboard/my-tasks' },
      { label: t('nav.timeTracking'), path: '/dashboard/time-tracking' },
    ],
    [
      { label: t('nav.team'), path: '/dashboard/team' },
      ...(canManageDepartment ? [{ label: t('nav.departments'), path: '/dashboard/departments' }] : []),
    ],
    ...(isAdmin ? [[
      { label: t('nav.automations'), path: '/dashboard/automations' },
      { label: t('nav.formViews'),   path: '/dashboard/views/forms' },
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
