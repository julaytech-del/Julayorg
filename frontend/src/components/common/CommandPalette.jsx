import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, Box, InputBase, Typography, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import {
  Dashboard, Assignment, FolderOpen, CalendarMonth, Group, BarChart, ViewKanban, Folder, Settings,
  AutoAwesome, Add, Search, NavigateNext
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';

const NAV_ITEMS = [
  { id: 'nav-dashboard', title: 'Dashboard', subtitle: 'Overview & stats', url: '/dashboard', icon: <Dashboard sx={{ fontSize: 18 }} /> },
  { id: 'nav-tasks', title: 'My Tasks', subtitle: 'Your assigned tasks', url: '/dashboard/my-tasks', icon: <Assignment sx={{ fontSize: 18 }} /> },
  { id: 'nav-projects', title: 'Projects', subtitle: 'Browse all projects', url: '/dashboard/projects', icon: <FolderOpen sx={{ fontSize: 18 }} /> },
  { id: 'nav-calendar', title: 'Calendar', subtitle: 'Timeline & scheduling', url: '/dashboard/calendar', icon: <CalendarMonth sx={{ fontSize: 18 }} /> },
  { id: 'nav-workload', title: 'Workload', subtitle: 'Team capacity view', url: '/dashboard/workload', icon: <Group sx={{ fontSize: 18 }} /> },
  { id: 'nav-reports', title: 'Reports', subtitle: 'Analytics & insights', url: '/dashboard/reports', icon: <BarChart sx={{ fontSize: 18 }} /> },
  { id: 'nav-portfolio', title: 'Portfolio', subtitle: 'All projects overview', url: '/dashboard/portfolio', icon: <Folder sx={{ fontSize: 18 }} /> },
  { id: 'nav-sprints', title: 'Sprints', subtitle: 'Agile sprint board', url: '/dashboard/sprints', icon: <ViewKanban sx={{ fontSize: 18 }} /> },
  { id: 'nav-settings', title: 'Settings', subtitle: 'App configuration', url: '/dashboard/settings', icon: <Settings sx={{ fontSize: 18 }} /> },
];

const ACTION_ITEMS = [
  { id: 'action-new-task', title: 'Create New Task', subtitle: 'Add a task to a project', url: '/dashboard/projects', icon: <Add sx={{ fontSize: 18 }} /> },
  { id: 'action-reports', title: 'View Reports', subtitle: 'Analytics dashboard', url: '/dashboard/reports', icon: <BarChart sx={{ fontSize: 18 }} /> },
  { id: 'action-ai', title: 'Go to AI Studio', subtitle: 'AI project generation', url: '/dashboard/ai', icon: <AutoAwesome sx={{ fontSize: 18 }} /> },
];

function fuzzyMatch(query, text) {
  if (!query) return true;
  return text.toLowerCase().includes(query.toLowerCase());
}

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [taskResults, setTaskResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setTaskResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced task search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setTaskResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/search', { params: { q: query } });
        const items = Array.isArray(res) ? res : (res?.data || res?.results || []);
        setTaskResults(items.slice(0, 5));
      } catch {
        setTaskResults([]);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const filteredNav = NAV_ITEMS.filter(i => !query || fuzzyMatch(query, i.title) || fuzzyMatch(query, i.subtitle));
  const filteredActions = ACTION_ITEMS.filter(i => !query || fuzzyMatch(query, i.title) || fuzzyMatch(query, i.subtitle));

  const allItems = [
    ...filteredNav.map(i => ({ ...i, section: 'Navigate' })),
    ...taskResults.map(t => ({ id: `task-${t._id}`, title: t.title, subtitle: t.project?.name || 'Task', url: `/dashboard/projects/${t.project?._id || t.project}`, icon: <Assignment sx={{ fontSize: 18 }} />, section: 'Tasks' })),
    ...filteredActions.map(i => ({ ...i, section: 'Actions' })),
  ];

  const executeItem = useCallback((item) => {
    if (!item) return;
    onClose();
    if (item.url) navigate(item.url);
  }, [navigate, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, allItems.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter') { e.preventDefault(); executeItem(allItems[selectedIndex]); }
      else if (e.key === 'Escape') { onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, allItems, selectedIndex, executeItem, onClose]);

  // Keep selection in bounds
  useEffect(() => {
    setSelectedIndex(i => Math.min(i, Math.max(allItems.length - 1, 0)));
  }, [allItems.length]);

  // Group items by section
  const sections = [];
  let currentSection = null;
  let globalIdx = 0;
  allItems.forEach(item => {
    if (item.section !== currentSection) {
      currentSection = item.section;
      sections.push({ label: item.section, items: [] });
    }
    sections[sections.length - 1].items.push({ ...item, globalIdx: globalIdx++ });
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          mt: '15vh',
          verticalAlign: 'top',
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }
      }}
      sx={{ '& .MuiBackdrop-root': { backdropFilter: 'blur(4px)' } }}
    >
      {/* Search Input */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Search sx={{ color: 'text.secondary', fontSize: 20, flexShrink: 0 }} />
        <InputBase
          inputRef={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
          placeholder="Search pages, tasks, actions..."
          fullWidth
          sx={{ fontSize: '1rem', color: 'text.primary', '& input::placeholder': { color: 'text.secondary', opacity: 1 } }}
        />
        <Box sx={{ px: 0.75, py: 0.25, borderRadius: 1, border: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600, userSelect: 'none' }}>ESC</Typography>
        </Box>
      </Box>

      {/* Results */}
      <Box sx={{ maxHeight: '55vh', overflowY: 'auto', py: 1, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { borderRadius: 2, background: 'rgba(0,0,0,0.12)' } }}>
        {allItems.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary" fontSize="0.875rem">No results found</Typography>
          </Box>
        ) : (
          sections.map((section, si) => (
            <Box key={section.label}>
              {si > 0 && <Divider sx={{ my: 0.5 }} />}
              <Typography sx={{ px: 2, py: 0.75, fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {section.label}
              </Typography>
              {section.items.map(item => {
                const isSelected = item.globalIdx === selectedIndex;
                return (
                  <ListItem
                    key={item.id}
                    onClick={() => executeItem(item)}
                    sx={{
                      px: 2, py: 0.75, cursor: 'pointer', borderRadius: 1.5, mx: 0.5, width: 'auto',
                      backgroundColor: isSelected ? 'rgba(99,102,241,0.1)' : 'transparent',
                      '&:hover': { backgroundColor: 'rgba(99,102,241,0.08)' },
                      transition: 'background-color 0.1s',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 34, color: isSelected ? '#6366F1' : 'text.secondary' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography fontSize="0.875rem" fontWeight={isSelected ? 600 : 500} color={isSelected ? '#6366F1' : 'text.primary'}>{item.title}</Typography>}
                      secondary={<Typography fontSize="0.72rem" color="text.secondary">{item.subtitle}</Typography>}
                      sx={{ my: 0 }}
                    />
                    {isSelected && <NavigateNext sx={{ fontSize: 16, color: '#6366F1', flexShrink: 0 }} />}
                  </ListItem>
                );
              })}
            </Box>
          ))
        )}
      </Box>

      {/* Footer hint */}
      <Box sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 2 }}>
        {[['↑↓', 'Navigate'], ['↵', 'Select'], ['Esc', 'Close']].map(([key, label]) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ px: 0.6, py: 0.2, borderRadius: 0.75, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
              <Typography fontSize="0.6rem" fontWeight={700} color="text.secondary" sx={{ fontFamily: 'monospace' }}>{key}</Typography>
            </Box>
            <Typography fontSize="0.7rem" color="text.secondary">{label}</Typography>
          </Box>
        ))}
      </Box>
    </Dialog>
  );
}
