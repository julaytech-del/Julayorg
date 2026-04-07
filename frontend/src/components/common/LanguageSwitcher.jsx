import React, { useState } from 'react';
import { Box, Menu, MenuItem, Typography, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Language } from '@mui/icons-material';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt-BR', label: 'Português (BR)', flag: '🇧🇷' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [anchor, setAnchor] = useState(null);
  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  return (
    <>
      <Tooltip title="Language / اللغة / Langue">
        <Box
          onClick={e => setAnchor(e.currentTarget)}
          sx={{
            display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer',
            px: 1.25, py: 0.6, borderRadius: 2,
            border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC',
            '&:hover': { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
            transition: 'all 0.15s', userSelect: 'none'
          }}
        >
          <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>{current.flag}</Typography>
          <Typography variant="caption" fontWeight={700} sx={{ color: '#475569', fontSize: '0.75rem' }}>
            {current.code.toUpperCase()}
          </Typography>
        </Box>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { mt: 0.75, minWidth: 160 } }}
      >
        {LANGUAGES.map(lang => (
          <MenuItem
            key={lang.code}
            onClick={() => { i18n.changeLanguage(lang.code); setAnchor(null); }}
            selected={i18n.language === lang.code}
            sx={{ gap: 1.5, '&.Mui-selected': { backgroundColor: '#EEF2FF', color: '#4F46E5' } }}
          >
            <Typography sx={{ fontSize: '1rem' }}>{lang.flag}</Typography>
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem' }}>{lang.label}</Typography>
            </Box>
            {i18n.language === lang.code && (
              <Box sx={{ ml: 'auto', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4F46E5' }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
