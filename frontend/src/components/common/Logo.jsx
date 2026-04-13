import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Logo({ size = 36, showText = true, textColor = 'white', sx = {} }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ...sx }}>
      <Box
        component="img"
        src="/logo.png"
        alt="Julay"
        sx={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      />
      {showText && (
        <Typography sx={{ color: textColor, fontWeight: 800, fontSize: size * 0.44, letterSpacing: '-0.02em', lineHeight: 1 }}>
          Julay
        </Typography>
      )}
    </Box>
  );
}
