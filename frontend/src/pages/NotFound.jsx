import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', background: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 3, px: 2, textAlign: 'center' }}>
      <Box sx={{ width: 56, height: 56, borderRadius: 2.5, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
        <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>J</Typography>
      </Box>
      <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '5rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em' }}>404</Typography>
      <Typography sx={{ color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>Page not found</Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', maxWidth: 360 }}>
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
        <Button onClick={() => navigate(-1)} variant="outlined"
          sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontWeight: 600, px: 3, py: 1.25, borderRadius: 2, '&:hover': { borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)' } }}>
          Go back
        </Button>
        <Button onClick={() => navigate('/')} variant="contained"
          sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', fontWeight: 700, px: 3, py: 1.25, borderRadius: 2, '&:hover': { opacity: 0.9 } }}>
          Home
        </Button>
      </Box>
    </Box>
  );
}
