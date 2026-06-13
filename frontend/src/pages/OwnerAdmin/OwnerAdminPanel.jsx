import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Avatar, Table, TableBody,
  TableCell, TableHead, TableRow, TablePagination, TextField, Select, MenuItem,
  FormControl, InputLabel, IconButton, Button, Tooltip, CircularProgress,
  LinearProgress, Paper, Tab, Tabs, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Switch, FormControlLabel, Divider, Badge,
  InputAdornment, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import {
  People, Business, AttachMoney, TrendingUp, Search, Refresh,
  Delete, Shield, CheckCircle, Cancel, Star, Lock, Block, LockOpen,
  Android, Apple, Download, OpenInNew, Build,
  Settings, Notifications, Email, Memory, Storage, Speed,
  ExpandMore, Edit, Save, Add, Dns, Circle,
  Warning, Info, Error as ErrorIcon, CheckCircleOutline,
  Campaign, Send, PowerSettingsNew, Tune, CreditCard, BarChart,
  Public, Language, TouchApp, Visibility,
} from '@mui/icons-material';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import api from '../../services/api.js';
import { showSnackbar } from '../../store/slices/uiSlice.js';

const OWNER_EMAIL = 'assimohammad489@gmail.com';
const PLAN_COLOR = { free: '#94A3B8', starter: '#6366F1', professional: '#8B5CF6', business: '#F59E0B', enterprise: '#10B981' };
const PLAN_PRICE_DEFAULT = { free: 0, starter: 19, professional: 59, business: 99, enterprise: 299 };
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ANNOUNCE_COLOR = { info: '#3B82F6', warning: '#F59E0B', error: '#EF4444', success: '#10B981' };
const ANNOUNCE_ICON  = { info: Info, warning: Warning, error: ErrorIcon, success: CheckCircleOutline };

function buildGrowthSkeleton() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: MONTH_NAMES[d.getMonth()], year: d.getFullYear(), monthNum: d.getMonth() + 1, signups: 0 };
  });
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
  const color = PLAN_COLOR[plan] || '#94A3B8';
  return <Chip label={plan} size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: `${color}18`, color, border: `1px solid ${color}30` }} />;
}

function SectionHeader({ title, action }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
      {action}
    </Box>
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function OwnerAdminPanel() {
  const dispatch = useDispatch();
  const { token, initialized, user } = useSelector(s => s.auth);

  const [tab, setTab] = useState(0);

  // Overview
  const [stats, setStats]   = useState(null);
  const [growth, setGrowth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Orgs
  const [orgs, setOrgs]         = useState([]);
  const [orgTotal, setOrgTotal] = useState(0);
  const [orgPage, setOrgPage]   = useState(0);
  const [orgPlan, setOrgPlan]   = useState('all');
  const [search, setSearch]     = useState('');
  const [planDialog, setPlanDialog] = useState(null);
  const [newPlan, setNewPlan]   = useState('');
  const [editOrgName, setEditOrgName] = useState('');
  const [saving, setSaving]     = useState(false);
  const [deleteOrgDialog, setDeleteOrgDialog] = useState(null);
  const [deletingOrg, setDeletingOrg]         = useState(false);

  // Users
  const [users, setUsers]         = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage]   = useState(0);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  // Platform Settings
  const [platformSettings, setPlatformSettings] = useState(null);
  const [settingsSaving, setSettingsSaving]     = useState(false);

  // Plans
  const [planData, setPlanData]     = useState({});
  const [planSaving, setPlanSaving] = useState('');
  const [planEdit, setPlanEdit]     = useState({});

  // Announcements
  const [announcements, setAnnouncements]   = useState([]);
  const [announceSaving, setAnnounceSaving] = useState(false);
  const [announceDialog, setAnnounceDialog] = useState(null);
  const [announceForm, setAnnounceForm]     = useState({ message: '', type: 'info', active: true, link: '', linkText: '', dismissible: true, targetPlans: [] });

  // Email Blast
  const [blastForm, setBlastForm]   = useState({ subject: '', body: '', targetPlans: [] });
  const [blastSending, setBlastSending] = useState(false);
  const [blastResult, setBlastResult]   = useState(null);
  const [blastConfirm, setBlastConfirm] = useState(false);

  // System
  const [systemData, setSystemData] = useState(null);
  const [systemLoading, setSystemLoading] = useState(false);

  const isOwner = initialized && token && user?.email === OWNER_EMAIL;

  // ── Fetchers ────────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/owner/stats');
      setStats(res.data);
    } catch (err) {
      if (err?.response?.status === 403) setAccessDenied(true);
    }
  }, []);

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

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/owner/settings');
      setPlatformSettings(res.data);
    } catch {}
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await api.get('/owner/plans');
      setPlanData(res.data || {});
      setPlanEdit(JSON.parse(JSON.stringify(res.data || {})));
    } catch {}
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await api.get('/owner/announcements');
      setAnnouncements(res.data || []);
    } catch {}
  }, []);

  const fetchSystem = useCallback(async () => {
    setSystemLoading(true);
    try {
      const res = await api.get('/owner/system');
      setSystemData(res.data);
    } catch {} finally { setSystemLoading(false); }
  }, []);

  const [traffic, setTraffic] = useState(null);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const fetchTraffic = useCallback(async () => {
    setTrafficLoading(true);
    try {
      const res = await api.get('/owner/analytics');
      setTraffic(res.data || res);
    } catch {} finally { setTrafficLoading(false); }
  }, []);

  useEffect(() => {
    if (!isOwner) return;
    Promise.all([fetchStats(), fetchGrowth()]).finally(() => setLoading(false));
  }, [isOwner]);

  useEffect(() => { if (isOwner) fetchOrgs(); }, [fetchOrgs, isOwner]);
  useEffect(() => { if (isOwner) fetchUsers(); }, [fetchUsers, isOwner]);
  useEffect(() => { if (isOwner && tab === 4) fetchSettings(); }, [tab, isOwner]);
  useEffect(() => { if (isOwner && tab === 5) fetchPlans(); }, [tab, isOwner]);
  useEffect(() => { if (isOwner && tab === 6) fetchAnnouncements(); }, [tab, isOwner]);
  useEffect(() => { if (isOwner && tab === 10) fetchTraffic(); }, [tab, isOwner]);
  // System tab: do NOT auto-fetch — show placeholder until user clicks Refresh

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleChangePlan = async () => {
    if (!planDialog) return;
    const name = (editOrgName || '').trim();
    if (!name) { dispatch(showSnackbar({ message: 'Organization name is required.', severity: 'error' })); return; }
    setSaving(true);
    try {
      await api.patch(`/owner/organizations/${planDialog.orgId}`, { name, plan: newPlan });
      setPlanDialog(null); fetchOrgs(); fetchStats();
      dispatch(showSnackbar({ message: `Updated "${name}"`, severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to update organization.', severity: 'error' }));
    } finally { setSaving(false); }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      await api.delete(`/owner/users/${deleteDialog.userId}`);
      setDeleteDialog(null); fetchUsers(); fetchStats();
      dispatch(showSnackbar({ message: `User "${deleteDialog.userName}" deleted.`, severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete user.', severity: 'error' }));
    } finally { setDeleting(false); }
  };

  const handleToggleBlock = async (u) => {
    const next = !u.blocked;
    try {
      await api.patch(`/owner/users/${u._id}/block`, { blocked: next });
      fetchUsers();
      dispatch(showSnackbar({ message: next ? `"${u.name}" suspended.` : `"${u.name}" unblocked.`, severity: 'success' }));
    } catch (err) {
      dispatch(showSnackbar({ message: err?.response?.data?.message || 'Failed to update user.', severity: 'error' }));
    }
  };

  const handleDeleteOrg = async () => {
    if (!deleteOrgDialog) return;
    setDeletingOrg(true);
    try {
      await api.delete(`/owner/organizations/${deleteOrgDialog.orgId}`);
      setDeleteOrgDialog(null); fetchOrgs(); fetchStats();
      dispatch(showSnackbar({ message: `Organization "${deleteOrgDialog.orgName}" deleted.`, severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete organization.', severity: 'error' }));
    } finally { setDeletingOrg(false); }
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const res = await api.put('/owner/settings', platformSettings);
      setPlatformSettings(res.data);
      dispatch(showSnackbar({ message: 'Settings saved.', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to save settings.', severity: 'error' }));
    } finally { setSettingsSaving(false); }
  };

  const handleSavePlan = async (planName) => {
    setPlanSaving(planName);
    try {
      await api.put(`/owner/plans/${planName}`, planEdit[planName]);
      await fetchPlans();
      dispatch(showSnackbar({ message: `"${planName}" plan saved.`, severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to save plan.', severity: 'error' }));
    } finally { setPlanSaving(''); }
  };

  const handleSaveAnnouncement = async () => {
    setAnnounceSaving(true);
    try {
      if (announceDialog?._id) {
        await api.put(`/owner/announcements/${announceDialog._id}`, announceForm);
      } else {
        await api.post('/owner/announcements', announceForm);
      }
      setAnnounceDialog(null);
      setAnnounceForm({ message: '', type: 'info', active: true, link: '', linkText: '', dismissible: true, targetPlans: [] });
      await fetchAnnouncements();
      dispatch(showSnackbar({ message: 'Announcement saved.', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to save announcement.', severity: 'error' }));
    } finally { setAnnounceSaving(false); }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await api.delete(`/owner/announcements/${id}`);
      await fetchAnnouncements();
      dispatch(showSnackbar({ message: 'Announcement deleted.', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete.', severity: 'error' }));
    }
  };

  const handleToggleAnnouncement = async (item) => {
    try {
      await api.put(`/owner/announcements/${item._id}`, { active: !item.active });
      await fetchAnnouncements();
    } catch {}
  };

  const handleSendBlast = async () => {
    setBlastSending(true);
    setBlastConfirm(false);
    setBlastResult(null);
    try {
      const res = await api.post('/owner/email-blast', blastForm);
      setBlastResult(res.data);
      setBlastForm({ subject: '', body: '', targetPlans: [] });
      dispatch(showSnackbar({ message: `Email sent to ${res.data.sent} recipients.`, severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to send email blast.', severity: 'error' }));
    } finally { setBlastSending(false); }
  };

  // ── Auth guards (after all hooks) ────────────────────────────────────────────
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
        <Tooltip title="Refresh all data">
          <IconButton onClick={() => { fetchStats(); fetchOrgs(); fetchUsers(); fetchGrowth(); }}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Maintenance Mode Banner */}
      {platformSettings?.maintenanceMode && (
        <Alert severity="warning" sx={{ mb: 3 }} action={
          <Button size="small" color="warning" onClick={async () => {
          const updated = { ...platformSettings, maintenanceMode: false };
          setPlatformSettings(updated);
          try { await api.put('/owner/settings', updated); } catch {}
        }}>Disable</Button>
        }>
          <strong>Maintenance Mode is ON</strong> — Users see a maintenance page. Disable when done.
        </Alert>
      )}

      {/* Overview Stats */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}><StatCard icon={Business} label="Organizations" value={stats?.totalOrgs} sub={`${stats?.paidOrgs} paid · ${stats?.freeOrgs} free`} color="#6366F1" /></Grid>
        <Grid item xs={6} md={3}><StatCard icon={People} label="Total Users" value={stats?.totalUsers} sub="across all orgs" color="#8B5CF6" /></Grid>
        <Grid item xs={6} md={3}><StatCard icon={AttachMoney} label="MRR (Est.)" value={`$${mrr.toLocaleString()}`} sub={`ARR: $${arr.toLocaleString()}`} color="#10B981" /></Grid>
        <Grid item xs={6} md={3}><StatCard icon={TrendingUp} label="Conversion" value={`${stats?.conversionRate || 0}%`} sub="free → paid" color="#F59E0B" /></Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label={`Organizations (${orgTotal})`} icon={<Business sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label={`Users (${userTotal})`} icon={<People sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label="Recent Signups" icon={<TrendingUp sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label="Growth" icon={<BarChart sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label="Settings" icon={<Settings sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label="Plans & Pricing" icon={<CreditCard sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label="Announcements" icon={<Campaign sx={{ fontSize: 16 }} />} iconPosition="start"
            icon={<Badge badgeContent={announcements.filter(a => a.active).length || null} color="error"><Campaign sx={{ fontSize: 16 }} /></Badge>}
          />
          <Tab label="Email Blast" icon={<Email sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label="System" icon={<Dns sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label="Mobile" icon={<Android sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label="Traffic" icon={<Public sx={{ fontSize: 16 }} />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Search + Filters (tabs 0 and 1) */}
      {(tab === 0 || tab === 1) && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search…" value={search}
            onChange={e => { setSearch(e.target.value); setOrgPage(0); setUserPage(0); }}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.disabled', fontSize: 18 }} /> }}
            sx={{ minWidth: 240 }}
          />
          {tab === 0 && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Plan</InputLabel>
              <Select value={orgPlan} label="Plan" onChange={e => { setOrgPlan(e.target.value); setOrgPage(0); }}
                renderValue={v => v === 'all' ? 'All Plans' : <PlanBadge plan={v} />}>
                <MenuItem value="all">All Plans</MenuItem>
                {['free','starter','professional','business','enterprise'].map(p => (
                  <MenuItem key={p} value={p}><PlanBadge plan={p} /></MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      )}

      {/* ── Tab 0: Organizations ── */}
      {tab === 0 && (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['Organization','Plan','Members','Projects','Joined','MRR','Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {orgs.map(org => (
                <TableRow key={org._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: '#6366F118', color: '#6366F1', fontWeight: 700 }}>{org.name?.[0]?.toUpperCase()}</Avatar>
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
                      ${PLAN_PRICE_DEFAULT[org.subscription?.plan] || 0}/mo
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit organization">
                      <IconButton size="small" onClick={() => { setPlanDialog({ orgId: org._id, orgName: org.name, currentPlan: org.subscription?.plan }); setNewPlan(org.subscription?.plan || 'free'); setEditOrgName(org.name || ''); }}>
                        <Edit sx={{ fontSize: 16, color: '#6366F1' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete organization">
                      <IconButton size="small" onClick={() => setDeleteOrgDialog({ orgId: org._id, orgName: org.name })} sx={{ color: 'error.main' }}>
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {orgs.length === 0 && (
                <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>No organizations found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination component="div" count={orgTotal} page={orgPage} rowsPerPage={15} onPageChange={(_, p) => setOrgPage(p)} rowsPerPageOptions={[15]} />
        </Paper>
      )}

      {/* ── Tab 1: Users ── */}
      {tab === 1 && (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['User','Organization','Plan','2FA','Joined','Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(u => (
                <TableRow key={u._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: '#8B5CF618', color: '#8B5CF6' }} src={u.avatar}>{u.name?.[0]?.toUpperCase()}</Avatar>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem' }}>{u.name}</Typography>
                          {u.blocked && <Chip label="Suspended" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#FEE2E2', color: '#DC2626' }} />}
                        </Box>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>{u.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="caption">{u.organization?.name || '—'}</Typography></TableCell>
                  <TableCell><PlanBadge plan={u.organization?.subscription?.plan || 'free'} /></TableCell>
                  <TableCell>{u.twoFactor?.enabled ? <CheckCircle sx={{ fontSize: 16, color: '#10B981' }} /> : <Cancel sx={{ fontSize: 16, color: '#94A3B8' }} />}</TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}</Typography></TableCell>
                  <TableCell>
                    <Tooltip title={u.blocked ? 'Unblock user' : 'Suspend user'}>
                      <IconButton size="small" onClick={() => handleToggleBlock(u)} sx={{ color: u.blocked ? '#10B981' : '#F59E0B' }}>
                        {u.blocked ? <LockOpen sx={{ fontSize: 16 }} /> : <Block sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete user">
                      <IconButton size="small" onClick={() => setDeleteDialog({ userId: u._id, userName: u.name })} sx={{ color: 'error.main' }}>
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>No users found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination component="div" count={userTotal} page={userPage} rowsPerPage={20} onPageChange={(_, p) => setUserPage(p)} rowsPerPageOptions={[20]} />
        </Paper>
      )}

      {/* ── Tab 2: Recent Signups ── */}
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
          {!stats?.recentSignups?.length && <Typography color="text.disabled" sx={{ textAlign: 'center', py: 6 }}>No signups yet</Typography>}
        </Box>
      )}

      {/* ── Tab 3: Growth Charts ── */}
      {tab === 3 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>New Signups (Last 6 Months)</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <ReBarChart data={growth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <ReTooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="signups" radius={[4, 4, 0, 0]}>
                      {growth.map((_, i) => <Cell key={i} fill={i === growth.length - 1 ? '#6366F1' : '#C7D2FE'} />)}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>Plan Breakdown</Typography>
                {(stats?.planBreakdown || []).map(p => (
                  <Box key={p._id} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PlanBadge plan={p._id} />
                        <Typography variant="caption" color="text.secondary">${PLAN_PRICE_DEFAULT[p._id] || 0}/mo</Typography>
                      </Box>
                      <Typography variant="caption" fontWeight={700}>{p.count}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={stats.totalOrgs > 0 ? (p.count / stats.totalOrgs) * 100 : 0}
                      sx={{ height: 6, borderRadius: 3, bgcolor: `${PLAN_COLOR[p._id]}18`, '& .MuiLinearProgress-bar': { bgcolor: PLAN_COLOR[p._id] || '#94A3B8', borderRadius: 3 } }} />
                  </Box>
                ))}
                {!stats?.planBreakdown?.length && <Typography variant="caption" color="text.disabled">No data yet</Typography>}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── Tab 4: Platform Settings ── */}
      {tab === 4 && (
        <Box>
          {!platformSettings ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <Grid container spacing={2.5}>
              {/* Access Control */}
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <SectionHeader title="Access Control" />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: platformSettings.maintenanceMode ? '#EF444410' : 'action.hover', borderRadius: 1.5, border: platformSettings.maintenanceMode ? '1px solid #EF444440' : '1px solid transparent' }}>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>Maintenance Mode</Typography>
                          <Typography variant="caption" color="text.secondary">Shows maintenance page to all users</Typography>
                        </Box>
                        <Switch checked={!!platformSettings.maintenanceMode} onChange={e => setPlatformSettings(p => ({ ...p, maintenanceMode: e.target.checked }))} color="error" />
                      </Box>
                      {platformSettings.maintenanceMode && (
                        <TextField size="small" fullWidth label="Maintenance Message" multiline rows={2}
                          value={platformSettings.maintenanceMessage || ''}
                          onChange={e => setPlatformSettings(p => ({ ...p, maintenanceMessage: e.target.value }))} />
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>Allow New Signups</Typography>
                          <Typography variant="caption" color="text.secondary">New users can register</Typography>
                        </Box>
                        <Switch checked={platformSettings.allowNewSignups !== false} onChange={e => setPlatformSettings(p => ({ ...p, allowNewSignups: e.target.checked }))} />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>Allow Google Auth</Typography>
                          <Typography variant="caption" color="text.secondary">Google OAuth login enabled</Typography>
                        </Box>
                        <Switch checked={platformSettings.allowGoogleAuth !== false} onChange={e => setPlatformSettings(p => ({ ...p, allowGoogleAuth: e.target.checked }))} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Feature Flags */}
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <SectionHeader title="Feature Flags" />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {[
                        ['aiEnabled', 'AI Assistant'],
                        ['automationsEnabled', 'Automations'],
                        ['reportsEnabled', 'Reports'],
                        ['portfoliosEnabled', 'Portfolios'],
                        ['webhooksEnabled', 'Webhooks'],
                        ['ganttEnabled', 'Gantt Chart'],
                        ['sprintsEnabled', 'Sprints'],
                        ['timeTrackingEnabled', 'Time Tracking'],
                        ['calendarEnabled', 'Calendar'],
                      ].map(([key, label]) => (
                        <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'action.hover', borderRadius: 1.5 }}>
                          <Typography variant="body2">{label}</Typography>
                          <Switch size="small" checked={platformSettings.featureFlags?.[key] !== false}
                            onChange={e => setPlatformSettings(p => ({ ...p, featureFlags: { ...p.featureFlags, [key]: e.target.checked } }))} />
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Contact & Links */}
              <Grid item xs={12}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <SectionHeader title="Contact & URLs" />
                    <Grid container spacing={2}>
                      {[
                        ['contactEmail', 'Support Email'],
                        ['supportUrl', 'Support URL'],
                        ['termsUrl', 'Terms of Service URL'],
                        ['privacyUrl', 'Privacy Policy URL'],
                      ].map(([key, label]) => (
                        <Grid item xs={12} md={6} key={key}>
                          <TextField size="small" fullWidth label={label} value={platformSettings[key] || ''}
                            onChange={e => setPlatformSettings(p => ({ ...p, [key]: e.target.value }))} />
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" startIcon={settingsSaving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                    onClick={handleSaveSettings} disabled={settingsSaving}
                    sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 2, textTransform: 'none', px: 3 }}>
                    Save Settings
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>
      )}

      {/* ── Tab 5: Plans & Pricing ── */}
      {tab === 5 && (
        <Box>
          {!Object.keys(planEdit).length ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <Grid container spacing={2.5}>
              {['free', 'starter', 'professional', 'business', 'enterprise'].map(planName => {
                const p = planEdit[planName] || {};
                const set = (k, v) => setPlanEdit(prev => ({ ...prev, [planName]: { ...prev[planName], [k]: v } }));
                return (
                  <Grid item xs={12} md={6} key={planName}>
                    <Card elevation={0} sx={{ border: `1px solid ${PLAN_COLOR[planName]}40`, borderRadius: 2.5 }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <PlanBadge plan={planName} />
                          <Button size="small" variant="outlined" startIcon={planSaving === planName ? <CircularProgress size={12} /> : <Save />}
                            onClick={() => handleSavePlan(planName)} disabled={!!planSaving}
                            sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.72rem' }}>
                            Save
                          </Button>
                        </Box>
                        <Grid container spacing={1.5}>
                          <Grid item xs={6}>
                            <TextField size="small" fullWidth label="Price ($/mo)" type="number" value={p.price ?? 0}
                              onChange={e => set('price', Number(e.target.value))} />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField size="small" fullWidth label="Max Members (-1=∞)" type="number" value={p.maxMembers ?? 5}
                              onChange={e => set('maxMembers', Number(e.target.value))} />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField size="small" fullWidth label="Max Projects (-1=∞)" type="number" value={p.maxProjects ?? 3}
                              onChange={e => set('maxProjects', Number(e.target.value))} />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField size="small" fullWidth label="Storage GB (-1=∞)" type="number" value={p.maxStorage ?? 1}
                              onChange={e => set('maxStorage', Number(e.target.value))} />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField size="small" fullWidth label="AI Credits (-1=∞)" type="number" value={p.aiCredits ?? 0}
                              onChange={e => set('aiCredits', Number(e.target.value))} />
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>Features</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                              {['automations','reports','webhooks','customRoles','portfolios'].map(f => (
                                <Chip key={f} label={f} size="small" clickable
                                  onClick={() => set(f, !p[f])}
                                  sx={{ height: 22, fontSize: '0.65rem',
                                    bgcolor: p[f] ? `${PLAN_COLOR[planName]}18` : 'action.hover',
                                    color: p[f] ? PLAN_COLOR[planName] : 'text.disabled',
                                    border: p[f] ? `1px solid ${PLAN_COLOR[planName]}40` : '1px solid transparent',
                                    fontWeight: p[f] ? 700 : 400,
                                  }} />
                              ))}
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}

      {/* ── Tab 6: Announcements ── */}
      {tab === 6 && (
        <Box>
          <SectionHeader title="Site-Wide Announcements"
            action={
              <Button size="small" variant="contained" startIcon={<Add />}
                onClick={() => { setAnnounceDialog({}); setAnnounceForm({ message: '', type: 'info', active: true, link: '', linkText: '', dismissible: true, targetPlans: [] }); }}
                sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 2, textTransform: 'none' }}>
                New Announcement
              </Button>
            }
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {announcements.map(a => {
              const AIcon = ANNOUNCE_ICON[a.type] || Info;
              const color = ANNOUNCE_COLOR[a.type] || '#3B82F6';
              return (
                <Card key={a._id} elevation={0} sx={{ border: `1px solid ${color}30`, borderRadius: 2, opacity: a.active ? 1 : 0.5 }}>
                  <CardContent sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <AIcon sx={{ color, fontSize: 18 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{a.message}</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Chip label={a.type} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: `${color}18`, color }} />
                        {a.targetPlans?.length > 0 && a.targetPlans.map(p => <PlanBadge key={p} plan={p} />)}
                        {!a.targetPlans?.length && <Typography variant="caption" color="text.disabled">All users</Typography>}
                        {a.expiresAt && <Typography variant="caption" color="text.disabled">Expires {format(new Date(a.expiresAt), 'MMM d, yyyy')}</Typography>}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title={a.active ? 'Active — click to deactivate' : 'Inactive — click to activate'}>
                        <Switch size="small" checked={a.active} onChange={() => handleToggleAnnouncement(a)} />
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => { setAnnounceDialog(a); setAnnounceForm({ message: a.message, type: a.type, active: a.active, link: a.link || '', linkText: a.linkText || '', dismissible: a.dismissible !== false, targetPlans: a.targetPlans || [] }); }}>
                          <Edit sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDeleteAnnouncement(a._id)} sx={{ color: 'error.main' }}>
                          <Delete sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
            {!announcements.length && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Campaign sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.disabled">No announcements yet</Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* ── Tab 7: Email Blast ── */}
      {tab === 7 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <SectionHeader title="Send Email to Users" />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField fullWidth size="small" label="Subject" value={blastForm.subject}
                    onChange={e => setBlastForm(p => ({ ...p, subject: e.target.value }))} />
                  <TextField fullWidth multiline rows={8} label="Body (HTML supported)"
                    value={blastForm.body} onChange={e => setBlastForm(p => ({ ...p, body: e.target.value }))}
                    placeholder="<p>Hello {name},</p><p>Your message here...</p>" />
                  <FormControl size="small">
                    <InputLabel>Target Plans (empty = all)</InputLabel>
                    <Select multiple value={blastForm.targetPlans} label="Target Plans (empty = all)"
                      onChange={e => setBlastForm(p => ({ ...p, targetPlans: e.target.value }))}
                      renderValue={v => v.map(p => <PlanBadge key={p} plan={p} />)}>
                      {['free','starter','professional','business','enterprise'].map(p => (
                        <MenuItem key={p} value={p}><PlanBadge plan={p} /></MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button variant="contained" startIcon={blastSending ? <CircularProgress size={16} color="inherit" /> : <Send />}
                    onClick={() => setBlastConfirm(true)}
                    disabled={!blastForm.subject || !blastForm.body || blastSending}
                    sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 2, textTransform: 'none', alignSelf: 'flex-start', px: 3 }}>
                    {blastSending ? 'Sending…' : 'Send Email Blast'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            {blastResult && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={2}>Last Send Result</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: '#10B98118', borderRadius: 1.5 }}>
                      <Typography variant="body2" fontWeight={700} color="#10B981">Sent</Typography>
                      <Typography variant="body2" fontWeight={800} color="#10B981">{blastResult.sent}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: '#EF444418', borderRadius: 1.5 }}>
                      <Typography variant="body2" fontWeight={700} color="#EF4444">Failed</Typography>
                      <Typography variant="body2" fontWeight={800} color="#EF4444">{blastResult.failed}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, mt: blastResult ? 2 : 0 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>Tips</Typography>
                <Typography variant="caption" color="text.secondary" component="ul" sx={{ pl: 2, lineHeight: 2 }}>
                  <li>Leave Target Plans empty to email all users</li>
                  <li>HTML is supported in the body</li>
                  <li>Max 500 recipients per blast</li>
                  <li>Sender: your SMTP config</li>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── Tab 8: System Health ── */}
      {tab === 8 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button size="small" startIcon={<Refresh />} onClick={fetchSystem} disabled={systemLoading}>Refresh</Button>
          </Box>
          {systemLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : systemData ? (
            <Grid container spacing={2.5}>
              {/* Database */}
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Dns sx={{ color: systemData.database?.state === 1 ? '#10B981' : '#EF4444' }} />
                      <Typography variant="subtitle2" fontWeight={700}>Database</Typography>
                      <Chip label={systemData.database?.status} size="small"
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700,
                          bgcolor: systemData.database?.state === 1 ? '#10B98118' : '#EF444418',
                          color: systemData.database?.state === 1 ? '#10B981' : '#EF4444' }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">MongoDB · {systemData.database?.status === 'connected' ? 'Healthy' : 'Check connection'}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Server */}
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Speed sx={{ color: '#6366F1' }} />
                      <Typography variant="subtitle2" fontWeight={700}>Server</Typography>
                    </Box>
                    {[
                      ['Uptime', systemData.server?.uptimeFormatted],
                      ['Node.js', systemData.server?.nodeVersion],
                      ['Platform', `${systemData.server?.platform} / ${systemData.server?.arch}`],
                    ].map(([k, v]) => (
                      <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">{k}</Typography>
                        <Typography variant="caption" fontWeight={700}>{v}</Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              {/* Memory */}
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Memory sx={{ color: '#8B5CF6' }} />
                      <Typography variant="subtitle2" fontWeight={700}>Memory</Typography>
                    </Box>
                    {[
                      ['Heap Used', `${systemData.memory?.heapUsed} MB`],
                      ['Heap Total', `${systemData.memory?.heapTotal} MB`],
                      ['RSS', `${systemData.memory?.rss} MB`],
                    ].map(([k, v]) => (
                      <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">{k}</Typography>
                        <Typography variant="caption" fontWeight={700}>{v}</Typography>
                      </Box>
                    ))}
                    <LinearProgress variant="determinate"
                      value={systemData.memory?.heapTotal > 0 ? (systemData.memory.heapUsed / systemData.memory.heapTotal) * 100 : 0}
                      sx={{ mt: 1, height: 4, borderRadius: 2, '& .MuiLinearProgress-bar': { bgcolor: '#8B5CF6' } }} />
                  </CardContent>
                </Card>
              </Grid>

              {/* OS */}
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Storage sx={{ color: '#F59E0B' }} />
                      <Typography variant="subtitle2" fontWeight={700}>OS / Machine</Typography>
                    </Box>
                    <Grid container spacing={1}>
                      {[
                        ['CPU Cores', systemData.os?.cpus],
                        ['Load Avg 1m', systemData.os?.loadAvg1],
                        ['Load Avg 5m', systemData.os?.loadAvg5],
                        ['Total RAM', `${systemData.os?.totalMem} GB`],
                        ['Free RAM', `${systemData.os?.freeMem} GB`],
                      ].map(([k, v]) => (
                        <Grid item xs={6} key={k}>
                          <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1.5, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary" display="block">{k}</Typography>
                            <Typography variant="body2" fontWeight={700}>{v}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Activity */}
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <TrendingUp sx={{ color: '#10B981' }} />
                      <Typography variant="subtitle2" fontWeight={700}>Activity (24h / 7d)</Typography>
                    </Box>
                    <Grid container spacing={1}>
                      {[
                        ['New Users (24h)', systemData.activity?.newUsersToday, '#6366F1'],
                        ['New Users (7d)', systemData.activity?.newUsersWeek, '#8B5CF6'],
                        ['New Orgs (24h)', systemData.activity?.newOrgsToday, '#F59E0B'],
                        ['Active Users (24h)', systemData.activity?.activeToday, '#10B981'],
                      ].map(([k, v, color]) => (
                        <Grid item xs={6} key={k}>
                          <Box sx={{ p: 1, bgcolor: `${color}10`, borderRadius: 1.5, textAlign: 'center', border: `1px solid ${color}20` }}>
                            <Typography variant="caption" color="text.secondary" display="block">{k}</Typography>
                            <Typography variant="body2" fontWeight={800} color={color}>{v ?? 0}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.disabled" sx={{ textAlign: 'center', py: 6 }}>Click Refresh to load system info</Typography>
          )}
        </Box>
      )}

      {/* ── Tab 9: Mobile Apps ── */}
      {tab === 9 && (
        <Grid container spacing={2.5}>
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
                  {[
                    { label: 'APK Download', value: 'julay.org/julay.apk', chip: null, btn: { label: 'Download', href: 'https://julay.org/julay.apk' } },
                    { label: 'AAB (Play Store)', value: 'GitHub Actions Artifacts', chip: null, btn: { label: 'View', href: 'https://github.com/julaytech-del/Julayorg/actions/workflows/apk.yml' } },
                    { label: 'Auto-Build', value: 'Every push to main', chip: { label: 'Active', color: '#10B981' }, btn: null },
                    { label: 'Play Store', value: 'Google Play Developer Required', chip: { label: 'Pending', color: '#F59E0B' }, btn: null },
                  ].map(({ label, value, chip, btn }) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>{label}</Typography>
                        <Typography variant="body2" fontWeight={600}>{value}</Typography>
                      </Box>
                      {chip && <Chip label={chip.label} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${chip.color}18`, color: chip.color }} />}
                      {btn && <Button size="small" variant="outlined" href={btn.href} target="_blank" sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem' }}>{btn.label}</Button>}
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

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
                <Alert severity="info" sx={{ mb: 2, fontSize: '0.78rem' }}>Requires Apple Developer Program ($99/year)</Alert>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    ['ios.yml Workflow', 'Ready', '#10B981'],
                    ['Apple Developer Account', 'Needed', '#F59E0B'],
                    ['Signing Certificate', 'Needed', '#F59E0B'],
                    ['Provisioning Profile', 'Needed', '#F59E0B'],
                    ['App Store Connect API', 'Needed', '#F59E0B'],
                  ].map(([label, status, color]) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
                      <Typography variant="body2" fontWeight={600}>{label}</Typography>
                      <Chip label={status} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${color}18`, color }} />
                    </Box>
                  ))}
                </Box>
                <Button fullWidth variant="outlined" startIcon={<Build />}
                  href="https://developer.apple.com/programs/enroll/" target="_blank"
                  sx={{ mt: 2.5, textTransform: 'none', borderRadius: 2 }}>
                  Enroll in Apple Developer
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>Auto-Sync Pipeline</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {['Push to main', '→', 'Web Build (Vite)', '→', 'Cap Sync', '→', 'Android AAB + APK', '→', 'Deploy to julay.org'].map((step, i) => (
                    step === '→'
                      ? <Typography key={i} color="text.disabled" sx={{ fontWeight: 700 }}>→</Typography>
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

      {/* ── Traffic (visitor analytics) ──────────────────────────────────────── */}
      {tab === 10 && (
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>Site Traffic</Typography>
            <Button size="small" startIcon={<Refresh sx={{ fontSize: 16 }} />} onClick={fetchTraffic} disabled={trafficLoading} sx={{ textTransform: 'none' }}>
              {trafficLoading ? 'Loading…' : 'Refresh'}
            </Button>
          </Box>

          {!traffic && trafficLoading && <LinearProgress />}
          {traffic && (
            <>
              {/* Stat cards */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} md={3}><StatCard icon={Circle} label="Active Now" value={traffic.active} sub="visitors (5 min)" color="#10B981" /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={Visibility} label="Today" value={traffic.today} sub="page views" color="#6366F1" /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={BarChart} label="This Week" value={traffic.week} sub="page views" color="#8B5CF6" /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={TrendingUp} label="This Month" value={traffic.month} sub="page views" color="#F59E0B" /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={TouchApp} label="Bounce Rate" value={`${traffic.bounceRate}%`} sub="single-page" color="#EF4444" /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={Speed} label="Avg Session" value={`${Math.round((traffic.avgDuration||0)/60)}m`} sub="on site" color="#0EA5E9" /></Grid>
              </Grid>

              {/* Conversion funnel */}
              <Card sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }} elevation={0}>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Conversion Funnel <Typography component="span" variant="caption" color="text.disabled">(7 days, unique sessions)</Typography></Typography>
                  {[
                    { label: '🏠 Homepage', val: traffic.funnel?.home },
                    { label: '💲 Pricing', val: traffic.funnel?.pricing },
                    { label: '📝 Register / Login', val: traffic.funnel?.register },
                    { label: '📊 Dashboard', val: traffic.funnel?.dashboard },
                  ].map((s, i) => {
                    const max = traffic.funnel?.home || 1;
                    const pct = Math.round(((s.val || 0) / max) * 100);
                    return (
                      <Box key={i} sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                          <Typography variant="caption" fontWeight={600}>{s.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.val || 0} · {pct}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: '#6366F1' } }} />
                      </Box>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Top pages / referrers / languages */}
              <Grid container spacing={2}>
                {[
                  { title: 'Top Pages', rows: (traffic.topPages||[]).map(p => [p.page, p.views]) },
                  { title: 'Top Referrers', rows: (traffic.topReferrers||[]).map(r => [r.referrer || 'Direct', r.views]) },
                  { title: 'Top Clicked', rows: (traffic.topClicks||[]).map(c => [c.element, c.count]) },
                  { title: 'Languages', rows: (traffic.topLanguages||[]).map(l => [l.language, l.count]) },
                  { title: 'Devices', rows: (traffic.deviceBreakdown||[]).map(d => [d.device, d.count]) },
                ].map((tbl, ti) => (
                  <Grid item xs={12} md={6} key={ti}>
                    <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, height: '100%' }} elevation={0}>
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{tbl.title}</Typography>
                        {tbl.rows.length === 0 && <Typography variant="caption" color="text.disabled">No data yet</Typography>}
                        {tbl.rows.slice(0, 8).map(([k, v], ri) => (
                          <Box key={ri} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4, borderBottom: ri < Math.min(tbl.rows.length, 8) - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                            <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{k}</Typography>
                            <Typography variant="caption" fontWeight={700}>{v}</Typography>
                          </Box>
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Box>
      )}

      {/* ── Dialogs ────────────────────────────────────────────────────────────── */}

      {/* Edit Organization */}
      <Dialog open={!!planDialog} onClose={() => setPlanDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Edit Organization</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth size="small" label="Organization name" sx={{ mt: 1, mb: 2 }}
            value={editOrgName} onChange={e => setEditOrgName(e.target.value)}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Plan</InputLabel>
            <Select value={newPlan} label="Plan" onChange={e => setNewPlan(e.target.value)}>
              {['free','starter','professional','business','enterprise'].map(p => (
                <MenuItem key={p} value={p}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PlanBadge plan={p} />
                    <Typography variant="caption" color="text.secondary">${PLAN_PRICE_DEFAULT[p]}/month</Typography>
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

      {/* Delete User */}
      <Dialog open={!!deleteDialog} onClose={() => !deleting && setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700} sx={{ color: 'error.main' }}>Delete User</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>This action cannot be undone.</Alert>
          <Typography variant="body2">Delete <strong>{deleteDialog?.userName}</strong>? All their data will be removed.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialog(null)} disabled={deleting}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteUser} disabled={deleting} sx={{ borderRadius: 2 }}>
            {deleting ? <CircularProgress size={16} color="inherit" /> : 'Delete permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Org */}
      <Dialog open={!!deleteOrgDialog} onClose={() => !deletingOrg && setDeleteOrgDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700} sx={{ color: 'error.main' }}>Delete Organization</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>This will delete all members, projects, and tasks.</Alert>
          <Typography variant="body2">Delete <strong>{deleteOrgDialog?.orgName}</strong> and all its data permanently?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOrgDialog(null)} disabled={deletingOrg}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteOrg} disabled={deletingOrg} sx={{ borderRadius: 2 }}>
            {deletingOrg ? <CircularProgress size={16} color="inherit" /> : 'Delete permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Announcement Form */}
      <Dialog open={announceDialog !== null} onClose={() => { setAnnounceDialog(null); setAnnounceForm({ message: '', type: 'info', active: true, link: '', linkText: '', dismissible: true, targetPlans: [] }); }} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{announceDialog?._id ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField fullWidth size="small" label="Message" multiline rows={2}
              value={announceForm.message} onChange={e => setAnnounceForm(p => ({ ...p, message: e.target.value }))} />
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select value={announceForm.type} label="Type" onChange={e => setAnnounceForm(p => ({ ...p, type: e.target.value }))}>
                {['info','warning','error','success'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Target Plans (empty = all)</InputLabel>
              <Select multiple value={announceForm.targetPlans} label="Target Plans (empty = all)"
                onChange={e => setAnnounceForm(p => ({ ...p, targetPlans: e.target.value }))}>
                {['free','starter','professional','business','enterprise'].map(p => (
                  <MenuItem key={p} value={p}><PlanBadge plan={p} /></MenuItem>
                ))}
              </Select>
            </FormControl>
            <Grid container spacing={1.5}>
              <Grid item xs={8}><TextField fullWidth size="small" label="Link URL (optional)" value={announceForm.link} onChange={e => setAnnounceForm(p => ({ ...p, link: e.target.value }))} /></Grid>
              <Grid item xs={4}><TextField fullWidth size="small" label="Link Text" value={announceForm.linkText} onChange={e => setAnnounceForm(p => ({ ...p, linkText: e.target.value }))} /></Grid>
            </Grid>
            <TextField fullWidth size="small" type="datetime-local" label="Expires At (optional)"
              value={announceForm.expiresAt ? new Date(announceForm.expiresAt).toISOString().slice(0, 16) : ''}
              onChange={e => setAnnounceForm(p => ({ ...p, expiresAt: e.target.value || null }))}
              InputLabelProps={{ shrink: true }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel control={<Switch checked={announceForm.active} onChange={e => setAnnounceForm(p => ({ ...p, active: e.target.checked }))} />} label="Active" />
              <FormControlLabel control={<Switch checked={announceForm.dismissible !== false} onChange={e => setAnnounceForm(p => ({ ...p, dismissible: e.target.checked }))} />} label="Dismissible" />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setAnnounceDialog(null); setAnnounceForm({ message: '', type: 'info', active: true, link: '', linkText: '', dismissible: true, targetPlans: [] }); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAnnouncement} disabled={!announceForm.message || announceSaving}
            sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 2 }}>
            {announceSaving ? <CircularProgress size={16} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Blast Confirm */}
      <Dialog open={blastConfirm} onClose={() => setBlastConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Confirm Email Blast</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>This will send an email to ALL matching users.</Alert>
          <Typography variant="body2"><strong>Subject:</strong> {blastForm.subject}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}><strong>Target:</strong> {blastForm.targetPlans.length ? blastForm.targetPlans.join(', ') : 'All plans'}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBlastConfirm(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleSendBlast} sx={{ borderRadius: 2 }}>Send</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
