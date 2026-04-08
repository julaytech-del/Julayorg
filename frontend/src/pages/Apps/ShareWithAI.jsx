import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, MenuItem, Card, CardContent, Chip, CircularProgress, Alert, Divider, IconButton, Collapse } from '@mui/material';
import { AutoAwesome, CheckCircle, Close, ExpandMore, ExpandLess, Send, History } from '@mui/icons-material';
import { contextAPI, projectsAPI } from '../../services/api.js';
import { useDispatch } from 'react-redux';
import { showSnackbar } from '../../store/slices/uiSlice.js';

const SOURCE_OPTIONS = [
  { value: 'manual', label: 'Manual / Other', icon: '📋' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '📱' },
  { value: 'slack', label: 'Slack', icon: '💬' },
  { value: 'gmail', label: 'Gmail', icon: '📧' },
  { value: 'notion', label: 'Notion', icon: '📒' },
  { value: 'github', label: 'GitHub', icon: '🐙' },
];

const TYPE_COLORS = {
  add_task: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', label: '+ Task' },
  update_task: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: '~ Update Task' },
  add_goal: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: '+ Goal' },
  update_timeline: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: '↻ Timeline' },
  add_blocker: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: '⚠ Blocker' },
  add_note: { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: '📝 Note' },
  reassign: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', label: '→ Reassign' },
};

function SuggestionCard({ suggestion, onApplyItem, onRejectItem }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card sx={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, mb: 2 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography fontSize="1.2rem">
              {SOURCE_OPTIONS.find(s => s.value === suggestion.source?.type)?.icon || '📋'}
            </Typography>
            <Box>
              <Typography fontWeight={700} fontSize="0.875rem">{suggestion.source?.label}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>
                {new Date(suggestion.createdAt).toLocaleString()}
                {suggestion.project && ` · ${suggestion.project.name}`}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setExpanded(!expanded)} sx={{ color: 'rgba(255,255,255,0.3)' }}>
            {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
        </Box>

        {/* AI Analysis */}
        <Box sx={{ bgcolor: 'rgba(99,102,241,0.08)', borderRadius: 2, p: 1.5, mb: 2, border: '1px solid rgba(99,102,241,0.15)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <AutoAwesome sx={{ fontSize: 14, color: '#818cf8' }} />
            <Typography fontSize="0.72rem" fontWeight={700} color="#818cf8">AI Analysis</Typography>
          </Box>
          <Typography fontSize="0.8rem" sx={{ color: 'rgba(255,255,255,0.65)' }}>{suggestion.aiAnalysis}</Typography>
        </Box>

        <Collapse in={expanded}>
          {/* Suggestion items */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {suggestion.items.map((item, idx) => {
              const typeStyle = TYPE_COLORS[item.type] || TYPE_COLORS.add_note;
              const isPending = item.status === 'pending';
              return (
                <Box key={idx} sx={{ bgcolor: isPending ? typeStyle.bg : 'rgba(255,255,255,0.02)', borderRadius: 2, p: 2, border: `1px solid ${isPending ? typeStyle.color + '30' : 'rgba(255,255,255,0.05)'}`, opacity: isPending ? 1 : 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: item.description ? 0.8 : 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={typeStyle.label} size="small" sx={{ bgcolor: typeStyle.bg, color: typeStyle.color, fontWeight: 700, fontSize: '0.65rem', height: 20, border: `1px solid ${typeStyle.color}30` }} />
                      <Typography fontWeight={600} fontSize="0.82rem">{item.title}</Typography>
                    </Box>
                    {isPending && (
                      <Box sx={{ display: 'flex', gap: 0.8 }}>
                        <Button size="small" onClick={() => onApplyItem(suggestion._id, idx)}
                          sx={{ minWidth: 0, px: 1.5, py: 0.4, bgcolor: 'rgba(52,211,153,0.15)', color: '#34d399', fontWeight: 700, fontSize: '0.72rem', borderRadius: 1.5, textTransform: 'none', '&:hover': { bgcolor: 'rgba(52,211,153,0.25)' }, border: '1px solid rgba(52,211,153,0.25)' }}>
                          Apply
                        </Button>
                        <Button size="small" onClick={() => onRejectItem(suggestion._id, idx)}
                          sx={{ minWidth: 0, px: 1.5, py: 0.4, bgcolor: 'rgba(248,113,113,0.1)', color: '#f87171', fontWeight: 700, fontSize: '0.72rem', borderRadius: 1.5, textTransform: 'none', '&:hover': { bgcolor: 'rgba(248,113,113,0.2)' }, border: '1px solid rgba(248,113,113,0.2)' }}>
                          Skip
                        </Button>
                      </Box>
                    )}
                    {item.status === 'applied' && <Chip label="✓ Applied" size="small" sx={{ bgcolor: 'rgba(52,211,153,0.1)', color: '#34d399', fontSize: '0.65rem', height: 20 }} />}
                    {item.status === 'rejected' && <Chip label="Skipped" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', height: 20 }} />}
                  </Box>
                  {item.description && <Typography fontSize="0.75rem" sx={{ color: 'rgba(255,255,255,0.4)', mt: 0.5 }}>{item.description}</Typography>}
                </Box>
              );
            })}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

export default function ShareWithAI() {
  const dispatch = useDispatch();
  const [text, setText] = useState('');
  const [projectId, setProjectId] = useState('');
  const [source, setSource] = useState('manual');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('share'); // 'share' | 'history'

  useEffect(() => {
    projectsAPI.getAll().then(res => setProjects(res.data?.projects || [])).catch(() => {});
    loadHistory();
  }, []);

  const loadHistory = () => {
    contextAPI.getSuggestions().then(res => setHistory(res.data || [])).catch(() => {});
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const sourceObj = SOURCE_OPTIONS.find(s => s.value === source);
      const res = await contextAPI.analyze(text, projectId || undefined, {
        type: source,
        label: sourceObj?.label,
        icon: sourceObj?.icon
      });
      const newSuggestion = {
        _id: res.data.id,
        source: { type: source, label: sourceObj?.label },
        aiAnalysis: res.data.analysis,
        items: res.data.suggestions,
        project: projects.find(p => p._id === projectId),
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      setSuggestions([newSuggestion]);
      setText('');
      if (res.data.suggestions.length === 0) {
        dispatch(showSnackbar({ message: 'No actionable updates found in this text.', severity: 'info' }));
      }
    } catch (err) {
      dispatch(showSnackbar({ message: err.message || 'Analysis failed', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (suggestionId, itemIndex) => {
    try {
      await contextAPI.applyItem(suggestionId, itemIndex);
      setSuggestions(prev => prev.map(s => s._id === suggestionId ? {
        ...s, items: s.items.map((item, i) => i === itemIndex ? { ...item, status: 'applied' } : item)
      } : s));
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2.5, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AutoAwesome sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} letterSpacing='-0.02em'>Smart Share</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Share any content — AI reads it and updates your plans</Typography>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {[['share', '✨ Share with AI'], ['history', `📋 History (${history.length})`]].map(([val, label]) => (
          <Button key={val} onClick={() => { setTab(val); if (val === 'history') loadHistory(); }}
            sx={{ px: 2.5, py: 0.8, fontWeight: 700, fontSize: '0.82rem', borderRadius: 2, textTransform: 'none', bgcolor: tab === val ? 'rgba(99,102,241,0.2)' : 'transparent', color: tab === val ? '#a5b4fc' : 'rgba(255,255,255,0.4)', border: `1px solid ${tab === val ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`, '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' } }}>
            {label}
          </Button>
        ))}
      </Box>

      {tab === 'share' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 0.8fr' }, gap: 3 }}>
          {/* Input panel */}
          <Box>
            <Card sx={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography fontWeight={700} fontSize="0.875rem" mb={2}>Paste your content</Typography>

                {/* Source selector */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  {SOURCE_OPTIONS.map(opt => (
                    <Chip key={opt.value} label={`${opt.icon} ${opt.label}`} onClick={() => setSource(opt.value)} size="small"
                      sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.72rem', bgcolor: source === opt.value ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', color: source === opt.value ? '#a5b4fc' : 'rgba(255,255,255,0.5)', border: `1px solid ${source === opt.value ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`, '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' } }} />
                  ))}
                </Box>

                <TextField select fullWidth label="Related Project (optional)" value={projectId} onChange={e => setProjectId(e.target.value)} size="small" sx={{ mb: 2, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.04)', color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.4)' } }}>
                  <MenuItem value=""><em style={{ color: 'rgba(255,255,255,0.3)' }}>No specific project</em></MenuItem>
                  {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
                </TextField>

                <TextField multiline rows={8} fullWidth placeholder={`Paste text from ${SOURCE_OPTIONS.find(s => s.value === source)?.label || 'anywhere'}...\n\nExamples:\n• WhatsApp: "The client pushed deadline to next month"\n• Email: "Budget reduced to $8k, need to cut scope"\n• Meeting notes: "Decided to change the tech stack to React"`}
                  value={text} onChange={e => setText(e.target.value)}
                  sx={{ mb: 2, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '0.875rem', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: 'rgba(99,102,241,0.5)' } }, '& textarea::placeholder': { color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem' } }} />

                <Button fullWidth variant="contained" onClick={handleAnalyze} disabled={!text.trim() || loading}
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
                  sx={{ py: 1.4, fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 2, textTransform: 'none', boxShadow: '0 0 20px rgba(99,102,241,0.3)', '&:hover': { boxShadow: '0 0 30px rgba(99,102,241,0.5)' } }}>
                  {loading ? 'Analyzing...' : 'Analyze & Get Suggestions'}
                </Button>
              </CardContent>
            </Card>
          </Box>

          {/* Suggestions panel */}
          <Box>
            {suggestions.length > 0 ? (
              <>
                <Typography fontWeight={700} fontSize="0.78rem" letterSpacing="0.1em" sx={{ color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', mb: 2 }}>
                  AI Suggestions ({suggestions[0]?.items?.length || 0})
                </Typography>
                {suggestions.map(s => (
                  <SuggestionCard key={s._id} suggestion={s} onApplyItem={handleApply} onRejectItem={handleReject} />
                ))}
              </>
            ) : (
              <Box sx={{ border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 3, p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                <Typography fontSize="2rem">🧠</Typography>
                <Typography fontWeight={600} fontSize="0.875rem">AI suggestions will appear here</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', maxWidth: 260 }}>
                  Paste any text from your work tools and AI will suggest how to update your project plans
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {tab === 'history' && (
        <Box>
          {history.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography fontSize="2rem" mb={1}>📋</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.3)' }}>No history yet. Start sharing content with AI.</Typography>
            </Box>
          ) : (
            history.map(s => (
              <SuggestionCard key={s._id} suggestion={s} onApplyItem={handleApply} onRejectItem={handleReject} />
            ))
          )}
        </Box>
      )}
    </Box>
  );
}
