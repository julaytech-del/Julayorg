import React from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Avatar, Divider, Tooltip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Dashboard, FolderOpen, Group, Business, AutoAwesome, Logout, Psychology, Apps, Share, PictureAsPdf, CalendarMonth, Speed, Bolt, BarChart, Webhook, DynamicForm, ViewQuilt } from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice.js';

const SIDEBAR_WIDTH = 268;

export default function Sidebar({ open, onClose, variant = 'permanent' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const { t } = useTranslation();
  const org = user?.organization;

  const NAV = [
    { title: t('nav.sections.workspace'), items: [
      { label: t('nav.dashboard'), icon: Dashboard, path: '/dashboard' },
      { label: t('nav.projects'), icon: FolderOpen, path: '/dashboard/projects' },
      { label: t('nav.team'), icon: Group, path: '/dashboard/team' },
      { label: t('nav.departments'), icon: Business, path: '/dashboard/departments' },
    ]},
    { title: 'Views', items: [
      { label: 'Calendar', icon: CalendarMonth, path: '/dashboard/calendar' },
      { label: 'Workload', icon: Speed, path: '/dashboard/workload' },
      { label: 'Custom Dashboard', icon: ViewQuilt, path: '/dashboard/custom-dashboard' },
    ]},
    { title: t('nav.sections.intelligence'), items: [
      { label: t('nav.aiStudio'), icon: AutoAwesome, path: '/dashboard/ai', badge: 'AI' },
      { label: 'Reports', icon: BarChart, path: '/dashboard/reports' },
    ]},
    { title: 'Automation', items: [
      { label: 'Automations', icon: Bolt, path: '/dashboard/automations' },
      { label: 'Form Views', icon: DynamicForm, path: '/dashboard/views/forms' },
      { label: 'Webhooks', icon: Webhook, path: '/dashboard/settings/webhooks' },
    ]},
    { title: 'Apps', items: [
      { label: 'Workspace Apps', icon: Apps, path: '/dashboard/apps' },
      { label: 'Smart Share', icon: Share, path: '/dashboard/apps/share' },
      { label: 'PDF + AI', icon: PictureAsPdf, path: '/dashboard/apps/pdf' },
    ]}
  ];

  const isActive = (path) => path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(path);
  const handleNav = (path) => { navigate(path); if (variant === 'temporary') onClose?.(); };

  const content = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0F172A', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      <Box sx={{ p: 2.5, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Box sx={{ width: 34, height: 34, borderRadius: 2, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Psychology sx={{ color: 'white', fontSize: 19 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {typeof org === 'object' ? org?.name : 'Julay'}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', textTransform: 'capitalize' }}>
              {typeof org === 'object' ? org?.industry : ''} · {user?.role?.name || 'Admin'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2.5 }} />

      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: 2 } }}>
        {NAV.map(section => (
          <Box key={section.title} sx={{ mb: 0.5 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.25)', px: 3, py: 0.75, display: 'block', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.62rem' }}>
              {section.title}
            </Typography>
            <List dense disablePadding sx={{ px: 1.5 }}>
              {section.items.map(item => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
                    <ListItemButton onClick={() => handleNav(item.path)} sx={{ borderRadius: 2, py: 0.85, px: 1.5, transition: 'all 0.12s', backgroundColor: active ? 'rgba(99,102,241,0.18)' : 'transparent', '&:hover': { backgroundColor: active ? 'rgba(99,102,241,0.22)' : 'rgba(255,255,255,0.05)' }, position: 'relative' }}>
                      {active && <Box sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: '0 2px 2px 0', backgroundColor: '#818CF8' }} />}
                      <ListItemIcon sx={{ minWidth: 34, color: active ? '#A5B4FC' : 'rgba(255,255,255,0.38)' }}><Icon sx={{ fontSize: 18 }} /></ListItemIcon>
                      <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: active ? 600 : 400, color: active ? '#E0E7FF' : 'rgba(255,255,255,0.55)' }} />
                      {item.badge && (
                        <Box sx={{ px: 0.75, py: 0.2, borderRadius: 1, backgroundColor: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.4)' }}>
                          <Typography sx={{ color: '#A5B4FC', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.04em' }}>{item.badge}</Typography>
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

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2.5 }} />

      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: 2, '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }, transition: 'all 0.12s' }}>
          <Avatar sx={{ width: 30, height: 30, fontSize: '0.78rem', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', flexShrink: 0 }}>{user?.name?.[0]?.toUpperCase()}</Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</Typography>
          </Box>
          <Tooltip title={t('nav.signOut')} placement="top">
            <Logout onClick={() => dispatch(logout())} sx={{ color: 'rgba(255,255,255,0.25)', fontSize: 16, cursor: 'pointer', flexShrink: 0, transition: 'color 0.12s', '&:hover': { color: '#EF4444' } }} />
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Drawer variant={variant} open={variant === 'temporary' ? open : true} onClose={onClose}
      sx={{ width: SIDEBAR_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box', border: 'none' } }}>
      {content}
    </Drawer>
  );
}
