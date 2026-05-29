import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Avatar, Table, TableBody,
  TableCell, TableHead, TableRow, TablePagination, TextField, Select, MenuItem,
  FormControl, InputLabel, IconButton, Button, Tooltip, CircularProgress,
  LinearProgress, Paper, Tab, Tabs, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert,
} from '@mui/material';
import {
  People, Business, AttachMoney, TrendingUp, Search, Refresh,
  Delete, Shield, CheckCircle, Cancel, Star, Lock,
  Android, Apple, Download, OpenInNew, Build,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import api from '../../services/api.js';
import { showSnackbar } from '../../store/slices/uiSlice.js';

const OWNER_EMAIL = 'assimohammad489@gmail.com';
const PLAN_COLOR = { free: '#94A3B8', starter: '#6366F1', professional: '#8B5CF6', business: '#F59E0B', enterprise: '#10B981' };
const PLAN_PRICE = { free: 0, starter: 19, professional: 59, business: 99, enterprise: 299 };
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildGrowthSkeleton() {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: MONTH_NAMES[d.getMonth()], year: d.getFullYear(), monthNum: d.getMonth() + 1, signups: 0 });
  }
  return months;
}

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

function AccessDenied() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2 }}>
      <Lock sx={{ fontSize: 48, color: 'error.main' }} />
      <Typography variant="h6" fontWeight={700}>Access Denied</Typography>
      <Typography color="text.secondary" variant="body2">This area is restricted to platform owners only.</Typography>
      <Button variant="contained" href="/dashboard" sx={{ textTransform: 'none', borderRadius: 2, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
        Back to Dashboard
      </Button>
    </Box>
  );
}

export default function OwnerAdminPanel() {
  const dispatch = useDispatch();
  const { token, initialized, user } = useSelector(s => s.auth);

  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [users, setUsers] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [orgTotal, setOrgTotal] = useState(0);
  const [userTotal, setUserTotal] = useState(0);
  const [orgPage, setOrgPage] = useState(0);
  const [userPage, setUserPage] = useState(0);
  const [orgPlan, setOrgPlan] = useState('all');
  const [search, setSearch] = useState('');
  const [planDialog, setPlanDialog] = useState(null);
  const [newPlan, setNewPlan] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isOwner = initialized && token && user?.email === OWNER_EMAIL;

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/owner/stats');
      setStats(res.data);
    } catch (err) {
      if (err?.response?.status === 403) setAccessDenied(true);
    }
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
      const skeleton = buildGrowthSkeleton();
      (res.data || []).forEach(d => {
        const slot = skeleton.find(s => s.monthNum === d._id.month && s.year === d._id.year);
        if (slot) slot.signups = d.count;
      });
      setGrowth(skeleton);
    } catch { setGrowth(buildGrowthSkeleton()); }
  }, []);

  useEffect(() => {
    if (!isOwner) return;
    Promise.all([fetchStats(), fetchGrowth()]).finally(() => setLoading(false));
  }, [isOwner]);

  useEffect(() => { if (isOwner) fetchOrgs(); }, [fetchOrgs, isOwner]);
  useEffect(() => { if (isOwner) fetchUsers(); }, [fetchUsers, isOwner]);

  const handleChangePlan = async () => {
    if (!planDialog || !newPlan) return;
    setSaving(true);
    try {
      await api.patch(`/owner/organizations/${planDialog.orgId}/plan`, { plan: newPlan });
      setPlanDialog(null);
      fetchOrgs();
      fetchStats();
      dispatch(showSnackbar({ message: `Plan updated to "${newPlan}" for ${planDialog.orgName}`, severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to update plan. Please try again.', severity: 'error' }));
    } finally { setSaving(false); }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      await api.delete(`/owner/users/${deleteDialog.userId}`);
      setDeleteDialog(null);
      fetchUsers();
      fetchStats();
      dispatch(showSnackbar({ message: `User "${deleteDialog.userName}" has been deleted.`, severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete user. Please try again.', severity: 'error' }));
    } finally { setDeleting(false); }
  };

  // ── Auth guards (after all hooks) ─────────────────────────────────────────
  if (!initialized) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress sx={{ color: '#6366F1' }} />
    </Box>
  );

  if (!token) return <Navigate to="/login" replace />;

  if (user?.email !== OWNER_EMAIL || accessDenied) return <AccessDenied />;

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
          <StatCard icon={People} label="Total Users" value={stats?.totalUsers} sub="across all orgs" color="#8B5CF6" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={AttachMoney} label="MRR (Est.)" value={`$${mrr.toLocaleString()}`} sub={`ARR: $${arr.toLocaleString()}`} color="#10B981" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={TrendingUp} label="Conversion Rate" value={`${stats?.conversionRate || 0}%`} sub="free → paid" color="#F59E0B" />
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
              {!stats?.planBreakdown?.length && (
                <Typography variant="caption" color="text.disabled">No data yet</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={2}>New Signups (Last 6 Months)</Typography>
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
          <Tab label="Mobile Apps" />
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
              {orgs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>No organizations found</TableCell>
                </TableRow>
              )}
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
              {users.map(u => (
                <TableRow key={u._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: '#8B5CF618', color: '#8B5CF6' }} src={u.avatar}>
                        {u.name?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem' }}>{u.name}</Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>{u.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="caption">{u.organization?.name || '—'}</Typography></TableCell>
                  <TableCell><PlanBadge plan={u.organization?.subscription?.plan || 'free'} /></TableCell>
                  <TableCell>
                    {u.twoFactor?.enabled
                      ? <CheckCircle sx={{ fontSize: 16, color: '#10B981' }} />
                      : <Cancel sx={{ fontSize: 16, color: '#94A3B8' }} />
                    }
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Delete user">
                      <IconButton size="small" onClick={() => setDeleteDialog({ userId: u._id, userName: u.name })} sx={{ color: 'error.main' }}>
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>No users found</TableCell>
                </TableRow>
              )}
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

      {/* Mobile Apps */}
      {tab === 3 && (
        <Grid container spacing={2.5}>
          {/* Android */}
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#3DDC8418', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Android sx={{ color: '#3DDC84', fontSize: 26 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800}>Android</Typography>
                    <Chip label="Live" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: '#10B98118', color: '#10B981' }} />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>APK (Direct Download)</Typography>
                      <Typography variant="body2" fontWeight={600}>julay.org/julay.apk</Typography>
                    </Box>
                    <Button size="small" variant="outlined" startIcon={<Download />}
                      href="https://julay.org/julay.apk" target="_blank"
                      sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem' }}>
                      Download
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>AAB (Play Store)</Typography>
                      <Typography variant="body2" fontWeight={600}>GitHub Actions Artifacts</Typography>
                    </Box>
                    <Button size="small" variant="outlined" startIcon={<OpenInNew />}
                      href="https://github.com/julaytech-del/Julayorg/actions/workflows/apk.yml" target="_blank"
                      sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem' }}>
                      View
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>Auto-Build Trigger</Typography>
                      <Typography variant="body2" fontWeight={600}>Every push to main</Typography>
                    </Box>
                    <Chip label="Active" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#10B98118', color: '#10B981' }} />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>Play Store</Typography>
                      <Typography variant="body2" fontWeight={600}>Google Play Developer Required</Typography>
                    </Box>
                    <Chip label="Pending" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#F59E0B18', color: '#F59E0B' }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* iOS */}
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#94A3B818', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Apple sx={{ color: '#94A3B8', fontSize: 26 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800}>iOS</Typography>
                    <Chip label="Pending Setup" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: '#F59E0B18', color: '#F59E0B' }} />
                  </Box>
                </Box>

                <Alert severity="info" sx={{ mb: 2, fontSize: '0.78rem' }}>
                  Requires Apple Developer Program ($99/year) to build and distribute.
                </Alert>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[
                    { label: 'Workflow (ios.yml)', status: 'Ready', color: '#10B981' },
                    { label: 'Apple Developer Account', status: 'Needed', color: '#F59E0B' },
                    { label: 'Signing Certificate', status: 'Needed', color: '#F59E0B' },
                    { label: 'Provisioning Profile', status: 'Needed', color: '#F59E0B' },
                    { label: 'App Store Connect API', status: 'Needed', color: '#F59E0B' },
                    { label: 'TestFlight / App Store', status: 'Pending', color: '#94A3B8' },
                  ].map(({ label, status, color }) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
                      <Typography variant="body2" fontWeight={600}>{label}</Typography>
                      <Chip label={status} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${color}18`, color }} />
                    </Box>
                  ))}
                </Box>

                <Button fullWidth variant="outlined" startIcon={<Build />}
                  href="https://developer.apple.com/programs/enroll/" target="_blank"
                  sx={{ mt: 2.5, textTransform: 'none', borderRadius: 2 }}>
                  Enroll in Apple Developer Program
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* CI/CD Info */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>Auto-Sync Pipeline</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {['Push to main', '→', 'Web Build (Vite)', '→', 'Cap Sync', '→', 'Android AAB + APK', '→', 'Deploy to julay.org'].map((step, i) => (
                    step === '→'
                      ? <Typography key={i} color="text.disabled" sx={{ fontWeight: 700, mx: 0.5 }}>→</Typography>
                      : <Chip key={i} label={step} size="small"
                          sx={{ height: 24, fontSize: '0.72rem', fontWeight: 600,
                            bgcolor: step === 'Push to main' ? '#6366F118' : step === 'Deploy to julay.org' ? '#10B98118' : 'action.selected',
                            color: step === 'Push to main' ? '#6366F1' : step === 'Deploy to julay.org' ? '#10B981' : 'text.primary' }} />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
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

      {/* Delete User Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onClose={() => !deleting && setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700} sx={{ color: 'error.main' }}>Delete User</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>This action cannot be undone.</Alert>
          <Typography variant="body2">
            Are you sure you want to permanently delete <strong>{deleteDialog?.userName}</strong>? Their account and all associated data will be removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialog(null)} disabled={deleting}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirmed} disabled={deleting} sx={{ borderRadius: 2 }}>
            {deleting ? <CircularProgress size={16} color="inherit" /> : 'Delete permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
