import React, { useState, useEffect, useRef } from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Avatar, Divider, Tooltip, Collapse } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Dashboard, FolderOpen, Group, Business, AutoAwesome, Logout, Apps, Share, PictureAsPdf, CalendarMonth, Speed, Bolt, BarChart, Webhook, DynamicForm, ViewQuilt, AccountTree, AssignmentTurnedIn, History, FilterTiltShift, Settings, Timer, InsertDriveFile, ViewKanban, NotificationsNone, ExpandMore, ExpandLess, MoreHoriz, ChatBubbleOutline } from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice.js';
import { usePermissions } from '../../hooks/usePermissions.js';
import { chatAPI } from '../../services/api.js';

const SIDEBAR_WIDTH = 260;

export default function Sidebar({ open, onClose, variant = 'permanent' }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dispatch  = useDispatch();
  const user      = useSelector(s => s.auth.user);
  const darkMode  = useSelector(s => s.ui.darkMode);
  const accent    = useSelector(s => s.ui.accentColor) || '#4F46E5';
  const { t }     = useTranslation();
  const org       = user?.organization;
  const { canUseAI, canViewReports, canManageDepartment, isAdmin } = usePermissions();

  // Unread team-chat messages → badge on the Chat item + desktop notification.
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnread = useRef(0);
  useEffect(() => {
    const onChat = () => window.location.pathname.startsWith('/dashboard/chat');
    const poll = async () => {
      try {
        const r = await chatAPI.getUnread();
        const c = r?.count ?? r?.data?.count ?? 0;
        if (c > prevUnread.current && !onChat()) {
          try {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Julay', { body: 'New team message 💬', icon: '/logo-icon.png' });
            }
          } catch { /* ignore */ }
        }
        prevUnread.current = c;
        setUnreadCount(onChat() ? 0 : c);
      } catch { /* ignore */ }
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, []);

  // ── Parent sections. Secondary features live as tabs inside these pages
  //    (see SectionTabs), so the sidebar stays a short list of parents. ──
  const NAV_ITEMS = [
    { label: t('nav.dashboard'),       icon: Dashboard,          path: '/dashboard' },
    { label: t('nav.projects'),        icon: FolderOpen,         path: '/dashboard/projects' },
    { label: t('nav.myTasks'),         icon: AssignmentTurnedIn, path: '/dashboard/my-tasks' },
    { label: t('nav.executionBoard'),  icon: ViewKanban,         path: '/dashboard/execution-board' },
    ...(canUseAI ? [{ label: t('nav.aiStudio'), icon: AutoAwesome, path: '/dashboard/ai', badge: 'AI' }] : []),
    { label: t('nav.calendar'),        icon: CalendarMonth,      path: '/dashboard/calendar' },
    { label: t('nav.team'),            icon: Group,              path: '/dashboard/team' },
    { label: t('nav.chat'),            icon: ChatBubbleOutline,  path: '/dashboard/chat', badge: unreadCount > 0 ? String(unreadCount > 99 ? '99+' : unreadCount) : null, danger: true },
    ...(isAdmin ? [{ label: t('nav.automations'), icon: Bolt,    path: '/dashboard/automations' }] : []),
    { label: t('nav.settings'),        icon: Settings,           path: '/dashboard/settings' },
  ];

  // When on a sub-tab, light up its parent in the sidebar.
  const TAB_PARENT = {
    '/dashboard/reports':          '/dashboard',
    '/dashboard/workload':         '/dashboard',
    '/dashboard/custom-dashboard': '/dashboard',
    '/dashboard/activity':         '/dashboard',
    '/dashboard/sprints':          '/dashboard/projects',
    '/dashboard/portfolio':        '/dashboard/projects',
    '/dashboard/time-tracking':    '/dashboard/my-tasks',
    '/dashboard/departments':      '/dashboard/team',
    '/dashboard/views/forms':      '/dashboard/automations',
  };

  const handleNav  = (path) => { navigate(path); if (variant === 'temporary') onClose?.(); };
  const activePath = TAB_PARENT[location.pathname] || location.pathname;
  const isActive   = (path) => path === '/dashboard'
    ? activePath === '/dashboard'
    : activePath.startsWith(path);

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
  const iconAct    = accent;
  const txtAct     = accent;
  const activeBg   = `${accent}18`;
  const hoverBg    = darkMode ? 'rgba(255,255,255,0.05)'    : `${accent}08`;
  const activeBar  = accent;
  const divCol     = darkMode ? 'rgba(255,255,255,0.07)'    : '#F1F5F9';
  const userHover  = darkMode ? 'rgba(255,255,255,0.05)'    : '#F5F5FF';
  const userName   = darkMode ? 'rgba(255,255,255,0.9)'     : '#111827';
  const userEmail  = darkMode ? 'rgba(255,255,255,0.3)'     : '#9CA3AF';
  const scrollThumb= darkMode ? 'rgba(255,255,255,0.1)'     : `${accent}25`;
  const badgeBg    = `${accent}22`;
  const badgeBorder= `${accent}44`;
  const badgeTxt   = accent;

  const renderItem = (item) => {
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
            <Box sx={{ px: 0.75, py: 0.2, borderRadius: 1, backgroundColor: item.danger ? '#EF444422' : badgeBg, border: `1px solid ${item.danger ? '#EF444466' : badgeBorder}` }}>
              <Typography sx={{ color: item.danger ? '#EF4444' : badgeTxt, fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.04em' }}>{item.badge}</Typography>
            </Box>
          )}
        </ListItemButton>
      </ListItem>
    );
  };

  const content = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: bg, borderRight: `1px solid ${border}` }}>

      {/* ── Dept badge ── */}
      <Box sx={{ p: 2, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 2.5, backgroundColor: orgBg, border: `1px solid ${orgBorder}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Avatar
              src={org?.logo || undefined}
              sx={{
                width: 24, height: 24, borderRadius: 1, flexShrink: 0,
                backgroundColor: accent,
                fontSize: '0.65rem', fontWeight: 700,
              }}
            >
              {!org?.logo && (org?.name?.[0]?.toUpperCase() || 'W')}
            </Avatar>
            <Typography sx={{
              color: orgName, fontSize: '0.82rem', fontWeight: 700,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {org?.name || 'Workspace'}
            </Typography>
          </Box>
          <Typography sx={{ color: orgSub, fontSize: '0.68rem', textTransform: 'capitalize', flexShrink: 0 }}>
            {user?.role?.name || 'Admin'}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: divCol, mx: 2 }} />

      {/* ── Nav ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5, '&::-webkit-scrollbar': { width: 3 }, '&::-webkit-scrollbar-thumb': { background: scrollThumb, borderRadius: 2 } }}>
        <List dense disablePadding sx={{ px: 1.5 }}>
          {NAV_ITEMS.map(renderItem)}
        </List>
      </Box>

      <Divider sx={{ borderColor: divCol, mx: 2 }} />

      {/* ── User footer ── */}
      <Box sx={{ p: 1.75 }}>
        <Box onClick={() => navigate('/dashboard/settings?tab=profile')} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: 2, '&:hover': { backgroundColor: userHover }, transition: 'all 0.12s', cursor: 'pointer' }}>
          <Avatar src={user?.avatar || undefined} sx={{ width: 30, height: 30, fontSize: '0.78rem', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', flexShrink: 0 }}>
            {!user?.avatar && user?.name?.[0]?.toUpperCase()}
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
