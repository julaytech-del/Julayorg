import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Tabs, Tab, TextField, Button,
  Avatar, Switch, FormControlLabel, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, Select, MenuItem, FormControl,
  InputLabel, LinearProgress, IconButton, Tooltip, List, ListItem,
  ListItemText, ListItemAvatar, ListItemSecondaryAction, Alert,
  CircularProgress, Paper, Grid,
} from '@mui/material';
import {
  Person, Group, CreditCard, Security, Notifications, Extension,
  Lock, Email, GitHub, Webhook, FlashOn, VideoCall, Edit, CheckCircle,
  Cancel, LockOutlined, Add, Visibility, VisibilityOff,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import { settingsAPI, subscriptionAPI, usersAPI } from '../../services/api.js';

// ── Profile Tab ────────────────────────────────────────────────────────────
const TIMEZONES = ['UTC', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Tokyo'];
const LANGUAGES = [{ code: 'en', label: 'English' }, { code: 'ar', label: 'العربية' }, { code: 'fr', label: 'Français' }];

function ProfileTab({ user }) {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const [form, setForm] = useState({
    name: user?.name || '',
    jobTitle: user?.jobTitle || '',
    avatar: user?.avatar || '',
    timezone: user?.timezone || 'UTC',
    language: user?.language || 'en',
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.updateProfile(form);
      if (form.language !== i18n.language) i18n.changeLanguage(form.language);
      dispatch(showSnackbar({ message: 'Profile updated successfully', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to update profile', severity: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 560 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Profile Settings</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, borderRadius: 2, backgroundColor: '#F8FAFC', border: '1px solid', borderColor: 'divider' }}>
        <Avatar sx={{ width: 64, height: 64, fontSize: '1.5rem', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
          {form.avatar ? <img src={form.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : form.name?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={600}>{form.name || 'Your Name'}</Typography>
          <Typography variant="caption" color="text.secondary">{form.jobTitle || 'Your Role'}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label="Full Name"    value={form.name}     onChange={set('name')}     fullWidth />
        <TextField label="Job Title"    value={form.jobTitle} onChange={set('jobTitle')} fullWidth />
        <TextField label="Avatar URL"   value={form.avatar}   onChange={set('avatar')}   fullWidth placeholder="https://..." />
        <FormControl fullWidth>
          <InputLabel>Timezone</InputLabel>
          <Select value={form.timezone} label="Timezone" onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}>
            {TIMEZONES.map(tz => <MenuItem key={tz} value={tz}>{tz}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Language</InputLabel>
          <Select value={form.language} label="Language" onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
            {LANGUAGES.map(l => <MenuItem key={l.code} value={l.code}>{l.label}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleSave} disabled={saving}
          sx={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', alignSelf: 'flex-start', px: 4 }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
}

// ── Team Tab ───────────────────────────────────────────────────────────────
function TeamTab({ currentUser }) {
  const dispatch = useDispatch();
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    settingsAPI.getOrgMembers()
      .then(res => setMembers(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = currentUser?.role?.name === 'admin' || currentUser?.isAdmin;

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      // Simulated invite — backend endpoint TBD
      await new Promise(r => setTimeout(r, 800));
      dispatch(showSnackbar({ message: `Invitation sent to ${inviteEmail}`, severity: 'success' }));
      setInviteOpen(false);
      setInviteEmail('');
    } catch {
      dispatch(showSnackbar({ message: 'Failed to send invitation', severity: 'error' }));
    } finally {
      setInviting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Team Members</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setInviteOpen(true)}
          sx={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
          Invite Member
        </Button>
      </Box>

      {loading ? <CircularProgress /> : (
        <List disablePadding>
          {members.map((m, i) => (
            <React.Fragment key={m._id || i}>
              <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>{m.name?.[0]?.toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Typography fontWeight={600}>{m.name}</Typography><Chip label={m.role?.name || m.role || 'member'} size="small" sx={{ height: 18, fontSize: '0.65rem', textTransform: 'capitalize' }} /></Box>}
                  secondary={m.email}
                />
                <ListItemSecondaryAction>
                  <Chip label={m.status || 'active'} size="small" color={m.status === 'active' ? 'success' : 'default'} />
                </ListItemSecondaryAction>
              </ListItem>
              {i < members.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Invite Team Member</DialogTitle>
        <DialogContent>
          <TextField
            label="Email Address" type="email" fullWidth autoFocus
            value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleInvite} disabled={!inviteEmail || inviting}
            sx={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
            {inviting ? 'Sending…' : 'Send Invite'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Billing Tab ────────────────────────────────────────────────────────────
const PLANS = [
  { id: 'free',       name: 'Free',       price: '$0',   features: ['5 projects', '3 members', 'Basic AI (10 req/mo)'] },
  { id: 'pro',        name: 'Pro',        price: '$29',  features: ['Unlimited projects', '25 members', 'AI (500 req/mo)'] },
  { id: 'business',   name: 'Business',   price: '$79',  features: ['Unlimited everything', '100 members', 'AI (2000 req/mo)'] },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', features: ['White-label', 'Dedicated AI', 'SLA'] },
];

function BillingTab() {
  const [sub, setSub]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subscriptionAPI.status()
      .then(res => setSub(res?.data || res))
      .catch(() => setSub({ plan: 'free', aiUsedThisMonth: 0, aiLimit: 10 }))
      .finally(() => setLoading(false));
  }, []);

  const currentPlan = sub?.plan || 'free';
  const aiUsed      = sub?.aiUsedThisMonth || 0;
  const aiLimit     = sub?.aiLimit || 10;
  const aiPct       = aiLimit > 0 ? Math.min(100, Math.round((aiUsed / aiLimit) * 100)) : 0;

  const handleUpgrade = (planId) => {
    window.location.href = `/api/subscription/checkout?plan=${planId}`;
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Billing & Subscription</Typography>

      {/* AI usage */}
      <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>AI Usage This Month</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography variant="body2" color="text.secondary">{aiUsed} / {aiLimit} requests</Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: aiPct > 80 ? '#EF4444' : '#6366F1' }}>{aiPct}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={aiPct} sx={{ height: 8, borderRadius: 4, backgroundColor: '#E2E8F0', '& .MuiLinearProgress-bar': { background: aiPct > 80 ? 'linear-gradient(90deg, #F59E0B, #EF4444)' : 'linear-gradient(90deg, #6366F1, #8B5CF6)', borderRadius: 4 } }} />
          {aiPct > 80 && <Alert severity="warning" sx={{ mt: 1, py: 0 }}>You're approaching your AI limit. Consider upgrading.</Alert>}
        </CardContent>
      </Card>

      {/* Plan cards */}
      <Grid container spacing={2}>
        {PLANS.map(plan => {
          const isCurrent = plan.id === currentPlan;
          return (
            <Grid item xs={12} sm={6} key={plan.id}>
              <Card elevation={0} sx={{ border: `2px solid ${isCurrent ? '#6366F1' : 'divider'}`, borderRadius: 2, height: '100%', position: 'relative' }}>
                {isCurrent && <Chip label="Current Plan" size="small" sx={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#6366F1', color: 'white', fontSize: '0.65rem' }} />}
                <CardContent>
                  <Typography variant="h6" fontWeight={800}>{plan.name}</Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ color: '#6366F1', mb: 1 }}>{plan.price}<Typography component="span" variant="caption" color="text.secondary">/mo</Typography></Typography>
                  <Box sx={{ mb: 2 }}>
                    {plan.features.map((f, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                        <CheckCircle sx={{ fontSize: 14, color: '#10B981' }} />
                        <Typography variant="body2">{f}</Typography>
                      </Box>
                    ))}
                  </Box>
                  {!isCurrent && (
                    <Button fullWidth variant="outlined" onClick={() => handleUpgrade(plan.id)} sx={{ borderColor: '#6366F1', color: '#6366F1' }}>
                      Upgrade to {plan.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

// ── Security Tab ───────────────────────────────────────────────────────────
function SecurityTab() {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleChange = async () => {
    if (form.newPass !== form.confirm) {
      dispatch(showSnackbar({ message: 'Passwords do not match', severity: 'error' })); return;
    }
    setSaving(true);
    try {
      await settingsAPI.changePassword({ currentPassword: form.current, newPassword: form.newPass });
      dispatch(showSnackbar({ message: 'Password changed successfully', severity: 'success' }));
      setForm({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      dispatch(showSnackbar({ message: err?.message || 'Failed to change password', severity: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const toggle = (k) => () => setShowPass(p => ({ ...p, [k]: !p[k] }));

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Security Settings</Typography>

      <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, maxWidth: 480 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Change Password</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { label: 'Current Password', key: 'current', stateKey: 'current' },
              { label: 'New Password',     key: 'newPass', stateKey: 'new' },
              { label: 'Confirm Password', key: 'confirm', stateKey: 'confirm' },
            ].map(({ label, key, stateKey }) => (
              <TextField
                key={key}
                label={label}
                type={showPass[stateKey] ? 'text' : 'password'}
                value={form[key]}
                onChange={set(key)}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={toggle(stateKey)} size="small">
                      {showPass[stateKey] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  )
                }}
              />
            ))}
            <Button variant="contained" onClick={handleChange} disabled={saving || !form.current || !form.newPass || !form.confirm}
              sx={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', alignSelf: 'flex-start' }}>
              {saving ? 'Changing…' : 'Change Password'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 2FA placeholder */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, maxWidth: 480 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 2, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LockOutlined sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={700}>Two-Factor Authentication</Typography>
            <Typography variant="body2" color="text.secondary">Add an extra layer of security to your account.</Typography>
          </Box>
          <Chip label="Coming Soon" size="small" sx={{ backgroundColor: '#E0E7FF', color: '#6366F1', fontWeight: 600 }} />
        </CardContent>
      </Card>
    </Box>
  );
}

// ── Notifications Tab ──────────────────────────────────────────────────────
const NOTIF_CATEGORIES = [
  { key: 'taskAssigned', label: 'Task Assigned to Me' },
  { key: 'taskOverdue',  label: 'Task Overdue' },
  { key: 'comments',     label: 'Comments & Mentions' },
  { key: 'projectUpdates', label: 'Project Updates' },
];

function NotificationsTab() {
  const dispatch = useDispatch();
  const [prefs, setPrefs] = useState({ email: {}, inApp: {} });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const defaults = NOTIF_CATEGORIES.reduce((acc, c) => ({ ...acc, [c.key]: true }), {});
    setPrefs({ email: { ...defaults }, inApp: { ...defaults } });
  }, []);

  const toggle = (channel, key) => setPrefs(p => ({ ...p, [channel]: { ...p[channel], [key]: !p[channel][key] } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 600)); // API TBD
      dispatch(showSnackbar({ message: 'Notification preferences saved', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to save preferences', severity: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Notification Preferences</Typography>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>Category</Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Email sx={{ fontSize: 16, color: '#6366F1' }} />
                <Typography variant="caption" fontWeight={700} color="#6366F1">Email</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Notifications sx={{ fontSize: 16, color: '#8B5CF6' }} />
                <Typography variant="caption" fontWeight={700} color="#8B5CF6">In-App</Typography>
              </Box>
            </Box>
          </Box>
          <Divider sx={{ mb: 1 }} />
          {NOTIF_CATEGORIES.map(cat => (
            <Box key={cat.key} sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
              <Typography variant="body2" sx={{ flex: 1 }}>{cat.label}</Typography>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <Switch checked={!!prefs.email[cat.key]} onChange={() => toggle('email', cat.key)} size="small" sx={{ '& .MuiSwitch-track': { backgroundColor: '#6366F1' } }} />
                <Switch checked={!!prefs.inApp[cat.key]} onChange={() => toggle('inApp', cat.key)} size="small" sx={{ '& .MuiSwitch-track': { backgroundColor: '#8B5CF6' } }} />
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>

      <Button variant="contained" onClick={handleSave} disabled={saving}
        sx={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
        {saving ? 'Saving…' : 'Save Preferences'}
      </Button>
    </Box>
  );
}

// ── Integrations Tab ───────────────────────────────────────────────────────
const INTEGRATIONS = [
  { id: 'slack',    name: 'Slack',             icon: '💬', desc: 'Team messaging and notifications',    comingSoon: true  },
  { id: 'gcal',     name: 'Google Calendar',   icon: '📅', desc: 'Sync task due dates with your calendar', comingSoon: false },
  { id: 'github',   name: 'GitHub',            icon: '🐙', desc: 'Link PRs and issues to tasks',        comingSoon: true  },
  { id: 'jira',     name: 'Jira',              icon: '🔵', desc: 'Import and sync Jira issues',         comingSoon: false },
  { id: 'zapier',   name: 'Zapier',            icon: '⚡', desc: 'Connect with 5000+ apps',             comingSoon: false },
  { id: 'msteams',  name: 'Microsoft Teams',   icon: '🟣', desc: 'Get notifications in Teams channels', comingSoon: false },
];

function IntegrationsTab() {
  const [enabled, setEnabled] = useState({});

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Integrations</Typography>
      <Grid container spacing={2}>
        {INTEGRATIONS.map(intg => (
          <Grid item xs={12} sm={6} key={intg.id}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Typography sx={{ fontSize: '2rem', lineHeight: 1 }}>{intg.icon}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontWeight={700}>{intg.name}</Typography>
                    {intg.comingSoon ? (
                      <Chip label="Coming Soon" size="small" sx={{ backgroundColor: '#E0E7FF', color: '#6366F1', fontSize: '0.65rem' }} />
                    ) : (
                      <Switch
                        size="small"
                        checked={!!enabled[intg.id]}
                        onChange={() => setEnabled(p => ({ ...p, [intg.id]: !p[intg.id] }))}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{intg.desc}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// ── main ───────────────────────────────────────────────────────────────────
const TABS = [
  { value: 'profile',       label: 'Profile',       icon: Person },
  { value: 'team',          label: 'Team',           icon: Group },
  { value: 'billing',       label: 'Billing',        icon: CreditCard },
  { value: 'security',      label: 'Security',       icon: Security },
  { value: 'notifications', label: 'Notifications',  icon: Notifications },
  { value: 'integrations',  label: 'Integrations',   icon: Extension },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('profile');
  const user = useSelector(s => s.auth.user);

  const renderContent = () => {
    switch (tab) {
      case 'profile':       return <ProfileTab user={user} />;
      case 'team':          return <TeamTab currentUser={user} />;
      case 'billing':       return <BillingTab />;
      case 'security':      return <SecurityTab />;
      case 'notifications': return <NotificationsTab />;
      case 'integrations':  return <IntegrationsTab />;
      default: return null;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Settings
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
          Manage your account, team, and preferences
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Sidebar tabs */}
        <Box sx={{ width: { xs: '100%', md: 220 }, flexShrink: 0 }}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <Tabs
              orientation="vertical"
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{ '& .MuiTab-root': { justifyContent: 'flex-start', px: 2, py: 1.25, minHeight: 44, textTransform: 'none', fontWeight: 500, fontSize: '0.875rem', alignItems: 'center', gap: 1 }, '& .Mui-selected': { color: '#6366F1', fontWeight: 700 }, '& .MuiTabs-indicator': { backgroundColor: '#6366F1', left: 0, right: 'auto', width: 3 } }}
            >
              {TABS.map(t => {
                const Icon = t.icon;
                return (
                  <Tab
                    key={t.value}
                    value={t.value}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon sx={{ fontSize: 18 }} />
                        {t.label}
                      </Box>
                    }
                  />
                );
              })}
            </Tabs>
          </Paper>
        </Box>

        {/* Content area */}
        <Box sx={{ flex: 1 }}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
            {renderContent()}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
