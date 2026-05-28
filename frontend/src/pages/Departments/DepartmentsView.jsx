import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, CircularProgress, Skeleton, Divider, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { Add, Edit, Delete, Business, PhotoCamera, People } from '@mui/icons-material';
import api from '../../services/api.js';

// Module-level cache: survives re-renders and re-navigation within the same session
let _deptCache = null;
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { departmentsAPI } from '../../services/api.js';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import { patchUserDepartment } from '../../store/slices/authSlice.js';
import { useSelector } from 'react-redux';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';

export default function DepartmentsView() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const currentUser = useSelector(s => s.auth.user);
  const { canManageDepartment } = usePermissions();
  const [departments, setDepartments] = useState(_deptCache || []);
  const [loading, setLoading] = useState(!_deptCache);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366F1', logo: '' });
  const [uploading, setUploading] = useState(false);
  const [membersDialogDept, setMembersDialogDept] = useState(null);
  const [deptMembers, setDeptMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const MAX_LOGO_SIZE = 200; // px — resize before saving as base64
  const [logoPreview, setLogoPreview] = useState('');

  const COLORS = ['#6366F1','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#EC4899','#14B8A6'];
  const UPLOAD_INPUT_ID = 'dept-logo-file-input';

  const load = async () => {
    try {
      const res = await departmentsAPI.getAll();
      const data = res.data || [];
      _deptCache = data;
      setDepartments(data);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleOpen = (dept = null) => {
    setEditing(dept);
    setForm(dept
      ? { name: dept.name, description: dept.description || '', color: dept.color || '#6366F1', logo: dept.logo || '' }
      : { name: '', description: '', color: '#6366F1', logo: '' }
    );
    setLogoPreview(dept?.logo || '');
    setDialogOpen(true);
  };

  const resizeToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const size = MAX_LOGO_SIZE;
        const ratio = Math.min(size / img.width, size / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/webp', 0.85));
      };
      img.onerror = reject;
      img.src = reader.result; // data: URL allowed by CSP
    };
    reader.readAsDataURL(file);
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await resizeToBase64(file);
      setLogoPreview(base64);
      setForm(p => ({ ...p, logo: base64 }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to read image', severity: 'error' }));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    try {
      if (editing) await departmentsAPI.update(editing._id, form);
      else await departmentsAPI.create(form);
      dispatch(showSnackbar({ message: editing ? t('departments.form.save') : t('departments.form.create') }));
      setDialogOpen(false);
      load();
      // If user belongs to this department, update Redux immediately (no async roundtrip)
      const userDeptId = currentUser?.department?._id || currentUser?.department;
      if (editing && String(userDeptId) === String(editing._id)) {
        dispatch(patchUserDepartment({ name: form.name, color: form.color, logo: form.logo }));
      }
    } catch (err) {
      const msg = err?.response?.status === 403
        ? 'You need Manager or Admin role to manage departments.'
        : t('errors.generic');
      dispatch(showSnackbar({ message: msg, severity: 'error' }));
    }
  };

  const openMembers = async (dept) => {
    setMembersDialogDept(dept);
    setDeptMembers([]);
    setLoadingMembers(true);
    try {
      const res = await api.get('/users');
      const all = res.data?.data || res.data || [];
      setDeptMembers(all.filter(u => {
        const dId = u.department?._id || u.department;
        return dId && String(dId) === String(dept._id);
      }));
    } catch {}
    setLoadingMembers(false);
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
      {/*
        File input lives OUTSIDE the MUI Dialog portal so programmatic
        clicks work reliably across all browsers.
      */}
      <input
        id={UPLOAD_INPUT_ID}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleLogoUpload}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>{t('departments.title')}</Typography>
        {canManageDepartment && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>{t('departments.new')}</Button>
        )}
      </Box>

      <Grid container spacing={2.5}>
        {loading && [1,2,3].map(i => (
          <Grid item xs={12} sm={6} md={4} key={`sk-${i}`}>
            <Card>
              <Skeleton variant="rectangular" height={6} sx={{ borderRadius: '12px 12px 0 0' }} />
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                  <Skeleton variant="rounded" width={40} height={40} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={22} />
                    <Skeleton variant="text" width="40%" height={18} />
                  </Box>
                </Box>
                <Skeleton variant="text" width="80%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
        {!loading && departments.map(dept => (
          <Grid item xs={12} sm={6} md={4} key={dept._id}>
            <Card>
              <Box sx={{ height: 6, backgroundColor: dept.color || '#6366F1', borderRadius: '12px 12px 0 0' }} />
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Avatar
                      src={dept.logo || undefined}
                      sx={{ width: 40, height: 40, borderRadius: 2, backgroundColor: `${dept.color}18`, border: `1px solid ${dept.color}30` }}
                    >
                      {!dept.logo && <Business sx={{ color: dept.color, fontSize: 22 }} />}
                    </Avatar>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: dept.color }}>{dept.head.name?.[0]}</Avatar>
                    <Typography variant="caption" color="text.secondary">{t('departments.head', { name: dept.head.name })}</Typography>
                  </Box>
                )}
                <Button
                  size="small" variant="outlined" fullWidth startIcon={<People sx={{ fontSize: 14 }} />}
                  onClick={() => openMembers(dept)}
                  sx={{ borderColor: `${dept.color}40`, color: dept.color, '&:hover': { borderColor: dept.color, bgcolor: `${dept.color}10` }, textTransform: 'none', fontSize: '0.78rem' }}
                >
                  View Members
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {!loading && departments.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Business sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
              <Typography color="text.secondary">{t('common.noData')}</Typography>
              {canManageDepartment && (
                <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => handleOpen()}>{t('departments.form.create')}</Button>
              )}
            </Box>
          </Grid>
        )}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>{editing ? t('departments.edit') : t('departments.new')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>

          {/* Logo upload — label wraps Avatar, htmlFor links to input OUTSIDE portal */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Box sx={{ position: 'relative' }}>
              <label htmlFor={UPLOAD_INPUT_ID} style={{ cursor: uploading ? 'wait' : 'pointer', display: 'block' }}>
                <Avatar
                  src={logoPreview || undefined}
                  sx={{ width: 80, height: 80, borderRadius: 3, backgroundColor: `${form.color}18`, border: `2px solid ${form.color}40` }}
                >
                  {!logoPreview && <Business sx={{ color: form.color, fontSize: 36 }} />}
                </Avatar>
              </label>
              <Box
                component="label"
                htmlFor={UPLOAD_INPUT_ID}
                sx={{
                  position: 'absolute', bottom: -6, right: -6,
                  width: 26, height: 26, borderRadius: '50%',
                  backgroundColor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: uploading ? 'wait' : 'pointer', boxShadow: 2,
                }}
              >
                {uploading
                  ? <CircularProgress size={14} sx={{ color: '#fff' }} />
                  : <PhotoCamera sx={{ color: '#fff', fontSize: 14 }} />
                }
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {uploading ? 'Uploading…' : 'Click to upload logo'}
            </Typography>
          </Box>

          <TextField label={t('departments.form.name')} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required fullWidth />
          <TextField label={t('departments.form.description')} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} multiline rows={2} fullWidth />
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>{t('departments.form.color')}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {COLORS.map(c => (
                <Box key={c} onClick={() => setForm(p => ({ ...p, color: c }))} sx={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: c, cursor: 'pointer', border: form.color === c ? '3px solid #1E293B' : '2px solid transparent', transition: 'all 0.1s' }} />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>{t('departments.form.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name.trim() || uploading}>
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

      {/* Members Dialog */}
      <Dialog open={Boolean(membersDialogDept)} onClose={() => setMembersDialogDept(null)} maxWidth="xs" fullWidth>
        {membersDialogDept && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${membersDialogDept.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Business sx={{ color: membersDialogDept.color, fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>{membersDialogDept.name}</Typography>
                <Typography variant="caption" color="text.secondary">{deptMembers.length} member{deptMembers.length !== 1 ? 's' : ''}</Typography>
              </Box>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 0 }}>
              {loadingMembers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={28} sx={{ color: membersDialogDept.color }} />
                </Box>
              ) : deptMembers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <People sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No members in this department</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {deptMembers.map((u, i) => (
                    <React.Fragment key={u._id}>
                      {i > 0 && <Divider component="li" />}
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar src={u.avatar || undefined} sx={{ bgcolor: membersDialogDept.color, width: 36, height: 36, fontSize: '0.85rem' }}>
                            {!u.avatar && u.name?.[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600}>{u.name}</Typography>}
                          secondary={<Typography variant="caption" color="text.secondary">{u.jobTitle || u.role?.label || 'Member'}</Typography>}
                        />
                        <Chip label={u.status || 'active'} size="small"
                          sx={{ fontSize: '0.65rem', height: 20, textTransform: 'capitalize',
                            bgcolor: u.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)',
                            color: u.status === 'active' ? '#10B981' : '#94A3B8' }} />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setMembersDialogDept(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
