import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Badge, Box, Button, Chip, CircularProgress, Divider,
  IconButton, List, ListItem, Popover, Tooltip, Typography
} from '@mui/material';
import {
  Assignment, AutoAwesome, Comment, DoneAll,
  Notifications, NotificationsNone, Schedule, SwapHoriz, Warning
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import { notificationsAPI } from '../../services/api.js';

const TYPE_CONFIG = {
  task_assigned:        { icon: Assignment,   color: '#3B82F6', label: 'Assigned' },
  task_due_soon:        { icon: Schedule,     color: '#F59E0B', label: 'Due Soon' },
  task_overdue:         { icon: Warning,      color: '#EF4444', label: 'Overdue' },
  comment_added:        { icon: Comment,      color: '#A855F7', label: 'Comment' },
  status_changed:       { icon: SwapHoriz,    color: '#10B981', label: 'Updated' },
  automation_triggered: { icon: AutoAwesome,  color: '#8B5CF6', label: 'Automation' },
};

const DEFAULT_TYPE = { icon: Notifications, color: '#94A3B8', label: 'Notice' };

function NotificationItem({ notif, onRead, onNavigate }) {
  const cfg = TYPE_CONFIG[notif.type] || DEFAULT_TYPE;
  const IconComp = cfg.icon;

  const handleClick = () => {
    if (!notif.read) onRead(notif._id);
    if (notif.link) onNavigate(notif.link);
  };

  return (
    <ListItem
      disablePadding
      onClick={handleClick}
      sx={{
        px: 2, py: 1.25, cursor: notif.link ? 'pointer' : 'default',
        bgcolor: notif.read ? 'transparent' : 'rgba(99,102,241,0.06)',
        borderLeft: notif.read ? '3px solid transparent' : `3px solid ${cfg.color}`,
        transition: 'background 0.15s',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
        display: 'flex', gap: 1.5, alignItems: 'flex-start',
      }}
    >
      {/* Icon */}
      <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
        <IconComp sx={{ fontSize: 16, color: cfg.color }} />
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.25 }}>
          <Typography variant="caption" fontWeight={notif.read ? 500 : 700} sx={{ fontSize: '0.78rem', lineHeight: 1.4, color: notif.read ? 'text.secondary' : 'text.primary' }} noWrap>
            {notif.title}
          </Typography>
          {!notif.read && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.color, flexShrink: 0, mt: 0.5 }} />}
        </Box>
        {notif.body && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1.45, display: 'block' }} noWrap>
            {notif.body}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Chip label={cfg.label} size="small" sx={{ height: 16, fontSize: '0.62rem', fontWeight: 700, bgcolor: `${cfg.color}18`, color: cfg.color, px: 0.25 }} />
          {notif.projectName && (
            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.disabled' }} noWrap>
              {notif.projectName}
            </Typography>
          )}
          <Typography variant="caption" sx={{ fontSize: '0.66rem', color: 'text.disabled', ml: 'auto', flexShrink: 0 }}>
            {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : ''}
          </Typography>
        </Box>
      </Box>
    </ListItem>
  );
}

export default function NotificationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);
  const open = Boolean(anchorEl);

  const fetchCount = useCallback(async () => {
    try {
      const res = await notificationsAPI.getCount();
      setUnreadCount((res?.data?.count ?? res?.count) || 0);
    } catch {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.getAll({ limit: 20 });
      setNotifications(res?.data || res || []);
      setUnreadCount((res?.data || res || []).filter(n => !n.read).length);
    } catch {
      dispatch(showSnackbar({ message: 'Could not load notifications', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchCount();
    pollRef.current = setInterval(fetchCount, 60000);
    return () => clearInterval(pollRef.current);
  }, [fetchCount]);

  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
    fetchNotifications();
  };
  const handleClose = () => setAnchorEl(null);

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      dispatch(showSnackbar({ message: 'All notifications marked as read', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to mark all as read', severity: 'error' }));
    }
  };

  const handleNavigate = (link) => {
    handleClose();
    navigate(link);
  };

  // Group by project
  const grouped = notifications.reduce((acc, notif) => {
    const key = notif.projectName || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(notif);
    return acc;
  }, {});

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton onClick={handleOpen} sx={{ color: open ? 'primary.main' : 'text.secondary', position: 'relative' }}>
          <Badge
            badgeContent={unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : null}
            sx={{
              '& .MuiBadge-badge': {
                bgcolor: '#EF4444', color: 'white', fontSize: '0.6rem', fontWeight: 700,
                minWidth: 16, height: 16, borderRadius: 99, border: '2px solid #0F172A',
              }
            }}
          >
            {unreadCount > 0 ? <Notifications sx={{ fontSize: 20 }} /> : <NotificationsNone sx={{ fontSize: 20 }} />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 400, maxHeight: 560, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            bgcolor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 3, mt: 0.5, boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2.5, pt: 2, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
            {unreadCount > 0 && (
              <Chip label={`${unreadCount} new`} size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: 'rgba(239,68,68,0.15)', color: '#EF4444' }} />
            )}
          </Box>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAll sx={{ fontSize: 14 }} />}
              onClick={handleMarkAllRead}
              sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.72rem', px: 1 }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

        {/* Body */}
        <Box sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={28} sx={{ color: '#A855F7' }} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, px: 3, gap: 1.5 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <NotificationsNone sx={{ fontSize: 24, color: '#6366f1' }} />
              </Box>
              <Typography variant="body2" fontWeight={600} color="text.secondary">You're all caught up! 🎉</Typography>
              <Typography variant="caption" color="text.disabled" textAlign="center">No new notifications. Check back later.</Typography>
            </Box>
          ) : (
            Object.entries(grouped).map(([group, items], gi) => (
              <Box key={gi}>
                <Box sx={{ px: 2.5, py: 1, bgcolor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', fontSize: '0.64rem', letterSpacing: '0.08em' }}>
                    {group}
                  </Typography>
                </Box>
                <List disablePadding>
                  {items.map((notif, i) => (
                    <React.Fragment key={notif._id || i}>
                      <NotificationItem notif={notif} onRead={handleMarkRead} onNavigate={handleNavigate} />
                      {i < items.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)', mx: 2 }} />}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            ))
          )}
        </Box>

        {/* Footer */}
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ px: 2.5, py: 1.25, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <Button
            size="small"
            onClick={() => { handleClose(); navigate('/notifications'); }}
            sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.75rem' }}
          >
            View all notifications
          </Button>
        </Box>
      </Popover>
    </>
  );
}
