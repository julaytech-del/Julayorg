import React from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Avatar, Divider, Tooltip, Chip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dashboard, FolderOpen, Group, Business,
  AutoAwesome, Logout, Psychology, KeyboardArrowRight
} from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice.js';

const SIDEBAR_WIDTH = 268;

const NAV = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', icon: Dashboard, path: '/' },
      { label: 'Projects', icon: FolderOpen, path: '/projects' },
      { label: 'Team', icon: Group, path: '/team' },
      { label: 'Departments', icon: Business, path: '/departments' },
    ]
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'AI Studio', icon: AutoAwesome, path: '/ai', badge: 'NEW' },
    ]
  }
];

export default function Sidebar({ open, onClose, variant = 'permanent' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const org = user?.organization;

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  const handleNav = (path) => { navigate(path); if (variant === 'temporary') onClose?.(); };

  const content = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0F172A',
      borderRight: '1px solid rgba(255,255,255,0.06)'
    }}>
      {/* Org Header */}
      <Box sx={{ p: 2.5, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'default' }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: 2,
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Psychology sx={{ color: 'white', fontSize: 19 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {typeof org === 'object' ? org?.name : 'WorkOS'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', textTransform: 'capitalize' }}>
              {typeof org === 'object' ? org?.industry : 'workspace'} · {user?.role?.name || 'Admin'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2.5 }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-track': { background: 'transparent' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: 2 } }}>
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
                    <ListItemButton
                      onClick={() => handleNav(item.path)}
                      sx={{
                        borderRadius: 2,
                        py: 0.85,
                        px: 1.5,
                        transition: 'all 0.12s ease',
                        backgroundColor: active ? 'rgba(99,102,241,0.18)' : 'transparent',
                        '&:hover': { backgroundColor: active ? 'rgba(99,102,241,0.22)' : 'rgba(255,255,255,0.05)' },
                        position: 'relative'
                      }}
                    >
                      {active && (
                        <Box sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: '0 2px 2px 0', backgroundColor: '#818CF8' }} />
                      )}
                      <ListItemIcon sx={{ minWidth: 34, color: active ? '#A5B4FC' : 'rgba(255,255,255,0.38)' }}>
                        <Icon sx={{ fontSize: 18 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.85rem',
                          fontWeight: active ? 600 : 400,
                          color: active ? '#E0E7FF' : 'rgba(255,255,255,0.55)',
                          letterSpacing: '-0.005em'
                        }}
                      />
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

      {/* User Footer */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: 2, '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }, transition: 'all 0.12s', cursor: 'default' }}>
          <Avatar sx={{ width: 30, height: 30, fontSize: '0.78rem', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
              {user?.name}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </Typography>
          </Box>
          <Tooltip title="Sign out" placement="top">
            <Logout
              onClick={() => dispatch(logout())}
              sx={{ color: 'rgba(255,255,255,0.25)', fontSize: 16, cursor: 'pointer', flexShrink: 0, transition: 'color 0.12s', '&:hover': { color: '#EF4444' } }}
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
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box', border: 'none' }
      }}
    >
      {content}
    </Drawer>
  );
}
