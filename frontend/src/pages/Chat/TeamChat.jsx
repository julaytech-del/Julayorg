import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, TextField, IconButton, Avatar, CircularProgress, Tooltip } from '@mui/material';
import { Send, ChatBubbleOutline, DeleteOutline, AttachFile, Mic, Stop, InsertDriveFile } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { chatAPI, uploadAPI } from '../../services/api.js';

const fmtSize = (b) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;

export default function TeamChat() {
  const { t }    = useTranslation();
  const me       = useSelector(s => s.auth.user);
  const accent   = useSelector(s => s.ui.accentColor) || '#4F46E5';
  const darkMode = useSelector(s => s.ui.darkMode);

  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs]   = useState(0);

  const bottomRef  = useRef(null);
  const lastTs     = useRef(null);
  const fileRef    = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef  = useRef([]);
  const recTimer   = useRef(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  const merge = (incoming) => {
    if (!incoming?.length) return;
    setMessages(prev => {
      const ids = new Set(prev.map(m => m._id));
      const add = incoming.filter(m => !ids.has(m._id));
      if (!add.length) return prev;
      const next = [...prev, ...add];
      lastTs.current = next[next.length - 1].createdAt;
      return next;
    });
  };

  // Initial load + ask for desktop-notification permission
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await chatAPI.getMessages();
        if (!alive) return;
        const data = res.data || [];
        setMessages(data);
        if (data.length) lastTs.current = data[data.length - 1].createdAt;
        chatAPI.markRead().catch(() => {});
      } catch { /* ignore */ }
      if (alive) setLoading(false);
    })();
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch { /* ignore */ }
    return () => { alive = false; };
  }, []);

  // Poll for new messages
  useEffect(() => {
    const tick = async () => {
      if (document.hidden) return;
      try {
        const res = await chatAPI.getMessages(lastTs.current || undefined);
        const incoming = res.data || [];
        if (incoming.length) { merge(incoming); chatAPI.markRead().catch(() => {}); }
      } catch { /* ignore */ }
    };
    const id = setInterval(tick, 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const sendMessage = async (body, attachments = []) => {
    if ((!body || !body.trim()) && attachments.length === 0) return;
    setSending(true);
    try {
      const res = await chatAPI.send((body || '').trim(), attachments);
      merge([res.data]);
      chatAPI.markRead().catch(() => {});
    } catch { /* ignore */ }
    setSending(false);
  };

  const handleSendText = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    await sendMessage(body);
  };

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); } };

  // ── File attachment ──
  const pickFile = () => fileRef.current?.click();
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadAPI.upload(file);
      const d = res.data;
      await sendMessage(text, [{ url: d.url, name: d.originalName, type: d.mimeType, size: d.size }]);
      setText('');
    } catch (err) {
      alert(err?.message || 'Upload failed');
    }
    setUploading(false);
  };

  // ── Voice message ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (ev) => { if (ev.data.size) chunksRef.current.push(ev.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach(tk => tk.stop());
        clearInterval(recTimer.current);
        setRecSecs(0);
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        const ext = (rec.mimeType || 'audio/webm').includes('mp4') ? 'm4a' : 'webm';
        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type });
        setUploading(true);
        try {
          const res = await uploadAPI.upload(file);
          const d = res.data;
          await sendMessage('', [{ url: d.url, name: d.originalName, type: d.mimeType || blob.type, size: d.size }]);
        } catch (err) { alert(err?.message || 'Upload failed'); }
        setUploading(false);
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
      setRecSecs(0);
      recTimer.current = setInterval(() => setRecSecs(s => s + 1), 1000);
    } catch {
      alert(t('chat.micDenied'));
    }
  };
  const stopRecording = () => { try { recorderRef.current?.stop(); } catch { /* ignore */ } setRecording(false); };

  const handleDelete = async (id) => {
    try { await chatAPI.remove(id); setMessages(prev => prev.filter(m => m._id !== id)); } catch { /* ignore */ }
  };

  const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderAttachment = (a, i) => {
    const type = a.type || '';
    if (type.startsWith('image/')) {
      return <a key={i} href={a.url} target="_blank" rel="noreferrer"><Box component="img" src={a.url} alt={a.name} sx={{ maxWidth: 240, maxHeight: 240, borderRadius: 1.5, mt: 0.5, display: 'block' }} /></a>;
    }
    if (type.startsWith('audio/')) {
      return <Box key={i} component="audio" controls src={a.url} sx={{ mt: 0.5, height: 36, maxWidth: 240 }} />;
    }
    return (
      <a key={i} href={a.url} target="_blank" rel="noreferrer" download style={{ textDecoration: 'none' }}>
        <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1.5, bgcolor: 'rgba(0,0,0,0.06)', maxWidth: 240 }}>
          <InsertDriveFile sx={{ fontSize: 20, opacity: 0.7 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name || 'file'}</Typography>
            {a.size ? <Typography sx={{ fontSize: '0.65rem', opacity: 0.7 }}>{fmtSize(a.size)}</Typography> : null}
          </Box>
        </Box>
      </a>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 170px)', maxWidth: 920, mx: 'auto', width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <ChatBubbleOutline sx={{ color: accent }} />
        <Typography variant="h5" fontWeight={700}>{t('chat.title')}</Typography>
      </Box>

      <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', mt: 4 }}><CircularProgress size={24} /></Box>
          ) : messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 6 }}>
              <ChatBubbleOutline sx={{ fontSize: 42, opacity: 0.35 }} />
              <Typography sx={{ mt: 1 }}>{t('chat.empty')}</Typography>
            </Box>
          ) : messages.map(m => {
            const mine = String(m.sender?._id || m.sender) === String(me?._id);
            return (
              <Box key={m._id} sx={{ display: 'flex', flexDirection: mine ? 'row-reverse' : 'row', gap: 1, alignItems: 'flex-end' }}>
                {!mine && (
                  <Avatar src={m.sender?.avatar || undefined} sx={{ width: 30, height: 30, fontSize: '0.8rem' }}>
                    {m.sender?.name?.[0]?.toUpperCase()}
                  </Avatar>
                )}
                <Box sx={{ maxWidth: '72%' }}>
                  {!mine && <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 0.25, mx: 0.5 }}>{m.sender?.name}</Typography>}
                  <Box sx={{
                    px: 1.5, py: 1, borderRadius: 2.5,
                    bgcolor: mine ? accent : (darkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9'),
                    color: mine ? '#fff' : 'text.primary',
                  }}>
                    {m.text && <Typography sx={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</Typography>}
                    {(m.attachments || []).map(renderAttachment)}
                    <Typography sx={{ fontSize: '0.62rem', opacity: 0.7, textAlign: 'right', mt: 0.25 }}>{fmtTime(m.createdAt)}</Typography>
                  </Box>
                </Box>
                {mine && (
                  <Tooltip title={t('chat.delete')}>
                    <IconButton size="small" onClick={() => handleDelete(m._id)} sx={{ opacity: 0.25, '&:hover': { opacity: 1 } }}>
                      <DeleteOutline sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            );
          })}
          <div ref={bottomRef} />
        </Box>

        {/* Composer */}
        <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 0.5, alignItems: 'flex-end' }}>
          <input ref={fileRef} type="file" hidden onChange={onFile} />
          {recording ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, px: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#EF4444', animation: 'pulse 1s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
              <Typography sx={{ color: '#EF4444', fontWeight: 600 }}>{t('chat.recording')} {String(Math.floor(recSecs / 60)).padStart(2, '0')}:{String(recSecs % 60).padStart(2, '0')}</Typography>
            </Box>
          ) : (
            <>
              <Tooltip title={t('chat.attach')}>
                <span><IconButton onClick={pickFile} disabled={uploading || sending}>{uploading ? <CircularProgress size={18} /> : <AttachFile sx={{ fontSize: 20 }} />}</IconButton></span>
              </Tooltip>
              <TextField
                fullWidth multiline maxRows={4} size="small"
                placeholder={t('chat.placeholder')}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={onKey}
              />
            </>
          )}

          {/* Voice toggle */}
          <Tooltip title={t('chat.voice')}>
            <IconButton onClick={recording ? stopRecording : startRecording} disabled={uploading || sending} sx={recording ? { bgcolor: '#EF4444', color: '#fff', '&:hover': { bgcolor: '#DC2626' } } : {}}>
              {recording ? <Stop sx={{ fontSize: 20 }} /> : <Mic sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>

          {!recording && (
            <IconButton
              onClick={handleSendText}
              disabled={!text.trim() || sending}
              sx={{ bgcolor: accent, color: '#fff', '&:hover': { bgcolor: accent, opacity: 0.9 }, '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' } }}
            >
              {sending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <Send sx={{ fontSize: 18 }} />}
            </IconButton>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
