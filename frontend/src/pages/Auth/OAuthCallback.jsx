import { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';

export default function OAuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (window.opener) {
      window.opener.postMessage({ type: 'GOOGLE_OAUTH_CALLBACK', code, state, error }, window.location.origin);
      window.close();
    }
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress sx={{ color: '#6366F1' }} />
    </Box>
  );
}
