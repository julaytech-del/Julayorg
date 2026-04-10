import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Avatar, Chip, Button, Select, MenuItem, FormControl,
  InputLabel, TextField, Collapse, IconButton, Skeleton, Divider, Paper,
} from '@mui/material';
import {
  ExpandMore, ExpandLess, FolderOpen, Assignment, Group, History,
  FilterList, Inbox,
} from '@mui/icons-material';
import { activityAPI, usersAPI } from '../../services/api.js';

// ── helpers ────────────────────────────────────────────────────────────────
function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60)   return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const ENTITY_ICONS = {
  project: FolderOpen,
  task:    Assignment,
  user:    Group,
  member:  Group,
};

const ENTITY_COLORS = {
  project: '#6366F1',
  task:    '#8B5CF6',
  user:    '#10B981',
  member:  '#10B981',
};

const ACTION_COLORS = {
  created: '#10B981',
  updated: '#6366F1',
  deleted: '#EF4444',
  assigned: '#F59E0B',
  completed: '#10B981',
  commented: '#3B82F6',
};

// ── single activity entry ──────────────────────────────────────────────────
function ActivityEntry({ entry }) {
  const [expanded, setExpanded] = useState(false);
  const hasChanges = entry.changes && (entry.changes.before || entry.changes.after);

  const EntityIcon = ENTITY_ICONS[entry.entityType?.toLowerCase()] || History;
  const entityColor = ENTITY_COLORS[entry.entityType?.toLowerCase()] || '#94A3B8';
  const actionColor = ACTION_COLORS[entry.action?.toLowerCase()] || '#6366F1';
  const userName = typeof entry.user === 'object' ? entry.user?.name : entry.userName || 'Unknown';
  const userInitial = userName?.[0]?.toUpperCase() || '?';

  return (
    <Box sx={{ display: 'flex', gap: 2, py: 2 }}>
      {/* Avatar */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <Avatar sx={{ width: 36, height: 36, fontSize: '0.85rem', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', flexShrink: 0 }}>
          {userInitial}
        </Avatar>
        <Box sx={{ width: 1, flex: 1, backgroundColor: '#E2E8F0', mt: 1 }} />
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" fontWeight={700}>{userName}</Typography>
            <Chip
              label={entry.action || 'action'}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', backgroundColor: `${actionColor}18`, color: actionColor, fontWeight: 600 }}
            />
            <Typography variant="body2" color="text.secondary">
              {entry.description || `${entry.action} ${entry.entityType}`}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
            {timeAgo(entry.createdAt || entry.timestamp)}
          </Typography>
        </Box>

        {/* Entity reference */}
        {entry.entityName && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, p: 0.75, borderRadius: 1, backgroundColor: `${entityColor}0D`, width: 'fit-content' }}>
            <EntityIcon sx={{ fontSize: 13, color: entityColor }} />
            <Typography variant="caption" sx={{ color: entityColor, fontWeight: 600 }}>{entry.entityName}</Typography>
          </Box>
        )}

        {/* Expandable changes */}
        {hasChanges && (
          <Box sx={{ mt: 0.75 }}>
            <Button
              size="small"
              startIcon={expanded ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setExpanded(v => !v)}
              sx={{ fontSize: '0.72rem', color: 'text.secondary', p: 0, minWidth: 0, textTransform: 'none' }}
            >
              {expanded ? 'Hide' : 'Show'} changes
            </Button>
            <Collapse in={expanded}>
              <Box sx={{ mt: 1, p: 1.5, borderRadius: 1.5, backgroundColor: '#F8FAFC', border: '1px solid', borderColor: 'divider', fontSize: '0.78rem' }}>
                {entry.changes.before && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" fontWeight={700} color="error.main">Before</Typography>
                    <Box component="pre" sx={{ m: 0, fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {typeof entry.changes.before === 'object' ? JSON.stringify(entry.changes.before, null, 2) : entry.changes.before}
                    </Box>
                  </Box>
                )}
                {entry.changes.after && (
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="success.main">After</Typography>
                    <Box component="pre" sx={{ m: 0, fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {typeof entry.changes.after === 'object' ? JSON.stringify(entry.changes.after, null, 2) : entry.changes.after}
                    </Box>
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ── skeleton entry ─────────────────────────────────────────────────────────
function SkeletonEntry() {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 2 }}>
      <Skeleton variant="circular" width={36} height={36} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="60%" height={20} sx={{ mb: 0.5 }} />
        <Skeleton width="40%" height={16} />
      </Box>
    </Box>
  );
}

// ── main ───────────────────────────────────────────────────────────────────
export default function ActivityLogPage() {
  const [entries, setEntries]     = useState([]);
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(true);
  const [entityType, setEntityType] = useState('all');
  const [userId, setUserId]       = useState('all');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');

  const LIMIT = 50;

  const buildParams = useCallback((p = 1) => {
    const params = { page: p, limit: LIMIT };
    if (entityType !== 'all') params.entityType = entityType;
    if (userId !== 'all')     params.userId = userId;
    if (dateFrom)             params.dateFrom = dateFrom;
    if (dateTo)               params.dateTo = dateTo;
    return params;
  }, [entityType, userId, dateFrom, dateTo]);

  const loadEntries = useCallback(async (reset = false) => {
    const p = reset ? 1 : page;
    if (!reset) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await activityAPI.getLog(buildParams(p));
      const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : res?.entries || [];
      if (reset) {
        setEntries(data);
        setPage(2);
      } else {
        setEntries(prev => [...prev, ...data]);
        setPage(p + 1);
      }
      setHasMore(data.length === LIMIT);
    } catch {
      if (reset) setEntries([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildParams, page]);

  // load users for filter
  useEffect(() => {
    usersAPI.getAll()
      .then(res => setUsers(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []);

  // reload when filters change
  useEffect(() => { loadEntries(true); }, [entityType, userId, dateFrom, dateTo]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 860, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Activity Log
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
          A full audit trail of actions across your organization
        </Typography>
      </Box>

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FilterList sx={{ color: 'text.disabled' }} />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Entity Type</InputLabel>
            <Select value={entityType} label="Entity Type" onChange={e => setEntityType(e.target.value)}>
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="project">Projects</MenuItem>
              <MenuItem value="task">Tasks</MenuItem>
              <MenuItem value="user">Members</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>User</InputLabel>
            <Select value={userId} label="User" onChange={e => setUserId(e.target.value)}>
              <MenuItem value="all">All Users</MenuItem>
              {users.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="From" type="date" size="small" value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ width: 150 }}
          />
          <TextField
            label="To" type="date" size="small" value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ width: 150 }}
          />
          {(entityType !== 'all' || userId !== 'all' || dateFrom || dateTo) && (
            <Button size="small" onClick={() => { setEntityType('all'); setUserId('all'); setDateFrom(''); setDateTo(''); }} sx={{ color: '#EF4444' }}>
              Clear
            </Button>
          )}
        </Box>
      </Paper>

      {/* Timeline */}
      <Box>
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <React.Fragment key={i}>
              <SkeletonEntry />
              {i < 7 && <Divider />}
            </React.Fragment>
          ))
        ) : entries.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <Inbox sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
            <Typography color="text.secondary">No activity found for the selected filters.</Typography>
          </Box>
        ) : (
          entries.map((entry, i) => (
            <React.Fragment key={entry._id || i}>
              <ActivityEntry entry={entry} />
              {i < entries.length - 1 && <Divider />}
            </React.Fragment>
          ))
        )}

        {/* Load more */}
        {!loading && hasMore && entries.length > 0 && (
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => loadEntries(false)}
              disabled={loadingMore}
              sx={{ borderColor: '#6366F1', color: '#6366F1' }}
            >
              {loadingMore ? 'Loading…' : 'Load More'}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
