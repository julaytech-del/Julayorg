import React from 'react';
import { Box } from '@mui/material';

export default function Logo({ size = 36, showText = true, textColor = 'white', sx = {} }) {
  const isOnDark = textColor === 'white';
  return (
    <Box
      component="img"
      src="/julay-logo-full.png"
      alt="Julay.org"
      sx={{
        height: size,
        objectFit: 'contain',
        filter: isOnDark ? 'brightness(0) invert(1)' : 'none',
        ...sx
      }}
    />
  );
}
