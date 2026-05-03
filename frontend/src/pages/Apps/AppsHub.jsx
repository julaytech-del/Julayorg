import React, { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Chip, Switch, Divider } from '@mui/material';
import { CheckCircle, Lock, OpenInNew } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const APPS = [
  {
    id: 'share-ai',
    name: 'Smart Share',
    desc: 'Share any text with AI — it reads and updates your project plan automatically.',
    icon: '🧠',
    color: '#6366f1',
    bg: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1))',
    border: 'rgba(99,102,241,0.3)',
    status: 'available',
    route: '/dashboard/apps/share',
    badge: 'CORE'
  },
  {
    id: 'pdf',
    name: 'PDF + AI',
    desc: 'Open any PDF, ask AI to summarize it, extract tasks, or answer questions about it.',
    icon: '📑',
    color: '#e17055',
    bg: 'linear-gradient(135deg, rgba(225,112,85,0.1), rgba(253,150,68,0.08))',
    border: 'rgba(225,112,85,0.25)',
    status: 'available',
    route: '/dashboard/apps/pdf',
    badge: 'CORE'
  },
  {
    id: 'slack',
    name: 'Slack',
    desc: 'Connect your Slack workspace. AI monitors channels and turns messages into tasks.',
    icon: '💬',
    color: '#4a154b',
    bg: 'linear-gradient(135deg, rgba(74,21,75,0.12), rgba(224,30,90,0.08))',
    border: 'rgba(74,21,75,0.25)',
    status: 'coming',
    badge: 'SOON'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    desc: 'Connect WhatsApp Business. Share conversations directly with AI for instant plan updates.',
    icon: '📱',
    color: '#25d366',
    bg: 'linear-gradient(135deg, rgba(37,211,102,0.1), rgba(18,140,126,0.08))',
    border: 'rgba(37,211,102,0.2)',
    status: 'coming',
    badge: 'SOON'
  },
  {
    id: 'gmail',
    name: 'Gmail',
    desc: 'Connect Gmail. AI reads important emails and extracts action items into your projects.',
    icon: '📧',
    color: '#ea4335',
    bg: 'linear-gradient(135deg, rgba(234,67,53,0.1), rgba(251,188,4,0.06))',
    border: 'rgba(234,67,53,0.2)',
    status: 'coming',
    badge: 'SOON'
  },
  {
    id: 'github',
    name: 'GitHub',
    desc: 'Connect GitHub repos. PRs, issues, and commits auto-sync with your project tasks.',
    icon: '🐙',
    color: '#fff',
    bg: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
    border: 'rgba(255,255,255,0.12)',
    status: 'coming',
    badge: 'SOON'
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    desc: 'Link Drive files to projects. AI can read docs and spreadsheets to extract insights.',
    icon: '📁',
    color: '#4285f4',
    bg: 'linear-gradient(135deg, rgba(66,133,244,0.1), rgba(52,168,83,0.06))',
    border: 'rgba(66,133,244,0.2)',
    status: 'coming',
    badge: 'SOON'
  },
  {
    id: 'notion',
    name: 'Notion',
    desc: 'Import Notion pages into Julay. AI converts them into structured project plans.',
    icon: '📒',
    color: '#fff',
    bg: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
    border: 'rgba(255,255,255,0.1)',
    status: 'coming',
    badge: 'SOON'
  },
];

export default function AppsHub() {
  const navigate = useNavigate();
  const user = useSelector(s => s.auth.user);

  const available = APPS.filter(a => a.status === 'available');
  const coming = APPS.filter(a => a.status === 'coming');

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={800} letterSpacing='-0.02em' mb={0.5}>Workspace Apps</Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
          Connect your tools. AI reads the updates and keeps your project plans in sync — automatically.
        </Typography>
      </Box>

      {/* How it works */}
      <Box sx={{ mb: 4, p: 3, background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 3 }}>
        <Typography fontWeight={700} fontSize="0.9rem" color="#a5b4fc" mb={1.5}>⚡ How it works</Typography>
        <Box sx={{ display: 'flex', gap: { xs: 2, md: 4 }, flexWrap: 'wrap' }}>
          {[
            ['1', 'Share any content', 'Paste text from WhatsApp, upload a PDF, or connect an app'],
            ['2', 'AI reads & understands', 'Claude analyzes the content in context of your projects'],
            ['3', 'Review suggestions', 'AI proposes plan updates — you approve or reject each one'],
          ].map(([num, title, desc]) => (
            <Box key={num} sx={{ display: 'flex', gap: 1.5, flex: 1, minWidth: 200 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 99, background: 'rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Typography fontSize="0.75rem" fontWeight={800} color="#a5b4fc">{num}</Typography>
              </Box>
              <Box>
                <Typography fontWeight={700} fontSize="0.82rem" color="white">{title}</Typography>
                <Typography fontSize="0.75rem" sx={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Available now */}
      <Typography fontWeight={700} fontSize="0.78rem" letterSpacing="0.1em" sx={{ color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', mb: 2 }}>Available Now</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {available.map(app => (
          <Grid item xs={12} sm={6} md={4} key={app.id}>
            <Card onClick={() => navigate(app.route)} sx={{ background: app.bg, border: `1px solid ${app.border}`, borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 30px ${app.color}25` }, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Typography fontSize="2rem">{app.icon}</Typography>
                  <Chip label={app.badge} size="small" sx={{ bgcolor: `${app.color}25`, color: app.color, fontWeight: 700, fontSize: '0.65rem', border: `1px solid ${app.color}40` }} />
                </Box>
                <Typography fontWeight={700} fontSize="0.95rem" mb={0.8}>{app.name}</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', lineHeight: 1.6 }}>{app.desc}</Typography>
                <Button size="small" endIcon={<OpenInNew sx={{ fontSize: '14px !important' }} />}
                  sx={{ mt: 2, color: app.color, fontWeight: 700, fontSize: '0.78rem', textTransform: 'none', p: 0, '&:hover': { background: 'none', opacity: 0.8 } }}>
                  Open
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Coming soon */}
      <Typography fontWeight={700} fontSize="0.78rem" letterSpacing="0.1em" sx={{ color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', mb: 2 }}>Coming Soon</Typography>
      <Grid container spacing={2}>
        {coming.map(app => (
          <Grid item xs={12} sm={6} md={3} key={app.id}>
            <Card sx={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, opacity: 0.7, height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.2 }}>
                  <Typography fontSize="1.5rem">{app.icon}</Typography>
                  <Box>
                    <Typography fontWeight={700} fontSize="0.875rem">{app.name}</Typography>
                    <Chip label="Coming Soon" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem', height: 18 }} />
                  </Box>
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', lineHeight: 1.5 }}>{app.desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
