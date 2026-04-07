import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material';
import { Add, Edit, Delete, Business } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { departmentsAPI } from '../../services/api.js';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';

export default function DepartmentsView() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [departments, setDepartments] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366F1' });

  const COLORS = ['#6366F1','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#EC4899','#14B8A6'];

  const load = () => departmentsAPI.getAll().then(res => setDepartments(res.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleOpen = (dept = null) => {
    setEditing(dept);
    setForm(dept ? { name: dept.name, description: dept.description || '', color: dept.color || '#6366F1' } : { name: '', description: '', color: '#6366F1' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) await departmentsAPI.update(editing._id, form);
      else await departmentsAPI.create(form);
      dispatch(showSnackbar({ message: editing ? t('departments.form.save') : t('departments.form.create') }));
      setDialogOpen(false);
      load();
    } catch { dispatch(showSnackbar({ message: t('errors.generic'), severity: 'error' })); }
  };

  const handleDelete = async () => {
    try {
      await departmentsAPI.delete(deleteTarget._id);
      dispatch(showSnackbar({ message: t('departments.delete'), severity: 'info' }));
      setDeleteTarget(null);
      load();
    } catch { dispatch(showSnackbar({ message: t('errors.generic'), severity: 'error' })); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>{t('departments.title')}</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>{t('departments.new')}</Button>
      </Box>

      <Grid container spacing={2.5}>
        {departments.map(dept => (
          <Grid item xs={12} sm={6} md={4} key={dept._id}>
            <Card>
              <Box sx={{ height: 6, backgroundColor: dept.color || '#6366F1', borderRadius: '12px 12px 0 0' }} />
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: `${dept.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Business sx={{ color: dept.color, fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>{dept.name}</Typography>
                      <Chip label={t('departments.members', { count: dept.memberCount || 0 })} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleOpen(dept)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setDeleteTarget(dept)} color="error"><Delete fontSize="small" /></IconButton>
                  </Box>
                </Box>
                {dept.description && <Typography variant="body2" color="text.secondary" mb={1.5}>{dept.description}</Typography>}
                {dept.head && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: dept.color }}>{dept.head.name?.[0]}</Avatar>
                    <Typography variant="caption" color="text.secondary">{t('departments.head', { name: dept.head.name })}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
        {departments.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Business sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
              <Typography color="text.secondary">{t('common.noData')}</Typography>
              <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => handleOpen()}>{t('departments.form.create')}</Button>
            </Box>
          </Grid>
        )}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>{editing ? t('departments.edit') : t('departments.new')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label={t('departments.form.name')} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required fullWidth />
          <TextField label={t('departments.form.description')} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} multiline rows={2} fullWidth />
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>{t('departments.form.color')}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {COLORS.map(c => <Box key={c} onClick={() => setForm(p => ({ ...p, color: c }))} sx={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: c, cursor: 'pointer', border: form.color === c ? '3px solid #1E293B' : '2px solid transparent', transition: 'all 0.1s' }} />)}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>{t('departments.form.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name.trim()}>
            {editing ? t('departments.form.save') : t('departments.form.create')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('departments.delete') + ' ' + (deleteTarget?.name || '')}
        message={`${t('departments.delete')} "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
