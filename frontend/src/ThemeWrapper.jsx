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

export default function ThemeWrapper({ children }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const darkMode = useSelector(s => s.ui.darkMode);

  const theme = useMemo(() => {
    const dark = darkMode;
    return createTheme({
      ...baseTheme,
      palette: dark ? {
        mode: 'dark',
        primary: { main: '#818CF8', light: '#A5B4FC', dark: '#6366F1', contrastText: '#fff' },
        secondary: { main: '#38BDF8', light: '#7DD3FC', dark: '#0284C7', contrastText: '#fff' },
        success: { main: '#10B981', light: '#34D399', dark: '#059669' },
        error: { main: '#F87171', light: '#FCA5A5', dark: '#EF4444' },
        warning: { main: '#FCD34D', light: '#FDE68A', dark: '#F59E0B' },
        background: { default: '#0F172A', paper: '#1E293B' },
        text: { primary: '#F1F5F9', secondary: '#94A3B8' },
        divider: 'rgba(255,255,255,0.08)',
        grey: { 50: '#1E293B', 100: '#334155', 200: '#475569', 300: '#64748B', 400: '#94A3B8', 500: '#CBD5E1', 600: '#E2E8F0', 700: '#F1F5F9', 800: '#F8FAFC', 900: '#FFFFFF' },
      } : baseTheme.palette,
      direction: isRTL ? 'rtl' : 'ltr',
      components: {
        ...baseTheme.components,
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 14,
              boxShadow: dark ? 'none' : '0px 1px 3px rgba(15,23,42,0.06), 0px 1px 2px rgba(15,23,42,0.04)',
              border: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #E2E8F0',
              backgroundImage: 'none',
              backgroundColor: dark ? '#1E293B' : '#FFFFFF',
            }
          }
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: dark ? '#1E293B' : '#FFFFFF',
            }
          }
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              boxShadow: 'none',
              backgroundImage: 'none',
              borderBottom: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #E2E8F0',
              backgroundColor: dark ? '#1E293B' : '#FFFFFF',
            }
          }
        },
        MuiTableHead: {
          styleOverrides: {
            root: {
              '& .MuiTableCell-root': {
                backgroundColor: dark ? '#0F172A' : '#F8FAFC',
                fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: dark ? '#64748B' : '#475569',
                borderBottom: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
              }
            }
          }
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              borderColor: dark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
              padding: '12px 16px', fontSize: '0.875rem',
              color: dark ? '#E2E8F0' : undefined,
            }
          }
        },
        MuiDivider: { styleOverrides: { root: { borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' } } },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: 9,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: dark ? 'rgba(255,255,255,0.12)' : '#E2E8F0', borderWidth: '1.5px' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: dark ? 'rgba(255,255,255,0.25)' : '#CBD5E1' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: dark ? '#818CF8' : '#4F46E5', borderWidth: '1.5px' },
            }
          }
        },
        MuiMenu: {
          styleOverrides: {
            paper: {
              borderRadius: 12,
              border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
              boxShadow: dark ? '0px 8px 24px rgba(0,0,0,0.4)' : '0px 8px 24px rgba(15,23,42,0.1)',
              backgroundColor: dark ? '#1E293B' : '#FFFFFF',
            }
          }
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: 16,
              border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
              backgroundColor: dark ? '#1E293B' : '#FFFFFF',
            }
          }
        },
        MuiChip: {
          styleOverrides: {
            root: { borderRadius: 7, fontWeight: 600, fontSize: '0.75rem' },
            outlined: { borderWidth: '1.5px' }
          }
        },
        MuiButton: { ...baseTheme.components.MuiButton },
        MuiLinearProgress: { ...baseTheme.components.MuiLinearProgress },
        MuiAvatar: { ...baseTheme.components.MuiAvatar },
        MuiTooltip: { ...baseTheme.components.MuiTooltip },
        MuiMenuItem: { ...baseTheme.components.MuiMenuItem },
        MuiTextField: { defaultProps: { size: 'small' } },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: dark ? '#1E293B' : '#FFFFFF',
              borderColor: dark ? 'rgba(255,255,255,0.07)' : '#E2E8F0',
            }
          }
        },
      }
    });
  }, [isRTL, darkMode]);

  React.useEffect(() => {
    document.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
    // Apply dark bg to body
    document.body.style.backgroundColor = darkMode ? '#0F172A' : '';
  }, [isRTL, i18n.language, darkMode]);

  return (
    <CacheProvider value={isRTL ? rtlCache : ltrCache}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
