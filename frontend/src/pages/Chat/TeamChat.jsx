import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, TextField, IconButton, Avatar, CircularProgress, Tooltip } from '@mui/material';
import { Send, ChatBubbleOutline, DeleteOutline } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { chatAPI } from '../../services/api.js';

export default function TeamChat() {
  const { t }    = useTranslation();
  const me       = useSelector(s => s.auth.user);
  const accent   = useSelector(s => s.ui.accentColor) || '#4F46E5';
  const darkMode = useSelector(s => s.ui.darkMode);

  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef(null);
  const lastTs    = useRef(null);

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

  // Initial load
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await chatAPI.getMessages();
        if (!alive) return;
        const data = res.data || [];
        setMessages(data);
        if (data.length) lastTs.current = data[data.length - 1].createdAt;
      } catch { /* ignore */ }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  // Poll for new messages
  useEffect(() => {
    const tick = async () => {
      if (document.hidden) return;
      try {
        const res = await chatAPI.getMessages(lastTs.current || undefined);
        merge(res.data || []);
      } catch { /* ignore */ }
    };
    const id = setInterval(tick, 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await chatAPI.send(body);
      setText('');
      merge([res.data]);
    } catch { /* ignore */ }
    setSending(false);
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleDelete = async (id) => {
    try { await chatAPI.remove(id); setMessages(prev => prev.filter(m => m._id !== id)); } catch { /* ignore */ }
  };

  const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 170px)', maxWidth: 920, mx: 'auto', width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <ChatBubbleOutline sx={{ color: accent }} />
        <Typography variant="h5" fontWeight={700}>{t('chat.title')}</Typography>
      </Box>

      <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden' }}>
        {/* Messages */}
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
                    <Typography sx={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</Typography>
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
        <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth multiline maxRows={4} size="small"
            placeholder={t('chat.placeholder')}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKey}
          />
          <IconButton
            onClick={send}
            disabled={!text.trim() || sending}
            sx={{ bgcolor: accent, color: '#fff', '&:hover': { bgcolor: accent, opacity: 0.9 }, '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' } }}
          >
            {sending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <Send sx={{ fontSize: 18 }} />}
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
}
