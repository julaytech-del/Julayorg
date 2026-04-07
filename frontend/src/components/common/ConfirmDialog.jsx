import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { Warning } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel, confirmColor = 'error' }) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning color="warning" /> {title || t('common.confirm')}
      </DialogTitle>
      <DialogContent>
        <Typography>{message || t('common.confirm')}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} variant="outlined">{t('common.cancel')}</Button>
        <Button onClick={onConfirm} variant="contained" color={confirmColor}>{confirmLabel || t('common.delete')}</Button>
      </DialogActions>
    </Dialog>
  );
}
