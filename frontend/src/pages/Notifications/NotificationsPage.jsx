import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Chip, List, ListItem, Divider, CircularProgress, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Assignment, AutoAwesome, Comment, DoneAll, NotificationsNone, Schedule, SwapHoriz, Warning, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import { notificationsAPI } from '../../services/api.js';
import { showSnackbar } from '../../store/slices/uiSlice.js';

const TYPE_CONFIG = {
  task_assigned:        { icon: Assignment,   color: '#3B82F6', label: 'Assigned' },
  task_due_soon:        { icon: Schedule,     color: '#F59E0B', label: 'Due Soon' },
  task_overdue:         { icon: Warning,      color: '#EF4444', label: 'Overdue' },
  comment_added:        { icon: Comment,      color: '#A855F7', label: 'Comment' },
  status_changed:       { icon: SwapHoriz,    color: '#10B981', label: 'Updated' },
  automation_triggered: { icon: AutoAwesome,  color: '#8B5CF6', label: 'Automation' },
};
const DEFAULT_TYPE = { icon: NotificationsNone, color: '#94A3B8', label: 'Notice' };

export default function NotificationsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.getAll({ limit: 100 });
      setNotifications(res?.data || res || []);
    } catch {
      dispatch(showSnackbar({ message: 'Could not load notifications', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      dispatch(showSnackbar({ message: 'All marked as read', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed', severity: 'error' }));
    }
  };

  const handleClick = (notif) => {
    if (!notif.read) markRead(notif._id);
    if (notif.link) navigate(notif.link);
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'automation') return n.type === 'automation_triggered';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Box sx={{ p: 3, maxWidth: 760, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Notifications</Typography>
          <Typography variant="body2" color="text.secondary">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Filter</InputLabel>
            <Select value={filter} label="Filter" onChange={e => setFilter(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="unread">Unread</MenuItem>
              <MenuItem value="automation">Automation</MenuItem>
            </Select>
          </FormControl>
          {unreadCount > 0 && (
            <Button startIcon={<DoneAll />} variant="outlined" size="small" onClick={markAllRead} sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}>
              Mark all read
            </Button>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8, p: 6, border: '2px dashed #E2E8F0', borderRadius: 3 }}>
          <NotificationsNone sx={{ fontSize: 56, color: '#CBD5E1', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>No notifications</Typography>
          <Typography variant="body2" color="text.secondary">
            {filter !== 'all' ? 'Try changing the filter above' : "You're all caught up!"}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
          <List disablePadding>
            {filtered.map((notif, i) => {
              const cfg = TYPE_CONFIG[notif.type] || DEFAULT_TYPE;
              const IconComp = cfg.icon;
              return (
                <React.Fragment key={notif._id || i}>
                  <ListItem
                    onClick={() => handleClick(notif)}
                    sx={{
                      px: 2.5, py: 1.5, cursor: notif.link ? 'pointer' : 'default',
                      bgcolor: notif.read ? 'transparent' : `${cfg.color}08`,
                      borderLeft: notif.read ? '3px solid transparent' : `3px solid ${cfg.color}`,
                      gap: 2, alignItems: 'flex-start',
                      '&:hover': { bgcolor: notif.read ? '#F8FAFC' : `${cfg.color}12` },
                    }}
                  >
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                      <IconComp sx={{ fontSize: 18, color: cfg.color }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.25 }}>
                        <Typography fontWeight={notif.read ? 500 : 700} fontSize="0.88rem" sx={{ lineHeight: 1.4 }}>
                          {notif.title}
                        </Typography>
                        {!notif.read && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: cfg.color, flexShrink: 0, mt: 0.6 }} />}
                      </Box>
                      {notif.body && (
                        <Typography variant="body2" color="text.secondary" fontSize="0.82rem" sx={{ mb: 0.75 }}>
                          {notif.body}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={cfg.label} size="small" sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700, bgcolor: `${cfg.color}18`, color: cfg.color }} />
                        {notif.projectName && (
                          <Typography variant="caption" color="text.secondary" fontSize="0.75rem">{notif.projectName}</Typography>
                        )}
                        <Typography variant="caption" color="text.disabled" fontSize="0.72rem" sx={{ ml: 'auto' }}>
                          {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : ''}
                        </Typography>
                      </Box>
                    </Box>
                    {!notif.read && (
                      <Tooltip title="Mark as read">
                        <IconButton size="small" onClick={e => { e.stopPropagation(); markRead(notif._id); }} sx={{ flexShrink: 0, mt: 0.25 }}>
                          <DoneAll sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItem>
                  {i < filtered.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        </Box>
      )}
    </Box>
  );
}
