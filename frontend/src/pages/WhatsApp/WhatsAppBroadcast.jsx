import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, IconButton, Chip, Tooltip, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, CircularProgress, Divider, Collapse,
} from '@mui/material';
import { WhatsApp, OpenInNew, CheckCircle, ContentCopy, PlayArrow, Bolt, LinkOff, Send } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { whatsappAPI } from '../../services/api.js';

const STORAGE_KEY = 'julay_wa_broadcast';
const WA_GREEN = '#25D366';
const toDigits = (s) => (s || '').replace(/[^\d]/g, '');

export default function WhatsAppBroadcast() {
  const { t } = useTranslation();
  const isAdmin = useSelector(s => s.auth.user?.isAdmin);

  const [raw, setRaw]         = useState('');
  const [message, setMessage] = useState('');
  const [opened, setOpened]   = useState(() => new Set());
  const [seqIndex, setSeqIndex] = useState(0);

  // API connection
  const [config, setConfig]   = useState({ connected: false });
  const [templates, setTemplates] = useState([]);
  const [tpl, setTpl]         = useState('');        // selected template name
  const [tplLang, setTplLang] = useState('en_US');
  const [tplVars, setTplVars] = useState('');        // comma-separated variables
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState(null);

  // connect dialog
  const [dlg, setDlg]         = useState(false);
  const [form, setForm]       = useState({ phoneNumberId: '', accessToken: '', wabaId: '' });
  const [saving, setSaving]   = useState(false);
  const [testMsg, setTestMsg] = useState(null);

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); if (s.raw) setRaw(s.raw); if (s.message) setMessage(s.message); } catch { /* ignore */ }
    loadConfig();
  }, []);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ raw, message })); } catch { /* ignore */ } }, [raw, message]);

  const loadConfig = async () => {
    try {
      const r = await whatsappAPI.getConfig();
      setConfig(r.data || { connected: false });
      if (r.data?.connected) loadTemplates();
    } catch { /* ignore */ }
  };
  const loadTemplates = async () => { try { const r = await whatsappAPI.getTemplates(); setTemplates(r.data || []); } catch { /* ignore */ } };

  const numbers = useMemo(() => {
    const seen = new Set(); const out = [];
    raw.split(/[\n,;]+/).map(x => toDigits(x)).forEach(d => { if (d.length >= 8 && !seen.has(d)) { seen.add(d); out.push(d); } });
    return out;
  }, [raw]);

  const link = (num) => `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  const openOne = (num) => { window.open(link(num), '_blank', 'noopener'); setOpened(prev => new Set(prev).add(num)); };
  const openNext = () => { if (seqIndex >= numbers.length) return; openOne(numbers[seqIndex]); setSeqIndex(i => i + 1); };
  const copyMessage = () => { try { navigator.clipboard.writeText(message); } catch { /* ignore */ } };

  // ── Connect ──
  const saveConfig = async () => {
    setSaving(true); setTestMsg(null);
    try {
      await whatsappAPI.saveConfig(form);
      const test = await whatsappAPI.test();
      setTestMsg({ ok: true, text: `${test.data?.name || ''} ${test.data?.displayPhone || ''}`.trim() });
      await loadConfig();
      setTimeout(() => setDlg(false), 900);
    } catch (e) { setTestMsg({ ok: false, text: e?.message || 'Failed' }); }
    setSaving(false);
  };
  const disconnect = async () => { try { await whatsappAPI.disconnect(); setConfig({ connected: false }); setTemplates([]); } catch { /* ignore */ } };

  // ── Auto send ──
  const sendAll = async () => {
    if (!numbers.length) return;
    setSending(true); setResult(null);
    try {
      const payload = { numbers };
      if (tpl) payload.template = { name: tpl, language: tplLang, variables: tplVars.split(',').map(s => s.trim()).filter(Boolean) };
      else payload.text = message;
      const r = await whatsappAPI.send(payload);
      setResult(r.data);
    } catch (e) { setResult({ error: e?.message || 'Send failed' }); }
    setSending(false);
  };

  const ready = numbers.length > 0 && (tpl || message.trim().length > 0);

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <WhatsApp sx={{ color: WA_GREEN }} />
        <Typography variant="h5" fontWeight={700}>{t('whatsapp.title')}</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t('whatsapp.subtitle')}</Typography>

      {/* Connection bar */}
      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Bolt sx={{ color: config.connected ? WA_GREEN : 'text.disabled' }} />
        <Box sx={{ flex: 1, minWidth: 180 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('whatsapp.autoSend')}</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: config.connected ? WA_GREEN : 'text.secondary' }}>
            {config.connected ? `${t('whatsapp.connected')} ${config.phoneNumberId ? `(${config.phoneNumberId})` : ''}` : t('whatsapp.notConnected')}
          </Typography>
        </Box>
        {isAdmin && (config.connected
          ? <Button size="small" color="error" startIcon={<LinkOff sx={{ fontSize: 16 }} />} onClick={disconnect} sx={{ textTransform: 'none' }}>{t('whatsapp.disconnect')}</Button>
          : <Button size="small" variant="contained" onClick={() => setDlg(true)} sx={{ bgcolor: WA_GREEN, textTransform: 'none', '&:hover': { bgcolor: '#1EBE5D' } }}>{t('whatsapp.connect')}</Button>)}
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* Left: inputs */}
        <Paper variant="outlined" sx={{ flex: '1 1 420px', p: 2.5, borderRadius: 3 }}>
          <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{t('whatsapp.numbers')}</Typography>
          <Typography variant="caption" color="text.secondary">{t('whatsapp.numbersHelp')}</Typography>
          <TextField fullWidth multiline minRows={6} maxRows={12} sx={{ mt: 1 }}
            placeholder={"+966501234567\n+971501234567\n+201001234567"} value={raw} onChange={e => setRaw(e.target.value)} />
          <Chip size="small" sx={{ mt: 1 }} color={numbers.length ? 'success' : 'default'} label={t('whatsapp.valid', { count: numbers.length })} />

          <Typography sx={{ fontWeight: 700, mt: 2.5, mb: 0.5 }}>{t('whatsapp.message')}</Typography>
          <TextField fullWidth multiline minRows={4} maxRows={10} placeholder={t('whatsapp.messagePlaceholder')} value={message} onChange={e => setMessage(e.target.value)} />
          <Button size="small" startIcon={<ContentCopy sx={{ fontSize: 16 }} />} onClick={copyMessage} disabled={!message.trim()} sx={{ mt: 1, textTransform: 'none' }}>{t('whatsapp.copyMessage')}</Button>

          {/* Template (when connected) */}
          {config.connected && (
            <Box sx={{ mt: 2 }}>
              <TextField select fullWidth size="small" label={t('whatsapp.template')} value={tpl} onChange={e => { setTpl(e.target.value); const f = templates.find(x => x.name === e.target.value); if (f) setTplLang(f.language); }}>
                <MenuItem value="">{t('whatsapp.noTemplate')}</MenuItem>
                {templates.map(x => <MenuItem key={x.name + x.language} value={x.name}>{x.name} ({x.language})</MenuItem>)}
              </TextField>
              {tpl && <TextField fullWidth size="small" sx={{ mt: 1 }} label={t('whatsapp.tplVars')} placeholder="value1, value2" value={tplVars} onChange={e => setTplVars(e.target.value)} />}
            </Box>
          )}
        </Paper>

        {/* Right: send */}
        <Paper variant="outlined" sx={{ flex: '1 1 380px', p: 2.5, borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
          {/* AUTO send (API) */}
          {config.connected ? (
            <>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>{t('whatsapp.sendAuto')}</Typography>
              <Button variant="contained" startIcon={sending ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <Send />}
                disabled={!ready || sending} onClick={sendAll}
                sx={{ bgcolor: WA_GREEN, textTransform: 'none', fontWeight: 700, py: 1, '&:hover': { bgcolor: '#1EBE5D' } }}>
                {t('whatsapp.sendToAll', { count: numbers.length })}
              </Button>
              {!tpl && <Alert severity="warning" sx={{ mt: 1.5, py: 0.25, fontSize: '0.75rem' }}>{t('whatsapp.windowNote')}</Alert>}
              {result && (
                <Alert severity={result.error ? 'error' : (result.failed ? 'warning' : 'success')} sx={{ mt: 1.5, fontSize: '0.8rem' }}>
                  {result.error ? result.error : t('whatsapp.sentResult', { sent: result.sent, failed: result.failed })}
                </Alert>
              )}
              <Divider sx={{ my: 2 }}><Typography variant="caption" color="text.secondary">{t('whatsapp.orManual')}</Typography></Divider>
            </>
          ) : (
            <Alert severity="info" sx={{ mb: 1.5, fontSize: '0.78rem' }}>{t('whatsapp.connectHint')}</Alert>
          )}

          {/* Manual wa.me */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('whatsapp.recipients')}</Typography>
            <Button variant="outlined" size="small" startIcon={<PlayArrow />} disabled={!numbers.length || !message.trim() || seqIndex >= numbers.length} onClick={openNext}
              sx={{ color: WA_GREEN, borderColor: WA_GREEN, textTransform: 'none' }}>
              {seqIndex === 0 ? t('whatsapp.startSequence') : seqIndex >= numbers.length ? t('whatsapp.done') : `${t('whatsapp.next')} (${seqIndex + 1}/${numbers.length})`}
            </Button>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 360 }}>
            {numbers.length === 0 ? <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 3, fontSize: '0.85rem' }}>{t('whatsapp.empty')}</Typography>
             : numbers.map((num, i) => (
              <Box key={num} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.6, borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ width: 22, color: 'text.secondary', fontSize: '0.8rem' }}>{i + 1}.</Typography>
                <Typography sx={{ flex: 1, fontFamily: 'monospace', fontSize: '0.82rem' }}>+{num}</Typography>
                {opened.has(num) && <CheckCircle sx={{ fontSize: 16, color: WA_GREEN }} />}
                <Tooltip title={t('whatsapp.open')}><span><IconButton size="small" disabled={!message.trim()} onClick={() => openOne(num)} sx={{ color: WA_GREEN }}><OpenInNew sx={{ fontSize: 17 }} /></IconButton></span></Tooltip>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      {/* Connect dialog */}
      <Dialog open={dlg} onClose={() => setDlg(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('whatsapp.connectTitle')}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, fontSize: '0.78rem' }}>{t('whatsapp.connectSteps')}</Alert>
          <TextField fullWidth size="small" sx={{ mb: 1.5 }} label="Phone Number ID" value={form.phoneNumberId} onChange={e => setForm(f => ({ ...f, phoneNumberId: e.target.value }))} />
          <TextField fullWidth size="small" sx={{ mb: 1.5 }} label="Access Token" type="password" value={form.accessToken} onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))} />
          <TextField fullWidth size="small" label="WhatsApp Business Account ID" value={form.wabaId} onChange={e => setForm(f => ({ ...f, wabaId: e.target.value }))} />
          {testMsg && <Alert severity={testMsg.ok ? 'success' : 'error'} sx={{ mt: 1.5, fontSize: '0.8rem' }}>{testMsg.ok ? `✅ ${t('whatsapp.testOk')} ${testMsg.text}` : testMsg.text}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDlg(false)} sx={{ textTransform: 'none' }}>{t('whatsapp.cancel')}</Button>
          <Button variant="contained" onClick={saveConfig} disabled={saving || !form.phoneNumberId || !form.accessToken} sx={{ bgcolor: WA_GREEN, textTransform: 'none', '&:hover': { bgcolor: '#1EBE5D' } }}>
            {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : t('whatsapp.connectSave')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
