import React, { useState } from 'react';
import { Box, Typography, Button, Container, Grid, Chip, Avatar } from '@mui/material';
import { CheckCircle, ArrowForward, AutoAwesome, Groups, Timeline, BarChart, Bolt, RocketLaunch, Psychology, Menu, Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '🤖', color: '#6C5CE7', bg: '#F0EEFF', title: 'AI Project Generation', desc: 'Type any idea and AI builds a full plan — tasks, team, timeline — in seconds.' },
  { icon: '👥', color: '#00B894', bg: '#E8FBF5', title: 'Smart Team Assignment', desc: 'AI matches tasks to the right people based on skills and availability.' },
  { icon: '⚡', color: '#FDCB6E', bg: '#FFFBEE', title: 'Daily AI Standup', desc: 'Automated standup reports every morning with blockers and priorities.' },
  { icon: '📊', color: '#E17055', bg: '#FFF2EF', title: 'Performance Analytics', desc: 'Track velocity, completion rates, and get AI improvement recommendations.' },
  { icon: '🗂', color: '#0984E3', bg: '#EEF6FF', title: 'Kanban & Gantt', desc: 'Drag-and-drop boards and Gantt timelines to visualize all your work.' },
  { icon: '🔄', color: '#00CEC9', bg: '#EEFAFA', title: 'Auto Re-planning', desc: 'When delays happen, AI reschedules your entire project automatically.' },
];

const TESTIMONIALS = [
  { name: 'Sarah K.', role: 'Product Manager', text: 'Julay replaced 3 tools for us. The AI planning alone saves us hours every week.', avatar: 'S' },
  { name: 'Ahmed R.', role: 'Engineering Lead', text: 'The AI standup is incredible. It knows what\'s blocked before I even ask.', avatar: 'A' },
  { name: 'Maria L.', role: 'Startup Founder', text: 'We went from idea to full project plan in under 2 minutes. Unbelievable.', avatar: 'M' },
];

const STATS = [
  { value: '10x', label: 'Faster planning' },
  { value: '68%', label: 'Less meetings' },
  { value: '4.9★', label: 'User rating' },
  { value: '2min', label: 'To full project plan' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Box sx={{ bgcolor: '#fff', color: '#1a1a2e', fontFamily: 'Inter, sans-serif' }}>

      {/* ── NAV ── */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 100, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f0f0f0' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Psychology sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Typography fontWeight={800} fontSize={20} color="#1a1a2e">julay</Typography>
            </Box>

            {/* Desktop Nav */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4 }}>
              {['Features', 'Pricing', 'About'].map(item => (
                <Typography key={item} sx={{ color: '#555', fontWeight: 500, cursor: 'pointer', fontSize: '0.95rem', '&:hover': { color: '#6C5CE7' }, transition: 'color 0.15s' }}>
                  {item}
                </Typography>
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Button onClick={() => navigate('/login')} sx={{ color: '#555', fontWeight: 600, display: { xs: 'none', md: 'inline-flex' }, '&:hover': { color: '#6C5CE7' } }}>
                Log in
              </Button>
              <Button onClick={() => navigate('/register')} variant="contained"
                sx={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)', fontWeight: 700, borderRadius: 2.5, px: 2.5, py: 1, boxShadow: '0 4px 15px rgba(108,92,231,0.3)', '&:hover': { boxShadow: '0 6px 20px rgba(108,92,231,0.5)' }, textTransform: 'none', fontSize: '0.9rem' }}>
                Get Started Free
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── HERO ── */}
      <Box sx={{ background: 'linear-gradient(180deg, #faf9ff 0%, #ffffff 100%)', pt: { xs: 8, md: 12 }, pb: { xs: 6, md: 8 }, overflow: 'hidden' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: 780, mx: 'auto', mb: { xs: 6, md: 8 } }}>
            <Chip label="✨ AI-Powered Project Management" sx={{ mb: 3, bgcolor: '#F0EEFF', color: '#6C5CE7', fontWeight: 700, fontSize: '0.82rem', border: '1px solid #d9d4ff', px: 1 }} />

            <Typography sx={{ fontWeight: 900, fontSize: { xs: '2.6rem', sm: '3.4rem', md: '4.2rem' }, lineHeight: 1.08, letterSpacing: '-0.04em', mb: 3, color: '#1a1a2e' }}>
              Your team's work,<br />
              <Box component="span" sx={{ background: 'linear-gradient(135deg, #6C5CE7, #fd79a8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                powered by AI
              </Box>
            </Typography>

            <Typography sx={{ color: '#777', fontSize: { xs: '1rem', md: '1.2rem' }, lineHeight: 1.7, maxWidth: 560, mx: 'auto', mb: 5 }}>
              Describe any project. Julay's AI instantly creates a complete plan with goals, tasks, team assignments, and timelines — in under 2 minutes.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
              <Button onClick={() => navigate('/register')} variant="contained" size="large" endIcon={<ArrowForward />}
                sx={{ px: 4, py: 1.6, fontWeight: 700, fontSize: '1rem', background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)', borderRadius: 3, boxShadow: '0 8px 30px rgba(108,92,231,0.35)', '&:hover': { boxShadow: '0 12px 40px rgba(108,92,231,0.5)', transform: 'translateY(-2px)' }, transition: 'all 0.2s', textTransform: 'none' }}>
                Start for free
              </Button>
              <Button onClick={() => navigate('/login')} variant="outlined" size="large"
                sx={{ px: 4, py: 1.6, fontWeight: 700, fontSize: '1rem', borderColor: '#e0e0e0', color: '#444', borderRadius: 3, '&:hover': { borderColor: '#6C5CE7', color: '#6C5CE7', bgcolor: '#f9f7ff' }, textTransform: 'none' }}>
                Sign in
              </Button>
            </Box>
            <Typography sx={{ color: '#aaa', fontSize: '0.82rem' }}>No credit card required • Free forever plan available</Typography>
          </Box>

          {/* App Preview */}
          <Box sx={{ maxWidth: 900, mx: 'auto', borderRadius: 4, overflow: 'hidden', boxShadow: '0 30px 80px rgba(108,92,231,0.15), 0 0 0 1px rgba(108,92,231,0.08)', border: '1px solid #f0eeff' }}>
            {/* Fake browser bar */}
            <Box sx={{ bgcolor: '#f8f8f8', px: 2, py: 1.2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #eee' }}>
              {['#ff5f57','#febc2e','#28c840'].map(c => <Box key={c} sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: c }} />)}
              <Box sx={{ flex: 1, mx: 2, bgcolor: '#fff', borderRadius: 1.5, px: 2, py: 0.5, fontSize: '0.78rem', color: '#aaa', border: '1px solid #eee' }}>julay.org/dashboard</Box>
            </Box>
            {/* Dashboard mockup */}
            <Box sx={{ bgcolor: '#0F172A', p: 3, minHeight: 320 }}>
              <Grid container spacing={2}>
                {/* Sidebar */}
                <Grid item xs={2}>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2, p: 1.5, height: '100%' }}>
                    {['Dashboard','Projects','Team','AI Studio'].map((item, i) => (
                      <Box key={item} sx={{ py: 0.8, px: 1, borderRadius: 1.5, mb: 0.5, bgcolor: i === 3 ? 'rgba(108,92,231,0.3)' : 'transparent', cursor: 'pointer' }}>
                        <Typography sx={{ color: i === 3 ? '#a29bfe' : 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: i === 3 ? 700 : 400 }}>{item}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
                {/* Main content */}
                <Grid item xs={10}>
                  <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    {[['12', 'Active Projects', '#6C5CE7'],['89%', 'On-Time Rate', '#00B894'],['24', 'Tasks Today', '#FDCB6E'],['3', 'AI Reports', '#E17055']].map(([val, label, color]) => (
                      <Grid item xs={3} key={label}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, p: 1.5 }}>
                          <Typography sx={{ color, fontWeight: 800, fontSize: '1.3rem' }}>{val}</Typography>
                          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>{label}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  <Box sx={{ bgcolor: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.3)', borderRadius: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <AutoAwesome sx={{ color: '#a29bfe', fontSize: 16 }} />
                      <Typography sx={{ color: '#a29bfe', fontWeight: 700, fontSize: '0.8rem' }}>AI Studio — Generate Project Plan</Typography>
                    </Box>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1.5, p: 1.2, mb: 1 }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>"Build an e-commerce platform with payment integration..."</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {['6 Goals','24 Tasks','5 Team Members','3 Weeks'].map(tag => (
                        <Chip key={tag} label={tag} size="small" sx={{ bgcolor: 'rgba(108,92,231,0.25)', color: '#a29bfe', fontSize: '0.65rem', height: 22 }} />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── STATS ── */}
      <Box sx={{ bgcolor: '#6C5CE7', py: 5 }}>
        <Container maxWidth="lg">
          <Grid container spacing={2} justifyContent="center">
            {STATS.map(({ value, label }) => (
              <Grid item xs={6} md={3} key={label} sx={{ textAlign: 'center' }}>
                <Typography sx={{ color: 'white', fontWeight: 900, fontSize: { xs: '2rem', md: '2.8rem' }, letterSpacing: '-0.03em' }}>{value}</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: 500 }}>{label}</Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── FEATURES ── */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fafafa' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: '2rem', md: '2.8rem' }, letterSpacing: '-0.03em', mb: 1.5 }}>
              Everything your team needs
            </Typography>
            <Typography sx={{ color: '#888', fontSize: '1.05rem', maxWidth: 500, mx: 'auto' }}>
              One platform to plan, execute, and deliver — supercharged with AI
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {FEATURES.map((f) => (
              <Grid item xs={12} sm={6} md={4} key={f.title}>
                <Box sx={{ bgcolor: '#fff', borderRadius: 3, p: 3.5, height: '100%', border: '1px solid #f0f0f0', transition: 'all 0.2s', '&:hover': { boxShadow: '0 12px 40px rgba(0,0,0,0.08)', transform: 'translateY(-4px)', borderColor: f.color + '40' } }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', mb: 2 }}>
                    {f.icon}
                  </Box>
                  <Typography fontWeight={700} fontSize="1rem" mb={1} color="#1a1a2e">{f.title}</Typography>
                  <Typography sx={{ color: '#888', fontSize: '0.875rem', lineHeight: 1.65 }}>{f.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── TESTIMONIALS ── */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Typography sx={{ fontWeight: 900, fontSize: { xs: '2rem', md: '2.8rem' }, letterSpacing: '-0.03em', textAlign: 'center', mb: 7 }}>
            Loved by teams worldwide
          </Typography>
          <Grid container spacing={3}>
            {TESTIMONIALS.map((t) => (
              <Grid item xs={12} md={4} key={t.name}>
                <Box sx={{ bgcolor: '#fafafa', borderRadius: 3, p: 3.5, border: '1px solid #f0f0f0', height: '100%' }}>
                  <Typography sx={{ color: '#333', fontSize: '1rem', lineHeight: 1.7, mb: 3, fontStyle: 'italic' }}>"{t.text}"</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: '#6C5CE7', width: 38, height: 38, fontWeight: 700 }}>{t.avatar}</Avatar>
                    <Box>
                      <Typography fontWeight={700} fontSize="0.875rem">{t.name}</Typography>
                      <Typography sx={{ color: '#aaa', fontSize: '0.78rem' }}>{t.role}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── PRICING ── */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fafafa' }} id="pricing">
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: '2rem', md: '2.8rem' }, letterSpacing: '-0.03em', mb: 1.5 }}>
              Simple pricing
            </Typography>
            <Typography sx={{ color: '#888', fontSize: '1.05rem' }}>Start free. Upgrade when you need AI.</Typography>
          </Box>
          <Grid container spacing={3} justifyContent="center">
            {/* Free */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ bgcolor: '#fff', borderRadius: 4, p: 4, border: '1px solid #e8e8e8', height: '100%' }}>
                <Typography fontWeight={800} fontSize="1.1rem" mb={0.5}>Free</Typography>
                <Typography sx={{ color: '#aaa', fontSize: '0.85rem', mb: 3 }}>For individuals & small teams</Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, mb: 3 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: '3rem', letterSpacing: '-0.04em', lineHeight: 1 }}>$0</Typography>
                  <Typography sx={{ color: '#aaa', mb: 0.8 }}>/month</Typography>
                </Box>
                {['Project management', 'Kanban & Timeline views', 'Team collaboration', 'Up to 3 projects'].map(f => (
                  <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.2 }}>
                    <CheckCircle sx={{ color: '#00B894', fontSize: 18 }} />
                    <Typography fontSize="0.875rem" color="#555">{f}</Typography>
                  </Box>
                ))}
                <Button fullWidth onClick={() => navigate('/register')} variant="outlined"
                  sx={{ mt: 3, borderColor: '#e0e0e0', color: '#444', fontWeight: 700, borderRadius: 2.5, py: 1.2, textTransform: 'none', fontSize: '0.95rem', '&:hover': { borderColor: '#6C5CE7', color: '#6C5CE7', bgcolor: '#f9f7ff' } }}>
                  Get started free
                </Button>
              </Box>
            </Grid>
            {/* Pro */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ bgcolor: '#6C5CE7', borderRadius: 4, p: 4, height: '100%', position: 'relative', boxShadow: '0 20px 60px rgba(108,92,231,0.35)' }}>
                <Chip label="Most Popular" size="small" sx={{ position: 'absolute', top: 20, right: 20, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700, fontSize: '0.72rem' }} />
                <Typography fontWeight={800} fontSize="1.1rem" mb={0.5} color="white">Pro</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mb: 3 }}>For teams that move fast with AI</Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, mb: 3 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: '3rem', letterSpacing: '-0.04em', lineHeight: 1, color: 'white' }}>$20</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.8 }}>/month</Typography>
                </Box>
                {['Everything in Free', 'AI project generation', 'Daily AI standup reports', 'Performance analytics', 'Auto re-planning', 'Unlimited projects', 'Priority support'].map(f => (
                  <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.2 }}>
                    <CheckCircle sx={{ color: '#a29bfe', fontSize: 18 }} />
                    <Typography fontSize="0.875rem" color="rgba(255,255,255,0.85)">{f}</Typography>
                  </Box>
                ))}
                <Button fullWidth onClick={() => navigate('/register')} variant="contained"
                  sx={{ mt: 3, bgcolor: 'white', color: '#6C5CE7', fontWeight: 800, borderRadius: 2.5, py: 1.2, textTransform: 'none', fontSize: '0.95rem', '&:hover': { bgcolor: '#f0eeff', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' } }}>
                  Start Pro Free
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── CTA ── */}
      <Box sx={{ py: { xs: 8, md: 12 }, background: 'linear-gradient(135deg, #6C5CE7 0%, #a29bfe 50%, #fd79a8 100%)', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography sx={{ fontWeight: 900, fontSize: { xs: '2rem', md: '3rem' }, letterSpacing: '-0.03em', color: 'white', mb: 2 }}>
            Ready to work smarter?
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', mb: 5 }}>
            Join teams using Julay to ship faster with AI.
          </Typography>
          <Button onClick={() => navigate('/register')} variant="contained" size="large"
            sx={{ px: 5, py: 1.8, fontWeight: 800, fontSize: '1.05rem', bgcolor: 'white', color: '#6C5CE7', borderRadius: 3, boxShadow: '0 8px 30px rgba(0,0,0,0.2)', '&:hover': { bgcolor: '#f5f3ff', transform: 'translateY(-2px)', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }, transition: 'all 0.2s', textTransform: 'none' }}>
            Get started — it's free ✨
          </Button>
        </Container>
      </Box>

      {/* ── FOOTER ── */}
      <Box sx={{ bgcolor: '#1a1a2e', py: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1.5, background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Psychology sx={{ color: 'white', fontSize: 16 }} />
              </Box>
              <Typography fontWeight={800} color="white" fontSize="0.95rem">julay</Typography>
            </Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>© 2026 Julay. All rights reserved.</Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              {['Privacy', 'Terms', 'Contact'].map(item => (
                <Typography key={item} sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', cursor: 'pointer', '&:hover': { color: 'rgba(255,255,255,0.7)' } }}>{item}</Typography>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
