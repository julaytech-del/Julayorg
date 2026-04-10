import React, { useState, useEffect } from 'react';
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import SuggestionsPanel from '../AI/SuggestionsPanel.jsx';
import CommandPalette from '../common/CommandPalette.jsx';

const SIDEBAR_WIDTH = 268;

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar variant="permanent" />}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sidebar
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content */}
      <Box component="main" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Header
          sidebarWidth={isMobile ? 0 : SIDEBAR_WIDTH}
          onMenuClick={() => setMobileOpen(true)}
          onOpenCommandPalette={() => setCmdPaletteOpen(true)}
        />
        <Toolbar />
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
      <SuggestionsPanel />

      {/* Global Command Palette */}
      <CommandPalette open={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} />
    </Box>
  );
}
