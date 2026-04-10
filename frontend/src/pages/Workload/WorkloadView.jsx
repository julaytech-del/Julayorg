import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Avatar, MenuItem, Select, FormControl,
  InputLabel, CircularProgress, Tooltip, Drawer, Divider, IconButton,
  Chip, TextField, Table, TableHead, TableBody, TableRow, TableCell
} from '@mui/material';
import {
  AutoAwesome, Refresh, Close, CheckCircle, ArrowForward
} from '@mui/icons-material';
import {
  format, startOfWeek, endOfWeek, addDays, parseISO, isValid
} from 'date-fns';
import { useSelector, useDispatch } from 'react-redux';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import { workloadAPI } from '../../services/api.js';

const cardBase = {
  backgroundColor: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 2
};

function getCapacityColor(ratio) {
  if (ratio <= 0.6) return { bg: 'rgba(16,185,129,0.18)', border: 'rgba(16,185,129,0.3)', text: '#6EE7B7', label: 'Ok' };
  if (ratio <= 0.9) return { bg: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.3)', text: '#FCD34D', label: 'Busy' };
  return { bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.3)', text: '#FCA5A5', label: 'Over' };
}

function WorkloadCell({ hours, capacity, tasks }) {
  const ratio = capacity > 0 ? hours / capacity : 0;
  const { bg, border, text } = getCapacityColor(ratio);

  const tooltipContent = (
    <Box sx={{ p: 1, maxWidth: 220 }}>
      <Typography sx={{ fontWeight: 600, fontSize: '0.78rem', mb: 0.75, color: 'white' }}>{hours}h / {capacity}h capacity</Typography>
      {tasks.length === 0
        ? <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>No tasks</Typography>
        : tasks.map((t, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.4 }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#6366f1', flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title} ({t.estimatedHours || 0}h)</Typography>
          </Box>
        ))
      }
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="top">
      <Box sx={{
        p: 1, borderRadius: 1.5, backgroundColor: hours > 0 ? bg : 'transparent',
        border: `1px solid ${hours > 0 ? border : 'rgba(255,255,255,0.06)'}`,
        cursor: 'default', minHeight: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.25,
        transition: 'all 0.15s', '&:hover': { transform: 'scale(1.04)' }
      }}>
        {hours > 0 ? (
          <>
            <Typography sx={{ color: text, fontWeight: 700, fontSize: '0.88rem' }}>{hours}h</Typography>
            <Box sx={{ width: '80%', height: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <Box sx={{ width: `${Math.min(ratio * 100, 100)}%`, height: '100%', backgroundColor: text, borderRadius: 2, transition: 'width 0.3s' }} />
            </Box>
          </>
        ) : (
          <Typography sx={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.75rem' }}>—</Typography>
        )}
      </Box>
    </Tooltip>
  );
}

export default function WorkloadView() {
  const dispatch = useDispatch();
  const { projects } = useSelector(s => s.projects);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const [startDate, setStartDate] = useState(format(weekStart, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(weekEnd, 'yyyy-MM-dd'));
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [workloadData, setWorkloadData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set());

  const getDays = useCallback(() => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const days = [];
    let cur = s;
    while (cur <= e) { days.push(new Date(cur)); cur = addDays(cur, 1); }
    return days;
  }, [startDate, endDate]);

  const loadWorkload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workloadAPI.get({
        start: new Date(startDate).toISOString(),
        end: new Date(endDate).toISOString(),
        projectId: selectedProjectId || undefined
      });
      const data = res?.data || res || [];
      setWorkloadData(Array.isArray(data) ? data : []);
    } catch {
      setWorkloadData([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedProjectId]);

  useEffect(() => { loadWorkload(); }, [loadWorkload]);

  const handleAIRebalance = async () => {
    setAiDrawerOpen(true);
    setAiLoading(true);
    setAiSuggestions([]);
    try {
      const res = await workloadAPI.aiRebalance({
        start: new Date(startDate).toISOString(),
        end: new Date(endDate).toISOString(),
        projectId: selectedProjectId || undefined,
        workloadData
      });
      const suggestions = res?.suggestions || res?.data || [];
      setAiSuggestions(Array.isArray(suggestions) ? suggestions : []);
    } catch {
      dispatch(showSnackbar({ message: 'AI rebalance failed', severity: 'error' }));
      setAiSuggestions([]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplySuggestion = (idx) => {
    setAppliedSuggestions(prev => new Set([...prev, idx]));
    dispatch(showSnackbar({ message: 'Suggestion applied successfully', severity: 'success' }));
  };

  const days = getDays();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0F172A', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>Workload</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', mt: 0.25 }}>
            Team capacity overview by hours
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AutoAwesome />}
          onClick={handleAIRebalance}
          sx={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #9333ea)' }, borderRadius: 2, fontWeight: 600, px: 2.5 }}
        >
          AI Rebalance
        </Button>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center', ...cardBase, p: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel sx={{ color: 'rgba(255,255,255,0.4)', '&.Mui-focused': { color: '#A78BFA' } }}>Project</InputLabel>
          <Select
            value={selectedProjectId}
            label="Project"
            onChange={e => setSelectedProjectId(e.target.value)}
            sx={{ color: 'rgba(255,255,255,0.8)', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' }, '.MuiSvgIcon-root': { color: 'rgba(255,255,255,0.4)' } }}
          >
            <MenuItem value="">All Projects</MenuItem>
            {(projects || []).map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
          </Select>
        </FormControl>

        <TextField
          size="small" type="date" label="Start Date" value={startDate}
          onChange={e => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true, sx: { color: 'rgba(255,255,255,0.4)', '&.Mui-focused': { color: '#A78BFA' } } }}
          sx={{ '& .MuiOutlinedInput-root': { color: 'rgba(255,255,255,0.8)', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }, '& input::-webkit-calendar-picker-indicator': { filter: 'invert(0.5)' } }}
        />
        <TextField
          size="small" type="date" label="End Date" value={endDate}
          onChange={e => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true, sx: { color: 'rgba(255,255,255,0.4)', '&.Mui-focused': { color: '#A78BFA' } } }}
          sx={{ '& .MuiOutlinedInput-root': { color: 'rgba(255,255,255,0.8)', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }, '& input::-webkit-calendar-picker-indicator': { filter: 'invert(0.5)' } }}
        />

        <Button
          startIcon={loading ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <Refresh />}
          variant="outlined" size="small" onClick={loadWorkload} disabled={loading}
          sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', '&:hover': { borderColor: '#6366f1', color: '#A78BFA', backgroundColor: 'rgba(99,102,241,0.08)' } }}
        >
          Refresh
        </Button>

        <Box sx={{ flex: 1 }} />

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {[
            { label: '≤60% Capacity', color: '#6EE7B7' },
            { label: '60–90%', color: '#FCD34D' },
            { label: '>90% Overloaded', color: '#FCA5A5' }
          ].map(item => (
            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>{item.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Workload Table */}
      <Box sx={{ ...cardBase, overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow sx={{ '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.04)', py: 1.5 } }}>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 180 }}>
                  Team Member
                </TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 80 }}>
                  Capacity
                </TableCell>
                {days.map((d, i) => (
                  <TableCell key={i} align="center" sx={{ color: isSameDayAsToday(d) ? '#A78BFA' : 'rgba(255,255,255,0.5)', fontWeight: isSameDayAsToday(d) ? 700 : 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 90 }}>
                    <Typography sx={{ fontSize: '0.68rem', color: 'inherit' }}>{format(d, 'EEE')}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: isSameDayAsToday(d) ? '#A78BFA' : 'rgba(255,255,255,0.7)' }}>{format(d, 'MMM d')}</Typography>
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 80 }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={days.length + 3} sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 6, textAlign: 'center' }}>
                    <CircularProgress size={28} sx={{ color: '#6366f1' }} />
                  </TableCell>
                </TableRow>
              ) : workloadData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={days.length + 3} sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 6, textAlign: 'center' }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem' }}>No workload data for this period</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                workloadData.map((member, mi) => {
                  const dailyCapacity = member.availability?.hoursPerDay || 8;
                  let totalHours = 0;
                  return (
                    <TableRow key={mi} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' }, '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.04)', py: 1 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.78rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', flexShrink: 0 }}>
                            {member.user?.name?.[0]?.toUpperCase() || member.name?.[0]?.toUpperCase() || '?'}
                          </Avatar>
                          <Box>
                            <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', fontWeight: 500 }}>{member.user?.name || member.name || 'Unknown'}</Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem' }}>{member.user?.email || member.email || ''}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', textAlign: 'center' }}>{dailyCapacity}h/day</Typography>
                      </TableCell>
                      {days.map((d, di) => {
                        const dayStr = format(d, 'yyyy-MM-dd');
                        const dayEntry = (member.days || {})[dayStr] || { hours: 0, tasks: [] };
                        totalHours += dayEntry.hours || 0;
                        return (
                          <TableCell key={di} sx={{ p: 0.75 }}>
                            <WorkloadCell hours={dayEntry.hours || 0} capacity={dailyCapacity} tasks={dayEntry.tasks || []} />
                          </TableCell>
                        );
                      })}
                      <TableCell align="center">
                        {(() => {
                          const totalCapacity = dailyCapacity * days.length;
                          const ratio = totalCapacity > 0 ? totalHours / totalCapacity : 0;
                          const { text } = getCapacityColor(ratio);
                          return (
                            <Typography sx={{ color: text, fontWeight: 700, fontSize: '0.88rem' }}>
                              {totalHours}h
                            </Typography>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {/* AI Rebalance Drawer */}
      <Drawer
        anchor="right"
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        PaperProps={{ sx: { width: 380, bgcolor: '#0F172A', borderLeft: '1px solid rgba(255,255,255,0.08)' } }}
      >
        <Box sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Drawer Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: 2, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AutoAwesome sx={{ color: 'white', fontSize: 16 }} />
              </Box>
              <Box>
                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>AI Rebalance</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>Workload suggestions</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setAiDrawerOpen(false)} sx={{ color: 'rgba(255,255,255,0.4)' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />

          {/* Suggestions Content */}
          <Box sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: 2 } }}>
            {aiLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, py: 6 }}>
                <CircularProgress size={32} sx={{ color: '#6366f1' }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>Analyzing workload distribution...</Typography>
              </Box>
            ) : aiSuggestions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem' }}>No suggestions available</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.75rem', mt: 0.75 }}>Your team workload looks balanced!</Typography>
              </Box>
            ) : (
              <Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
                  {aiSuggestions.length} Suggestion{aiSuggestions.length !== 1 ? 's' : ''}
                </Typography>
                {aiSuggestions.map((suggestion, idx) => {
                  const isApplied = appliedSuggestions.has(idx);
                  return (
                    <Box key={idx} sx={{ mb: 1.5, p: 1.75, borderRadius: 2, backgroundColor: isApplied ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isApplied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.2s' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isApplied ? '#10B981' : '#6366f1', mt: 0.7, flexShrink: 0 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', fontWeight: 500, mb: 0.5 }}>
                            Move <span style={{ color: '#A78BFA' }}>{suggestion.taskName || suggestion.task}</span>
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                            <Chip label={suggestion.fromUser || suggestion.from} size="small" sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#FCA5A5', fontSize: '0.68rem', height: 18 }} />
                            <ArrowForward sx={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }} />
                            <Chip label={suggestion.toUser || suggestion.to} size="small" sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: '#6EE7B7', fontSize: '0.68rem', height: 18 }} />
                          </Box>
                        </Box>
                      </Box>
                      {(suggestion.reason) && (
                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', lineHeight: 1.5, mb: 1, pl: 1.5 }}>
                          {suggestion.reason}
                        </Typography>
                      )}
                      {isApplied ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 1.5 }}>
                          <CheckCircle sx={{ fontSize: 14, color: '#10B981' }} />
                          <Typography sx={{ color: '#10B981', fontSize: '0.72rem', fontWeight: 600 }}>Applied</Typography>
                        </Box>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleApplySuggestion(idx)}
                          sx={{ ml: 1.5, height: 26, fontSize: '0.72rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #9333ea)' }, borderRadius: 1 }}
                        >
                          Apply
                        </Button>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>

          {!aiLoading && aiSuggestions.length > 0 && (
            <Box sx={{ pt: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Button
                fullWidth variant="outlined"
                onClick={() => {
                  aiSuggestions.forEach((_, idx) => handleApplySuggestion(idx));
                }}
                sx={{ borderColor: 'rgba(99,102,241,0.4)', color: '#A78BFA', '&:hover': { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)' }, borderRadius: 2 }}
              >
                Apply All Suggestions
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}

// Helper (avoids importing isSameDay twice in context)
function isSameDayAsToday(d) {
  const today = new Date();
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}
