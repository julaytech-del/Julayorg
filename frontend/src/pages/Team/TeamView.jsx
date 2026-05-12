import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, Chip, Button, TextField, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, CircularProgress, FormControl, InputLabel, Select, MenuItem, Tabs, Tab, Autocomplete } from '@mui/material';
import { Search, Group, TrendingUp, EmojiEvents, PersonAdd, Add } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import api, { usersAPI } from '../../services/api.js';

const STATUS_COLORS = { active: '#10B981', inactive: '#94A3B8', busy: '#F59E0B', away: '#3B82F6' };

export default function TeamView() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Add member dialog
  const [addOpen, setAddOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', password: '', jobTitle: '' });
  const [creating, setCreating] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    usersAPI.getAll()
      .then(res => setUsers(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const closeDialog = () => {
    setAddOpen(false);
    setForm({ name: '', email: '', password: '', jobTitle: '' });
    setDialogTab(0);
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      dispatch(showSnackbar({ message: 'Name, email, and password are required', severity: 'warning' }));
      return;
    }
    setCreating(true);
    try {
      await api.post('/users', form);
      dispatch(showSnackbar({ message: `${form.name} added to team!`, severity: 'success' }));
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
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, backgroundColor: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {React.cloneElement(s.icon, { sx: { color: s.color } })}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">{t(s.labelKey)}</Typography>
                  <Typography variant="h5" fontWeight={700}>{s.value}</Typography>
                </Box>
              </CardContent>
            </Card>
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
        {selectedUser && (
          <>
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
                {(selectedUser.skills || []).map((s, i) => (
                  <Chip key={i} label={`${s.name} (${s.level}/5)`} size="small" variant="outlined" />
                ))}
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
          </>
        )}
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addOpen} onClose={closeDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>Add Team Member</DialogTitle>
        <Box sx={{ px: 3, pt: 1 }}>
          <Tabs value={dialogTab} onChange={(_, v) => setDialogTab(v)}
            sx={{ borderBottom: '1px solid', borderColor: 'divider', '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, minWidth: 0, px: 2 } }}>
            <Tab icon={<PersonAdd sx={{ fontSize: 16 }} />} iconPosition="start" label="Existing Member" />
            <Tab icon={<Add sx={{ fontSize: 16 }} />} iconPosition="start" label="Create New Member" />
          </Tabs>
        </Box>

        <DialogContent sx={{ pt: 2.5 }}>
          {/* Tab 0: pick from existing org users (already registered but maybe not shown?) */}
          {dialogTab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                All registered members in your org are already shown in the team list above.
                Use <strong>Create New Member</strong> to add someone new.
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                {users.map(u => (
                  <Box key={u._id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.82rem', bgcolor: '#6366F1' }}>{u.name?.[0]?.toUpperCase()}</Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{u.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                    </Box>
                    <Chip label={u.status || 'active'} size="small" sx={{ ml: 'auto' }}
                      color={u.status === 'active' ? 'success' : 'default'} />
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Tab 1: Create new user */}
          {dialogTab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Create a new account. They can log in immediately with these credentials.
              </Typography>
              <TextField label="Full Name" fullWidth autoFocus
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <TextField label="Email Address" type="email" fullWidth
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <TextField label="Password" type="password" fullWidth
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                helperText="At least 8 characters" />
              <TextField label="Job Title (optional)" fullWidth
                value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={closeDialog} sx={{ textTransform: 'none' }}>Cancel</Button>
          {dialogTab === 1 && (
            <Button variant="contained" onClick={handleCreate}
              disabled={!form.name || !form.email || !form.password || creating}
              sx={{ bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' }, textTransform: 'none', minWidth: 120 }}>
              {creating ? <CircularProgress size={18} color="inherit" /> : 'Create Member'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
