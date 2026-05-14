import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, Chip, Button, TextField, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, CircularProgress, FormControl, InputLabel, Select, MenuItem, Tabs, Tab, Table, TableBody, TableRow, TableCell, Alert, IconButton, Tooltip } from '@mui/material';
import { Search, Group, TrendingUp, EmojiEvents, PersonAdd, Add, CheckCircle, Cancel, Email, ContentCopy } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import api, { usersAPI, departmentsAPI } from '../../services/api.js';

const STATUS_COLORS = { active: '#10B981', inactive: '#94A3B8', busy: '#F59E0B', away: '#3B82F6' };

const ROLE_LEVELS = [
  {
    level: 'admin',
    label: 'Admin',
    color: '#EF4444',
    bg: '#FEF2F2',
    desc: 'Full access — manages everything',
    perms: { Projects: true, Tasks: true, 'Assign Tasks': true, Team: true, Departments: true, 'AI Tools': true, Reports: true },
  },
  {
    level: 'manager',
    label: 'Manager',
    color: '#F97316',
    bg: '#FFF7ED',
    desc: 'Manages projects & tasks, uses AI, views reports',
    perms: { Projects: true, Tasks: true, 'Assign Tasks': true, Team: '👁 view', Departments: '👁 view', 'AI Tools': true, Reports: true },
  },
  {
    level: 'lead',
    label: 'Lead',
    color: '#6366F1',
    bg: '#EEF2FF',
    desc: 'Handles tasks & assignments, limited project access',
    perms: { Projects: '👁 view', Tasks: true, 'Assign Tasks': true, Team: '👁 view', Departments: '👁 view', 'AI Tools': true, Reports: '👁 view' },
  },
  {
    level: 'member',
    label: 'Member',
    color: '#10B981',
    bg: '#ECFDF5',
    desc: 'Creates & updates own tasks, basic access',
    perms: { Projects: '👁 view', Tasks: true, 'Assign Tasks': false, Team: '👁 view', Departments: '👁 view', 'AI Tools': false, Reports: false },
  },
  {
    level: 'viewer',
    label: 'Viewer',
    color: '#94A3B8',
    bg: '#F8FAFC',
    desc: 'Read-only — can view but not change anything',
    perms: { Projects: '👁 view', Tasks: '👁 view', 'Assign Tasks': false, Team: '👁 view', Departments: '👁 view', 'AI Tools': false, Reports: '👁 view' },
  },
];

const PermIcon = ({ val }) => {
  if (val === true) return <CheckCircle sx={{ fontSize: 16, color: '#10B981' }} />;
  if (val === false) return <Cancel sx={{ fontSize: 16, color: '#EF4444' }} />;
  return <Typography variant="caption" color="text.secondary">{val}</Typography>;
};

const BLANK_FORM = { name: '', email: '', password: '', jobTitle: '', department: '', roleLevel: 'member' };

export default function TeamView() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [departments, setDepartments] = useState([]);

  const [addOpen, setAddOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState(1);
  const [form, setForm] = useState(BLANK_FORM);
  const [creating, setCreating] = useState(false);
  // Invite by email state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleLevel, setInviteRoleLevel] = useState('member');
  const [inviteLink, setInviteLink] = useState('');
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [existingEmailError, setExistingEmailError] = useState(false);
  const [addingExisting, setAddingExisting] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const loadUsers = () => {
    setLoading(true);
    usersAPI.getAll().then(res => setUsers(res.data || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
    departmentsAPI.getAll().then(res => {
      const depts = res.data || [];
      setDepartments(depts);
      // Auto-select default department in the form
      const defaultDept = depts.find(d => d.isDefault) || depts[0];
      if (defaultDept) setForm(f => ({ ...f, department: defaultDept._id }));
    }).catch(() => {});
  }, []);

  const closeDialog = () => {
    const defaultDept = departments.find(d => d.isDefault)?._id || departments[0]?._id || '';
    setAddOpen(false);
    setForm({ ...BLANK_FORM, department: defaultDept });
    setDialogTab(1);
    setInviteEmail('');
    setInviteRoleLevel('member');
    setInviteLink('');
    setCopied(false);
    setExistingEmailError(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    setExistingEmailError(false);
    try {
      const res = await api.post('/auth/invite', { email: inviteEmail, roleLevel: inviteRoleLevel });
      setInviteLink(res.data.inviteLink);
      dispatch(showSnackbar({ message: `Invite link generated for ${inviteEmail}`, severity: 'success' }));
    } catch (e) {
      if (e.message?.includes('already has an account')) {
        setExistingEmailError(true);
      } else {
        dispatch(showSnackbar({ message: e.message || 'Failed to generate invite', severity: 'error' }));
      }
    } finally {
      setInviting(false);
    }
  };

  const handleAddExisting = async () => {
    setAddingExisting(true);
    try {
      await api.post('/users/add-existing', { email: inviteEmail });
      dispatch(showSnackbar({ message: `${inviteEmail} added to your team!`, severity: 'success' }));
      loadUsers();
      closeDialog();
    } catch (e) {
      dispatch(showSnackbar({ message: e.message || 'Failed to add user', severity: 'error' }));
    } finally {
      setAddingExisting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    dispatch(showSnackbar({ message: 'Invite link copied!', severity: 'success' }));
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      dispatch(showSnackbar({ message: 'Name, email, and password are required', severity: 'warning' }));
      return;
    }
    setCreating(true);
    try {
      await api.post('/users', form);
      dispatch(showSnackbar({ message: `${form.name} created successfully!`, severity: 'success' }));
      loadUsers();
      closeDialog();
    } catch (e) {
      dispatch(showSnackbar({ message: e.message || 'Failed to create member', severity: 'error' }));
    } finally {
      setCreating(false);
    }
  };

  const filtered = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.jobTitle?.toLowerCase().includes(search.toLowerCase()));
  const avgPerf = users.length ? Math.round(users.reduce((sum, u) => sum + (u.performance?.score || 0), 0) / users.length) : 0;
  const selectedRole = ROLE_LEVELS.find(r => r.level === form.roleLevel) || ROLE_LEVELS[3];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>{t('team.title')}</Typography>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setAddOpen(true)}
          sx={{ bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' }, textTransform: 'none', borderRadius: 2 }}>
          Add Member
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { labelKey: 'team.stats.total', value: users.length, icon: <Group />, color: '#6366F1' },
          { labelKey: 'team.stats.active', value: users.filter(u => u.status === 'active').length, icon: <TrendingUp />, color: '#10B981' },
          { labelKey: 'team.stats.avgPerformance', value: `${avgPerf}%`, icon: <EmojiEvents />, color: '#F59E0B' }
        ].map(s => (
          <Grid item xs={12} sm={4} key={s.labelKey}>
            <Card><CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, backgroundColor: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {React.cloneElement(s.icon, { sx: { color: s.color } })}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{t(s.labelKey)}</Typography>
                <Typography variant="h5" fontWeight={700}>{s.value}</Typography>
              </Box>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      <TextField size="small" placeholder={t('team.search')} value={search} onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
        sx={{ mb: 3, width: 280 }} />

      <Grid container spacing={2.5}>
        {filtered.map(member => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={member._id}>
            <Card sx={{ transition: 'all 0.2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 25px rgb(0 0 0 / 0.1)' } }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ position: 'relative', display: 'inline-block', mb: 1.5 }}>
                  <Avatar sx={{ width: 64, height: 64, fontSize: '1.5rem', bgcolor: 'primary.main', mx: 'auto' }}>{member.name?.[0]}</Avatar>
                  <Box sx={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', backgroundColor: STATUS_COLORS[member.status] || '#94A3B8', border: '2px solid white' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>{member.name}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>{member.jobTitle || 'Team Member'}</Typography>
                {member.department && <Chip label={member.department.name} size="small" sx={{ mb: 1.5, backgroundColor: `${member.department.color}18`, color: member.department.color, fontWeight: 600 }} />}
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap', mb: 1.5 }}>
                  {(member.skills || []).slice(0, 3).map((s, i) => <Chip key={i} label={s.name} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />)}
                  {(member.skills || []).length > 3 && <Chip label={`+${member.skills.length - 3}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />}
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">{t('team.card.performance')}</Typography>
                    <Typography variant="caption" fontWeight={700}>{member.performance?.score || 0}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={member.performance?.score || 0} sx={{ height: 4, borderRadius: 2 }} />
                </Box>
                <Button size="small" variant="outlined" fullWidth onClick={() => setSelectedUser(member)}>{t('team.card.viewProfile')}</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* View Profile Dialog */}
      <Dialog open={Boolean(selectedUser)} onClose={() => setSelectedUser(null)} maxWidth="sm" fullWidth>
        {selectedUser && (<>
          <DialogTitle>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Avatar sx={{ width: 52, height: 52, fontSize: '1.3rem', bgcolor: 'primary.main' }}>{selectedUser.name?.[0]}</Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>{selectedUser.name}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedUser.jobTitle}</Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip label={selectedUser.status} size="small" sx={{ backgroundColor: `${STATUS_COLORS[selectedUser.status]}20`, color: STATUS_COLORS[selectedUser.status], textTransform: 'capitalize', fontWeight: 600 }} />
              <Chip label={selectedUser.email} size="small" variant="outlined" />
              {selectedUser.department && <Chip label={selectedUser.department.name} size="small" />}
            </Box>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>{t('team.card.skills')}</Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
              {(selectedUser.skills || []).map((s, i) => <Chip key={i} label={`${s.name} (${s.level}/5)`} size="small" variant="outlined" />)}
            </Box>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>{t('team.card.performance')}</Typography>
            <Grid container spacing={2}>
              {[
                { labelKey: 'task.detail.subtasks', value: selectedUser.performance?.tasksCompleted || 0 },
                { labelKey: 'task.detail.dueDate', value: `${selectedUser.performance?.onTimeRate || 0}%` },
                { labelKey: 'dashboard.stats.overdueBadge', value: selectedUser.performance?.tasksOverdue || 0 },
                { labelKey: 'dashboard.stats.completionRate', value: `${selectedUser.performance?.score || 0}%` }
              ].map(m => (
                <Grid item xs={6} key={m.labelKey}>
                  <Box sx={{ p: 1.5, backgroundColor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={700}>{m.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{t(m.labelKey, { count: m.value })}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions><Button onClick={() => setSelectedUser(null)}>{t('common.close')}</Button></DialogActions>
        </>)}
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addOpen} onClose={closeDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>Add Team Member</DialogTitle>
        <Box sx={{ px: 3, pt: 1 }}>
          <Tabs value={dialogTab} onChange={(_, v) => setDialogTab(v)}
            sx={{ borderBottom: '1px solid', borderColor: 'divider', '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, minWidth: 0, px: 2 } }}>
            <Tab icon={<PersonAdd sx={{ fontSize: 16 }} />} iconPosition="start" label="Permissions Guide" />
            <Tab icon={<Add sx={{ fontSize: 16 }} />} iconPosition="start" label="Create Member" />
            <Tab icon={<Email sx={{ fontSize: 16 }} />} iconPosition="start" label="Invite by Email" />
          </Tabs>
        </Box>

        <DialogContent sx={{ pt: 2.5 }}>
          {/* Tab 0: Permissions table */}
          {dialogTab === 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Choose the right role when creating a member. Each role controls what they can see and do.
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableBody>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 700, minWidth: 110 }}>Permission</TableCell>
                      {ROLE_LEVELS.map(r => (
                        <TableCell key={r.level} align="center">
                          <Chip label={r.label} size="small" sx={{ bgcolor: r.bg, color: r.color, fontWeight: 700 }} />
                        </TableCell>
                      ))}
                    </TableRow>
                    {Object.keys(ROLE_LEVELS[0].perms).map(perm => (
                      <TableRow key={perm} hover>
                        <TableCell sx={{ fontWeight: 500, fontSize: '0.82rem' }}>{perm}</TableCell>
                        {ROLE_LEVELS.map(r => (
                          <TableCell key={r.level} align="center">
                            <PermIcon val={r.perms[perm]} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary' }}>Summary</TableCell>
                      {ROLE_LEVELS.map(r => (
                        <TableCell key={r.level} sx={{ fontSize: '0.73rem', color: 'text.secondary' }}>{r.desc}</TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
              <Button variant="contained" sx={{ mt: 2.5, bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' }, textTransform: 'none' }}
                onClick={() => setDialogTab(1)}>
                Create New Member →
              </Button>
            </Box>
          )}

          {/* Tab 1: Create new member form */}
          {dialogTab === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Full Name" fullWidth autoFocus value={form.name} onChange={set('name')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Job Title (optional)" fullWidth value={form.jobTitle} onChange={set('jobTitle')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Email Address" type="email" fullWidth value={form.email} onChange={set('email')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Password" type="password" fullWidth value={form.password} onChange={set('password')} helperText="Min 8 characters" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select value={form.department} onChange={set('department')} label="Department">
                    {departments.map(d => (
                      <MenuItem key={d._id} value={d._id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: d.color }} />
                          {d.name}
                          {d.isDefault && (
                            <Chip label="Default" size="small" sx={{ ml: 0.5, height: 16, fontSize: '0.62rem', bgcolor: '#EEF2FF', color: '#6366F1', fontWeight: 700 }} />
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select value={form.roleLevel} onChange={set('roleLevel')} label="Role">
                    {ROLE_LEVELS.map(r => (
                      <MenuItem key={r.level} value={r.level}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: r.color }} />
                          <Typography variant="body2" fontWeight={600}>{r.label}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>— {r.desc}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Role preview */}
              <Grid item xs={12}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: selectedRole.bg, border: `1px solid ${selectedRole.color}30` }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: selectedRole.color }}>
                    {selectedRole.label} permissions:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                    {Object.entries(selectedRole.perms).map(([perm, val]) => (
                      <Chip key={perm} size="small" label={perm}
                        sx={{ fontSize: '0.68rem', height: 20,
                          bgcolor: val === true ? '#DCFCE7' : val === false ? '#FEE2E2' : '#FFF7ED',
                          color: val === true ? '#16A34A' : val === false ? '#DC2626' : '#EA580C' }} />
                    ))}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Tab 2: Invite by email */}
          {dialogTab === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {!inviteLink ? (
                <>
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select value={inviteRoleLevel} onChange={e => setInviteRoleLevel(e.target.value)} label="Role">
                      {ROLE_LEVELS.map(r => (
                        <MenuItem key={r.level} value={r.level}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: r.color, flexShrink: 0 }} />
                            <Box>
                              <Typography fontSize="0.875rem" fontWeight={600}>{r.label}</Typography>
                              <Typography fontSize="0.75rem" color="text.secondary">{r.desc}</Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Email Address" type="email" fullWidth autoFocus
                    value={inviteEmail}
                    onChange={e => { setInviteEmail(e.target.value); setExistingEmailError(false); }}
                    onKeyDown={e => e.key === 'Enter' && handleInvite()}
                    placeholder="example@email.com"
                  />
                  {existingEmailError && (
                    <Box sx={{ p: 2, borderRadius: 2, border: '1.5px solid #FDE68A', bgcolor: '#FFFBEB' }}>
                      <Typography variant="body2" fontWeight={600} color="#92400E" mb={1}>
                        This email already has an account.
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                        Add them directly to your team without creating a new account.
                      </Typography>
                      <Button variant="contained" size="small" onClick={handleAddExisting} disabled={addingExisting}
                        sx={{ bgcolor: '#F59E0B', '&:hover': { bgcolor: '#D97706' }, textTransform: 'none' }}>
                        {addingExisting ? <CircularProgress size={16} color="inherit" /> : 'Add to My Team'}
                      </Button>
                    </Box>
                  )}
                </>
              ) : (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    تم توليد لينك الدعوة لـ <strong>{inviteEmail}</strong> — شاركه عبر واتساب أو إيميل.
                  </Alert>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Invite link (valid 7 days):
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 2, border: '1.5px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {inviteLink}
                    </Typography>
                    <Tooltip title={copied ? 'Copied!' : 'Copy'}>
                      <IconButton size="small" onClick={handleCopy} color={copied ? 'success' : 'default'}>
                        {copied ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={closeDialog} sx={{ textTransform: 'none' }}>{inviteLink ? 'Close' : 'Cancel'}</Button>
          {dialogTab === 1 && (
            <Button variant="contained" onClick={handleCreate}
              disabled={!form.name || !form.email || !form.password || creating}
              sx={{ bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' }, textTransform: 'none', minWidth: 130 }}>
              {creating ? <CircularProgress size={18} color="inherit" /> : 'Create Member'}
            </Button>
          )}
          {dialogTab === 2 && !inviteLink && (
            <Button variant="contained" onClick={handleInvite}
              disabled={!inviteEmail || inviting}
              sx={{ bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' }, textTransform: 'none', minWidth: 130 }}>
              {inviting ? <CircularProgress size={18} color="inherit" /> : 'Generate Link'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
