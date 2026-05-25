import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Avatar, Table, TableBody,
  TableCell, TableHead, TableRow, TablePagination, TextField, Select, MenuItem,
  FormControl, InputLabel, IconButton, Button, Tooltip, CircularProgress,
  LinearProgress, Divider, Paper, Tab, Tabs, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from '@mui/material';
import {
  People, Business, AttachMoney, TrendingUp, Search, Refresh,
  Delete, Edit, Shield, CheckCircle, Cancel, Star,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { format } from 'date-fns';
import api from '../../services/api.js';

const PLAN_COLOR = { free: '#94A3B8', starter: '#6366F1', professional: '#8B5CF6', business: '#F59E0B', enterprise: '#10B981' };
const PLAN_PRICE = { free: 0, starter: 19, professional: 59, business: 99, enterprise: 299 };

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>{label}</Typography>
            <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, letterSpacing: '-0.02em' }}>{value ?? '—'}</Typography>
            {sub && <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{sub}</Typography>}
          </Box>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon sx={{ color, fontSize: 22 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function PlanBadge({ plan }) {
  return (
    <Chip label={plan} size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: `${PLAN_COLOR[plan] || '#94A3B8'}18`, color: PLAN_COLOR[plan] || '#94A3B8', border: `1px solid ${PLAN_COLOR[plan] || '#94A3B8'}30` }} />
  );
}

export default function OwnerAdminPanel() {
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [users, setUsers] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgTotal, setOrgTotal] = useState(0);
  const [userTotal, setUserTotal] = useState(0);
  const [orgPage, setOrgPage] = useState(0);
  const [userPage, setUserPage] = useState(0);
  const [orgPlan, setOrgPlan] = useState('all');
  const [search, setSearch] = useState('');
  const [planDialog, setPlanDialog] = useState(null); // { orgId, orgName, currentPlan }
  const [newPlan, setNewPlan] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/owner/stats');
      setStats(res.data);
    } catch { /* handled by auth interceptor */ }
  }, []);

  const fetchOrgs = useCallback(async () => {
    try {
      const res = await api.get('/owner/organizations', { params: { plan: orgPlan, search, page: orgPage + 1, limit: 15 } });
      setOrgs(res.data);
      setOrgTotal(res.total);
    } catch { setOrgs([]); }
  }, [orgPlan, search, orgPage]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/owner/users', { params: { search, page: userPage + 1, limit: 20 } });
      setUsers(res.data);
      setUserTotal(res.total);
    } catch { setUsers([]); }
  }, [search, userPage]);

  const fetchGrowth = useCallback(async () => {
    try {
      const res = await api.get('/owner/growth');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      setGrowth((res.data || []).map(d => ({ month: months[d._id.month - 1], signups: d.count })));
    } catch { setGrowth([]); }
  }, []);

  useEffect(() => {
    Promise.all([fetchStats(), fetchGrowth()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleChangePlan = async () => {
    if (!planDialog || !newPlan) return;
    setSaving(true);
    try {
      await api.patch(`/owner/organizations/${planDialog.orgId}/plan`, { plan: newPlan });
      setPlanDialog(null);
      fetchOrgs();
      fetchStats();
    } catch { }
    finally { setSaving(false); }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/owner/users/${userId}`);
      fetchUsers();
      fetchStats();
    } catch { }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress sx={{ color: '#6366F1' }} />
      <Typography color="text.secondary">Loading owner panel…</Typography>
    </Box>
  );

  const mrr = stats?.mrr || 0;
  const arr = mrr * 12;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Shield sx={{ color: '#6366F1', fontSize: 28 }} />
            <Typography variant="h4" fontWeight={800} sx={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Owner Control Panel
            </Typography>
          </Box>
          <Typography color="text.secondary" variant="body2">julay.org — Platform Administration</Typography>
        </Box>
        <Tooltip title="Refresh data">
          <IconButton onClick={() => { fetchStats(); fetchOrgs(); fetchUsers(); fetchGrowth(); }}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <StatCard icon={Business} label="Total Organizations" value={stats?.totalOrgs} sub={`${stats?.paidOrgs} paid · ${stats?.freeOrgs} free`} color="#6366F1" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={People} label="Total Users" value={stats?.totalUsers} sub={`across all orgs`} color="#8B5CF6" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={AttachMoney} label="MRR (Est.)" value={`$${mrr.toLocaleString()}`} sub={`ARR: $${arr.toLocaleString()}`} color="#10B981" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={TrendingUp} label="Conversion Rate" value={`${stats?.conversionRate || 0}%`} sub={`free → paid`} color="#F59E0B" />
        </Grid>
      </Grid>

      {/* Plan breakdown + Growth chart */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={2}>Plan Breakdown</Typography>
              {(stats?.planBreakdown || []).map(p => (
                <Box key={p._id} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PlanBadge plan={p._id} />
                      <Typography variant="caption" color="text.secondary">${PLAN_PRICE[p._id] || 0}/mo each</Typography>
                    </Box>
                    <Typography variant="caption" fontWeight={700}>{p.count} orgs</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={stats.totalOrgs > 0 ? (p.count / stats.totalOrgs) * 100 : 0}
                    sx={{ height: 6, borderRadius: 3, bgcolor: `${PLAN_COLOR[p._id]}18`, '& .MuiLinearProgress-bar': { bgcolor: PLAN_COLOR[p._id] || '#94A3B8', borderRadius: 3 } }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={2}>New Signups (Last 6 Months)</Typography>
              {growth.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={growth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <ReTooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="signups" radius={[4, 4, 0, 0]}>
                      {growth.map((_, i) => <Cell key={i} fill={i === growth.length - 1 ? '#6366F1' : '#C7D2FE'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="caption" color="text.disabled">No growth data yet</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`Organizations (${orgTotal})`} />
          <Tab label={`Users (${userTotal})`} />
          <Tab label="Recent Signups" />
        </Tabs>
      </Box>

      {/* Search + Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
        <TextField
          size="small" placeholder="Search…" value={search}
          onChange={e => { setSearch(e.target.value); setOrgPage(0); setUserPage(0); }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.disabled', fontSize: 18 }} /> }}
          sx={{ minWidth: 240 }}
        />
        {tab === 0 && (
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Plan</InputLabel>
            <Select value={orgPlan} label="Plan" onChange={e => { setOrgPlan(e.target.value); setOrgPage(0); }}>
              <MenuItem value="all">All Plans</MenuItem>
              {['free','starter','professional','business','enterprise'].map(p => (
                <MenuItem key={p} value={p}><PlanBadge plan={p} /></MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Organizations Table */}
      {tab === 0 && (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Organization</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Plan</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Members</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Projects</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Joined</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>MRR</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orgs.map(org => (
                <TableRow key={org._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: '#6366F118', color: '#6366F1', fontWeight: 700 }}>
                        {org.name?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem' }}>{org.name}</Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>{org.industry}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><PlanBadge plan={org.subscription?.plan || 'free'} /></TableCell>
                  <TableCell><Typography variant="body2">{org.memberCount}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{org.projectCount}</Typography></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{org.createdAt ? format(new Date(org.createdAt), 'MMM d, yyyy') : '—'}</Typography></TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color={PLAN_COLOR[org.subscription?.plan] || '#94A3B8'}>
                      ${PLAN_PRICE[org.subscription?.plan] || 0}/mo
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Change plan">
                      <IconButton size="small" onClick={() => { setPlanDialog({ orgId: org._id, orgName: org.name, currentPlan: org.subscription?.plan }); setNewPlan(org.subscription?.plan || 'free'); }}>
                        <Star sx={{ fontSize: 16, color: '#F59E0B' }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div" count={orgTotal} page={orgPage} rowsPerPage={15}
            onPageChange={(_, p) => setOrgPage(p)} rowsPerPageOptions={[15]}
          />
        </Paper>
      )}

      {/* Users Table */}
      {tab === 1 && (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Organization</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Plan</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>2FA</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Joined</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => (
                <TableRow key={user._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: '#8B5CF618', color: '#8B5CF6' }} src={user.avatar}>
                        {user.name?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem' }}>{user.name}</Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>{user.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{user.organization?.name || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <PlanBadge plan={user.organization?.subscription?.plan || 'free'} />
                  </TableCell>
                  <TableCell>
                    {user.twoFactor?.enabled
                      ? <CheckCircle sx={{ fontSize: 16, color: '#10B981' }} />
                      : <Cancel sx={{ fontSize: 16, color: '#94A3B8' }} />
                    }
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Delete user">
                      <IconButton size="small" onClick={() => handleDeleteUser(user._id, user.name)} sx={{ color: 'error.main' }}>
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div" count={userTotal} page={userPage} rowsPerPage={20}
            onPageChange={(_, p) => setUserPage(p)} rowsPerPageOptions={[20]}
          />
        </Paper>
      )}

      {/* Recent Signups */}
      {tab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {(stats?.recentSignups || []).map((org, i) => (
            <Card key={org._id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <CardContent sx={{ py: '12px !important', px: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#6366F118', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography fontWeight={800} sx={{ color: '#6366F1', fontSize: '0.9rem' }}>{org.name?.[0]?.toUpperCase()}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={700}>{org.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{org.createdAt ? format(new Date(org.createdAt), 'MMM d, yyyy · h:mm a') : '—'}</Typography>
                </Box>
                <PlanBadge plan={org['subscription.plan'] || org.subscription?.plan || 'free'} />
                {i === 0 && <Chip label="Latest" size="small" sx={{ height: 18, fontSize: '0.62rem', bgcolor: '#10B98118', color: '#10B981', fontWeight: 700 }} />}
              </CardContent>
            </Card>
          ))}
          {!stats?.recentSignups?.length && (
            <Typography color="text.disabled" variant="body2" sx={{ textAlign: 'center', py: 6 }}>No signups yet</Typography>
          )}
        </Box>
      )}

      {/* Change Plan Dialog */}
      <Dialog open={!!planDialog} onClose={() => setPlanDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Change Plan — {planDialog?.orgName}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>New Plan</InputLabel>
            <Select value={newPlan} label="New Plan" onChange={e => setNewPlan(e.target.value)}>
              {['free','starter','professional','business','enterprise'].map(p => (
                <MenuItem key={p} value={p}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PlanBadge plan={p} />
                    <Typography variant="caption" color="text.secondary">${PLAN_PRICE[p]}/month</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPlanDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleChangePlan} disabled={saving}
            sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 2 }}>
            {saving ? <CircularProgress size={16} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
