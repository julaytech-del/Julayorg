import React from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Avatar, Divider, Tooltip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Dashboard, FolderOpen, Group, Business, AutoAwesome, Logout, Apps, Share, PictureAsPdf, CalendarMonth, Speed, Bolt, BarChart, Webhook, DynamicForm, ViewQuilt, AccountTree, AssignmentTurnedIn, History, FilterTiltShift, Settings, Timer } from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice.js';

const SIDEBAR_WIDTH = 260;

export default function Sidebar({ open, onClose, variant = 'permanent' }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dispatch  = useDispatch();
  const user      = useSelector(s => s.auth.user);
  const darkMode  = useSelector(s => s.ui.darkMode);
  const { t }     = useTranslation();
  const org       = user?.organization;

  const NAV = [
    { title: t('nav.sections.workspace'), items: [
      { label: t('nav.dashboard'), icon: Dashboard,         path: '/dashboard' },
      { label: t('nav.projects'),  icon: FolderOpen,        path: '/dashboard/projects' },
      { label: t('nav.team'),      icon: Group,             path: '/dashboard/team' },
      { label: t('nav.departments'),icon: Business,         path: '/dashboard/departments' },
    ]},
    { title: 'Views', items: [
      { label: 'Calendar',          icon: CalendarMonth,    path: '/dashboard/calendar' },
      { label: 'Workload',          icon: Speed,            path: '/dashboard/workload' },
      { label: 'Custom Dashboard',  icon: ViewQuilt,        path: '/dashboard/custom-dashboard' },
      { label: 'Portfolio',         icon: AccountTree,      path: '/dashboard/portfolio' },
    ]},
    { title: 'Personal', items: [
      { label: 'My Tasks',          icon: AssignmentTurnedIn, path: '/dashboard/my-tasks' },
      { label: 'Time Tracking',     icon: Timer,            path: '/dashboard/time-tracking' },
      { label: 'Activity',          icon: History,          path: '/dashboard/activity' },
    ]},
    { title: t('nav.sections.intelligence'), items: [
      { label: t('nav.aiStudio'),   icon: AutoAwesome,      path: '/dashboard/ai',     badge: 'AI' },
      { label: 'Reports',           icon: BarChart,         path: '/dashboard/reports' },
    ]},
    { title: 'Automation', items: [
      { label: 'Automations',       icon: Bolt,             path: '/dashboard/automations' },
      { label: 'Sprints',           icon: FilterTiltShift,  path: '/dashboard/sprints' },
      { label: 'Form Views',        icon: DynamicForm,      path: '/dashboard/views/forms' },
      { label: 'Webhooks',          icon: Webhook,          path: '/dashboard/settings/webhooks' },
    ]},
    { title: 'Apps', items: [
      { label: 'Workspace Apps',    icon: Apps,             path: '/dashboard/apps' },
      { label: 'Smart Share',       icon: Share,            path: '/dashboard/apps/share' },
      { label: 'PDF + AI',          icon: PictureAsPdf,     path: '/dashboard/apps/pdf' },
    ]},
    { title: 'Account', items: [
      { label: 'Settings',          icon: Settings,         path: '/dashboard/settings' },
    ]},
  ];

  const isActive  = (path) => path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(path);
  const handleNav = (path) => { navigate(path); if (variant === 'temporary') onClose?.(); };

  /* ── colours that flip with dark mode ── */
  const bg         = darkMode ? '#1E293B'                   : '#FFFFFF';
  const border     = darkMode ? 'rgba(255,255,255,0.07)'    : '#F1F5F9';
  const orgBg      = darkMode ? 'rgba(255,255,255,0.04)'    : '#F8F8FF';
  const orgBorder  = darkMode ? 'rgba(255,255,255,0.07)'    : '#E8E8F8';
  const orgName    = darkMode ? 'rgba(255,255,255,0.9)'     : '#111827';
  const orgSub     = darkMode ? 'rgba(255,255,255,0.35)'    : '#9CA3AF';
  const sectionLbl = darkMode ? 'rgba(255,255,255,0.28)'    : '#9CA3AF';
  const iconInact  = darkMode ? 'rgba(255,255,255,0.38)'    : '#9CA3AF';
  const txtInact   = darkMode ? 'rgba(255,255,255,0.55)'    : '#6B7280';
  const iconAct    = darkMode ? '#A5B4FC'                   : '#6366F1';
  const txtAct     = darkMode ? '#E0E7FF'                   : '#4F46E5';
  const activeBg   = darkMode ? 'rgba(99,102,241,0.18)'     : '#EEF2FF';
  const hoverBg    = darkMode ? 'rgba(255,255,255,0.05)'    : '#F5F5FF';
  const activeBar  = darkMode ? '#818CF8'                   : '#6366F1';
  const divCol     = darkMode ? 'rgba(255,255,255,0.07)'    : '#F1F5F9';
  const userHover  = darkMode ? 'rgba(255,255,255,0.05)'    : '#F5F5FF';
  const userName   = darkMode ? 'rgba(255,255,255,0.9)'     : '#111827';
  const userEmail  = darkMode ? 'rgba(255,255,255,0.3)'     : '#9CA3AF';
  const scrollThumb= darkMode ? 'rgba(255,255,255,0.1)'     : 'rgba(99,102,241,0.15)';
  const badgeBg    = darkMode ? 'rgba(99,102,241,0.3)'      : 'rgba(99,102,241,0.1)';
  const badgeBorder= darkMode ? 'rgba(99,102,241,0.4)'      : 'rgba(99,102,241,0.25)';
  const badgeTxt   = darkMode ? '#A5B4FC'                   : '#6366F1';

  const content = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: bg, borderRight: `1px solid ${border}` }}>

      {/* ── Org badge ── */}
      <Box sx={{ p: 2, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 2.5, backgroundColor: orgBg, border: `1px solid ${orgBorder}` }}>
          <Box component="img"
            src="/julay-logo-full.png"
            alt="Julay.org"
            sx={{ height: 24, objectFit: 'contain', filter: darkMode ? 'brightness(0) invert(1)' : 'none' }}
          />
          <Typography sx={{ color: orgSub, fontSize: '0.68rem', textTransform: 'capitalize', flexShrink: 0 }}>
            {user?.role?.name || 'Admin'}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: divCol, mx: 2 }} />

      {/* ── Nav ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5, '&::-webkit-scrollbar': { width: 3 }, '&::-webkit-scrollbar-thumb': { background: scrollThumb, borderRadius: 2 } }}>
        {NAV.map(section => (
          <Box key={section.title} sx={{ mb: 0.5 }}>
            <Typography sx={{ color: sectionLbl, px: 3, py: 0.6, display: 'block', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.6rem' }}>
              {section.title}
            </Typography>
            <List dense disablePadding sx={{ px: 1.5 }}>
              {section.items.map(item => {
                const active = isActive(item.path);
                const Icon   = item.icon;
                return (
                  <ListItem key={item.path} disablePadding sx={{ mb: 0.2 }}>
                    <ListItemButton
                      onClick={() => handleNav(item.path)}
                      sx={{
                        borderRadius: 2, py: 0.8, px: 1.5,
                        transition: 'all 0.12s',
                        backgroundColor: active ? activeBg : 'transparent',
                        '&:hover': { backgroundColor: active ? activeBg : hoverBg },
                        position: 'relative',
                      }}
                    >
                      {active && (
                        <Box sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: '0 2px 2px 0', backgroundColor: activeBar }} />
                      )}
                      <ListItemIcon sx={{ minWidth: 32, color: active ? iconAct : iconInact }}>
                        <Icon sx={{ fontSize: 17 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: '0.83rem', fontWeight: active ? 600 : 400, color: active ? txtAct : txtInact }}
                      />
                      {item.badge && (
                        <Box sx={{ px: 0.75, py: 0.2, borderRadius: 1, backgroundColor: badgeBg, border: `1px solid ${badgeBorder}` }}>
                          <Typography sx={{ color: badgeTxt, fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.04em' }}>{item.badge}</Typography>
                        </Box>
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: divCol, mx: 2 }} />

      {/* ── User footer ── */}
      <Box sx={{ p: 1.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: 2, '&:hover': { backgroundColor: userHover }, transition: 'all 0.12s', cursor: 'default' }}>
          <Avatar sx={{ width: 30, height: 30, fontSize: '0.78rem', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: userName, fontWeight: 600, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</Typography>
            <Typography sx={{ color: userEmail, fontSize: '0.67rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</Typography>
          </Box>
          <Tooltip title={t('nav.signOut')} placement="top">
            <Logout
              onClick={() => dispatch(logout())}
              sx={{ color: userEmail, fontSize: 16, cursor: 'pointer', flexShrink: 0, transition: 'color 0.12s', '&:hover': { color: '#EF4444' } }}
            />
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={variant === 'temporary' ? open : true}
      onClose={onClose}
      sx={{ width: SIDEBAR_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box', border: 'none' } }}
    >
      {content}
    </Drawer>
  );
}
