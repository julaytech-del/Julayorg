import React, { useState, useMemo, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, IconButton, Chip, Divider, Tooltip, Alert } from '@mui/material';
import { WhatsApp, OpenInNew, CheckCircle, ContentCopy, PlayArrow } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'julay_wa_broadcast';
const WA_GREEN = '#25D366';

// digits only (drop +, spaces, dashes) — wa.me wants the full international number
const toDigits = (s) => (s || '').replace(/[^\d]/g, '');

export default function WhatsAppBroadcast() {
  const { t } = useTranslation();

  const [raw, setRaw]         = useState('');
  const [message, setMessage] = useState('');
  const [opened, setOpened]   = useState(() => new Set());
  const [seqIndex, setSeqIndex] = useState(0);

  // persist locally
  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); if (s.raw) setRaw(s.raw); if (s.message) setMessage(s.message); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ raw, message })); } catch { /* ignore */ }
  }, [raw, message]);

  const numbers = useMemo(() => {
    const seen = new Set(); const out = [];
    raw.split(/[\n,;]+/).map(x => toDigits(x)).forEach(d => {
      if (d.length >= 8 && !seen.has(d)) { seen.add(d); out.push(d); }
    });
    return out;
  }, [raw]);

  const link = (num) => `https://wa.me/${num}?text=${encodeURIComponent(message)}`;

  const openOne = (num) => {
    window.open(link(num), '_blank', 'noopener');
    setOpened(prev => new Set(prev).add(num));
  };

  const openNext = () => {
    if (seqIndex >= numbers.length) return;
    openOne(numbers[seqIndex]);
    setSeqIndex(i => i + 1);
  };

  const copyMessage = () => { try { navigator.clipboard.writeText(message); } catch { /* ignore */ } };

  const ready = numbers.length > 0 && message.trim().length > 0;

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto', width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <WhatsApp sx={{ color: WA_GREEN }} />
        <Typography variant="h5" fontWeight={700}>{t('whatsapp.title')}</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t('whatsapp.subtitle')}</Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* Left: inputs */}
        <Paper variant="outlined" sx={{ flex: '1 1 420px', p: 2.5, borderRadius: 3 }}>
          <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{t('whatsapp.numbers')}</Typography>
          <Typography variant="caption" color="text.secondary">{t('whatsapp.numbersHelp')}</Typography>
          <TextField
            fullWidth multiline minRows={6} maxRows={12} sx={{ mt: 1 }}
            placeholder={"+966501234567\n+971501234567\n+201001234567"}
            value={raw} onChange={e => setRaw(e.target.value)}
          />
          <Chip size="small" sx={{ mt: 1 }} color={numbers.length ? 'success' : 'default'} label={t('whatsapp.valid', { count: numbers.length })} />

          <Typography sx={{ fontWeight: 700, mt: 2.5, mb: 0.5 }}>{t('whatsapp.message')}</Typography>
          <TextField
            fullWidth multiline minRows={4} maxRows={10}
            placeholder={t('whatsapp.messagePlaceholder')}
            value={message} onChange={e => setMessage(e.target.value)}
          />
          <Button size="small" startIcon={<ContentCopy sx={{ fontSize: 16 }} />} onClick={copyMessage} disabled={!message.trim()} sx={{ mt: 1, textTransform: 'none' }}>
            {t('whatsapp.copyMessage')}
          </Button>
        </Paper>

        {/* Right: recipients */}
        <Paper variant="outlined" sx={{ flex: '1 1 380px', p: 2.5, borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ fontWeight: 700 }}>{t('whatsapp.recipients')}</Typography>
            <Button
              variant="contained" size="small" startIcon={<PlayArrow />}
              disabled={!ready || seqIndex >= numbers.length}
              onClick={openNext}
              sx={{ bgcolor: WA_GREEN, textTransform: 'none', '&:hover': { bgcolor: '#1EBE5D' } }}
            >
              {seqIndex === 0 ? t('whatsapp.startSequence')
                : seqIndex >= numbers.length ? t('whatsapp.done')
                : `${t('whatsapp.next')} (${seqIndex + 1}/${numbers.length})`}
            </Button>
          </Box>
          <Alert severity="info" sx={{ mb: 1.5, py: 0.25, fontSize: '0.78rem' }}>{t('whatsapp.note')}</Alert>

          <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 460 }}>
            {numbers.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 4, fontSize: '0.85rem' }}>{t('whatsapp.empty')}</Typography>
            ) : numbers.map((num, i) => (
              <Box key={num} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ width: 24, color: 'text.secondary', fontSize: '0.8rem' }}>{i + 1}.</Typography>
                <Typography sx={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}>+{num}</Typography>
                {opened.has(num) && <Tooltip title={t('whatsapp.opened')}><CheckCircle sx={{ fontSize: 17, color: WA_GREEN }} /></Tooltip>}
                <Tooltip title={t('whatsapp.open')}>
                  <span>
                    <IconButton size="small" disabled={!message.trim()} onClick={() => openOne(num)} sx={{ color: WA_GREEN }}>
                      <OpenInNew sx={{ fontSize: 18 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
