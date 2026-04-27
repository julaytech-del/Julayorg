import React, { useEffect, useState } from 'react';
import { Box, Button, Snackbar, Alert, IconButton } from '@mui/material';
import { Close, GetApp, PhoneAndroid } from '@mui/icons-material';

export default function InstallApp() {
  const [pwaPrompt, setPwaPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(standalone);
    if (standalone) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    const handler = (e) => {
      e.preventDefault();
      setPwaPrompt(e);
      setTimeout(() => setShowBanner(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Show iOS banner after delay
    if (ios) setTimeout(() => setShowBanner(true), 3000);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (pwaPrompt) {
      pwaPrompt.prompt();
      const { outcome } = await pwaPrompt.userChoice;
      if (outcome === 'accepted') setShowBanner(false);
    }
  };

  if (isStandalone) return null;

  return (
    <Snackbar
      open={showBanner}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ mb: 2 }}
    >
      <Alert
        severity="info"
        icon={<PhoneAndroid />}
        sx={{
          bgcolor: '#1e293b',
          color: '#e2e8f0',
          border: '1px solid #6366f1',
          borderRadius: 3,
          '& .MuiAlert-icon': { color: '#6366f1' },
          alignItems: 'center',
          minWidth: 300,
        }}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {!isIOS && pwaPrompt && (
              <Button
                size="small"
                variant="contained"
                startIcon={<GetApp />}
                onClick={handleInstall}
                sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                تثبيت
              </Button>
            )}
            <IconButton size="small" onClick={() => setShowBanner(false)} sx={{ color: '#94a3b8' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        {isIOS
          ? 'ثبّت التطبيق: اضغط Share ثم "Add to Home Screen"'
          : 'ثبّت Julay كتطبيق على جهازك'}
      </Alert>
    </Snackbar>
  );
}
