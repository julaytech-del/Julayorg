import { createTheme, alpha } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4F46E5', light: '#6366F1', dark: '#3730A3', contrastText: '#fff' },
    secondary: { main: '#0EA5E9', light: '#38BDF8', dark: '#0284C7', contrastText: '#fff' },
    success: { main: '#10B981', light: '#34D399', dark: '#059669' },
    error: { main: '#EF4444', light: '#F87171', dark: '#DC2626' },
    warning: { main: '#F59E0B', light: '#FCD34D', dark: '#D97706' },
    info: { main: '#6366F1' },
    background: { default: '#F1F5F9', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#475569' },
    divider: '#E2E8F0',
    grey: { 50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8', 500: '#64748B', 600: '#475569', 700: '#334155', 800: '#1E293B', 900: '#0F172A' }
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.015em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600, letterSpacing: '-0.005em' },
    subtitle2: { fontWeight: 600, letterSpacing: '-0.005em' },
    body1: { letterSpacing: '-0.005em' },
    body2: { letterSpacing: '-0.005em' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '-0.005em' },
    caption: { letterSpacing: '0em' }
  },
  shape: { borderRadius: 10 },
  shadows: [
    'none',
    '0px 1px 2px rgba(15, 23, 42, 0.06)',
    '0px 1px 3px rgba(15, 23, 42, 0.08), 0px 1px 2px rgba(15, 23, 42, 0.04)',
    '0px 4px 6px -1px rgba(15, 23, 42, 0.08), 0px 2px 4px -1px rgba(15, 23, 42, 0.04)',
    '0px 8px 16px -2px rgba(15, 23, 42, 0.08), 0px 4px 6px -2px rgba(15, 23, 42, 0.04)',
    '0px 12px 24px -4px rgba(15, 23, 42, 0.1), 0px 6px 12px -2px rgba(15, 23, 42, 0.05)',
    '0px 16px 32px -4px rgba(15, 23, 42, 0.1), 0px 8px 16px -4px rgba(15, 23, 42, 0.06)',
    '0px 20px 40px -4px rgba(15, 23, 42, 0.12), 0px 10px 20px -4px rgba(15, 23, 42, 0.06)',
    '0px 24px 48px -6px rgba(15, 23, 42, 0.12), 0px 12px 24px -6px rgba(15, 23, 42, 0.07)',
    '0px 28px 56px -6px rgba(15, 23, 42, 0.14), 0px 14px 28px -6px rgba(15, 23, 42, 0.08)',
    '0px 32px 64px -8px rgba(15, 23, 42, 0.14), 0px 16px 32px -8px rgba(15, 23, 42, 0.08)',
    '0px 36px 72px -8px rgba(15, 23, 42, 0.16), 0px 18px 36px -8px rgba(15, 23, 42, 0.09)',
    '0px 40px 80px -8px rgba(15, 23, 42, 0.16), 0px 20px 40px -8px rgba(15, 23, 42, 0.1)',
    '0px 44px 88px -10px rgba(15, 23, 42, 0.18), 0px 22px 44px -10px rgba(15, 23, 42, 0.1)',
    '0px 48px 96px -10px rgba(15, 23, 42, 0.18), 0px 24px 48px -10px rgba(15, 23, 42, 0.11)',
    '0px 52px 104px -12px rgba(15, 23, 42, 0.2), 0px 26px 52px -12px rgba(15, 23, 42, 0.12)',
    '0px 56px 112px -12px rgba(15, 23, 42, 0.2), 0px 28px 56px -12px rgba(15, 23, 42, 0.12)',
    '0px 60px 120px -14px rgba(15, 23, 42, 0.22), 0px 30px 60px -14px rgba(15, 23, 42, 0.13)',
    '0px 64px 128px -14px rgba(15, 23, 42, 0.22), 0px 32px 64px -14px rgba(15, 23, 42, 0.13)',
    '0px 68px 136px -16px rgba(15, 23, 42, 0.24), 0px 34px 68px -16px rgba(15, 23, 42, 0.14)',
    '0px 72px 144px -16px rgba(15, 23, 42, 0.24), 0px 36px 72px -16px rgba(15, 23, 42, 0.14)',
    '0px 76px 152px -18px rgba(15, 23, 42, 0.26), 0px 38px 76px -18px rgba(15, 23, 42, 0.15)',
    '0px 80px 160px -18px rgba(15, 23, 42, 0.26), 0px 40px 80px -18px rgba(15, 23, 42, 0.15)',
    '0px 84px 168px -20px rgba(15, 23, 42, 0.28), 0px 42px 84px -20px rgba(15, 23, 42, 0.16)',
    '0px 88px 176px -20px rgba(15, 23, 42, 0.28), 0px 44px 88px -20px rgba(15, 23, 42, 0.16)'
  ],
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.06), 0px 1px 2px rgba(15, 23, 42, 0.04)',
          border: '1px solid #E2E8F0',
          backgroundImage: 'none'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 9, fontWeight: 600, letterSpacing: '-0.005em' },
        contained: {
          boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.08)',
          '&:hover': { boxShadow: '0px 4px 8px rgba(15, 23, 42, 0.12)' }
        },
        outlined: { borderWidth: '1.5px', '&:hover': { borderWidth: '1.5px' } }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 7, fontWeight: 600, fontSize: '0.75rem' },
        outlined: { borderWidth: '1.5px' }
      }
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 9,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0', borderWidth: '1.5px' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4F46E5', borderWidth: '1.5px' }
        }
      }
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          backgroundImage: 'none',
          borderBottom: '1px solid #E2E8F0'
        }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 99, backgroundColor: '#E2E8F0' },
        bar: { borderRadius: 99 }
      }
    },
    MuiDivider: { styleOverrides: { root: { borderColor: '#E2E8F0' } } },
    MuiAvatar: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: '0.8rem' }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { borderRadius: 8, fontSize: '0.75rem', fontWeight: 500, backgroundColor: '#0F172A', padding: '6px 10px' }
      }
    },
    MuiMenu: {
      styleOverrides: {
        paper: { borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0px 8px 24px rgba(15, 23, 42, 0.1)' }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { borderRadius: 7, margin: '2px 6px', padding: '7px 10px', fontSize: '0.875rem' }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, boxShadow: '0px 24px 48px rgba(15, 23, 42, 0.16)', border: '1px solid #E2E8F0' }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: { '& .MuiTableCell-root': { backgroundColor: '#F8FAFC', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', borderBottom: '1px solid #E2E8F0' } }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#F1F5F9', padding: '12px 16px', fontSize: '0.875rem' }
      }
    }
  }
});

export default theme;
