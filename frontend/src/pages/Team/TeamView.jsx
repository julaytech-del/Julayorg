import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, Chip, Button, TextField, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, CircularProgress } from '@mui/material';
import { Search, Group, TrendingUp, EmojiEvents } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { usersAPI } from '../../services/api.js';
import { format } from 'date-fns';

const STATUS_COLORS = { active: '#10B981', inactive: '#94A3B8', busy: '#F59E0B', away: '#3B82F6' };

export default function TeamView() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    usersAPI.getAll().then(res => { setUsers(res.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.jobTitle?.toLowerCase().includes(search.toLowerCase()));
  const avgPerf = users.length ? Math.round(users.reduce((sum, u) => sum + (u.performance?.score || 0), 0) / users.length) : 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>{t('team.title')}</Typography>
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
    </Box>
  );
}
