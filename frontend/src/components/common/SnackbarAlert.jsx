import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { hideSnackbar } from '../../store/slices/uiSlice.js';

export default function SnackbarAlert() {
  const dispatch = useDispatch();
  const { open, message, severity } = useSelector(s => s.ui.snackbar);
  return (
    <Snackbar open={open} autoHideDuration={4000} onClose={() => dispatch(hideSnackbar())} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Alert severity={severity} onClose={() => dispatch(hideSnackbar())} variant="filled" sx={{ borderRadius: 2 }}>{message}</Alert>
    </Snackbar>
  );
}
