import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Paper, Typography, TextField, IconButton, Avatar, CircularProgress, Tooltip, Badge, Divider } from '@mui/material';
import { Send, ChatBubbleOutline, DeleteOutline, AttachFile, Mic, Stop, InsertDriveFile, Groups } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { chatAPI, uploadAPI } from '../../services/api.js';

const fmtSize = (b) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function TeamChat() {
  const { t }    = useTranslation();
  const me       = useSelector(s => s.auth.user);
  const accent   = useSelector(s => s.ui.accentColor) || '#4F46E5';
  const darkMode = useSelector(s => s.ui.darkMode);

  const [convs, setConvs]   = useState({ team: { unread: 0, lastMessage: null }, dms: [] });
  const [active, setActive] = useState({ type: 'team' });          // {type:'team'} | {type:'dm', user}
  const [messages, setMessages] = useState([]);
  const [text, setText]     = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);

  const bottomRef   = useRef(null);
  const lastTs      = useRef(null);
  const fileRef     = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);
  const recTimer    = useRef(null);
  const activeRef   = useRef(active);
  activeRef.current = active;

  const convId   = (a) => a.type === 'team' ? 'team' : a.user._id;
  const fetchOpts = (a) => a.type === 'dm' ? { with: a.user._id } : {};

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  const loadConversations = useCallback(async () => {
    try { const r = await chatAPI.getConversations(); setConvs(r.data || { team: { unread: 0 }, dms: [] }); } catch { /* ignore */ }
  }, []);

  // Load the active conversation's messages fresh
  const openConversation = useCallback(async (a) => {
    setActive(a);
    setMessages([]);
    setLoading(true);
    lastTs.current = null;
    try {
      const r = await chatAPI.getMessages(fetchOpts(a));
      const data = r.data || [];
      setMessages(data);
      if (data.length) lastTs.current = data[data.length - 1].createdAt;
      chatAPI.markRead(convId(a)).catch(() => {});
      loadConversations();
    } catch { /* ignore */ }
    setLoading(false);
  }, [loadConversations]);

  // Initial load
  useEffect(() => {
    loadConversations();
    openConversation({ type: 'team' });
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch { /* ignore */ }
  }, []); // eslint-disable-line

  // Poll active conversation for new messages + refresh the list
  useEffect(() => {
    const tick = async () => {
      if (document.hidden) return;
      const a = activeRef.current;
      try {
        const r = await chatAPI.getMessages({ ...fetchOpts(a), after: lastTs.current || undefined });
        const incoming = r.data || [];
        if (incoming.length) {
          setMessages(prev => {
            const ids = new Set(prev.map(m => m._id));
            const add = incoming.filter(m => !ids.has(m._id));
            if (!add.length) return prev;
            lastTs.current = add[add.length - 1].createdAt;
            return [...prev, ...add];
          });
          chatAPI.markRead(convId(a)).catch(() => {});
        }
      } catch { /* ignore */ }
      loadConversations();
    };
    const id = setInterval(tick, 4000);
    return () => clearInterval(id);
  }, [loadConversations]);

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const appendMine = (msg) => {
    setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
    lastTs.current = msg.createdAt;
  };

  const sendMessage = async (body, attachments = []) => {
    if ((!body || !body.trim()) && attachments.length === 0) return;
    setSending(true);
    try {
      const to = active.type === 'dm' ? active.user._id : null;
      const r = await chatAPI.send((body || '').trim(), attachments, to);
      appendMine(r.data);
      chatAPI.markRead(convId(active)).catch(() => {});
      loadConversations();
    } catch { /* ignore */ }
    setSending(false);
  };

  const handleSendText = async () => { const b = text.trim(); if (!b) return; setText(''); await sendMessage(b); };
  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); } };

  // File
  const pickFile = () => fileRef.current?.click();
  const onFile = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    setUploading(true);
    try { const r = await uploadAPI.upload(file); const d = r.data; await sendMessage(text, [{ url: d.url, name: d.originalName, type: d.mimeType, size: d.size }]); setText(''); }
    catch (err) { alert(err?.message || 'Upload failed'); }
    setUploading(false);
  };

  // Voice
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (ev) => { if (ev.data.size) chunksRef.current.push(ev.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach(tk => tk.stop());
        clearInterval(recTimer.current); setRecSecs(0);
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        const ext = (rec.mimeType || 'audio/webm').includes('mp4') ? 'm4a' : 'webm';
        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type });
        setUploading(true);
        try { const r = await uploadAPI.upload(file); const d = r.data; await sendMessage('', [{ url: d.url, name: d.originalName, type: d.mimeType || blob.type, size: d.size }]); }
        catch (err) { alert(err?.message || 'Upload failed'); }
        setUploading(false);
      };
      recorderRef.current = rec; rec.start();
      setRecording(true); setRecSecs(0);
      recTimer.current = setInterval(() => setRecSecs(s => s + 1), 1000);
    } catch { alert(t('chat.micDenied')); }
  };
  const stopRecording = () => { try { recorderRef.current?.stop(); } catch { /* ignore */ } setRecording(false); };

  const handleDelete = async (id) => { try { await chatAPI.remove(id); setMessages(prev => prev.filter(m => m._id !== id)); } catch { /* ignore */ } };

  const renderAttachment = (a, i) => {
    const type = a.type || '';
    if (type.startsWith('image/')) return <a key={i} href={a.url} target="_blank" rel="noreferrer"><Box component="img" src={a.url} alt={a.name} sx={{ maxWidth: 240, maxHeight: 240, borderRadius: 1.5, mt: 0.5, display: 'block' }} /></a>;
    if (type.startsWith('audio/')) return <Box key={i} component="audio" controls src={a.url} sx={{ mt: 0.5, height: 36, maxWidth: 240 }} />;
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

  const preview = (lm) => !lm ? '' : (lm.text || (lm.hasAttachment ? '📎' : ''));
  const isActive = (a) => active.type === a.type && (a.type === 'team' || active.user?._id === a.user?._id);

  const ConvRow = ({ avatar, title, sub, unread, onClick, selected, icon }) => (
    <Box onClick={onClick} sx={{
      display: 'flex', alignItems: 'center', gap: 1.25, p: 1, borderRadius: 2, cursor: 'pointer',
      bgcolor: selected ? `${accent}18` : 'transparent', '&:hover': { bgcolor: selected ? `${accent}18` : (darkMode ? 'rgba(255,255,255,0.05)' : '#F5F5FF') },
    }}>
      {icon ? <Avatar sx={{ width: 38, height: 38, bgcolor: accent }}>{icon}</Avatar>
            : <Avatar src={avatar || undefined} sx={{ width: 38, height: 38 }}>{title?.[0]?.toUpperCase()}</Avatar>}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</Typography>
        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</Typography>
      </Box>
      {unread > 0 && <Box sx={{ minWidth: 18, height: 18, px: 0.5, borderRadius: 9, bgcolor: '#EF4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread > 99 ? '99+' : unread}</Box>}
    </Box>
  );

  const headerTitle = active.type === 'team' ? t('chat.title') : active.user?.name;

  return (
    <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 150px)', maxWidth: 1100, mx: 'auto', width: '100%' }}>
      {/* Conversation list */}
      <Paper variant="outlined" sx={{ width: 300, flexShrink: 0, borderRadius: 3, display: { xs: 'none', md: 'flex' }, flexDirection: 'column', overflow: 'hidden' }}>
        <Typography sx={{ p: 2, pb: 1, fontWeight: 700 }}>{t('chat.conversations')}</Typography>
        <Box sx={{ flex: 1, overflowY: 'auto', px: 1, pb: 1 }}>
          <ConvRow icon={<Groups sx={{ fontSize: 20 }} />} title={t('chat.teamChannel')} sub={preview(convs.team?.lastMessage)} unread={isActive({ type: 'team' }) ? 0 : (convs.team?.unread || 0)} selected={isActive({ type: 'team' })} onClick={() => openConversation({ type: 'team' })} />
          <Divider sx={{ my: 1 }} />
          <Typography sx={{ px: 1, py: 0.5, fontSize: '0.66rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('chat.directMessages')}</Typography>
          {convs.dms?.length ? convs.dms.map(d => (
            <ConvRow key={d.user._id} avatar={d.user.avatar} title={d.user.name} sub={preview(d.lastMessage)}
              unread={isActive({ type: 'dm', user: d.user }) ? 0 : (d.unread || 0)}
              selected={isActive({ type: 'dm', user: d.user })}
              onClick={() => openConversation({ type: 'dm', user: d.user })} />
          )) : <Typography sx={{ px: 1, py: 1, fontSize: '0.78rem', color: 'text.secondary' }}>{t('chat.noMembers')}</Typography>}
        </Box>
      </Paper>

      {/* Active conversation */}
      <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.25 }}>
          {active.type === 'team'
            ? <Avatar sx={{ width: 32, height: 32, bgcolor: accent }}><Groups sx={{ fontSize: 18 }} /></Avatar>
            : <Avatar src={active.user?.avatar || undefined} sx={{ width: 32, height: 32 }}>{active.user?.name?.[0]?.toUpperCase()}</Avatar>}
          <Typography sx={{ fontWeight: 700 }}>{headerTitle}</Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {loading ? <Box sx={{ textAlign: 'center', mt: 4 }}><CircularProgress size={24} /></Box>
           : messages.length === 0 ? <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 6 }}><ChatBubbleOutline sx={{ fontSize: 42, opacity: 0.35 }} /><Typography sx={{ mt: 1 }}>{t('chat.empty')}</Typography></Box>
           : messages.map(m => {
              const mine = String(m.sender?._id || m.sender) === String(me?._id);
              return (
                <Box key={m._id} sx={{ display: 'flex', flexDirection: mine ? 'row-reverse' : 'row', gap: 1, alignItems: 'flex-end' }}>
                  {!mine && active.type === 'team' && <Avatar src={m.sender?.avatar || undefined} sx={{ width: 30, height: 30, fontSize: '0.8rem' }}>{m.sender?.name?.[0]?.toUpperCase()}</Avatar>}
                  <Box sx={{ maxWidth: '72%' }}>
                    {!mine && active.type === 'team' && <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 0.25, mx: 0.5 }}>{m.sender?.name}</Typography>}
                    <Box sx={{ px: 1.5, py: 1, borderRadius: 2.5, bgcolor: mine ? accent : (darkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9'), color: mine ? '#fff' : 'text.primary' }}>
                      {m.text && <Typography sx={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</Typography>}
                      {(m.attachments || []).map(renderAttachment)}
                      <Typography sx={{ fontSize: '0.62rem', opacity: 0.7, textAlign: 'right', mt: 0.25 }}>{fmtTime(m.createdAt)}</Typography>
                    </Box>
                  </Box>
                  {mine && <Tooltip title={t('chat.delete')}><IconButton size="small" onClick={() => handleDelete(m._id)} sx={{ opacity: 0.25, '&:hover': { opacity: 1 } }}><DeleteOutline sx={{ fontSize: 15 }} /></IconButton></Tooltip>}
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
              <Tooltip title={t('chat.attach')}><span><IconButton onClick={pickFile} disabled={uploading || sending}>{uploading ? <CircularProgress size={18} /> : <AttachFile sx={{ fontSize: 20 }} />}</IconButton></span></Tooltip>
              <TextField fullWidth multiline maxRows={4} size="small" placeholder={t('chat.placeholder')} value={text} onChange={e => setText(e.target.value)} onKeyDown={onKey} />
            </>
          )}
          <Tooltip title={t('chat.voice')}>
            <IconButton onClick={recording ? stopRecording : startRecording} disabled={uploading || sending} sx={recording ? { bgcolor: '#EF4444', color: '#fff', '&:hover': { bgcolor: '#DC2626' } } : {}}>
              {recording ? <Stop sx={{ fontSize: 20 }} /> : <Mic sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>
          {!recording && (
            <IconButton onClick={handleSendText} disabled={!text.trim() || sending} sx={{ bgcolor: accent, color: '#fff', '&:hover': { bgcolor: accent, opacity: 0.9 }, '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' } }}>
              {sending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <Send sx={{ fontSize: 18 }} />}
            </IconButton>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
