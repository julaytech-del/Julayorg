import React, { useState } from 'react';
import {
  AppBar, Toolbar, Box, InputBase, IconButton, Badge, Avatar, Menu, MenuItem,
  Typography, Chip, Divider, Tooltip, Dialog, DialogContent, DialogActions,
  TextField, Button, Select, FormControl, InputLabel, MenuItem as MuiItem,
} from '@mui/material';
import {
  Search, AutoAwesome, Settings, Logout, Person, KeyboardArrowDown,
  DarkMode, LightMode, Add, Close,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logout } from '../../store/slices/authSlice.js';
import { toggleDarkMode } from '../../store/slices/uiSlice.js';
import { showSnackbar, triggerDashboardRefresh } from '../../store/slices/uiSlice.js';
import LanguageSwitcher from '../common/LanguageSwitcher.jsx';
import NotificationBell from '../common/NotificationBell.jsx';
import { tasksAPI, projectsAPI } from '../../services/api.js';
import { fetchTasks } from '../../store/slices/taskSlice.js';

// ── Quick-add task modal ───────────────────────────────────────────────────────
function QuickAddModal({ open, onClose }) {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const [title,    setTitle]    = useState('');
  const [project,  setProject]  = useState('');
  const [priority, setPriority] = useState('medium');
  const [projects, setProjects] = useState([]);
  const [saving,   setSaving]   = useState(false);

  React.useEffect(() => {
    if (open) {
      projectsAPI.getAll().then(res => setProjects(res.data || [])).catch(()=>{});
    }
  }, [open]);

  const handleClose = () => {
    setTitle(''); setProject(''); setPriority('medium');
    onClose();
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await tasksAPI.create({
        title: title.trim(),
        priority,
        status: 'planned',
        createdBy: user._id,
        assignees: [user._id],
        ...(project ? { project } : {}),
      });
      dispatch(showSnackbar({ message: 'Task created!', severity: 'success' }));
      dispatch(fetchTasks());
      dispatch(triggerDashboardRefresh());
      handleClose();
    } catch {
      dispatch(showSnackbar({ message: 'Failed to create task', severity: 'error' }));
    } finally { setSaving(false); }
  };

  const PRIORITIES = [
    { value:'critical', label:'Critical', color:'#DC2626' },
    { value:'high',     label:'High',     color:'#EA580C' },
    { value:'medium',   label:'Medium',   color:'#D97706' },
    { value:'low',      label:'Low',      color:'#65A30D' },
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius:'16px', boxShadow:'0 24px 60px rgba(0,0,0,0.18)' } }}>
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', px:3, pt:2.5, pb:0 }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
          <Box sx={{ width:28, height:28, borderRadius:'8px', bgcolor:'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Add sx={{ fontSize:18, color:'#6366F1' }}/>
          </Box>
          <Typography sx={{ fontWeight:700, fontSize:'0.95rem', color:'#0F172A' }}>New Task</Typography>
        </Box>
        <IconButton size="small" onClick={handleClose} sx={{ color:'#94A3B8' }}>
          <Close sx={{ fontSize:18 }}/>
        </IconButton>
      </Box>

      <DialogContent sx={{ px:3, pt:2, pb:1 }}>
        <TextField
          autoFocus fullWidth multiline maxRows={3}
          placeholder="Task title…"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && title.trim()) { e.preventDefault(); handleSave(); } }}
          variant="outlined"
          sx={{
            mb:2,
            '& .MuiOutlinedInput-root': {
              fontSize:'0.95rem', fontWeight:500, borderRadius:'10px',
              '&:hover fieldset': { borderColor:'#A5B4FC' },
              '&.Mui-focused fieldset': { borderColor:'#6366F1' },
            },
          }}
        />

        <Box sx={{ display:'flex', gap:1.5 }}>
          <FormControl size="small" sx={{ flex:1 }}>
            <InputLabel sx={{ fontSize:'0.82rem' }}>Project (optional)</InputLabel>
            <Select value={project} onChange={e => setProject(e.target.value)}
              label="Project (optional)"
              sx={{ borderRadius:'10px', fontSize:'0.82rem' }}>
              <MuiItem value=""><em>No project</em></MuiItem>
              {projects.map(p => <MuiItem key={p._id} value={p._id}>{p.name}</MuiItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth:130 }}>
            <InputLabel sx={{ fontSize:'0.82rem' }}>Priority</InputLabel>
            <Select value={priority} onChange={e => setPriority(e.target.value)}
              label="Priority"
              sx={{ borderRadius:'10px', fontSize:'0.82rem' }}>
              {PRIORITIES.map(p => (
                <MuiItem key={p.value} value={p.value}>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                    <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:p.color }}/>
                    {p.label}
                  </Box>
                </MuiItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px:3, pb:2.5, pt:1.5, gap:1 }}>
        <Button onClick={handleClose} sx={{ borderRadius:'8px', textTransform:'none', color:'#64748B' }}>
          Cancel
        </Button>
        <Button
          variant="contained" onClick={handleSave} disabled={!title.trim() || saving}
          sx={{
            borderRadius:'8px', textTransform:'none', fontWeight:700,
            bgcolor:'#6366F1', '&:hover':{ bgcolor:'#4F46E5' },
            boxShadow:'0 2px 8px rgba(99,102,241,0.35)',
            px:2.5,
          }}>
          {saving ? 'Creating…' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
export default function Header({ sidebarWidth = 268, onOpenCommandPalette }) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = useSelector(s => s.auth.user);
  const darkMode  = useSelector(s => s.ui.darkMode);
  const { t }     = useTranslation();
  const [anchorEl,   setAnchorEl]   = useState(null);
  const [quickAdd,   setQuickAdd]   = useState(false);

  const pages   = { '/':'/', projects:'/projects', team:'/team', departments:'/departments', ai:'/ai' };
  const pageKey = location.pathname === '/' ? '/' : Object.values(pages).find(p => p !== '/' && location.pathname.startsWith(p)) || '/';
  const pageInfo = t(`header.pages.${pageKey}`, { returnObjects:true });

  return (
    <>
      <AppBar position="fixed" elevation={0} sx={{
        left:{ md:sidebarWidth }, width:{ md:`calc(100% - ${sidebarWidth}px)` },
        backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
        borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : '#F1F5F9'}`,
        zIndex: th => th.zIndex.drawer - 1,
      }}>
        <Toolbar sx={{ gap:1.5, px:{ xs:2, sm:3 }, minHeight:'60px !important' }}>
          <Box sx={{ display:{ xs:'none', md:'block' }, mr:0.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight:700, color:'text.primary', lineHeight:1.2, fontSize:'0.95rem' }}>{pageInfo?.title}</Typography>
            <Typography variant="caption" sx={{ color:'text.secondary', fontSize:'0.72rem' }}>{pageInfo?.subtitle}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ display:{ xs:'none', md:'block' }, mx:0.5 }}/>

          {/* Search / Command Palette */}
          <Box onClick={onOpenCommandPalette} sx={{
            flex:1, maxWidth:360, display:{ xs:'none', sm:'flex' }, alignItems:'center',
            backgroundColor: darkMode ? '#0F172A' : '#F8FAFC',
            border:`1.5px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
            borderRadius:2.5, px:1.5, py:0.6, gap:1, cursor:'pointer', transition:'all 0.15s',
            '&:hover':{ borderColor:'#6366F1', backgroundColor: darkMode ? '#1E293B' : '#FEFEFF', boxShadow:'0 0 0 3px rgba(99,102,241,0.08)' },
          }}>
            <Search sx={{ color:'#94A3B8', fontSize:16 }}/>
            <InputBase placeholder={t('header.search')} readOnly sx={{ fontSize:'0.82rem', flex:1, color:'text.primary', pointerEvents:'none', '& input::placeholder':{ color:'#94A3B8' } }}/>
            <Box sx={{ px:0.75, py:0.25, borderRadius:1, backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : '#F1F5F9', border:`1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}` }}>
              <Typography sx={{ fontSize:'0.65rem', color:'#94A3B8', fontWeight:600 }}>⌘K</Typography>
            </Box>
          </Box>

          <Box sx={{ flex:1 }}/>
          <LanguageSwitcher/>

          {/* ── Quick Add button ── */}
          <Tooltip title="New task (N)">
            <Box onClick={() => setQuickAdd(true)} sx={{
              display:'flex', alignItems:'center', gap:0.75,
              bgcolor: darkMode ? 'rgba(99,102,241,0.15)' : '#EEF2FF',
              border:`1.5px solid ${darkMode ? 'rgba(99,102,241,0.3)' : '#C7D2FE'}`,
              borderRadius:'10px', px:1.25, py:0.6, cursor:'pointer',
              transition:'all 0.15s',
              '&:hover':{ bgcolor: darkMode ? 'rgba(99,102,241,0.25)' : '#E0E7FF', transform:'translateY(-1px)', boxShadow:'0 4px 12px rgba(99,102,241,0.2)' },
            }}>
              <Add sx={{ fontSize:16, color:'#6366F1' }}/>
              <Typography sx={{ fontSize:'0.78rem', fontWeight:700, color:'#6366F1', display:{ xs:'none', sm:'block' } }}>New</Typography>
            </Box>
          </Tooltip>

          {/* AI Studio chip */}
          <Chip icon={<AutoAwesome sx={{ fontSize:'14px !important' }}/>} label={t('header.aiGenerate')}
            onClick={() => navigate('/dashboard/ai')} size="small"
            sx={{ background:'linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%)', color:'white', fontWeight:700, fontSize:'0.75rem', px:0.5, cursor:'pointer', '& .MuiChip-icon':{ color:'white' }, '&:hover':{ opacity:0.88, transform:'translateY(-1px)' }, transition:'all 0.15s', boxShadow:'0 2px 8px rgba(79,70,229,0.35)' }}/>

          {/* Dark mode */}
          <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
            <IconButton onClick={() => dispatch(toggleDarkMode())} size="small" sx={{ color:'text.secondary', '&:hover':{ backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : '#F1F5F9' } }}>
              {darkMode ? <LightMode sx={{ fontSize:18 }}/> : <DarkMode sx={{ fontSize:18 }}/>}
            </IconButton>
          </Tooltip>

          <NotificationBell/>

          {/* Avatar menu */}
          <Box onClick={e => setAnchorEl(e.currentTarget)} sx={{
            display:'flex', alignItems:'center', gap:1, cursor:'pointer',
            p:0.5, pl:1, borderRadius:2.5,
            border:`1.5px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
            backgroundColor: darkMode ? '#0F172A' : '#F8FAFC',
            '&:hover':{ backgroundColor: darkMode ? '#1E293B' : '#F1F5F9' }, transition:'all 0.15s',
          }}>
            <Avatar sx={{ width:26, height:26, fontSize:'0.72rem', background:'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="caption" sx={{ fontWeight:600, color:'text.primary', display:{ xs:'none', sm:'block' }, maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'0.78rem' }}>
              {user?.name?.split(' ')[0]}
            </Typography>
            <KeyboardArrowDown sx={{ fontSize:14, color:'#94A3B8' }}/>
          </Box>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal:'right', vertical:'top' }} anchorOrigin={{ horizontal:'right', vertical:'bottom' }}
            PaperProps={{ sx:{ mt:0.75, minWidth:200, borderRadius:'12px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)' } }}>
            <Box sx={{ px:2, py:1.5 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize:'0.85rem' }}>{user?.name}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize:'0.75rem' }}>{user?.email}</Typography>
              <Box sx={{ mt:0.5 }}><Chip label={user?.role?.name||'Member'} size="small" sx={{ fontSize:'0.68rem', height:18, backgroundColor:'#EEF2FF', color:'#4F46E5', fontWeight:600 }}/></Box>
            </Box>
            <Divider sx={{ my:0.5 }}/>
            <MenuItem onClick={() => setAnchorEl(null)}><Person sx={{ mr:1.5, fontSize:17, color:'text.secondary' }}/><Typography variant="body2">{t('header.profile')}</Typography></MenuItem>
            <MenuItem onClick={() => setAnchorEl(null)}><Settings sx={{ mr:1.5, fontSize:17, color:'text.secondary' }}/><Typography variant="body2">{t('header.settings')}</Typography></MenuItem>
            <Divider sx={{ my:0.5 }}/>
            <MenuItem onClick={() => { dispatch(logout()); setAnchorEl(null); }} sx={{ color:'error.main', '&:hover':{ backgroundColor:'#FEF2F2' } }}>
              <Logout sx={{ mr:1.5, fontSize:17 }}/><Typography variant="body2" fontWeight={600}>{t('header.signOut')}</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <QuickAddModal open={quickAdd} onClose={() => setQuickAdd(false)}/>
    </>
  );
}
