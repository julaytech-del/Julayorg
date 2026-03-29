import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function LoadingSpinner({ message = 'Loading...', size = 40, fullPage = false }) {
  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 4 }}>
      <CircularProgress size={size} />
      {message && <Typography color="text.secondary" variant="body2">{message}</Typography>}
    </Box>
  );
  if (fullPage) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>{content}</Box>;
  return content;
}
