import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, Box, Button, IconButton, Collapse } from '@mui/material';
import { Close } from '@mui/icons-material';
import api from '../../services/api.js';

const DISMISSED_KEY = 'julay_dismissed_announcements';

function getDismissed() {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'); } catch { return []; }
}
function dismiss(id) {
  const list = getDismissed();
  if (!list.includes(id)) localStorage.setItem(DISMISSED_KEY, JSON.stringify([...list, id]));
}

export default function AnnouncementBanner() {
  const [items, setItems] = useState([]);
  const [visible, setVisible] = useState({});

  useEffect(() => {
    api.get('/owner/announcements/active').then(res => {
      const dismissed = getDismissed();
      const active = (res.data || []).filter(a => !dismissed.includes(a._id));
      setItems(active);
      const v = {};
      active.forEach(a => { v[a._id] = true; });
      setVisible(v);
    }).catch(() => {});
  }, []);

  const handleDismiss = (id, dismissible) => {
    if (dismissible !== false) dismiss(id);
    setVisible(p => ({ ...p, [id]: false }));
  };

  const showing = items.filter(a => visible[a._id]);
  if (!showing.length) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
      {showing.map(a => (
        <Collapse key={a._id} in={!!visible[a._id]}>
          <Alert severity={a.type || 'info'}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {a.link && (
                  <Button size="small" color="inherit" href={a.link} target="_blank" sx={{ fontSize: '0.75rem', textTransform: 'none', minWidth: 'auto' }}>
                    {a.linkText || 'Learn more'}
                  </Button>
                )}
                {a.dismissible !== false && (
                  <IconButton size="small" onClick={() => handleDismiss(a._id, a.dismissible)} color="inherit">
                    <Close fontSize="small" />
                  </IconButton>
                )}
              </Box>
            }
            sx={{ borderRadius: 1.5, '& .MuiAlert-message': { flex: 1 } }}
          >
            {a.message}
          </Alert>
        </Collapse>
      ))}
    </Box>
  );
}
