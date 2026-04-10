import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, Container, Grid, Chip, Avatar, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { ArrowForward, AutoAwesome, CheckCircle, Psychology, Star } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/* ─── Animated gradient orb ─── */
function Orb({ sx }) {
  return <Box sx={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', ...sx }} />;
}

/* ─── Typing animation ─── */
function TypeWriter({ words }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[index];
    const speed = deleting ? 40 : 80;
    const timeout = setTimeout(() => {
      if (!deleting && text === word) {
        setTimeout(() => setDeleting(true), 1600);
        return;
      }
      if (deleting && text === '') {
        setDeleting(false);
        setIndex(i => (i + 1) % words.length);
        return;
      }
      setText(prev => deleting ? prev.slice(0, -1) : word.slice(0, prev.length + 1));
    }, speed);
    return () => clearTimeout(timeout);
  }, [text, deleting, index, words]);

  return (
    <Box component="span" sx={{ background: 'linear-gradient(135deg, #818cf8, #c084fc, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
      {text}<Box component="span" sx={{ WebkitTextFillColor: '#818cf8', animation: 'blink 1s infinite', '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } } }}>|</Box>
    </Box>
  );
}

/* ─── Bento card ─── */
function BentoCard({ children, sx }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef();
  const onMove = e => {
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  return (
    <Box ref={ref} onMouseMove={onMove}
      sx={{ position: 'relative', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', bgcolor: 'rgba(255,255,255,0.03)', overflow: 'hidden', transition: 'border-color 0.3s, transform 0.2s', '&:hover': { borderColor: 'rgba(129,140,248,0.35)', transform: 'translateY(-3px)' }, ...sx }}>
      <Box sx={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%)', left: pos.x - 150, top: pos.y - 150, pointerEvents: 'none', transition: 'left 0.1s, top 0.1s' }} />
      {children}
    </Box>
  );
}

const BENTO = [
  {
    size: { xs: 12, md: 7 }, minH: 260,
    content: (
      <Box sx={{ p: 4, height: '100%' }}>
        <Chip label="AI Generation" size="small" sx={{ bgcolor: 'rgba(129,140,248,0.15)', color: '#818cf8', fontWeight: 700, mb: 2.5, fontSize: '0.72rem' }} />
        <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.4rem', mb: 1.5, lineHeight: 1.3 }}>
          From idea to full plan<br />in under 2 minutes
        </Typography>
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, p: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', mb: 1 }}>Your prompt</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', fontStyle: 'italic' }}>"Build a fintech app with KYC and payments..."</Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['8 Goals ✓','32 Tasks ✓','6 Members ✓','6 Weeks ✓'].map(t => (
              <Chip key={t} label={t} size="small" sx={{ bgcolor: 'rgba(129,140,248,0.2)', color: '#a5b4fc', fontSize: '0.72rem', fontWeight: 700 }} />
            ))}
          </Box>
        </Box>
      </Box>
    )
  },
  {
    size: { xs: 12, md: 5 }, minH: 260,
    content: (
      <Box sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box>
          <Chip label="Smart Assignment" size="small" sx={{ bgcolor: 'rgba(52,211,153,0.15)', color: '#34d399', fontWeight: 700, mb: 2.5, fontSize: '0.72rem' }} />
          <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.3rem', mb: 2, lineHeight: 1.3 }}>AI assigns the<br />right person, always</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[['Sarah K.','Frontend','94% match'],['Ahmed R.','Backend','91% match'],['Maria L.','Design','88% match']].map(([name, role, match]) => (
            <Box key={name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2, px: 2, py: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: '#6366f1', fontSize: '0.7rem', fontWeight: 700 }}>{name[0]}</Avatar>
                <Box>
                  <Typography sx={{ color: 'white', fontSize: '0.78rem', fontWeight: 600 }}>{name}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem' }}>{role}</Typography>
                </Box>
              </Box>
              <Chip label={match} size="small" sx={{ bgcolor: 'rgba(52,211,153,0.15)', color: '#34d399', fontSize: '0.68rem', fontWeight: 700, height: 20 }} />
            </Box>
          ))}
        </Box>
      </Box>
    )
  },
  {
    size: { xs: 12, md: 4 }, minH: 220,
    content: (
      <Box sx={{ p: 4, height: '100%' }}>
        <Chip label="Daily Standup" size="small" sx={{ bgcolor: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontWeight: 700, mb: 2.5, fontSize: '0.72rem' }} />
        <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.2rem', mb: 2 }}>AI standup,<br />zero effort</Typography>
        <Box sx={{ bgcolor: 'rgba(251,191,36,0.08)', borderRadius: 2, p: 2, border: '1px solid rgba(251,191,36,0.15)' }}>
          <Typography sx={{ color: '#fbbf24', fontSize: '0.72rem', fontWeight: 700, mb: 1 }}>Today's AI Report</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', lineHeight: 1.6 }}>3 tasks at risk · 2 blockers · Sprint 87% on track</Typography>
        </Box>
      </Box>
    )
  },
  {
    size: { xs: 12, md: 4 }, minH: 220,
    content: (
      <Box sx={{ p: 4, height: '100%' }}>
        <Chip label="Analytics" size="small" sx={{ bgcolor: 'rgba(244,114,182,0.15)', color: '#f472b6', fontWeight: 700, mb: 2.5, fontSize: '0.72rem' }} />
        <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.2rem', mb: 2.5 }}>Track what matters</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {[['89%','On-time','#34d399'],['12','Projects','#818cf8'],['4.9','AI Score','#f472b6']].map(([val, label, color]) => (
            <Box key={label} sx={{ textAlign: 'center', flex: 1 }}>
              <Typography sx={{ color, fontWeight: 900, fontSize: '1.5rem' }}>{val}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem' }}>{label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    )
  },
  {
    size: { xs: 12, md: 4 }, minH: 220,
    content: (
      <Box sx={{ p: 4, height: '100%' }}>
        <Chip label="Auto Re-plan" size="small" sx={{ bgcolor: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 700, mb: 2.5, fontSize: '0.72rem' }} />
        <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.2rem', mb: 2 }}>Delays happen.<br />AI handles them.</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ flex: 1, height: 4, bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ width: '72%', height: '100%', bgcolor: '#818cf8', borderRadius: 2 }} />
          </Box>
          <Typography sx={{ color: '#818cf8', fontSize: '0.78rem', fontWeight: 700 }}>72%</Typography>
        </Box>
        <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', mt: 1 }}>Rescheduled 8 tasks automatically</Typography>
      </Box>
    )
  },
];

const TESTIMONIALS = [
  { name: 'Sarah K.', role: 'Product Manager @ Stripe', text: 'Julay replaced 3 tools. The AI planning saves 8+ hours every week.', color: '#818cf8' },
  { name: 'Ahmed R.', role: 'Engineering Lead @ Notion', text: "The standup AI knows what's blocked before I even ask. Insane.", color: '#34d399' },
  { name: 'Maria L.', role: 'Founder @ YC W25', text: 'From idea to full plan in 90 seconds. Nothing else comes close.', color: '#f472b6' },
];

const PLANS = [
  {
    name: 'FREE',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Perfect for individuals getting started',
    features: ['3 projects', '3 team members', '5 AI requests/mo', 'Kanban & Gantt views', 'Basic analytics'],
    cta: 'Get Started Free',
    ctaUrl: '/register',
    highlight: false,
  },
  {
    name: 'STARTER',
    monthlyPrice: 9,
    yearlyPrice: 7,
    description: 'Great for small teams',
    features: ['10 projects', '10 team members', '100 AI requests/mo', 'Everything in Free', 'Priority support'],
    cta: 'Start Free Trial',
    ctaUrl: '/register?plan=starter',
    highlight: false,
  },
  {
    name: 'PROFESSIONAL',
    monthlyPrice: 29,
    yearlyPrice: 23,
    description: 'For growing teams with AI',
    features: ['Unlimited projects', '25 team members', '500 AI requests/mo', 'AI project generation', 'Daily AI standup reports', 'Auto re-planning', 'Advanced analytics'],
    cta: 'Start Free Trial',
    ctaUrl: '/register?plan=professional',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'BUSINESS',
    monthlyPrice: 79,
    yearlyPrice: 63,
    description: 'For large organizations',
    features: ['Unlimited projects', 'Unlimited members', '2000 AI requests/mo', 'Everything in Pro', 'SSO & SAML', 'Dedicated support', 'Custom integrations'],
    cta: 'Start Free Trial',
    ctaUrl: '/register?plan=business',
    highlight: false,
  },
];

function PricingSection({ navigate }) {
  const [yearly, setYearly] = useState(false);

  return (
    <Box sx={{ py: { xs: 10, md: 14 }, borderTop: '1px solid rgba(255,255,255,0.05)' }} id="pricing">
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography sx={{ color: '#818cf8', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 2 }}>Pricing</Typography>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: '2.2rem', md: '3rem' }, letterSpacing: '-0.04em', mb: 1 }}>
            Simple, Transparent Pricing
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.05rem', mb: 4 }}>
            Start free, scale as you grow
          </Typography>
          {/* Monthly/Yearly toggle */}
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, px: 2, py: 0.75 }}>
            <Typography sx={{ color: yearly ? 'rgba(255,255,255,0.35)' : 'white', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => setYearly(false)}>Monthly</Typography>
            <Box onClick={() => setYearly(y => !y)} sx={{ width: 44, height: 24, borderRadius: 99, bgcolor: yearly ? '#6366f1' : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'background-color 0.25s', flexShrink: 0 }}>
              <Box sx={{ position: 'absolute', top: 2, left: yearly ? 22 : 2, width: 20, height: 20, borderRadius: '50%', bgcolor: 'white', transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ color: yearly ? 'white' : 'rgba(255,255,255,0.35)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => setYearly(true)}>Yearly</Typography>
              {yearly && <Chip label="Save 20%" size="small" sx={{ bgcolor: 'rgba(52,211,153,0.15)', color: '#34d399', fontWeight: 700, fontSize: '0.68rem', height: 20 }} />}
            </Box>
          </Box>
        </Box>

        <Grid container spacing={2.5} alignItems="stretch">
          {PLANS.map(plan => (
            <Grid item xs={12} sm={6} lg={3} key={plan.name}>
              <Box sx={{
                position: 'relative', borderRadius: 4, p: 3.5, height: '100%', display: 'flex', flexDirection: 'column',
                bgcolor: plan.highlight ? 'transparent' : 'rgba(255,255,255,0.03)',
                background: plan.highlight ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.12))' : undefined,
                border: plan.highlight ? '1.5px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.07)',
                boxShadow: plan.highlight ? '0 0 60px rgba(99,102,241,0.18), inset 0 0 40px rgba(99,102,241,0.04)' : 'none',
                transition: 'transform 0.22s, box-shadow 0.22s, border-color 0.22s',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: plan.highlight
                    ? '0 0 80px rgba(99,102,241,0.28), inset 0 0 40px rgba(99,102,241,0.06)'
                    : '0 20px 60px rgba(0,0,0,0.3)',
                  borderColor: plan.highlight ? 'rgba(99,102,241,0.8)' : 'rgba(255,255,255,0.15)',
                },
              }}>
                {plan.badge && (
                  <Box sx={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', bgcolor: 'linear-gradient(135deg, #6366f1, #a855f7)', background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 99, px: 2, py: 0.4, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Star sx={{ fontSize: 11, color: '#fbbf24' }} />
                    <Typography sx={{ color: 'white', fontSize: '0.7rem', fontWeight: 800, whiteSpace: 'nowrap' }}>{plan.badge}</Typography>
                  </Box>
                )}

                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ color: plan.highlight ? '#a5b4fc' : 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', mb: 0.75 }}>{plan.name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '2.8rem', letterSpacing: '-0.05em', lineHeight: 1, color: 'white' }}>
                      ${yearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.35)', mb: 0.5, fontSize: '0.9rem' }}>/mo</Typography>
                  </Box>
                  {yearly && plan.monthlyPrice > 0 && (
                    <Typography sx={{ color: '#34d399', fontSize: '0.72rem', fontWeight: 600 }}>
                      ${plan.yearlyPrice * 12}/yr · Save ${(plan.monthlyPrice - plan.yearlyPrice) * 12}
                    </Typography>
                  )}
                  <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', mt: 1 }}>{plan.description}</Typography>
                </Box>

                <Box sx={{ flex: 1, mb: 3 }}>
                  {plan.features.map(f => (
                    <Box key={f} sx={{ display: 'flex', gap: 1.25, mb: 1.25, alignItems: 'flex-start' }}>
                      <CheckCircle sx={{ color: plan.highlight ? '#818cf8' : 'rgba(255,255,255,0.3)', fontSize: 16, mt: '1px', flexShrink: 0 }} />
                      <Typography fontSize="0.82rem" sx={{ color: plan.highlight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)' }}>{f}</Typography>
                    </Box>
                  ))}
                </Box>

                <Button
                  fullWidth
                  variant={plan.highlight ? 'contained' : 'outlined'}
                  onClick={() => {
                    if (plan.name === 'BUSINESS' && plan.monthlyPrice > 60) {
                      window.location.href = 'mailto:sales@julay.org';
                    } else {
                      navigate(plan.ctaUrl);
                    }
                  }}
                  sx={plan.highlight
                    ? { background: 'linear-gradient(135deg, #6366f1, #a855f7)', fontWeight: 800, borderRadius: 2.5, py: 1.2, textTransform: 'none', fontSize: '0.9rem', boxShadow: '0 0 24px rgba(99,102,241,0.4)', '&:hover': { boxShadow: '0 0 40px rgba(99,102,241,0.6)' } }
                    : { border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', fontWeight: 700, borderRadius: 2.5, py: 1.2, textTransform: 'none', fontSize: '0.9rem', '&:hover': { borderColor: 'rgba(255,255,255,0.3)', color: 'white', bgcolor: 'rgba(255,255,255,0.04)' } }
                  }
                >
                  {plan.cta}
                </Button>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Enterprise note */}
        <Box sx={{ textAlign: 'center', mt: 5 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
            Need a custom plan?{' '}
            <Box component="a" href="mailto:sales@julay.org" sx={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>Contact sales</Box>
            {' '}— we build custom contracts for enterprises.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: '#030712', color: 'white', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', bgcolor: 'rgba(3,7,18,0.85)' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.8 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 1.5, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Psychology sx={{ color: 'white', fontSize: 18 }} />
              </Box>
              <Typography fontWeight={800} fontSize={18} letterSpacing='-0.02em'>julay</Typography>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
              {['Features', 'Pricing', 'Blog'].map(item => (
                <Typography key={item} sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer', '&:hover': { color: 'white' }, transition: 'color 0.15s' }}>{item}</Typography>
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Button onClick={() => navigate('/login')} sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.85rem', '&:hover': { color: 'white' }, textTransform: 'none' }}>
                Sign in
              </Button>
              <Button onClick={() => navigate('/register')} variant="contained"
                sx={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', fontWeight: 700, borderRadius: 2, px: 2.5, py: 0.9, textTransform: 'none', fontSize: '0.85rem', boxShadow: '0 0 20px rgba(99,102,241,0.4)', '&:hover': { boxShadow: '0 0 30px rgba(99,102,241,0.6)' } }}>
                Get Started
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── HERO ── */}
      <Box sx={{ position: 'relative', pt: { xs: 10, md: 16 }, pb: { xs: 8, md: 14 }, overflow: 'hidden' }}>
        <Orb sx={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)', top: '-200px', left: '50%', transform: 'translateX(-50%)' }} />
        <Orb sx={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)', top: '100px', right: '-100px' }} />
        <Orb sx={{ width: 300, height: 300, background: 'radial-gradient(circle, rgba(244,114,182,0.15), transparent 70%)', bottom: '0', left: '-50px' }} />

        <Container maxWidth="lg" sx={{ position: 'relative', textAlign: 'center' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 99, px: 2, py: 0.8, mb: 5 }}>
            <AutoAwesome sx={{ fontSize: 14, color: '#818cf8' }} />
            <Typography sx={{ color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 600 }}>Powered by Claude AI — The smartest PM tool ever built</Typography>
          </Box>

          <Typography sx={{ fontWeight: 900, fontSize: { xs: '3rem', sm: '4rem', md: '5.5rem' }, letterSpacing: '-0.05em', lineHeight: 1.0, mb: 3 }}>
            The AI that runs<br />
            <TypeWriter words={['your projects.', 'your team.', 'your deadlines.', 'your business.']} />
          </Typography>

          <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: { xs: '1rem', md: '1.2rem' }, maxWidth: 560, mx: 'auto', lineHeight: 1.7, mb: 6 }}>
            Describe any project. Julay's AI generates a complete plan, assigns your team, and adapts in real-time — so you can focus on building.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 4 }}>
            <Button onClick={() => navigate('/register')} variant="contained" size="large" endIcon={<ArrowForward />}
              sx={{ px: 4, py: 1.6, fontWeight: 700, fontSize: '1rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 2.5, boxShadow: '0 0 40px rgba(99,102,241,0.5)', '&:hover': { boxShadow: '0 0 60px rgba(99,102,241,0.7)', transform: 'translateY(-2px)' }, transition: 'all 0.2s', textTransform: 'none' }}>
              Start for free
            </Button>
            <Button onClick={() => navigate('/login')} size="large"
              sx={{ px: 4, py: 1.6, fontWeight: 700, fontSize: '1rem', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2.5, '&:hover': { color: 'white', borderColor: 'rgba(255,255,255,0.25)', bgcolor: 'rgba(255,255,255,0.04)' }, textTransform: 'none' }}>
              Sign in
            </Button>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>No credit card · Free plan forever · Setup in 60 seconds</Typography>
        </Container>
      </Box>

      {/* ── SOCIAL PROOF ── */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', py: 3, bgcolor: 'rgba(255,255,255,0.015)' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 4, md: 8 }, flexWrap: 'wrap' }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.78rem', fontWeight: 500 }}>TRUSTED BY TEAMS AT</Typography>
            {['Stripe', 'Notion', 'Linear', 'Vercel', 'Figma'].map(name => (
              <Typography key={name} sx={{ color: 'rgba(255,255,255,0.2)', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>{name}</Typography>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── BENTO FEATURES ── */}
      <Box sx={{ py: { xs: 10, md: 16 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography sx={{ color: '#818cf8', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 2 }}>Everything, reimagined</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: '2.2rem', md: '3.2rem' }, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              Not just a PM tool.<br />An AI operating system.
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {BENTO.map((card, i) => (
              <Grid item {...card.size} key={i}>
                <BentoCard sx={{ minHeight: card.minH, height: '100%' }}>
                  {card.content}
                </BentoCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── TESTIMONIALS ── */}
      <Box sx={{ py: { xs: 10, md: 14 }, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: '2rem', md: '3rem' }, letterSpacing: '-0.04em' }}>
              Teams love it.
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {TESTIMONIALS.map((t, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 3, p: 3.5, height: '100%', transition: 'all 0.2s', '&:hover': { borderColor: t.color + '50', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    {[1,2,3,4,5].map(s => <Box key={s} sx={{ color: '#fbbf24', fontSize: '1rem' }}>★</Box>)}
                  </Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', lineHeight: 1.7, mb: 3 }}>"{t.text}"</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: t.color + '30', color: t.color, width: 36, height: 36, fontWeight: 800, fontSize: '0.9rem', border: `1px solid ${t.color}40` }}>{t.name[0]}</Avatar>
                    <Box>
                      <Typography fontWeight={700} fontSize="0.875rem">{t.name}</Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>{t.role}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── PRICING ── */}
      <PricingSection navigate={navigate} />

      {/* ── FINAL CTA ── */}
      <Box sx={{ py: { xs: 10, md: 16 }, position: 'relative', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <Orb sx={{ width: 700, height: 700, background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <Container maxWidth="md" sx={{ position: 'relative' }}>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: '2.5rem', md: '4rem' }, letterSpacing: '-0.05em', lineHeight: 1.05, mb: 3 }}>
            Build faster.<br />
            <Box component="span" sx={{ background: 'linear-gradient(135deg, #818cf8, #c084fc, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Ship smarter.
            </Box>
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '1.1rem', mb: 6 }}>
            Join the teams that let AI do the heavy lifting.
          </Typography>
          <Button onClick={() => navigate('/register')} variant="contained" size="large"
            sx={{ px: 6, py: 2, fontWeight: 800, fontSize: '1.1rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 3, boxShadow: '0 0 60px rgba(99,102,241,0.5)', '&:hover': { boxShadow: '0 0 80px rgba(99,102,241,0.7)', transform: 'translateY(-3px)' }, transition: 'all 0.25s', textTransform: 'none' }}>
            Get started for free ✨
          </Button>
        </Container>
      </Box>

      {/* ── FOOTER ── */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)', py: 3 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 26, height: 26, borderRadius: 1.5, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Psychology sx={{ color: 'white', fontSize: 14 }} />
              </Box>
              <Typography fontWeight={800} color="white" fontSize="0.9rem">julay</Typography>
            </Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.78rem' }}>© 2026 Julay. All rights reserved.</Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              {['Privacy', 'Terms', 'Contact'].map(item => (
                <Typography key={item} sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem', cursor: 'pointer', '&:hover': { color: 'rgba(255,255,255,0.6)' }, transition: 'color 0.15s' }}>{item}</Typography>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
