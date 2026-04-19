import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Button, Container, Chip, Avatar, ToggleButtonGroup, ToggleButton, Divider, IconButton, Drawer, List, ListItemButton, ListItemText } from '@mui/material';
import { ArrowForward, AutoAwesome, CheckCircle, CheckCircleOutline, Close, PlayArrow, Menu as MenuIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher.jsx';
import { trackEvent } from '../components/common/Analytics.jsx';

/* ─── Gradient orb ─── */
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

/* ─── AI Demo animation ─── */
function AIDemoCard() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const tasks = t('landing.demo.tasks', { returnObjects: true });

  const handleGenerate = () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setGenerated(false);
    // Simulate a brief loading then show mock tasks — no real API call
    setTimeout(() => { setLoading(false); setGenerated(true); }, 1200);
  };

  const handleReset = () => { setGenerated(false); setInput(''); };

  return (
    <Box sx={{ background: '#0F172A', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', width: '100%', maxWidth: 560, mx: 'auto', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
      {/* Window chrome */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
        {['#EF4444','#F59E0B','#10B981'].map(c => <Box key={c} sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c }} />)}
        <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', ml: 1 }}>julay.org · AI Studio</Typography>
      </Box>
      <Box sx={{ p: 3 }}>
        {/* Input */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('landing.demo.label')}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 2, border: `1.5px solid ${input.trim() ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)'}`, background: 'rgba(99,102,241,0.04)', transition: 'border-color 0.2s' }}>
            <Box
              component="input"
              value={input}
              onChange={e => { setInput(e.target.value); setGenerated(false); }}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder={t('landing.demo.prompt')}
              sx={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#E2E8F0', fontSize: '0.88rem', fontFamily: 'inherit', '&::placeholder': { color: 'rgba(255,255,255,0.25)' } }}
            />
            <Box
              onClick={generated ? handleReset : handleGenerate}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.6, borderRadius: 1.5, background: input.trim() ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'rgba(255,255,255,0.06)', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.2s', flexShrink: 0, '&:hover': input.trim() ? { opacity: 0.85 } : {} }}
            >
              <AutoAwesome sx={{ fontSize: 13, color: input.trim() ? 'white' : 'rgba(255,255,255,0.3)', animation: loading ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />
              <Typography sx={{ color: input.trim() ? 'white' : 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: 700 }}>
                {generated ? '↺' : t('landing.demo.generate')}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Loading shimmer */}
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[1,2,3].map(i => <Box key={i} sx={{ height: 42, borderRadius: 1.5, background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1s infinite', '@keyframes shimmer': { '0%,100%': { opacity: 0.3 }, '50%': { opacity: 0.7 } } }} />)}
          </Box>
        )}

        {/* Generated tasks */}
        {generated && !loading && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              <Typography sx={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>{t('landing.demo.generated')}</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {tasks.map((task, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: 1.5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', animation: `slideIn 0.3s ease ${i * 80}ms both`, '@keyframes slideIn': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: task.status === 'done' ? '#10B981' : task.status === 'in_progress' ? '#6366F1' : '#475569' }} />
                  <Typography sx={{ color: '#E2E8F0', fontSize: '0.8rem', flex: 1 }} noWrap>{task.title}</Typography>
                  <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', flexShrink: 0 }}>{task.assignee[0]}</Avatar>
                  <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', flexShrink: 0 }}>{task.hours}h</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Empty state */}
        {!generated && !loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[1,2,3].map(i => <Box key={i} sx={{ height: 42, borderRadius: 1.5, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.06)' }} />)}
          </Box>
        )}
      </Box>
    </Box>
  );
}

/* ─── Static comparison matrix (values only, names come from translations) ─── */
const COMPARE_MATRIX = [
  { julay: true,     monday: false, asana: false, notion: false },
  { julay: true,     monday: false, asana: false, notion: false },
  { julay: true,     monday: false, asana: false, notion: false },
  { julay: true,     monday: false, asana: false, notion: false },
  { julay: true,     monday: false, asana: false, notion: false },
  { julay: true,     monday: true,  asana: false, notion: false },
  { julay: true,     monday: true,  asana: true,  notion: false },
  { julay: true,     monday: true,  asana: true,  notion: false },
  { julay: true,     monday: true,  asana: true,  notion: false },
  { julay: true,     monday: true,  asana: false, notion: false },
  { julay: true,     monday: true,  asana: true,  notion: false },
  { julay: true,     monday: true,  asana: true,  notion: false },
  { julay: true,     monday: true,  asana: false, notion: false },
  { julay: true,     monday: true,  asana: false, notion: false },
  { julay: 'price',  monday: 'price', asana: 'price', notion: 'price' },
  { julay: true,     monday: false, asana: false, notion: false },
];

const LOGOS = ['NovaTech', 'Tamatem', 'BuildStack', 'Fintech.io', 'ZeroGravity', 'Shift Media', 'Launchpad', 'CoreSystems'];
const TOOLS = ['Monday', 'Asana', 'Notion'];

const STATS_NUMS = [
  { num: 12, suffix: '' },
  { num: 20, suffix: '+' },
  { num: 10, suffix: '' },
  { num: 60, suffix: 's' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [billing, setBilling] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const demoRef = useRef(null);

  const FEATURES = t('landing.features.items', { returnObjects: true });
  const PLANS = t('landing.pricing.plans', { returnObjects: true });
  const FAQS = t('landing.faq.items', { returnObjects: true });
  const BADGES = t('landing.badges', { returnObjects: true });
  const STATS = t('landing.stats', { returnObjects: true });
  const PAINS = t('landing.problem.pains', { returnObjects: true });
  const FEATURE_NAMES = t('landing.compare.featureNames', { returnObjects: true });
  const PRICE_ROW = t('landing.compare.startingPrice', { returnObjects: true });
  const NAV_LINKS = [
    { key: 'features', label: t('landing.nav.features') },
    { key: 'pricing', label: t('landing.nav.pricing') },
    { key: 'faq', label: t('landing.nav.faq') },
  ];

  const COMPARE = COMPARE_MATRIX.map((row, i) => ({
    feature: FEATURE_NAMES[i] || '',
    julay: row.julay === 'price' ? PRICE_ROW.julay : row.julay,
    monday: row.monday === 'price' ? PRICE_ROW.monday : row.monday,
    asana: row.asana === 'price' ? PRICE_ROW.asana : row.asana,
    notion: row.notion === 'price' ? PRICE_ROW.notion : row.notion,
  }));

  const scrollToDemo = () => {
    demoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <Box sx={{ fontFamily: '"Inter", sans-serif', overflowX: 'hidden' }} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ─── MOBILE DRAWER ─── */}
      <Drawer anchor={isRTL ? 'left' : 'right'} open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}
        PaperProps={{ sx: { width: 260, background: '#09090B', borderLeft: '1px solid rgba(255,255,255,0.08)' } }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={() => setMobileMenuOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
            <Close />
          </IconButton>
        </Box>
        <List>
          {NAV_LINKS.map(l => (
            <ListItemButton key={l.key} component="a" href={`#${l.key}`} onClick={() => setMobileMenuOpen(false)}
              sx={{ px: 3, py: 1.5, '&:hover': { background: 'rgba(255,255,255,0.06)' } }}>
              <ListItemText primary={l.label} primaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: '1rem' } }} />
            </ListItemButton>
          ))}
        </List>
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <LanguageSwitcher dark />
          </Box>
          <Button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} variant="outlined"
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', fontWeight: 600, py: 1.25, borderRadius: 2 }}>
            {t('landing.nav.login')}
          </Button>
          <Button onClick={() => { setMobileMenuOpen(false); navigate('/register'); }} variant="contained"
            sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', fontWeight: 700, py: 1.25, borderRadius: 2 }}>
            {t('landing.nav.start')}
          </Button>
        </Box>
      </Drawer>

      {/* ─── NAV ─── */}
      <Box component="nav" aria-label="Main navigation" sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,11,0.85)' }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 1.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Spacer — actual icon is fixed-positioned below straddling the nav border */}
          <Box sx={{ width: 200, flexShrink: 0 }} />

          {/* Desktop nav links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3 }}>
            {NAV_LINKS.map(l => (
              <Typography key={l.key} component="a" href={`#${l.key}`} sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', textDecoration: 'none', cursor: 'pointer', transition: 'color 0.15s', '&:hover': { color: 'white' } }}>{l.label}</Typography>
            ))}
          </Box>

          {/* Desktop buttons */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1.5, alignItems: 'center' }}>
            <LanguageSwitcher dark />
            <Button onClick={() => navigate('/login')} variant="text" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', '&:hover': { color: 'white', background: 'rgba(255,255,255,0.06)' } }}>{t('landing.nav.login')}</Button>
            <Button onClick={() => navigate('/register')} variant="contained" sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', fontWeight: 700, px: 2.5, py: 0.9, borderRadius: 2, fontSize: '0.88rem', boxShadow: '0 0 20px rgba(99,102,241,0.4)', '&:hover': { opacity: 0.9, boxShadow: '0 0 30px rgba(99,102,241,0.5)' } }}>
              {t('landing.nav.start')}
            </Button>
          </Box>

          {/* Mobile hamburger */}
          <IconButton onClick={() => setMobileMenuOpen(true)} sx={{ display: { xs: 'flex', md: 'none' }, color: 'rgba(255,255,255,0.7)' }}>
            <MenuIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Split logo — top half in navbar, bottom half in hero */}
      <Box sx={{
        position: 'fixed',
        top: -42,
        left: { xs: 16, md: 32 },
        height: 216,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        zIndex: 101,
        pointerEvents: 'none',
      }}>
        <Box
          component="img"
          src="/logo-icon.png"
          alt=""
          sx={{ height: 216, width: 216, objectFit: 'contain', flexShrink: 0 }}
        />
        <Typography sx={{
          fontSize: '2.6rem',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          background: 'linear-gradient(135deg, #818CF8 0%, #C084FC 50%, #38BDF8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
          userSelect: 'none',
          display: { xs: 'none', md: 'block' },
        }}>
          Julay
        </Typography>
      </Box>

      {/* ─── HERO ─── */}
      <Box sx={{ position: 'relative', background: '#09090B', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', pt: 10 }}>
        <Orb sx={{ width: 600, height: 600, background: 'rgba(99,102,241,0.15)', top: -200, left: -200 }} />
        <Orb sx={{ width: 500, height: 500, background: 'rgba(139,92,246,0.12)', top: 100, right: -150 }} />
        <Orb sx={{ width: 300, height: 300, background: 'rgba(6,182,212,0.08)', bottom: 50, left: '40%' }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 8, md: 12 } }}>
          <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto', mb: 8 }}>
            {/* Badge */}
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.75, borderRadius: 99, border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.1)', mb: 4 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: 0.5, transform: 'scale(0.8)' } } }} />
              <Typography sx={{ color: '#A5B4FC', fontSize: '0.8rem', fontWeight: 600 }}>{t('landing.hero.badge')}</Typography>
            </Box>

            {/* H1 */}
            <Typography variant="h1" sx={{ color: 'white', fontSize: { xs: '2.8rem', md: '4.5rem', lg: '5.2rem' }, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em', mb: 3 }}>
              {t('landing.hero.h1a')}{' '}
              <Box component="span" sx={{ background: 'linear-gradient(135deg, #818CF8, #C084FC, #38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t('landing.hero.h1b')}
              </Box>
            </Typography>

            <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: { xs: '1.05rem', md: '1.25rem' }, lineHeight: 1.65, mb: 5, maxWidth: 600, mx: 'auto' }}>
              {t('landing.hero.sub')}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center', mb: 3 }}>
              <Button onClick={() => { trackEvent('cta_clicked', { location: 'hero' }); navigate('/register'); }} variant="contained" size="large" aria-label="Start for free — no credit card required" sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', fontWeight: 700, px: 4, py: 1.75, borderRadius: 2.5, fontSize: '1rem', boxShadow: '0 4px 24px rgba(99,102,241,0.45)', '&:hover': { opacity: 0.9, transform: 'translateY(-2px)', boxShadow: '0 8px 32px rgba(99,102,241,0.5)' }, transition: 'all 0.2s' }}>
                {t('landing.hero.cta1')}
              </Button>
              <Button onClick={scrollToDemo} variant="outlined" size="large" sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', fontWeight: 600, px: 3.5, py: 1.75, borderRadius: 2.5, fontSize: '1rem', '&:hover': { borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' } }}>
                <PlayArrow sx={{ fontSize: 18, mr: 0.75 }} /> {t('landing.hero.cta2')}
              </Button>
            </Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
              {t('landing.hero.tagline')}
            </Typography>
          </Box>

          {/* AI Demo */}
          <FadeIn delay={300}>
            <Box ref={demoRef}>
              <AIDemoCard />
            </Box>
          </FadeIn>
        </Container>
      </Box>

      {/* ─── FEATURE BADGES ─── */}
      <Box sx={{ background: '#09090B', borderTop: '1px solid rgba(255,255,255,0.06)', py: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: { xs: 2, md: 5 } }}>
            {BADGES.map((badge, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <CheckCircleOutline sx={{ color: '#6366F1', fontSize: 14 }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.83rem', fontWeight: 500 }}>{badge}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ─── PRODUCT STATS ─── */}
      <Box sx={{ background: '#09090B', borderBottom: '1px solid rgba(255,255,255,0.06)', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,1fr)' }, gap: 3 }}>
            {STATS_NUMS.map((s, i) => (
              <FadeIn key={i} delay={i * 100}>
                <Box sx={{ textAlign: 'center', p: 3, borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  <Typography sx={{ color: 'white', fontSize: { xs: '2.2rem', md: '3rem' }, fontWeight: 800, letterSpacing: '-0.04em', background: 'linear-gradient(135deg,#818CF8,#C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    <AnimCounter end={s.num} suffix={s.suffix} />
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', mt: 0.5 }}>{STATS[i]?.label}</Typography>
                </Box>
              </FadeIn>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ─── PROBLEM ─── */}
      <Box sx={{ background: '#09090B', py: { xs: 8, md: 14 } }}>
        <Container maxWidth="md">
          <FadeIn>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Chip label={t('landing.problem.chip')} sx={{ mb: 3, background: 'rgba(239,68,68,0.08)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.18)', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em' }} />
              <Typography variant="h2" sx={{ color: 'white', fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, mb: 2 }}>
                {t('landing.problem.title')}{' '}
                <Box component="span" sx={{ color: '#EF4444', textDecoration: 'line-through' }}>{t('landing.problem.strike')}</Box>
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '1.1rem', lineHeight: 1.7 }}>
                {t('landing.problem.sub')}
              </Typography>
            </Box>
          </FadeIn>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {PAINS.map((p, i) => (
              <FadeIn key={i} delay={i * 80}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2.5, borderRadius: 2, border: '1px solid rgba(239,68,68,0.1)', background: 'rgba(239,68,68,0.03)' }}>
                  <Close sx={{ color: '#F87171', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.5 }}>{p}</Typography>
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
              <Typography sx={{ color: '#64748B', fontSize: '1.1rem', maxWidth: 550, mx: 'auto' }}>
                {t('landing.features.sub')}
              </Typography>
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

      {/* ─── COMPARE ─── hidden temporarily */}
      {false && <Box id="compare" sx={{ background: '#F8FAFC', py: { xs: 8, md: 14 } }}>
        <Container maxWidth="lg">
          <FadeIn>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Chip label={t('landing.compare.chip')} sx={{ mb: 3, background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em' }} />
              <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A', lineHeight: 1.15, mb: 2 }}>
                {t('landing.compare.title')}
              </Typography>
              <Typography sx={{ color: '#64748B', fontSize: '1.05rem' }}>{t('landing.compare.sub')}</Typography>
              <Box sx={{ display: 'inline-block', mt: 2, px: 3, py: 1, borderRadius: 99, background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.25)' }}>
                <Typography sx={{ color: '#6366F1', fontSize: '0.92rem', fontWeight: 700, fontStyle: 'italic' }}>
                  Others help you manage work. Julay does it for you.
                </Typography>
              </Box>
            </Box>
          </FadeIn>
          <Box sx={{ borderRadius: 4, overflow: 'hidden', border: '1.5px solid #E2E8F0', background: 'white', boxShadow: '0 4px 32px rgba(0,0,0,0.06)' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr repeat(4,1fr)', background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
              <Box sx={{ p: 2.5 }} />
              {['Julay', ...TOOLS].map((t, i) => (
                <Box key={i} sx={{ p: 2.5, textAlign: 'center', borderLeft: '1px solid #E2E8F0', background: t === 'Julay' ? 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.08))' : 'transparent', boxShadow: t === 'Julay' ? 'inset 0 -2px 12px rgba(99,102,241,0.15)' : 'none' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: t === 'Julay' ? '#4F46E5' : '#475569' }}>{t}</Typography>
                  {t === 'Julay' && <Box sx={{ width: 40, height: 2, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', mx: 'auto', mt: 0.5, borderRadius: 1 }} />}
                </Box>
              ))}
            </Box>
            {COMPARE.map((row, i) => (
              <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '2fr repeat(4,1fr)', borderBottom: i < COMPARE.length - 1 ? '1px solid #F1F5F9' : 'none', '&:hover': { background: '#FAFAFA' } }}>
                <Box sx={{ p: 2, px: 2.5, display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.875rem', color: '#334155', fontWeight: 500 }}>{row.feature}</Typography>
                </Box>
                {['julay', 'monday', 'asana', 'notion'].map(k => (
                  <Box key={k} sx={{ p: 2, textAlign: 'center', borderLeft: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', background: k === 'julay' ? 'rgba(99,102,241,0.03)' : 'transparent' }}>
                    {typeof row[k] === 'boolean'
                      ? row[k]
                        ? <CheckCircle sx={{ color: k === 'julay' ? '#6366F1' : '#10B981', fontSize: 20 }} />
                        : <Close sx={{ color: '#CBD5E1', fontSize: 18 }} />
                      : <Typography sx={{ fontSize: '0.8rem', fontWeight: k === 'julay' ? 700 : 500, color: k === 'julay' ? '#4F46E5' : '#64748B' }}>{row[k]}</Typography>
                    }
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Container>
      </Box>}

      {/* ─── EARLY ADOPTERS CTA ─── */}
      <Box sx={{ background: 'white', py: { xs: 8, md: 14 } }}>
        <Container maxWidth="md">
          <FadeIn>
            <Box sx={{ textAlign: 'center', p: { xs: 5, md: 8 }, borderRadius: 4, border: '2px solid #E2E8F0', background: 'linear-gradient(135deg, #F8FAFC, #EEF2FF)' }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.75, borderRadius: 99, background: '#EEF2FF', border: '1px solid rgba(99,102,241,0.3)', mb: 3 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
                <Typography sx={{ color: '#4F46E5', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.05em' }}>{t('landing.earlyAccess.badge')}</Typography>
              </Box>
              <Typography variant="h2" sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', mb: 2 }}>
                {t('landing.earlyAccess.title')}
              </Typography>
              <Typography sx={{ color: '#64748B', fontSize: '1rem', lineHeight: 1.7, mb: 4, maxWidth: 480, mx: 'auto' }}>
                {t('landing.earlyAccess.sub')}
              </Typography>
              <Button onClick={() => window.location.href = '/register'} variant="contained" size="large"
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
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.75, borderRadius: 99, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', mb: 4 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
                <Typography sx={{ color: '#EF4444', fontSize: '0.78rem', fontWeight: 700 }}>🔥 Founding member pricing — limited spots at this rate</Typography>
              </Box>
              <ToggleButtonGroup value={billing} exclusive onChange={(_, v) => v && setBilling(v)} sx={{ background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 2, p: 0.5 }}>
                <ToggleButton value="monthly" sx={{ px: 3, py: 1, borderRadius: 1.5, fontSize: '0.85rem', fontWeight: 600, border: 'none', '&.Mui-selected': { background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white' } }}>{t('landing.pricing.monthly')}</ToggleButton>
                <ToggleButton value="yearly" sx={{ px: 3, py: 1, borderRadius: 1.5, fontSize: '0.85rem', fontWeight: 600, border: 'none', '&.Mui-selected': { background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white' } }}>
                  {t('landing.pricing.yearly')} <Box component="span" sx={{ ml: 0.75, px: 0.75, py: 0.15, borderRadius: 1, background: '#10B981', color: 'white', fontSize: '0.68rem', fontWeight: 800 }}>-22%</Box>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </FadeIn>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4,1fr)' }, gap: 2.5, alignItems: 'start' }}>
            {PLANS.map((plan, i) => (
              <FadeIn key={i} delay={i * 80}>
                <Box sx={{ position: 'relative', borderRadius: 3, border: plan.highlight ? '2px solid #6366F1' : '1.5px solid #E2E8F0', background: plan.highlight ? 'white' : 'white', boxShadow: plan.highlight ? '0 8px 40px rgba(99,102,241,0.2)' : '0 1px 4px rgba(0,0,0,0.04)', transform: plan.highlight ? 'scale(1.03)' : 'none', transition: 'all 0.2s', '&:hover': { boxShadow: '0 12px 40px rgba(0,0,0,0.1)', transform: plan.highlight ? 'scale(1.05)' : 'translateY(-4px)' } }}>
                  {plan.popular && <Box sx={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', px: 2, py: 0.5, borderRadius: 99, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}><Typography sx={{ color: 'white', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em' }}>{t('landing.pricing.mostPopular')}</Typography></Box>}
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
                    <Button onClick={() => navigate('/register')} variant={plan.ctaVariant} fullWidth sx={{ mb: 3, py: 1.25, fontWeight: 700, borderRadius: 2, ...(plan.ctaVariant === 'contained' ? { background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)', '&:hover': { opacity: 0.9 } } : { borderWidth: '1.5px', '&:hover': { borderWidth: '1.5px' } }) }}>
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
              <Button variant="outlined" size="large" sx={{ flexShrink: 0, px: 3.5, py: 1.25, fontWeight: 700, borderWidth: '1.5px', borderRadius: 2, whiteSpace: 'nowrap' }}>{t('landing.pricing.enterprise.cta')}</Button>
            </Box>
          </FadeIn>
        </Container>
      </Box>

      {/* ─── INVITE A FRIEND ─── */}
      <Box sx={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)', py: { xs: 8, md: 14 }, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: '10%', right: '5%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: '10%', left: '5%', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Container maxWidth="lg">
          <FadeIn>
            <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
              <Chip label="REFER A FRIEND" sx={{ mb: 3, background: 'rgba(99,102,241,0.15)', color: '#818CF8', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', border: '1px solid rgba(99,102,241,0.3)' }} />
              <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 800, color: 'white', letterSpacing: '-0.03em', mb: 2 }}>
                Share Julay.{' '}
                <Box component="span" sx={{ background: 'linear-gradient(135deg,#818CF8,#C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Earn rewards.
                </Box>
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.05rem', maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}>
                Invite friends to Julay. When they sign up, you both win — they get a free account, you get a free month.
              </Typography>
            </Box>

            {/* How it works */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' }, gap: 3, mb: 8 }}>
              {[
                { step: '01', icon: '🔗', title: 'Get your link', desc: 'Sign up and find your unique referral link in Settings → Invite a Friend.' },
                { step: '02', icon: '📤', title: 'Share it', desc: 'Send it via WhatsApp, email, or any messaging app. One click, done.' },
                { step: '03', icon: '🎁', title: 'Both win', desc: 'Your friend gets a free Julay account. You get 1 month free on any paid plan.' },
              ].map((item) => (
                <Box key={item.step} sx={{ position: 'relative', p: 3, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)' }}>
                  <Typography sx={{ position: 'absolute', top: 16, right: 20, fontSize: '0.72rem', fontWeight: 800, color: 'rgba(99,102,241,0.5)', letterSpacing: '0.1em' }}>{item.step}</Typography>
                  <Typography sx={{ fontSize: '2.2rem', mb: 2 }}>{item.icon}</Typography>
                  <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.05rem', mb: 1 }}>{item.title}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', lineHeight: 1.65 }}>{item.desc}</Typography>
                </Box>
              ))}
            </Box>

            {/* Perks banner */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, mb: 8 }}>
              {[
                { icon: '♾️', label: 'Unlimited referrals' },
                { icon: '🆓', label: 'Friend gets free account' },
                { icon: '📅', label: '1 free month per referral' },
                { icon: '⚡', label: 'Instant rewards' },
              ].map((p) => (
                <Box key={p.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderRadius: 99, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <Typography sx={{ fontSize: '1rem' }}>{p.icon}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', fontWeight: 600 }}>{p.label}</Typography>
                </Box>
              ))}
            </Box>

            {/* CTA */}
            <Box sx={{ textAlign: 'center' }}>
              <Button onClick={() => window.location.href = '/register'} variant="contained" size="large"
                sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', fontWeight: 700, px: 5, py: 1.75, borderRadius: 2.5, fontSize: '1rem', boxShadow: '0 4px 24px rgba(99,102,241,0.4)', '&:hover': { opacity: 0.9 } }}>
                Sign up & get your referral link <ArrowForward sx={{ ml: 1, fontSize: 18 }} />
              </Button>
              <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', mt: 2 }}>
                Already have an account? Go to Settings → Invite a Friend
              </Typography>
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
              <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A' }}>
                {t('landing.faq.title')}
              </Typography>
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
      <Box sx={{ background: '#09090B', py: { xs: 10, md: 18 }, position: 'relative', overflow: 'hidden' }}>
        <Orb sx={{ width: 700, height: 700, background: 'rgba(99,102,241,0.12)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <FadeIn>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2.5, py: 0.75, borderRadius: 99, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', mb: 4 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
              <Typography sx={{ color: '#FCA5A5', fontSize: '0.78rem', fontWeight: 700 }}>500+ teams already on the waitlist — don't miss your spot</Typography>
            </Box>
            <Typography sx={{ color: '#818CF8', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 3 }}>{t('landing.finalCta.eyebrow')}</Typography>
            <Typography variant="h2" sx={{ color: 'white', fontSize: { xs: '2.5rem', md: '4rem' }, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, mb: 3 }}>
              {t('landing.finalCta.title')}{' '}
              <Box component="span" sx={{ background: 'linear-gradient(135deg,#818CF8,#C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('landing.finalCta.titleGrad')}</Box>
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '1.1rem', mb: 6, maxWidth: 480, mx: 'auto' }}>
              {t('landing.finalCta.sub')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center' }}>
              <Button onClick={() => navigate('/register')} variant="contained" size="large" sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', fontWeight: 700, px: 5, py: 2, borderRadius: 2.5, fontSize: '1.05rem', boxShadow: '0 8px 32px rgba(99,102,241,0.5)', '&:hover': { opacity: 0.9, transform: 'translateY(-2px)', boxShadow: '0 12px 48px rgba(99,102,241,0.6)' }, transition: 'all 0.2s' }}>
                {t('landing.finalCta.cta')} <ArrowForward sx={{ ml: 1, fontSize: 18 }} />
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', mt: 5 }}>
              {t('landing.finalCta.perks', { returnObjects: true }).map((perk, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <CheckCircleOutline sx={{ color: '#10B981', fontSize: 15 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>{perk}</Typography>
                </Box>
              ))}
            </Box>
          </FadeIn>
        </Container>
      </Box>

      {/* ─── FOOTER ─── */}
      <Box sx={{ background: '#09090B', borderTop: '1px solid rgba(255,255,255,0.06)', py: 6 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, justifyContent: 'space-between', mb: 5 }}>
            <Box sx={{ maxWidth: 280 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2 }}>
                <Box component="img" src="/logo-icon.png" alt="" sx={{ height: 30, width: 30, objectFit: 'contain' }} />
                <svg width="60" height="30" viewBox="0 0 60 30" fill="none" aria-label="Julay">
                  <text x="0" y="21" fontFamily="Inter,ui-sans-serif,system-ui,sans-serif"
                        fontWeight="700" fontSize="17" letterSpacing="-0.4" fill="rgba(255,255,255,0.6)">Julay</text>
                </svg>
              </Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', lineHeight: 1.65 }}>{t('landing.footer.tagline')}</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
              {[t('landing.footer.product', { returnObjects: true }), t('landing.footer.company', { returnObjects: true }), t('landing.footer.legal', { returnObjects: true })].map(col => (
                <Box key={col.title}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 2 }}>{col.title}</Typography>
                  {col.links.map((l, li) => (
                    <Typography key={li} sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', mb: 1.25, cursor: 'pointer', display: 'block', transition: 'color 0.15s', '&:hover': { color: 'rgba(255,255,255,0.7)' } }}>{l}</Typography>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 4 }} />
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem' }}>{t('landing.footer.copy')}</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem' }}>{t('landing.footer.built')}</Typography>
          </Box>
        </Container>
      </Box>

    </Box>
  );
}
