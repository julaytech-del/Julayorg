import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Button, Container, Chip, Avatar, ToggleButtonGroup, ToggleButton, Divider, IconButton, Drawer, List, ListItemButton, ListItemText } from '@mui/material';
import { ArrowForward, AutoAwesome, CheckCircle, CheckCircleOutline, Close, PlayArrow, Menu as MenuIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

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
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState('');
  const prompt = 'Launch v2.0 of our SaaS in Q4';
  const tasks = [
    { title: 'Market research & competitor analysis', assignee: 'Sara', hours: 12, status: 'done' },
    { title: 'Design system & UI components', assignee: 'Alex', hours: 24, status: 'in_progress' },
    { title: 'Backend API refactor', assignee: 'Mohammed', hours: 40, status: 'in_progress' },
    { title: 'QA testing & bug fixes', assignee: 'Dana', hours: 16, status: 'todo' },
    { title: 'DevOps & deployment pipeline', assignee: 'Karim', hours: 8, status: 'todo' },
  ];

  useEffect(() => {
    if (step === 0) {
      let i = 0;
      const t = setInterval(() => {
        i++;
        setTyped(prompt.slice(0, i));
        if (i >= prompt.length) { clearInterval(t); setTimeout(() => setStep(1), 800); }
      }, 55);
      return () => clearInterval(t);
    }
    if (step === 1) { setTimeout(() => setStep(2), 1200); }
  }, [step]);

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
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Describe your project goal</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 2, border: '1.5px solid rgba(99,102,241,0.5)', background: 'rgba(99,102,241,0.06)' }}>
            <Typography sx={{ color: '#E2E8F0', fontSize: '0.88rem', flex: 1 }}>{typed}{step < 1 && <Box component="span" sx={{ display: 'inline-block', width: 2, height: '1em', background: '#818CF8', ml: '2px', animation: 'blink 1s steps(1) infinite', '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } } }} />}</Typography>
            {step >= 1 && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.6, borderRadius: 1.5, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', cursor: 'pointer' }}>
              <AutoAwesome sx={{ fontSize: 13, color: 'white' }} />
              <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>Generate</Typography>
            </Box>}
          </Box>
        </Box>
        {/* Generated tasks */}
        {step >= 2 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
              <Typography sx={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>AI generated 5 tasks · assigned team · estimated 100h</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {tasks.map((t, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: 1.5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', animation: `slideIn 0.3s ease ${i * 100}ms both`, '@keyframes slideIn': { from: { opacity: 0, transform: 'translateX(-10px)' }, to: { opacity: 1, transform: 'translateX(0)' } } }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: t.status === 'done' ? '#10B981' : t.status === 'in_progress' ? '#6366F1' : '#475569' }} />
                  <Typography sx={{ color: '#E2E8F0', fontSize: '0.8rem', flex: 1 }} noWrap>{t.title}</Typography>
                  <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', flexShrink: 0 }}>{t.assignee[0]}</Avatar>
                  <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', flexShrink: 0 }}>{t.hours}h</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
        {step < 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[1,2,3].map(i => <Box key={i} sx={{ height: 42, borderRadius: 1.5, background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.5s infinite', '@keyframes shimmer': { '0%,100%': { opacity: 0.4 }, '50%': { opacity: 0.8 } } }} />)}
          </Box>
        )}
      </Box>
    </Box>
  );
}

/* ─── Comparison data ─── */
const COMPARE = [
  { feature: 'AI Project Planning', julay: true, monday: false, asana: false, notion: false },
  { feature: 'Auto Task Breakdown', julay: true, monday: false, asana: false, notion: false },
  { feature: 'Smart Team Assignment', julay: true, monday: false, asana: false, notion: false },
  { feature: 'AI Deadline Optimizer', julay: true, monday: false, asana: false, notion: false },
  { feature: 'Workload AI Rebalancer', julay: true, monday: false, asana: false, notion: false },
  { feature: 'Critical Path (CPM)', julay: true, monday: true, asana: false, notion: false },
  { feature: 'Automation Rules', julay: true, monday: true, asana: true, notion: false },
  { feature: 'Gantt Timeline', julay: true, monday: true, asana: true, notion: false },
  { feature: 'Calendar View', julay: true, monday: true, asana: true, notion: false },
  { feature: 'Custom Dashboards', julay: true, monday: true, asana: false, notion: false },
  { feature: 'Sprint / Agile Board', julay: true, monday: true, asana: true, notion: false },
  { feature: 'Time Tracking', julay: true, monday: true, asana: true, notion: false },
  { feature: 'Public Form Builder', julay: true, monday: true, asana: false, notion: false },
  { feature: 'Webhook System', julay: true, monday: true, asana: false, notion: false },
  { feature: 'Starting Price', julay: '$9/mo', monday: '$9/seat', asana: '$13/seat', notion: '$10/seat' },
  { feature: 'AI Included in Base Plan', julay: true, monday: false, asana: false, notion: false },
];

const TOOLS = ['Monday', 'Asana', 'Notion'];

/* ─── Testimonials ─── */
const TESTIMONIALS = [
  { name: 'Sarah Chen', title: 'CTO, NovaTech', avatar: 'S', stars: 5, text: 'Julay replaced our entire project stack. The AI planning feature alone saves us 8 hours per sprint. It just thinks ahead — assigning tasks, spotting risks, optimizing deadlines before I even notice the problem.' },
  { name: 'Ahmed Al-Rashid', title: 'Product Lead, Tamatem Games', avatar: 'A', stars: 5, text: 'We were on Monday for 3 years. Switched to Julay in a week and never looked back. The AI breaks down projects in seconds — what used to take a planning session now happens instantly.' },
  { name: 'Marcus Weber', title: 'Founder, BuildStack', avatar: 'M', stars: 5, text: 'The workload AI is insane. It tells me who is overloaded before they burn out. My team\'s delivery rate went from 62% to 91% in 6 weeks. This is what project management should have always been.' },
  { name: 'Layla Karimi', title: 'Engineering Manager, Fintech.io', avatar: 'L', stars: 5, text: 'Every feature feels intentional. The Critical Path analysis, the Gantt with AI risks — it\'s like having a senior PM always watching your project. The pricing is unreal for what you get.' },
];

/* ─── Company logos (placeholder) ─── */
const LOGOS = ['NovaTech', 'Tamatem', 'BuildStack', 'Fintech.io', 'ZeroGravity', 'Shift Media', 'Launchpad', 'CoreSystems'];

/* ─── Pricing plans ─── */
const PLANS = [
  { id: 'free', name: 'Free', price: 0, yearlyPrice: 0, description: 'Perfect to get started', features: ['3 projects', '3 team members', '5 AI requests/month', 'Kanban & List views', '1 GB storage'], cta: 'Start for Free', ctaVariant: 'outlined', highlight: false },
  { id: 'starter', name: 'Starter', price: 9, yearlyPrice: 7, description: 'For solo professionals', features: ['10 projects', '10 team members', '100 AI requests/month', 'All views (Calendar, Gantt)', '10 GB storage', 'Email support'], cta: 'Start Free Trial', ctaVariant: 'outlined', highlight: false },
  { id: 'professional', name: 'Professional', price: 29, yearlyPrice: 23, description: 'For growing teams', popular: true, features: ['Unlimited projects', '25 team members', '500 AI requests/month', 'Automations & Webhooks', 'Reports & Forms', 'Time Tracking + Custom Fields', '50 GB storage', 'Priority support'], cta: 'Start Free Trial', ctaVariant: 'contained', highlight: true },
  { id: 'business', name: 'Business', price: 79, yearlyPrice: 63, description: 'For scaling companies', features: ['Everything in Professional', 'Unlimited team members', '2,000 AI requests/month', 'API access', 'Custom analytics', '200 GB storage', 'Dedicated support'], cta: 'Start Free Trial', ctaVariant: 'outlined', highlight: false },
];

/* ─── Feature grid ─── */
const FEATURES = [
  { icon: '🧠', title: 'AI Project Planning', desc: 'Describe your goal in plain language. Julay AI generates a full project breakdown — tasks, timelines, and team assignments — in seconds.' },
  { icon: '⚡', title: 'Smart Auto-Assignment', desc: 'AI analyzes team skills, workload, and availability to assign tasks to the right person automatically.' },
  { icon: '📊', title: 'Critical Path (CPM)', desc: 'Automatically identifies which tasks can delay your entire project. Visual warnings keep you ahead of schedule.' },
  { icon: '🎯', title: 'Workload Balancer', desc: 'Real-time heatmap shows who is overloaded. One click AI rebalancing reassigns tasks intelligently across your team.' },
  { icon: '📅', title: 'Deadline Optimizer', desc: 'AI analyzes assignee workload and suggests the best due dates — with confidence scores and risk warnings.' },
  { icon: '🔔', title: 'Smart Notifications', desc: 'Get alerted before things go wrong. AI monitors your projects 24/7 and surfaces what matters, when it matters.' },
  { icon: '⚙️', title: 'Automation Engine', desc: 'Build powerful if-this-then-that rules. Trigger notifications, status changes, subtask creation — all automatically.' },
  { icon: '📋', title: 'Public Form Builder', desc: 'Create shareable intake forms that auto-create and assign tasks when submitted. No dev required.' },
  { icon: '📈', title: 'AI Executive Reports', desc: 'One click generates a 2-paragraph executive summary of your project status, written by Claude AI.' },
  { icon: '🔗', title: 'Webhook System', desc: 'Send real-time events to Slack, Zapier, or any endpoint. HMAC-signed payloads for enterprise security.' },
  { icon: '🏃', title: 'Sprint / Agile Board', desc: 'Full Scrum support. Plan sprints, track velocity, view burndown charts. Switch between Agile and waterfall in one click.' },
  { icon: '🌐', title: 'Portfolio View', desc: 'See every project\'s health in one executive dashboard. On Track, At Risk, Off Track — at a glance.' },
];

/* ─── FAQ ─── */
const FAQS = [
  { q: 'How is Julay different from Monday.com or Asana?', a: 'Julay is the only project management tool built AI-first. Monday and Asana have AI bolt-ons. Julay\'s AI plans your project, assigns your team, balances workload, and warns you about risks — all automatically. It\'s not a feature, it\'s the engine.' },
  { q: 'Do I need to know how to use AI?', a: 'Not at all. You write your goal in plain English (or Arabic). Julay does the rest. No prompts, no templates — just describe what you need to achieve.' },
  { q: 'Is there a free plan?', a: 'Yes — free forever. 3 projects, 3 team members, 5 AI requests per month. No credit card required. Upgrade when you need more.' },
  { q: 'How secure is my data?', a: 'All data is encrypted at rest and in transit. We use HMAC-signed webhooks, JWT authentication, and role-based access control. Your data is never used to train AI models.' },
  { q: 'Can I migrate from Monday or Asana?', a: 'Yes. You can recreate your project structure in Julay in minutes using AI generation. Describe your existing project and Julay will build the full task breakdown automatically. Business and Enterprise plans include onboarding assistance.' },
  { q: 'What AI model powers Julay?', a: 'Julay is powered by Anthropic\'s Claude — one of the most capable AI models available for structured planning, risk analysis, and executive reporting.' },
];

const NAV_LINKS = ['Features', 'Compare', 'Pricing', 'FAQ'];

export default function Landing() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const demoRef = useRef(null);

  const scrollToDemo = () => {
    demoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <Box sx={{ fontFamily: '"Inter", sans-serif', overflowX: 'hidden' }}>

      {/* ─── MOBILE DRAWER ─── */}
      <Drawer anchor="right" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}
        PaperProps={{ sx: { width: 260, background: '#09090B', borderLeft: '1px solid rgba(255,255,255,0.08)' } }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={() => setMobileMenuOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
            <Close />
          </IconButton>
        </Box>
        <List>
          {NAV_LINKS.map(l => (
            <ListItemButton key={l} component="a" href={`#${l.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)}
              sx={{ px: 3, py: 1.5, '&:hover': { background: 'rgba(255,255,255,0.06)' } }}>
              <ListItemText primary={l} primaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: '1rem' } }} />
            </ListItemButton>
          ))}
        </List>
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
          <Button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} variant="outlined"
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', fontWeight: 600, py: 1.25, borderRadius: 2 }}>
            Log in
          </Button>
          <Button onClick={() => { setMobileMenuOpen(false); navigate('/register'); }} variant="contained"
            sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', fontWeight: 700, py: 1.25, borderRadius: 2 }}>
            Start Free →
          </Button>
        </Box>
      </Drawer>

      {/* ─── NAV ─── */}
      <Box component="nav" sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,11,0.85)' }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 1.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1rem' }}>J</Typography>
            </Box>
            <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>Julay</Typography>
          </Box>

          {/* Desktop nav links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3 }}>
            {NAV_LINKS.map(l => (
              <Typography key={l} component="a" href={`#${l.toLowerCase()}`} sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', textDecoration: 'none', cursor: 'pointer', transition: 'color 0.15s', '&:hover': { color: 'white' } }}>{l}</Typography>
            ))}
          </Box>

          {/* Desktop buttons */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1.5, alignItems: 'center' }}>
            <Button onClick={() => navigate('/login')} variant="text" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', '&:hover': { color: 'white', background: 'rgba(255,255,255,0.06)' } }}>Log in</Button>
            <Button onClick={() => navigate('/register')} variant="contained" sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', fontWeight: 700, px: 2.5, py: 0.9, borderRadius: 2, fontSize: '0.88rem', boxShadow: '0 0 20px rgba(99,102,241,0.4)', '&:hover': { opacity: 0.9, boxShadow: '0 0 30px rgba(99,102,241,0.5)' } }}>
              Start Free →
            </Button>
          </Box>

          {/* Mobile hamburger */}
          <IconButton onClick={() => setMobileMenuOpen(true)} sx={{ display: { xs: 'flex', md: 'none' }, color: 'rgba(255,255,255,0.7)' }}>
            <MenuIcon />
          </IconButton>
        </Box>
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
              <Typography sx={{ color: '#A5B4FC', fontSize: '0.8rem', fontWeight: 600 }}>Powered by Claude AI · Now live</Typography>
            </Box>

            {/* H1 */}
            <Typography variant="h1" sx={{ color: 'white', fontSize: { xs: '2.8rem', md: '4.5rem', lg: '5.2rem' }, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em', mb: 3 }}>
              We don't manage tasks.{' '}
              <Box component="span" sx={{ background: 'linear-gradient(135deg, #818CF8, #C084FC, #38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                We build execution systems.
              </Box>
            </Typography>

            <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: { xs: '1.05rem', md: '1.25rem' }, lineHeight: 1.65, mb: 5, maxWidth: 600, mx: 'auto' }}>
              Julay uses AI to plan, break down, and execute your work — automatically.
              Describe your goal. Get a full project in seconds.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center', mb: 3 }}>
              <Button onClick={() => navigate('/register')} variant="contained" size="large" sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', fontWeight: 700, px: 4, py: 1.75, borderRadius: 2.5, fontSize: '1rem', boxShadow: '0 4px 24px rgba(99,102,241,0.45)', '&:hover': { opacity: 0.9, transform: 'translateY(-2px)', boxShadow: '0 8px 32px rgba(99,102,241,0.5)' }, transition: 'all 0.2s' }}>
                Start Free — No credit card
              </Button>
              <Button onClick={scrollToDemo} variant="outlined" size="large" sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', fontWeight: 600, px: 3.5, py: 1.75, borderRadius: 2.5, fontSize: '1rem', '&:hover': { borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' } }}>
                <PlayArrow sx={{ fontSize: 18, mr: 0.75 }} /> See how it works
              </Button>
            </Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
              Free plan forever · No credit card · Setup in 60 seconds
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
            {['12 AI-powered features', '10 languages supported', 'Kanban · Gantt · Sprints', 'Free plan forever', 'No per-seat pricing'].map(badge => (
              <Box key={badge} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
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
            {[
              { num: 12, suffix: '', label: 'AI-powered features' },
              { num: 20, suffix: '+', label: 'Views & tools included' },
              { num: 10, suffix: '', label: 'Languages supported' },
              { num: 60, suffix: 's', label: 'To generate a full project' },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 100}>
                <Box sx={{ textAlign: 'center', p: 3, borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  <Typography sx={{ color: 'white', fontSize: { xs: '2.2rem', md: '3rem' }, fontWeight: 800, letterSpacing: '-0.04em', background: 'linear-gradient(135deg,#818CF8,#C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    <AnimCounter end={s.num} suffix={s.suffix} />
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', mt: 0.5 }}>{s.label}</Typography>
                </Box>
              </FadeIn>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ─── LANGUAGES ─── */}
      <Box sx={{ background: '#09090B', borderTop: '1px solid rgba(255,255,255,0.06)', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <FadeIn>
            <Box sx={{ textAlign: 'center', mb: 7 }}>
              <Chip label="GLOBAL REACH" sx={{ mb: 3, background: 'rgba(99,102,241,0.15)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em' }} />
              <Typography variant="h2" sx={{ color: 'white', fontSize: { xs: '1.9rem', md: '2.8rem' }, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, mb: 2 }}>
                Built for teams{' '}
                <Box component="span" sx={{ background: 'linear-gradient(135deg,#818CF8,#C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>around the world</Box>
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', maxWidth: 480, mx: 'auto' }}>
                Julay speaks your language. Full UI translation in 10 languages — including right-to-left support for Arabic.
              </Typography>
            </Box>
          </FadeIn>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)', md: 'repeat(5,1fr)' }, gap: 2 }}>
            {[
              { flag: '🇺🇸', en: 'English',    native: 'English',    rtl: false },
              { flag: '🇸🇦', en: 'Arabic',     native: 'العربية',    rtl: true  },
              { flag: '🇫🇷', en: 'French',     native: 'Français',   rtl: false },
              { flag: '🇩🇪', en: 'German',     native: 'Deutsch',    rtl: false },
              { flag: '🇪🇸', en: 'Spanish',    native: 'Español',    rtl: false },
              { flag: '🇧🇷', en: 'Portuguese', native: 'Português',  rtl: false },
              { flag: '🇮🇳', en: 'Hindi',      native: 'हिन्दी',      rtl: false },
              { flag: '🇷🇺', en: 'Russian',    native: 'Русский',    rtl: false },
              { flag: '🇯🇵', en: 'Japanese',   native: '日本語',      rtl: false },
              { flag: '🇨🇳', en: 'Chinese',    native: '中文',        rtl: false },
            ].map((lang, i) => (
              <FadeIn key={lang.en} delay={i * 50}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 2.5, borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', transition: 'all 0.2s', cursor: 'default', '&:hover': { border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.08)', transform: 'translateY(-3px)' } }}>
                  <Typography sx={{ fontSize: '2rem', lineHeight: 1 }}>{lang.flag}</Typography>
                  <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', direction: lang.rtl ? 'rtl' : 'ltr' }}>{lang.native}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>{lang.en}</Typography>
                  {lang.rtl && (
                    <Box sx={{ px: 1, py: 0.2, borderRadius: 1, background: 'rgba(139,92,246,0.25)', border: '1px solid rgba(139,92,246,0.4)' }}>
                      <Typography sx={{ color: '#C084FC', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.04em' }}>RTL</Typography>
                    </Box>
                  )}
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
              <Chip label="THE PROBLEM" sx={{ mb: 3, background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.25)', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em' }} />
              <Typography variant="h2" sx={{ color: 'white', fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, mb: 2 }}>
                Your current PM tool is just a{' '}
                <Box component="span" sx={{ color: '#EF4444', textDecoration: 'line-through' }}>fancy to-do list</Box>
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '1.1rem', lineHeight: 1.7 }}>
                Monday, Asana, and Notion help you track work — but they don't think. You still need to plan, assign, schedule, and risk-check everything manually.
              </Typography>
            </Box>
          </FadeIn>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {['You spend Monday planning your whole week', 'Tasks get assigned based on guesswork', 'Nobody sees the deadline risk until it\'s too late', 'Standups replace actual visibility', 'AI tools require you to write perfect prompts', 'Reporting takes hours every week'].map((p, i) => (
              <FadeIn key={i} delay={i * 80}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2.5, borderRadius: 2, border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.04)' }}>
                  <Close sx={{ color: '#EF4444', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
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
              <Chip label="FEATURES" sx={{ mb: 3, background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em' }} />
              <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A', lineHeight: 1.15, mb: 2 }}>
                Everything your team needs.{' '}
                <Box component="span" sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nothing they don't.</Box>
              </Typography>
              <Typography sx={{ color: '#64748B', fontSize: '1.1rem', maxWidth: 550, mx: 'auto' }}>
                12 core features. All AI-connected. All designed to actually reduce your team's workload.
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

      {/* ─── COMPARE ─── */}
      <Box id="compare" sx={{ background: '#F8FAFC', py: { xs: 8, md: 14 } }}>
        <Container maxWidth="lg">
          <FadeIn>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Chip label="COMPARISON" sx={{ mb: 3, background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em' }} />
              <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A', lineHeight: 1.15, mb: 2 }}>
                How Julay stacks up
              </Typography>
              <Typography sx={{ color: '#64748B', fontSize: '1.05rem' }}>Spoiler: the AI column changes everything.</Typography>
            </Box>
          </FadeIn>
          <Box sx={{ borderRadius: 4, overflow: 'hidden', border: '1.5px solid #E2E8F0', background: 'white', boxShadow: '0 4px 32px rgba(0,0,0,0.06)' }}>
            {/* Header */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr repeat(4,1fr)', background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
              <Box sx={{ p: 2.5 }} />
              {['Julay', ...TOOLS].map((t, i) => (
                <Box key={i} sx={{ p: 2.5, textAlign: 'center', borderLeft: '1px solid #E2E8F0', background: t === 'Julay' ? 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.06))' : 'transparent' }}>
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
      </Box>

      {/* ─── EARLY ADOPTERS CTA ─── */}
      <Box sx={{ background: 'white', py: { xs: 8, md: 14 } }}>
        <Container maxWidth="md">
          <FadeIn>
            <Box sx={{ textAlign: 'center', p: { xs: 5, md: 8 }, borderRadius: 4, border: '2px solid #E2E8F0', background: 'linear-gradient(135deg, #F8FAFC, #EEF2FF)' }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.75, borderRadius: 99, background: '#EEF2FF', border: '1px solid rgba(99,102,241,0.3)', mb: 3 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
                <Typography sx={{ color: '#4F46E5', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.05em' }}>NOW IN EARLY ACCESS</Typography>
              </Box>
              <Typography variant="h2" sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', mb: 2 }}>
                Be among the first teams to use Julay
              </Typography>
              <Typography sx={{ color: '#64748B', fontSize: '1rem', lineHeight: 1.7, mb: 4, maxWidth: 480, mx: 'auto' }}>
                We're launching Julay with a small group of early users. Create your account now — get full access for free and help shape the product.
              </Typography>
              <Button onClick={() => window.location.href = '/register'} variant="contained" size="large"
                sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', fontWeight: 700, px: 4, py: 1.75, borderRadius: 2.5, fontSize: '1rem', boxShadow: '0 4px 24px rgba(99,102,241,0.35)', '&:hover': { opacity: 0.9 } }}>
                Get Early Access — Free <ArrowForward sx={{ ml: 1, fontSize: 18 }} />
              </Button>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 4 }}>
                {['No credit card', 'Cancel anytime', 'Full feature access'].map(t => (
                  <Box key={t} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <CheckCircle sx={{ color: '#10B981', fontSize: 15 }} />
                    <Typography sx={{ color: '#64748B', fontSize: '0.82rem' }}>{t}</Typography>
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
              <Chip label="PRICING" sx={{ mb: 3, background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em' }} />
              <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A', lineHeight: 1.15, mb: 2 }}>
                Start free. Scale as you grow.
              </Typography>
              <Typography sx={{ color: '#64748B', fontSize: '1.05rem', mb: 4 }}>No surprises. No per-seat traps. Cancel anytime.</Typography>
              <ToggleButtonGroup value={billing} exclusive onChange={(_, v) => v && setBilling(v)} sx={{ background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 2, p: 0.5 }}>
                <ToggleButton value="monthly" sx={{ px: 3, py: 1, borderRadius: 1.5, fontSize: '0.85rem', fontWeight: 600, border: 'none', '&.Mui-selected': { background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white' } }}>Monthly</ToggleButton>
                <ToggleButton value="yearly" sx={{ px: 3, py: 1, borderRadius: 1.5, fontSize: '0.85rem', fontWeight: 600, border: 'none', '&.Mui-selected': { background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white' } }}>
                  Yearly <Box component="span" sx={{ ml: 0.75, px: 0.75, py: 0.15, borderRadius: 1, background: '#10B981', color: 'white', fontSize: '0.68rem', fontWeight: 800 }}>-22%</Box>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </FadeIn>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4,1fr)' }, gap: 2.5, alignItems: 'start' }}>
            {PLANS.map((plan, i) => (
              <FadeIn key={i} delay={i * 80}>
                <Box sx={{ position: 'relative', borderRadius: 3, border: plan.highlight ? '2px solid #6366F1' : '1.5px solid #E2E8F0', background: plan.highlight ? 'white' : 'white', boxShadow: plan.highlight ? '0 8px 40px rgba(99,102,241,0.2)' : '0 1px 4px rgba(0,0,0,0.04)', transform: plan.highlight ? 'scale(1.03)' : 'none', transition: 'all 0.2s', '&:hover': { boxShadow: '0 12px 40px rgba(0,0,0,0.1)', transform: plan.highlight ? 'scale(1.05)' : 'translateY(-4px)' } }}>
                  {plan.popular && <Box sx={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', px: 2, py: 0.5, borderRadius: 99, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}><Typography sx={{ color: 'white', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em' }}>MOST POPULAR</Typography></Box>}
                  <Box sx={{ p: 3.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', mb: 0.5 }}>{plan.name}</Typography>
                    <Typography sx={{ color: '#64748B', fontSize: '0.82rem', mb: 2.5 }}>{plan.description}</Typography>
                    <Box sx={{ mb: 3 }}>
                      {plan.price === 0 ? (
                        <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1 }}>Free</Typography>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                          <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: '#64748B', mt: 0.5 }}>$</Typography>
                          <Typography sx={{ fontSize: '2.8rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1 }}>
                            {billing === 'yearly' ? plan.yearlyPrice : plan.price}
                          </Typography>
                          <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>/mo</Typography>
                        </Box>
                      )}
                      {billing === 'yearly' && plan.price > 0 && <Typography sx={{ color: '#10B981', fontSize: '0.78rem', fontWeight: 600, mt: 0.5 }}>Save ${(plan.price - plan.yearlyPrice) * 12}/year</Typography>}
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
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0F172A', mb: 0.5 }}>Enterprise</Typography>
                <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>Unlimited AI · SSO/SAML · White-label · Custom SLA · Dedicated support · On-premise option</Typography>
              </Box>
              <Button variant="outlined" size="large" sx={{ flexShrink: 0, px: 3.5, py: 1.25, fontWeight: 700, borderWidth: '1.5px', borderRadius: 2, whiteSpace: 'nowrap' }}>Contact Sales</Button>
            </Box>
          </FadeIn>
        </Container>
      </Box>

      {/* ─── FAQ ─── */}
      <Box id="faq" sx={{ background: 'white', py: { xs: 8, md: 14 } }}>
        <Container maxWidth="md">
          <FadeIn>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Chip label="FAQ" sx={{ mb: 3, background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em' }} />
              <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A' }}>
                Questions? We've got answers.
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
            <Typography sx={{ color: '#818CF8', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 3 }}>Stop planning. Start executing.</Typography>
            <Typography variant="h2" sx={{ color: 'white', fontSize: { xs: '2.5rem', md: '4rem' }, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, mb: 3 }}>
              Your next project starts{' '}
              <Box component="span" sx={{ background: 'linear-gradient(135deg,#818CF8,#C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>right now.</Box>
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '1.1rem', mb: 6, maxWidth: 480, mx: 'auto' }}>
              Replace planning meetings with Julay AI. Describe your goal, get a full project in 60 seconds. Free forever. No credit card.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center' }}>
              <Button onClick={() => navigate('/register')} variant="contained" size="large" sx={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', fontWeight: 700, px: 5, py: 2, borderRadius: 2.5, fontSize: '1.05rem', boxShadow: '0 8px 32px rgba(99,102,241,0.5)', '&:hover': { opacity: 0.9, transform: 'translateY(-2px)', boxShadow: '0 12px 48px rgba(99,102,241,0.6)' }, transition: 'all 0.2s' }}>
                Build your first project free <ArrowForward sx={{ ml: 1, fontSize: 18 }} />
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', mt: 5 }}>
              {['Free forever plan', 'No credit card', 'Setup in 60 seconds', 'Cancel anytime'].map(t => (
                <Box key={t} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <CheckCircleOutline sx={{ color: '#10B981', fontSize: 15 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>{t}</Typography>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: 1.5, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>J</Typography>
                </Box>
                <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1rem' }}>Julay</Typography>
              </Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', lineHeight: 1.65 }}>AI-powered project management for modern teams. Plan smarter. Execute faster.</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
              {[
                { title: 'Product', links: ['Features', 'Pricing', 'Compare', 'Changelog'] },
                { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
                { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] },
              ].map(col => (
                <Box key={col.title}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 2 }}>{col.title}</Typography>
                  {col.links.map(l => (
                    <Typography key={l} sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', mb: 1.25, cursor: 'pointer', display: 'block', transition: 'color 0.15s', '&:hover': { color: 'rgba(255,255,255,0.7)' } }}>{l}</Typography>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 4 }} />
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem' }}>© 2025 Julay. All rights reserved.</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem' }}>Built with ❤️ · Powered by Claude AI</Typography>
          </Box>
        </Container>
      </Box>

    </Box>
  );
}
