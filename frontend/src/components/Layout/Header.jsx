import React, { useState } from 'react';
import { AppBar, Toolbar, Box, InputBase, IconButton, Badge, Avatar, Menu, MenuItem, Typography, Chip, Divider, Tooltip } from '@mui/material';
import { Search, AutoAwesome, Settings, Logout, Person, KeyboardArrowDown } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logout } from '../../store/slices/authSlice.js';
import LanguageSwitcher from '../common/LanguageSwitcher.jsx';
import NotificationBell from '../common/NotificationBell.jsx';

export default function Header({ sidebarWidth = 268 }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(s => s.auth.user);
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);

  const pages = { '/': '/','projects': '/projects', 'team': '/team', 'departments': '/departments', 'ai': '/ai' };
  const pageKey = location.pathname === '/' ? '/' : Object.values(pages).find(p => p !== '/' && location.pathname.startsWith(p)) || '/';
  const pageInfo = t(`header.pages.${pageKey}`, { returnObjects: true });

  return (
    <AppBar position="fixed" elevation={0} sx={{ left: { md: sidebarWidth }, width: { md: `calc(100% - ${sidebarWidth}px)` }, backgroundColor: '#FFFFFF', zIndex: th => th.zIndex.drawer - 1 }}>
      <Toolbar sx={{ gap: 1.5, px: { xs: 2, sm: 3 }, minHeight: '60px !important' }}>
        <Box sx={{ display: { xs: 'none', md: 'block' }, mr: 0.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2, fontSize: '0.95rem' }}>{pageInfo?.title}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>{pageInfo?.subtitle}</Typography>
        </Box>
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, borderColor: '#E2E8F0', mx: 0.5 }} />

        <Box sx={{ flex: 1, maxWidth: 360, display: { xs: 'none', sm: 'flex' }, alignItems: 'center', backgroundColor: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 2.5, px: 1.5, py: 0.6, gap: 1, transition: 'all 0.15s', '&:focus-within': { borderColor: '#6366F1', backgroundColor: '#FEFEFF', boxShadow: '0 0 0 3px rgba(99,102,241,0.08)' } }}>
          <Search sx={{ color: '#94A3B8', fontSize: 16 }} />
          <InputBase placeholder={t('header.search')} sx={{ fontSize: '0.82rem', flex: 1, color: 'text.primary', '& input::placeholder': { color: '#94A3B8' } }} />
          <Box sx={{ px: 0.75, py: 0.25, borderRadius: 1, backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}>
            <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>⌘K</Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1 }} />
        <LanguageSwitcher />

        <Chip icon={<AutoAwesome sx={{ fontSize: '14px !important' }} />} label={t('header.aiGenerate')} onClick={() => navigate('/dashboard/ai')} size="small"
          sx={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', color: 'white', fontWeight: 700, fontSize: '0.75rem', px: 0.5, cursor: 'pointer', '& .MuiChip-icon': { color: 'white' }, '&:hover': { opacity: 0.88, transform: 'translateY(-1px)' }, transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(79,70,229,0.35)' }} />

        <NotificationBell />

        <Box onClick={e => setAnchorEl(e.currentTarget)} sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', p: 0.5, pl: 1, borderRadius: 2.5, border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC', '&:hover': { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }, transition: 'all 0.15s' }}>
          <Avatar sx={{ width: 26, height: 26, fontSize: '0.72rem', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>{user?.name?.[0]?.toUpperCase()}</Avatar>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', display: { xs: 'none', sm: 'block' }, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>{user?.name?.split(' ')[0]}</Typography>
          <KeyboardArrowDown sx={{ fontSize: 14, color: '#94A3B8' }} />
        </Box>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} PaperProps={{ sx: { mt: 0.75, minWidth: 200 } }}>
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>{user?.name}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{user?.email}</Typography>
            <Box sx={{ mt: 0.5 }}><Chip label={user?.role?.name || 'Member'} size="small" sx={{ fontSize: '0.68rem', height: 18, backgroundColor: '#EEF2FF', color: '#4F46E5', fontWeight: 600 }} /></Box>
          </Box>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={() => setAnchorEl(null)}><Person sx={{ mr: 1.5, fontSize: 17, color: 'text.secondary' }} /><Typography variant="body2">{t('header.profile')}</Typography></MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}><Settings sx={{ mr: 1.5, fontSize: 17, color: 'text.secondary' }} /><Typography variant="body2">{t('header.settings')}</Typography></MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={() => { dispatch(logout()); setAnchorEl(null); }} sx={{ color: 'error.main', '&:hover': { backgroundColor: '#FEF2F2' } }}>
            <Logout sx={{ mr: 1.5, fontSize: 17 }} /><Typography variant="body2" fontWeight={600}>{t('header.signOut')}</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
