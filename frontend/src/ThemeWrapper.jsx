import React, { useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import stylisRTLPlugin from 'stylis-plugin-rtl';
import baseTheme from './theme.js';

const ltrCache = createCache({ key: 'muiltr' });
const rtlCache = createCache({ key: 'muirtl', stylisPlugins: [stylisRTLPlugin] });

export default function ThemeWrapper({ children }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const theme = useMemo(() => createTheme({
    ...baseTheme,
    direction: isRTL ? 'rtl' : 'ltr'
  }), [isRTL]);

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
