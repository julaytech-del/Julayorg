import React, { useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import stylisRTLPlugin from 'stylis-plugin-rtl';
import baseTheme from './theme.js';

const ltrCache = createCache({ key: 'muiltr' });
const rtlCache = createCache({ key: 'muirtl', stylisPlugins: [stylisRTLPlugin] });

const darkPalette = {
  mode: 'dark',
  primary: { main: '#818CF8', light: '#A5B4FC', dark: '#6366F1' },
  background: { default: '#0F172A', paper: '#1E293B' },
  text: { primary: '#F1F5F9', secondary: '#94A3B8' },
  divider: 'rgba(255,255,255,0.08)',
};

export default function ThemeWrapper({ children }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const darkMode = useSelector(s => s.ui.darkMode);

  const theme = useMemo(() => createTheme({
    ...baseTheme,
    palette: darkMode ? { ...baseTheme.palette, ...darkPalette } : baseTheme.palette,
    direction: isRTL ? 'rtl' : 'ltr'
  }), [isRTL, darkMode]);

  React.useEffect(() => {
    document.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [isRTL, i18n.language]);

  return (
    <CacheProvider value={isRTL ? rtlCache : ltrCache}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
