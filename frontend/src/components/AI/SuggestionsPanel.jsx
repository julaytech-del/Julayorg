import React, { useState, useEffect } from 'react';
import { Box, Typography, Badge, IconButton, Drawer, Button, Chip, CircularProgress } from '@mui/material';
import { AutoAwesome, Close, CheckCircle } from '@mui/icons-material';
import { contextAPI } from '../../services/api.js';
import { useDispatch } from 'react-redux';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import { useNavigate } from 'react-router-dom';

const TYPE_COLORS = {
  add_task: { color: '#34d399', label: '+ Task' },
  update_task: { color: '#60a5fa', label: '~ Task' },
  add_goal: { color: '#a78bfa', label: '+ Goal' },
  update_timeline: { color: '#fbbf24', label: '↻ Timeline' },
  add_blocker: { color: '#f87171', label: '⚠ Blocker' },
  add_note: { color: '#94a3b8', label: '📝 Note' },
  reassign: { color: '#fb923c', label: '→ Assign' },
};

export default function SuggestionsPanel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Poll for new suggestions count every 30s
  useEffect(() => {
    const fetchCount = () => {
      contextAPI.getCount().then(res => setCount(res.count || 0)).catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const res = await contextAPI.getSuggestions();
      setSuggestions(res.data || []);
    } catch {}
    setLoading(false);
  };

  const handleOpen = () => {
    setOpen(true);
    loadSuggestions();
  };

  const handleApply = async (suggestionId, itemIndex) => {
    try {
      await contextAPI.applyItem(suggestionId, itemIndex);
      setSuggestions(prev => prev.map(s => s._id === suggestionId ? {
        ...s, items: s.items.map((item, i) => i === itemIndex ? { ...item, status: 'applied' } : item)
      } : s));
      setCount(c => Math.max(0, c - 1));
      dispatch(showSnackbar({ message: '✓ Applied to project plan' }));
    } catch (err) {
      dispatch(showSnackbar({ message: err.message, severity: 'error' }));
    }
  };

  const handleReject = async (suggestionId, itemIndex) => {
    try {
      await contextAPI.rejectItem(suggestionId, itemIndex);
      setSuggestions(prev => prev.map(s => s._id === suggestionId ? {
        ...s, items: s.items.map((item, i) => i === itemIndex ? { ...item, status: 'rejected' } : item)
      } : s));
    } catch {}
  };

  const pendingItems = suggestions.flatMap(s =>
    s.items.filter(item => item.status === 'pending').map(item => ({ ...item, suggestionId: s._id, suggestionIndex: s.items.indexOf(item), project: s.project, source: s.source }))
  );

  if (count === 0 && !open) return null;

  return (
    <>
      {/* Floating button */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}>
        <Badge badgeContent={count} color="error" sx={{ '& .MuiBadge-badge': { bgcolor: '#f87171', fontWeight: 700, fontSize: '0.72rem' } }}>
          <IconButton onClick={handleOpen}
            sx={{ width: 52, height: 52, background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 0 30px rgba(99,102,241,0.5)', '&:hover': { boxShadow: '0 0 40px rgba(99,102,241,0.7)', transform: 'scale(1.05)' }, transition: 'all 0.2s' }}>
            <AutoAwesome sx={{ color: 'white', fontSize: 22 }} />
          </IconButton>
        </Badge>
      </Box>

      {/* Drawer */}
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, bgcolor: '#0F172A', borderLeft: '1px solid rgba(255,255,255,0.08)' } }}>
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AutoAwesome sx={{ color: 'white', fontSize: 18 }} />
              </Box>
              <Box>
                <Typography fontWeight={800} fontSize="0.95rem">AI Suggestions</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>{pendingItems.length} pending updates</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setOpen(false)} size="small" sx={{ color: 'rgba(255,255,255,0.4)' }}><Close fontSize="small" /></IconButton>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress sx={{ color: '#818cf8' }} /></Box>
          ) : pendingItems.length === 0 ? (
            <Box sx={{ textAlign: 'center', pt: 6 }}>
              <CheckCircle sx={{ color: '#34d399', fontSize: 40, mb: 2 }} />
              <Typography fontWeight={700} mb={1}>All caught up!</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', mb: 3 }}>No pending AI suggestions.</Typography>
              <Button onClick={() => { setOpen(false); navigate('/dashboard/apps/share'); }} variant="outlined"
                sx={{ borderColor: 'rgba(99,102,241,0.3)', color: '#818cf8', textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                Share content with AI
              </Button>
            </Box>
          ) : (
            <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {pendingItems.map((item, idx) => {
                const typeStyle = TYPE_COLORS[item.type] || TYPE_COLORS.add_note;
                return (
                  <Box key={idx} sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2.5, p: 2.5, transition: 'all 0.15s', '&:hover': { borderColor: `${typeStyle.color}40` } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography fontSize="0.9rem">
                        {item.source?.type === 'whatsapp' ? '📱' : item.source?.type === 'slack' ? '💬' : item.source?.type === 'gmail' ? '📧' : item.source?.type === 'pdf' ? '📑' : '📋'}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>{item.source?.label}</Typography>
                      {item.project && <Chip label={item.project.name} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', height: 18 }} />}
                    </Box>
                    <Chip label={typeStyle.label} size="small" sx={{ bgcolor: `${typeStyle.color}18`, color: typeStyle.color, fontWeight: 700, fontSize: '0.65rem', height: 20, mb: 0.8 }} />
                    <Typography fontWeight={600} fontSize="0.82rem" mb={0.5}>{item.title}</Typography>
                    {item.description && <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', mb: 1.5 }}>{item.description}</Typography>}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" onClick={() => handleApply(item.suggestionId, item.suggestionIndex)}
                        sx={{ flex: 1, py: 0.6, bgcolor: 'rgba(52,211,153,0.12)', color: '#34d399', fontWeight: 700, fontSize: '0.75rem', borderRadius: 1.5, textTransform: 'none', border: '1px solid rgba(52,211,153,0.2)', '&:hover': { bgcolor: 'rgba(52,211,153,0.2)' } }}>
                        ✓ Apply
                      </Button>
                      <Button size="small" onClick={() => handleReject(item.suggestionId, item.suggestionIndex)}
                        sx={{ flex: 1, py: 0.6, bgcolor: 'rgba(248,113,113,0.08)', color: '#f87171', fontWeight: 700, fontSize: '0.75rem', borderRadius: 1.5, textTransform: 'none', border: '1px solid rgba(248,113,113,0.15)', '&:hover': { bgcolor: 'rgba(248,113,113,0.15)' } }}>
                        ✕ Skip
                      </Button>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}

          <Box sx={{ pt: 2, borderTop: '1px solid rgba(255,255,255,0.06)', mt: 2 }}>
            <Button fullWidth onClick={() => { setOpen(false); navigate('/dashboard/apps/share'); }}
              sx={{ py: 1.2, fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 2, textTransform: 'none', fontSize: '0.85rem' }}>
              + Share more content with AI
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
