import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Typography, Button, Container, Chip, ToggleButtonGroup, ToggleButton,
  Divider, IconButton, Drawer, List, ListItemButton, ListItemText,
} from '@mui/material';
import {
  ArrowForward, CheckCircle, CheckCircleOutline, Close, PlayArrow,
  Menu as MenuIcon, Search, Notifications,
} from '@mui/icons-material';
import { useNavigate, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher.jsx';
import { trackEvent } from '../components/common/Analytics.jsx';

/* ─── Gradient orb (used in lower sections) ─── */
const Orb = ({ sx }) => <Box sx={{ position: 'absolute', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none', ...sx }} />;

/* ─── Animated counter ─── */
function AnimCounter({ end, suffix = '', duration = 2000 }) {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = end / (duration / 16);
      const tick = () => {
        start = Math.min(start + step, end);
        setVal(Math.floor(start));
        if (start < end) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─── Section fade-in ─── */
function FadeIn({ children, delay = 0 }) {
  const ref = useRef();
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <Box ref={ref} sx={{ opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms` }}>
      {children}
    </Box>
  );
}

/* ─── Dashboard Mockup ─── */
function DashboardMockup() {
  const SIDEBAR = [
    { icon: '⊞', label: 'Dashboard',     active: true },
    { icon: '📁', label: 'Projects' },
    { icon: '👥', label: 'Team' },
    { icon: '🏢', label: 'Departments' },
    { icon: '📅', label: 'Calendar' },
    { icon: '✓',  label: 'My Tasks' },
    { icon: '⏱', label: 'Time Tracking' },
    { icon: '✨', label: 'AI Studio' },
    { icon: '📊', label: 'Reports' },
  ];

  const STATS = [
    { label: 'Active Projects',  value: '24',   change: '↑ 14% from last month',   color: '#6366F1' },
    { label: 'Tasks Completed',  value: '156',  change: '↑ 12.5% from last month', color: '#10B981' },
    { label: 'Team Members',     value: '18',   change: '↑ 8% this quarter',        color: '#F59E0B' },
    { label: 'On-time Rate',     value: '89%',  change: '↑ 9% from last month',     color: '#8B5CF6' },
  ];

  const PROJECTS = [
    { name: 'Website Redesign',      pct: 85, deadline: 'May 24', tasks: '18/21', dot: '#10B981' },
    { name: 'Mobile App',            pct: 60, deadline: 'Jun 15', tasks: '12/20', dot: '#6366F1' },
    { name: 'Marketing Campaign',    pct: 40, deadline: 'May 30', tasks: '8/20',  dot: '#F59E0B' },
    { name: 'E-commerce Platform',   pct: 75, deadline: 'Jun 10', tasks: '15/20', dot: '#10B981' },
  ];

  const barColor = p => p >= 75 ? '#10B981' : p >= 50 ? '#6366F1' : '#F59E0B';

  return (
    <Box sx={{
      background: 'white',
      borderRadius: '20px',
      border: '1px solid #E5E7EB',
      boxShadow: '0 32px 80px rgba(0,0,0,0.14)',
      overflow: 'hidden',
      display: 'flex',
      width: '100%',
      height: { lg: 500, xl: 530 },
      userSelect: 'none',
      position: 'relative',
    }}>

      {/* ── Sidebar ── */}
      <Box sx={{ width: 165, borderRight: '1px solid #F3F4F6', background: '#FAFAFA', flexShrink: 0, pt: 2.5, pb: 6, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Box sx={{ px: 2, mb: 3 }}>
          <Box component="img" src="/julay-logo-full.png" alt="Julay.org" sx={{ height: 22, objectFit: 'contain' }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          {SIDEBAR.map(item => (
            <Box key={item.label} sx={{ px: 1.5, py: 0.7, mx: 1, mb: 0.2, borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1, background: item.active ? '#EEF2FF' : 'transparent' }}>
              <Typography sx={{ fontSize: '0.72rem', width: 14, textAlign: 'center', color: item.active ? '#4F46E5' : '#9CA3AF' }}>{item.icon}</Typography>
              <Typography sx={{ fontSize: '0.73rem', color: item.active ? '#4F46E5' : '#6B7280', fontWeight: item.active ? 600 : 400, whiteSpace: 'nowrap' }}>{item.label}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ position: 'absolute', bottom: 12, left: 0, width: '100%', px: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Typography sx={{ color: 'white', fontSize: '0.55rem', fontWeight: 700 }}>OR</Typography>
          </Box>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#111827', lineHeight: 1.2 }} noWrap>Olivia Rhye</Typography>
            <Typography sx={{ fontSize: '0.6rem', color: '#9CA3AF' }}>Admin</Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Main ── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827' }}>Good morning, Olivia 👋</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: '#9CA3AF', mt: 0.15 }}>Here's what's happening with your projects today.</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
            <Search sx={{ fontSize: 15, color: '#9CA3AF' }} />
            <Notifications sx={{ fontSize: 15, color: '#9CA3AF' }} />
            <Box sx={{ px: 1.25, py: 0.45, borderRadius: 1.5, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', flexShrink: 0 }}>
              <Typography sx={{ color: 'white', fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>+ Add New</Typography>
            </Box>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'hidden' }}>
          {/* Stat cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1.5, flexShrink: 0 }}>
            {STATS.map(s => (
              <Box key={s.label} sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid #F3F4F6' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
                  <Typography sx={{ fontSize: '0.58rem', color: '#9CA3AF', fontWeight: 500, lineHeight: 1.3, pr: 0.5 }}>{s.label}</Typography>
                  <Box sx={{ width: 20, height: 20, borderRadius: 1, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
                  </Box>
                </Box>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</Typography>
                <Typography sx={{ fontSize: '0.56rem', color: '#10B981', mt: 0.3, fontWeight: 600 }}>{s.change}</Typography>
              </Box>
            ))}
          </Box>

          {/* Project table + Cash flow */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1.65fr 1fr', gap: 1.5, flex: 1, minHeight: 0 }}>
            {/* Project Overview */}
            <Box sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827', mb: 1 }}>Project Overview</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.8fr 0.8fr 0.9fr', mb: 0.5 }}>
                {['Project', 'Progress', 'Team', 'Due', 'Tasks'].map(h => (
                  <Typography key={h} sx={{ fontSize: '0.56rem', color: '#9CA3AF', fontWeight: 500 }}>{h}</Typography>
                ))}
              </Box>
              {PROJECTS.map(p => (
                <Box key={p.name} sx={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.8fr 0.8fr 0.9fr', alignItems: 'center', py: 0.7, borderTop: '1px solid #F9FAFB' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, pr: 0.5 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: p.dot, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '0.62rem', color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</Typography>
                  </Box>
                  <Box sx={{ pr: 1 }}>
                    <Box sx={{ height: 3.5, borderRadius: 2, background: '#F3F4F6', overflow: 'hidden', mb: 0.3 }}>
                      <Box sx={{ height: '100%', width: `${p.pct}%`, background: barColor(p.pct), borderRadius: 2 }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.52rem', color: '#9CA3AF' }}>{p.pct}%</Typography>
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    {['#6366F1','#8B5CF6','#10B981'].map((c, i) => (
                      <Box key={i} sx={{ width: 13, height: 13, borderRadius: '50%', background: c, border: '1.5px solid white', ml: i > 0 ? '-5px' : 0 }} />
                    ))}
                  </Box>
                  <Typography sx={{ fontSize: '0.56rem', color: '#6B7280' }}>{p.deadline}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ px: 0.6, py: 0.15, borderRadius: 0.75, background: `${p.dot}18` }}>
                      <Typography sx={{ fontSize: '0.52rem', color: p.dot, fontWeight: 600 }}>{p.tasks}</Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Sprint Velocity */}
            <Box sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827' }}>Sprint Velocity</Typography>
                <Typography sx={{ fontSize: '0.58rem', color: '#9CA3AF' }}>This Sprint ▾</Typography>
              </Box>
              <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>42 pts</Typography>
              <Typography sx={{ fontSize: '0.58rem', color: '#10B981', fontWeight: 600, mb: 1 }}>↑ 15.3% vs last</Typography>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <svg width="100%" height="100%" viewBox="0 0 180 80" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,72 C20,68 35,60 55,52 C75,44 90,38 110,28 C130,18 155,12 180,6"
                    stroke="#6366F1" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M0,72 C20,68 35,60 55,52 C75,44 90,38 110,28 C130,18 155,12 180,6 L180,80 L0,80Z"
                    fill="url(#velGrad)" />
                  <path d="M0,60 C20,58 35,55 55,58 C75,61 90,50 110,44 C130,38 155,32 180,28"
                    stroke="#8B5CF6" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="4 3" opacity="0.5" />
                </svg>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, pt: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 6, height: 2, borderRadius: 1, background: '#6366F1' }} />
                  <Typography sx={{ fontSize: '0.5rem', color: '#9CA3AF' }}>Current</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 6, height: 2, borderRadius: 1, background: '#8B5CF6', opacity: 0.5 }} />
                  <Typography sx={{ fontSize: '0.5rem', color: '#9CA3AF' }}>Previous</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* ─── static data ─── */
const COMPARE_MATRIX = [
  { julay: true,    monday: false, asana: false, notion: false },
  { julay: true,    monday: false, asana: false, notion: false },
  { julay: true,    monday: false, asana: false, notion: false },
  { julay: true,    monday: false, asana: false, notion: false },
  { julay: true,    monday: false, asana: false, notion: false },
  { julay: true,    monday: true,  asana: false, notion: false },
  { julay: true,    monday: true,  asana: true,  notion: false },
  { julay: true,    monday: true,  asana: true,  notion: false },
  { julay: true,    monday: true,  asana: true,  notion: false },
  { julay: true,    monday: true,  asana: false, notion: false },
  { julay: true,    monday: true,  asana: true,  notion: false },
  { julay: true,    monday: true,  asana: true,  notion: false },
  { julay: true,    monday: true,  asana: false, notion: false },
  { julay: true,    monday: true,  asana: false, notion: false },
  { julay: 'price', monday: 'price', asana: 'price', notion: 'price' },
  { julay: true,    monday: false, asana: false, notion: false },
];
const STATS_NUMS = [
  { num: 12, suffix: '' },
  { num: 20, suffix: '+' },
  { num: 10, suffix: '' },
  { num: 60, suffix: 's' },
];

const TRUSTED_BY = [
  { name: 'Airbnb',     style: { fontFamily: 'Georgia, serif', letterSpacing: '-0.03em' } },
  { name: 'HubSpot',    style: { fontWeight: 800, fontStyle: 'italic' } },
  { name: 'Zoom',       style: { fontWeight: 700 } },
  { name: 'Coca‑Cola',  style: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700 } },
  { name: 'Shopify',    style: { fontWeight: 700 } },
];

const FEATURES_STRIP = [
  { icon: '⊞', grad: 'linear-gradient(135deg,#6366F1,#8B5CF6)', title: 'All-in-One Workspace',  desc: 'Manage projects, tasks, clients, and documents in one place.' },
  { icon: '✨', grad: 'linear-gradient(135deg,#10B981,#059669)', title: 'AI-Powered Studio',      desc: 'Generate project plans, assign tasks, and get smart suggestions instantly.' },
  { icon: '⚡', grad: 'linear-gradient(135deg,#F59E0B,#EF4444)', title: 'Smart Automation',       desc: 'Automate workflows and save time on repetitive tasks.' },
  { icon: '📊', grad: 'linear-gradient(135deg,#3B82F6,#2563EB)', title: 'Real-Time Insights',     desc: 'Get powerful reports to make smarter business decisions.' },
  { icon: '👥', grad: 'linear-gradient(135deg,#EC4899,#8B5CF6)', title: 'Scalable for Everyone',  desc: 'Perfect for startups, agencies, and growing enterprises.' },
];

/* ═══════════════════════════════════════════════════════════ */
export default function Landing() {
  if (Capacitor.isNativePlatform()) return <Navigate to="/mobile-welcome" replace />;

  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [billing, setBilling] = useState('monthly');
  const [openFaq, setOpenFaq]  = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const FEATURES   = t('landing.features.items',   { returnObjects: true });
  const PLANS      = t('landing.pricing.plans',     { returnObjects: true });
  const FAQS       = t('landing.faq.items',         { returnObjects: true }).filter(f => !/(Notion|ClickUp)/i.test(f.q));
  const BADGES     = t('landing.badges',            { returnObjects: true });
  const STATS      = t('landing.stats',             { returnObjects: true });
  const PAINS      = t('landing.problem.pains',     { returnObjects: true });
  const FEATURE_NAMES = t('landing.compare.featureNames', { returnObjects: true });
  const PRICE_ROW     = t('landing.compare.startingPrice',{ returnObjects: true });

  const NAV_LINKS = [
    { label: t('landing.nav.whyJulay'), href: '#solutions' },
    { label: t('landing.nav.features'), href: '#features'  },
    { label: t('landing.nav.pricing'),  href: '#pricing'   },
    { label: t('landing.nav.faq'),      href: '#faq'       },
  ];

  const COMPARE = COMPARE_MATRIX.map((row, i) => ({
    feature: FEATURE_NAMES[i] || '',
    julay:   row.julay   === 'price' ? PRICE_ROW.julay   : row.julay,
    monday:  row.monday  === 'price' ? PRICE_ROW.monday  : row.monday,
    asana:   row.asana   === 'price' ? PRICE_ROW.asana   : row.asana,
    notion:  row.notion  === 'price' ? PRICE_ROW.notion  : row.notion,
  }));

  return (
    <Box sx={{ fontFamily: '"Inter", sans-serif', overflowX: 'hidden', background: 'white' }} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ─── MOBILE DRAWER ─── */}
      <Drawer anchor={isRTL ? 'left' : 'right'} open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}
        PaperProps={{ sx: { width: 260, background: 'white', borderLeft: '1px solid #E2E8F0' } }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={() => setMobileMenuOpen(false)}><Close /></IconButton>
        </Box>
        <List>
          {NAV_LINKS.map(l => (
            <ListItemButton key={l.label} component="a" href={l.href} onClick={() => setMobileMenuOpen(false)} sx={{ px: 3, py: 1.5 }}>
              <ListItemText primary={l.label} primaryTypographyProps={{ sx: { color: '#374151', fontWeight: 600 } }} />
            </ListItemButton>
          ))}
        </List>
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}><LanguageSwitcher /></Box>
          <Button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} variant="outlined"
            sx={{ fontWeight: 600, py: 1.25, borderRadius: 2, borderColor: '#D1D5DB', color: '#374151' }}>
            {t('landing.nav.login')}
          </Button>
          <Button onClick={() => { setMobileMenuOpen(false); navigate('/register'); }} variant="contained"
            sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', fontWeight: 700, py: 1.25, borderRadius: 2 }}>
            {t('landing.nav.start')}
          </Button>
        </Box>
      </Drawer>

      {/* ─── NAV ─── */}
      <Box component="nav" sx={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'white',
        borderBottom: '1px solid #F1F5F9',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Box component="a" href="#" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <Box component="img" src="/julay-logo-full.png" alt="Julay.org" sx={{ height: 34, objectFit: 'contain' }} />
          </Box>

          {/* Desktop nav links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3.5 }}>
            {NAV_LINKS.map(l => (
              <Typography key={l.label} component="a" href={l.href}
                sx={{ color: '#374151', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', cursor: 'pointer', transition: 'color 0.15s', '&:hover': { color: '#111827' } }}>
                {l.label}
              </Typography>
            ))}
          </Box>

          {/* Desktop actions */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1.5, alignItems: 'center' }}>
            <LanguageSwitcher />
            <Button onClick={() => navigate('/login')} variant="text"
              sx={{ color: '#374151', fontSize: '0.875rem', fontWeight: 600, '&:hover': { background: '#F8FAFC' } }}>
              {t('landing.nav.login')}
            </Button>
            <Button onClick={() => { trackEvent('cta_clicked', { location: 'nav' }); navigate('/register'); }} variant="contained"
              sx={{ background: 'linear-gradient(135deg,#6366F1,#7C3AED)', color: 'white', fontWeight: 700, px: 2.5, py: 1, borderRadius: 2, fontSize: '0.875rem', boxShadow: '0 2px 10px rgba(99,102,241,0.35)', '&:hover': { opacity: 0.9 } }}>
              {t('landing.nav.start')}
            </Button>
          </Box>

          {/* Mobile hamburger */}
          <IconButton onClick={() => setMobileMenuOpen(true)} sx={{ display: { xs: 'flex', md: 'none' }, color: '#374151' }}>
            <MenuIcon />
          </IconButton>
        </Box>
      </Box>

      {/* ─── HERO ─── */}
      <Box sx={{
        background: 'linear-gradient(155deg, #FAFAFF 0%, #EEE9FF 50%, #F0F4FF 100%)',
        pt: { xs: 11, md: 14 },
        pb: { xs: 5, md: 0 },
        overflow: 'hidden',
        minHeight: { lg: '88vh' },
        display: 'flex',
        alignItems: 'center',
      }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, width: '100%' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.25fr' }, gap: { xs: 6, lg: 6 }, alignItems: 'center' }}>

            {/* Left copy */}
            <Box sx={{ pb: { lg: 6 } }}>
              {/* Headline */}
              <Typography sx={{
                fontSize: { xs: '2.8rem', sm: '3.4rem', md: '4rem', lg: '4.2rem' },
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: '#0A0A14',
                lineHeight: 1.08,
                mb: 0.25,
              }}>
                More than a<br />work platform.
              </Typography>
              <Typography sx={{
                fontSize: { xs: '2.8rem', sm: '3.4rem', md: '4rem', lg: '4.2rem' },
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.08,
                mb: 3,
                background: 'linear-gradient(130deg,#6366F1 20%,#7C3AED 80%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                It's your growth<br />engine.
              </Typography>

              {/* Subtitle */}
              <Typography sx={{ color: '#6B7280', fontSize: { xs: '1rem', md: '1.05rem' }, lineHeight: 1.75, mb: 4, maxWidth: 440 }}>
                Julay.org combines powerful project management with built-in financial tools to help your team work smarter and your business grow faster.
              </Typography>

              {/* CTAs */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 5 }}>
                <Button onClick={() => { trackEvent('cta_clicked', { location: 'hero' }); navigate('/register'); }} variant="contained" size="large"
                  sx={{ background: 'linear-gradient(135deg,#6366F1,#7C3AED)', color: 'white', fontWeight: 700, px: 3.5, py: 1.6, borderRadius: 2, fontSize: '0.95rem', boxShadow: '0 4px 20px rgba(99,102,241,0.45)', '&:hover': { opacity: 0.9, transform: 'translateY(-1px)' }, transition: 'all 0.2s' }}>
                  {t('landing.nav.start')}
                </Button>
                <Button onClick={() => navigate('/login')} variant="outlined" size="large"
                  sx={{ borderColor: '#D1D5DB', color: '#374151', fontWeight: 600, px: 3.5, py: 1.6, borderRadius: 2, fontSize: '0.95rem', background: 'white', '&:hover': { background: '#F9FAFB', borderColor: '#9CA3AF' } }}>
                  {t('landing.nav.login')}
                </Button>
              </Box>

            </Box>

            {/* Right — dashboard */}
            <Box sx={{ display: { xs: 'none', lg: 'block' }, pt: 2, pb: 4 }}>
              <DashboardMockup />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ─── FEATURES STRIP ─── */}
      <Box sx={{ background: '#F5F3FF', py: { xs: 5, md: 5.5 } }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5,1fr)' }, gap: { xs: 3, md: 4 } }}>
            {FEATURES_STRIP.map((f, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1.75, alignItems: 'flex-start' }}>
                <Box sx={{ width: 42, height: 42, borderRadius: 2.5, background: f.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.2rem' }}>
                  {f.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827', mb: 0.4, lineHeight: 1.3 }}>{f.title}</Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: '#6B7280', lineHeight: 1.55 }}>{f.desc}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ─── PROBLEM ─── */}
      <Box id="solutions" sx={{ background: '#FAFAFA', py: { xs: 8, md: 14 }, borderTop: '1px solid #F1F1F8' }}>
        <Container maxWidth="md">
          <FadeIn>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Chip label={t('landing.problem.chip')} sx={{ mb: 3, background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em' }} />
              <Typography variant="h2" sx={{ color: '#0A0A14', fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, mb: 2 }}>
                {t('landing.problem.title')}{' '}
                <Box component="span" sx={{ color: '#6366F1', textDecoration: 'line-through' }}>{t('landing.problem.strike')}</Box>
              </Typography>
              <Typography sx={{ color: '#6B7280', fontSize: '1.1rem', lineHeight: 1.7 }}>{t('landing.problem.sub')}</Typography>
            </Box>
          </FadeIn>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {PAINS.map((p, i) => (
              <FadeIn key={i} delay={i * 80}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2.5, borderRadius: 2.5, border: '1.5px solid #C7D2FE', background: '#F5F3FF' }}>
                  <Close sx={{ color: '#6366F1', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
                  <Typography sx={{ color: '#374151', fontSize: '0.9rem', lineHeight: 1.5, fontWeight: 500 }}>{p}</Typography>
                </Box>
              </FadeIn>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ─── FEATURES ─── */}
      <Box id="features" sx={{ background: 'white', py: { xs: 8, md: 16 } }}>
        <Container maxWidth="lg">
          <FadeIn>
            <Box sx={{ textAlign: 'center', mb: 10 }}>
              <Chip label={t('landing.features.chip')} sx={{ mb: 3, background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em' }} />
              <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A', lineHeight: 1.15, mb: 2 }}>
                {t('landing.features.title')}{' '}
                <Box component="span" sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('landing.features.titleGrad')}</Box>
              </Typography>
              <Typography sx={{ color: '#64748B', fontSize: '1.1rem', maxWidth: 550, mx: 'auto' }}>{t('landing.features.sub')}</Typography>
            </Box>
          </FadeIn>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3,1fr)' }, gap: 2.5 }}>
            {FEATURES.map((f, i) => (
              <FadeIn key={i} delay={i * 50}>
                <Box sx={{ p: 3, borderRadius: 3, border: '1.5px solid #E2E8F0', transition: 'all 0.2s', '&:hover': { borderColor: '#6366F1', boxShadow: '0 8px 32px rgba(99,102,241,0.12)', transform: 'translateY(-4px)' } }}>
                  <Typography sx={{ fontSize: '2rem', mb: 1.5 }}>{f.icon}</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', mb: 0.75 }}>{f.title}</Typography>
                  <Typography sx={{ color: '#64748B', fontSize: '0.875rem', lineHeight: 1.65 }}>{f.desc}</Typography>
                </Box>
              </FadeIn>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ─── EARLY ADOPTERS CTA ─── */}
      <Box sx={{ background: 'white', py: { xs: 8, md: 14 } }}>
        <Container maxWidth="md">
          <FadeIn>
            <Box sx={{ textAlign: 'center', p: { xs: 5, md: 8 }, borderRadius: 4, border: '2px solid #E2E8F0', background: 'linear-gradient(135deg,#F8FAFC,#EEF2FF)' }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.75, borderRadius: 99, background: '#EEF2FF', border: '1px solid rgba(99,102,241,0.3)', mb: 3 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
                <Typography sx={{ color: '#4F46E5', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.05em' }}>{t('landing.earlyAccess.badge')}</Typography>
              </Box>
              <Typography variant="h2" sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', mb: 2 }}>
                {t('landing.earlyAccess.title')}
              </Typography>
              <Typography sx={{ color: '#64748B', fontSize: '1rem', lineHeight: 1.7, mb: 4, maxWidth: 480, mx: 'auto' }}>{t('landing.earlyAccess.sub')}</Typography>
              <Button onClick={() => navigate('/register')} variant="contained" size="large"
                sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', fontWeight: 700, px: 4, py: 1.75, borderRadius: 2.5, fontSize: '1rem', boxShadow: '0 4px 24px rgba(99,102,241,0.35)', '&:hover': { opacity: 0.9 } }}>
                {t('landing.earlyAccess.cta')} <ArrowForward sx={{ ml: 1, fontSize: 18 }} />
              </Button>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 4 }}>
                {t('landing.earlyAccess.perks', { returnObjects: true }).map((perk, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <CheckCircle sx={{ color: '#10B981', fontSize: 15 }} />
                    <Typography sx={{ color: '#64748B', fontSize: '0.82rem' }}>{perk}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </FadeIn>
        </Container>
      </Box>

      {/* ─── PRICING ─── */}
      <Box id="pricing" sx={{ background: '#F8FAFC', py: { xs: 8, md: 14 } }}>
        <Container maxWidth="lg">
          <FadeIn>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Chip label={t('landing.pricing.chip')} sx={{ mb: 3, background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em' }} />
              <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A', lineHeight: 1.15, mb: 2 }}>
                {t('landing.pricing.title')}
              </Typography>
              <Typography sx={{ color: '#64748B', fontSize: '1.05rem', mb: 2 }}>{t('landing.pricing.sub')}</Typography>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.75, borderRadius: 99, background: '#EEF2FF', border: '1px solid #C7D2FE', mb: 4 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
                <Typography sx={{ color: '#4F46E5', fontSize: '0.78rem', fontWeight: 700 }}>{t('landing.pricing.foundingBadge')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <ToggleButtonGroup value={billing} exclusive onChange={(_, v) => v && setBilling(v)} sx={{ background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 2, p: 0.5 }}>
                  <ToggleButton value="monthly" sx={{ px: 3, py: 1, borderRadius: 1.5, fontSize: '0.85rem', fontWeight: 600, border: 'none', '&.Mui-selected': { background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white' } }}>{t('landing.pricing.monthly')}</ToggleButton>
                  <ToggleButton value="yearly"  sx={{ px: 3, py: 1, borderRadius: 1.5, fontSize: '0.85rem', fontWeight: 600, border: 'none', '&.Mui-selected': { background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white' } }}>
                    {t('landing.pricing.yearly')} <Box component="span" sx={{ ml: 0.75, px: 0.75, py: 0.15, borderRadius: 1, background: '#10B981', color: 'white', fontSize: '0.68rem', fontWeight: 800 }}>-22%</Box>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>
          </FadeIn>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4,1fr)' }, gap: 2.5, alignItems: 'start' }}>
            {PLANS.map((plan, i) => (
              <FadeIn key={i} delay={i * 80}>
                <Box sx={{ position: 'relative', borderRadius: 3, border: plan.highlight ? '2px solid #6366F1' : '1.5px solid #E2E8F0', background: 'white', boxShadow: plan.highlight ? '0 8px 40px rgba(99,102,241,0.2)' : '0 1px 4px rgba(0,0,0,0.04)', transform: plan.highlight ? 'scale(1.03)' : 'none', transition: 'all 0.2s', '&:hover': { boxShadow: '0 12px 40px rgba(0,0,0,0.1)', transform: plan.highlight ? 'scale(1.05)' : 'translateY(-4px)' } }}>
                  {plan.popular && <Box sx={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', px: 2, py: 0.5, borderRadius: 99, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}><Typography sx={{ color: 'white', fontSize: '0.72rem', fontWeight: 800 }}>{t('landing.pricing.mostPopular')}</Typography></Box>}
                  <Box sx={{ p: 3.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', mb: 0.5 }}>{plan.name}</Typography>
                    <Typography sx={{ color: '#64748B', fontSize: '0.82rem', mb: 2.5 }}>{plan.description}</Typography>
                    <Box sx={{ mb: 3 }}>
                      {plan.price === 0 ? (
                        <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1 }}>{t('landing.pricing.free')}</Typography>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                          <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: '#64748B', mt: 0.5 }}>$</Typography>
                          <Typography sx={{ fontSize: '2.8rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1 }}>
                            {billing === 'yearly' ? plan.yearlyPrice : plan.price}
                          </Typography>
                          <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>{t('landing.pricing.perMo')}</Typography>
                        </Box>
                      )}
                      {billing === 'yearly' && plan.price > 0 && <Typography sx={{ color: '#10B981', fontSize: '0.78rem', fontWeight: 600, mt: 0.5 }}>{t('landing.pricing.saveYear', { amount: (plan.price - plan.yearlyPrice) * 12 })}</Typography>}
                    </Box>
                    <Button onClick={() => navigate('/register')} variant={plan.ctaVariant} fullWidth
                      sx={{ mb: 3, py: 1.25, fontWeight: 700, borderRadius: 2, ...(plan.ctaVariant === 'contained' ? { background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)', '&:hover': { opacity: 0.9 } } : { borderWidth: '1.5px', '&:hover': { borderWidth: '1.5px' } }) }}>
                      {plan.cta}
                    </Button>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                      {plan.features.map((f, fi) => (
                        <Box key={fi} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <CheckCircle sx={{ color: plan.highlight ? '#6366F1' : '#10B981', fontSize: 16, flexShrink: 0, mt: 0.2 }} />
                          <Typography sx={{ color: '#475569', fontSize: '0.83rem', lineHeight: 1.4 }}>{f}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </FadeIn>
            ))}
          </Box>
          <FadeIn delay={200}>
            <Box sx={{ mt: 6, p: 4, borderRadius: 3, border: '1.5px solid #E2E8F0', background: 'white', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 3 }}>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0F172A', mb: 0.5 }}>{t('landing.pricing.enterprise.title')}</Typography>
                <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>{t('landing.pricing.enterprise.sub')}</Typography>
              </Box>
              <Button onClick={() => navigate('/contact')} variant="outlined" size="large" sx={{ flexShrink: 0, px: 3.5, py: 1.25, fontWeight: 700, borderWidth: '1.5px', borderRadius: 2, whiteSpace: 'nowrap' }}>{t('landing.pricing.enterprise.cta')}</Button>
            </Box>
          </FadeIn>
        </Container>
      </Box>

      {/* ─── REFERRAL ─── */}
      <Box sx={{ background: '#F5F3FF', py: { xs: 8, md: 14 }, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: '10%', right: '5%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: '10%', left: '5%', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <Container maxWidth="lg">
          <FadeIn>
            <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
              <Chip label={t('landing.referral.chip')} sx={{ mb: 3, background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', border: '1px solid #C7D2FE' }} />
              <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 800, color: '#0A0A14', letterSpacing: '-0.03em', mb: 2 }}>
                {t('landing.referral.title')}{' '}
                <Box component="span" sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('landing.referral.titleGrad')}</Box>
              </Typography>
              <Typography sx={{ color: '#6B7280', fontSize: '1.05rem', maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}>{t('landing.referral.sub')}</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' }, gap: 3, mb: 8 }}>
              {t('landing.referral.steps', { returnObjects: true }).map(item => (
                <Box key={item.step} sx={{ position: 'relative', p: 3, borderRadius: 3, border: '1.5px solid #DDD6FE', background: 'white', boxShadow: '0 2px 12px rgba(99,102,241,0.08)' }}>
                  <Typography sx={{ position: 'absolute', top: 16, right: 20, fontSize: '0.72rem', fontWeight: 800, color: '#C4B5FD', letterSpacing: '0.1em' }}>{item.step}</Typography>
                  <Typography sx={{ fontSize: '2.2rem', mb: 2 }}>{item.icon}</Typography>
                  <Typography sx={{ color: '#111827', fontWeight: 700, fontSize: '1.05rem', mb: 1 }}>{item.title}</Typography>
                  <Typography sx={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.65 }}>{item.desc}</Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, mb: 8 }}>
              {(['♾️','🆓','📅','⚡']).map((icon, i) => {
                const labels = t('landing.referral.perks', { returnObjects: true });
                return (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderRadius: 99, background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
                    <Typography sx={{ fontSize: '1rem' }}>{icon}</Typography>
                    <Typography sx={{ color: '#4F46E5', fontSize: '0.82rem', fontWeight: 600 }}>{labels[i]}</Typography>
                  </Box>
                );
              })}
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Button onClick={() => navigate('/register')} variant="contained" size="large"
                sx={{ background: 'linear-gradient(135deg,#6366F1,#7C3AED)', color: 'white', fontWeight: 700, px: 5, py: 1.75, borderRadius: 2.5, fontSize: '1rem', boxShadow: '0 4px 24px rgba(99,102,241,0.35)', '&:hover': { opacity: 0.9 } }}>
                {t('landing.referral.cta')} <ArrowForward sx={{ ml: 1, fontSize: 18 }} />
              </Button>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.8rem', mt: 2 }}>{t('landing.referral.existing')}</Typography>
            </Box>
          </FadeIn>
        </Container>
      </Box>

      {/* ─── FAQ ─── */}
      <Box id="faq" sx={{ background: 'white', py: { xs: 8, md: 14 } }}>
        <Container maxWidth="md">
          <FadeIn>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Chip label={t('landing.faq.chip')} sx={{ mb: 3, background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em' }} />
              <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A' }}>{t('landing.faq.title')}</Typography>
            </Box>
          </FadeIn>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {FAQS.map((faq, i) => (
              <FadeIn key={i} delay={i * 60}>
                <Box sx={{ borderRadius: 2.5, border: '1.5px solid', borderColor: openFaq === i ? '#6366F1' : '#E2E8F0', overflow: 'hidden', transition: 'all 0.2s', '&:hover': { borderColor: '#6366F1' } }}>
                  <Box onClick={() => setOpenFaq(openFaq === i ? null : i)} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5, cursor: 'pointer', background: openFaq === i ? 'rgba(99,102,241,0.04)' : 'transparent' }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#0F172A', pr: 2 }}>{faq.q}</Typography>
                    <Typography sx={{ color: '#6366F1', fontWeight: 800, fontSize: '1.3rem', flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</Typography>
                  </Box>
                  {openFaq === i && <Box sx={{ px: 2.5, pb: 2.5, borderTop: '1px solid rgba(99,102,241,0.1)' }}><Typography sx={{ color: '#475569', lineHeight: 1.7, fontSize: '0.9rem', pt: 2 }}>{faq.a}</Typography></Box>}
                </Box>
              </FadeIn>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ─── FINAL CTA ─── */}
      <Box sx={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 60%, #6D28D9 100%)', py: { xs: 10, md: 16 }, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, rgba(139,92,246,0.4) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 80%, rgba(99,102,241,0.3) 0%, transparent 50%)', pointerEvents: 'none' }} />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <FadeIn>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2.5, py: 0.75, borderRadius: 99, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', mb: 4 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#FCD34D', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.78rem', fontWeight: 700 }}>{t('landing.waitlistBadge')}</Typography>
            </Box>
            <Typography variant="h2" sx={{ color: 'white', fontSize: { xs: '2.5rem', md: '4rem' }, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, mb: 3 }}>
              {t('landing.finalCta.title')}{' '}
              <Box component="span" sx={{ color: '#FCD34D' }}>{t('landing.finalCta.titleGrad')}</Box>
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', mb: 6, maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}>{t('landing.finalCta.sub')}</Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center' }}>
              <Button onClick={() => navigate('/register')} variant="contained" size="large"
                sx={{ background: 'white', color: '#4F46E5', fontWeight: 800, px: 5, py: 2, borderRadius: 2.5, fontSize: '1.05rem', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', '&:hover': { background: '#F5F5FF', transform: 'translateY(-2px)' }, transition: 'all 0.2s' }}>
                {t('landing.finalCta.cta')} <ArrowForward sx={{ ml: 1, fontSize: 18 }} />
              </Button>
              <Button onClick={() => navigate('/login')} variant="outlined" size="large"
                sx={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white', fontWeight: 700, px: 4, py: 2, borderRadius: 2.5, fontSize: '1.05rem', '&:hover': { borderColor: 'white', background: 'rgba(255,255,255,0.1)' } }}>
                {t('landing.nav.login')}
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', mt: 5 }}>
              {t('landing.finalCta.perks', { returnObjects: true }).map((perk, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <CheckCircleOutline sx={{ color: '#A7F3D0', fontSize: 15 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>{perk}</Typography>
                </Box>
              ))}
            </Box>
          </FadeIn>
        </Container>
      </Box>

      {/* ─── FOOTER ─── */}
      <Box sx={{ background: '#111827', borderTop: '1px solid #1F2937', py: 6 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, justifyContent: 'space-between', mb: 5 }}>
            <Box sx={{ maxWidth: 280 }}>
              <Box sx={{ mb: 2 }}>
                <Box component="img" src="/julay-logo-full.png" alt="Julay.org" sx={{ height: 30, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.85 }} />
              </Box>
              <Typography sx={{ color: '#6B7280', fontSize: '0.85rem', lineHeight: 1.65 }}>{t('landing.footer.tagline')}</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
              {[
                { col: t('landing.footer.product', { returnObjects: true }), hrefs: ['/#features', '/pricing', '/pricing', '/changelog'] },
                { col: t('landing.footer.company', { returnObjects: true }), hrefs: ['/about', '/blog', '/careers', '/contact'] },
                { col: t('landing.footer.legal',   { returnObjects: true }), hrefs: ['/privacy', '/terms', '/security', '/cookies'] },
              ].map(({ col, hrefs }) => (
                <Box key={col.title}>
                  <Typography sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 2 }}>{col.title}</Typography>
                  {col.links.map((l, li) => (
                    <Typography key={li} component="a" href={hrefs[li] || '#'}
                      sx={{ color: '#6B7280', fontSize: '0.85rem', mb: 1.25, cursor: 'pointer', display: 'block', textDecoration: 'none', transition: 'color 0.15s', '&:hover': { color: '#D1D5DB' } }}>{l}</Typography>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
          <Divider sx={{ borderColor: '#1F2937', mb: 4 }} />
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ color: '#4B5563', fontSize: '0.82rem' }}>{t('landing.footer.copy')}</Typography>
            <Typography sx={{ color: '#4B5563', fontSize: '0.82rem' }}>{t('landing.footer.built')}</Typography>
          </Box>
        </Container>
      </Box>

    </Box>
  );
}
