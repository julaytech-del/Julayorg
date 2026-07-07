import React from 'react';
import { Box, Paper, Typography, Chip, Stack } from '@mui/material';
import { WhatsApp, RocketLaunch, VerifiedUser } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const WA_GREEN = '#25D366';

/**
 * Temporary "Coming Soon" screen for the WhatsApp menu item.
 * Shown while the Meta / WhatsApp Business (Tech Provider) verification is pending.
 *
 * To restore the real broadcast page: in src/App.jsx swap the `whatsapp` route
 * element back to <WhatsAppBroadcast /> (see comment there).
 */
export default function WhatsAppComingSoon() {
  const { i18n } = useTranslation();
  const ar = (i18n.language || 'ar').startsWith('ar');

  const txt = ar
    ? {
        badge: 'قريباً',
        title: 'ميزة واتساب على وشك الإطلاق',
        subtitle:
          'عم نجهّز ربط WhatsApp Business الرسمي حتى تقدر كل الأعمال تربط رقمها وتبعت لجمهورها بكبسة وحدة — بأمان ومن غير خطر حظر.',
        chips: ['ربط رقمك بكبسة', 'إرسال جماعي بالقوالب', 'API رسمي معتمد من Meta'],
        note: 'المنصة قيد المراجعة النهائية من Meta. رح تكون جاهزة خلال أيام.',
      }
    : {
        badge: 'Coming soon',
        title: 'WhatsApp is almost here',
        subtitle:
          'We are setting up the official WhatsApp Business integration so every business can connect its own number and reach its audience in one click — safely, with no ban risk.',
        chips: ['One-click number connect', 'Bulk sending via templates', 'Official Meta-approved API'],
        note: 'The platform is in final review with Meta. It will be ready within days.',
      };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 140px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 560,
          width: '100%',
          textAlign: 'center',
          p: { xs: 4, sm: 6 },
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F5FFF9 100%)',
        }}
      >
        <Box
          sx={{
            width: 88,
            height: 88,
            mx: 'auto',
            mb: 3,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${WA_GREEN}1A`,
            animation: 'waPulse 2.4s ease-in-out infinite',
            '@keyframes waPulse': {
              '0%,100%': { boxShadow: `0 0 0 0 ${WA_GREEN}33` },
              '50%': { boxShadow: `0 0 0 16px ${WA_GREEN}00` },
            },
          }}
        >
          <WhatsApp sx={{ fontSize: 48, color: WA_GREEN }} />
        </Box>

        <Chip
          icon={<RocketLaunch sx={{ fontSize: 16 }} />}
          label={txt.badge}
          sx={{
            mb: 2,
            fontWeight: 700,
            bgcolor: `${WA_GREEN}1A`,
            color: '#0B7A43',
            '& .MuiChip-icon': { color: '#0B7A43' },
          }}
        />

        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary' }}>
          {txt.title}
        </Typography>

        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.8 }}>
          {txt.subtitle}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          justifyContent="center"
          sx={{ mb: 3 }}
        >
          {txt.chips.map((c) => (
            <Chip key={c} label={c} variant="outlined" sx={{ fontWeight: 600 }} />
          ))}
        </Stack>

        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: 2,
            bgcolor: 'grey.50',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <VerifiedUser sx={{ fontSize: 18, color: WA_GREEN }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {txt.note}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
