import React from 'react';
import { Box, Typography, Button, Container, Grid, Card, CardContent, Chip } from '@mui/material';
import { Psychology, AutoAwesome, CheckCircle, RocketLaunch, Groups, Timeline, BarChart, Bolt } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: <AutoAwesome />, title: 'AI Project Generation', desc: 'Describe your project in plain language. AI instantly creates goals, tasks, and timelines.' },
  { icon: <Groups />, title: 'Smart Team Assignment', desc: 'AI analyzes team skills and workload to assign the right tasks to the right people.' },
  { icon: <Bolt />, title: 'Daily AI Standup', desc: 'Automated standup reports with blockers, priorities, and insights — every morning.' },
  { icon: <Timeline />, title: 'Gantt & Kanban', desc: 'Visualize your project timeline and manage tasks with drag-and-drop Kanban boards.' },
  { icon: <BarChart />, title: 'Performance Analytics', desc: 'Track team velocity, completion rates, and get AI-powered improvement recommendations.' },
  { icon: <RocketLaunch />, title: 'Auto Re-planning', desc: 'When delays happen, AI automatically reschedules tasks and adjusts your timeline.' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', background: '#0F172A', color: 'white' }}>
      {/* Nav */}
      <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', px: { xs: 3, md: 6 }, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Psychology sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Typography fontWeight={800} fontSize={18} letterSpacing='-0.02em'>Julay</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button onClick={() => navigate('/login')} sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, '&:hover': { color: 'white' } }}>Sign In</Button>
          <Button onClick={() => navigate('/register')} variant="contained" sx={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', fontWeight: 700, px: 2.5, borderRadius: 2, '&:hover': { boxShadow: '0 4px 16px rgba(79,70,229,0.5)' } }}>
            Get Started Free
          </Button>
        </Box>
      </Box>

      {/* Hero */}
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 40%, rgba(79,70,229,0.2) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(124,58,237,0.15) 0%, transparent 50%)' }} />
        <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 14 }, pb: { xs: 8, md: 12 }, position: 'relative', textAlign: 'center' }}>
          <Chip label="AI-Powered Project Management" sx={{ mb: 3, background: 'rgba(99,102,241,0.15)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)', fontWeight: 600 }} />
          <Typography variant="h1" sx={{ fontWeight: 900, fontSize: { xs: '2.5rem', md: '4rem' }, letterSpacing: '-0.04em', lineHeight: 1.05, mb: 3 }}>
            Your team's AI-powered<br />
            <Box component="span" sx={{ background: 'linear-gradient(135deg, #818CF8, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              work engine
            </Box>
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: '1rem', md: '1.2rem' }, maxWidth: 560, mx: 'auto', mb: 5, lineHeight: 1.7 }}>
            Describe any project and AI instantly generates a complete plan — goals, tasks, team assignments, and timelines. Ship faster, work smarter.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button onClick={() => navigate('/register')} variant="contained" size="large"
              sx={{ px: 4, py: 1.5, fontWeight: 700, fontSize: '1rem', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', borderRadius: 2.5, boxShadow: '0 8px 32px rgba(79,70,229,0.4)', '&:hover': { boxShadow: '0 12px 40px rgba(79,70,229,0.6)', transform: 'translateY(-2px)' }, transition: 'all 0.2s' }}>
              Start Free — No Credit Card
            </Button>
            <Button onClick={() => navigate('/login')} variant="outlined" size="large"
              sx={{ px: 4, py: 1.5, fontWeight: 700, fontSize: '1rem', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', borderRadius: 2.5, '&:hover': { borderColor: 'rgba(255,255,255,0.3)', color: 'white', background: 'rgba(255,255,255,0.04)' } }}>
              Sign In
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography variant="h3" fontWeight={800} textAlign="center" letterSpacing='-0.03em' mb={1}>Everything your team needs</Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', mb: 6, fontSize: '1.05rem' }}>From idea to execution — powered by AI</Typography>
        <Grid container spacing={3}>
          {FEATURES.map((f, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 3, height: '100%', transition: 'all 0.2s', '&:hover': { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(99,102,241,0.3)', transform: 'translateY(-4px)' } }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2.5, background: 'linear-gradient(135deg, rgba(79,70,229,0.3), rgba(124,58,237,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, color: '#818CF8' }}>
                    {f.icon}
                  </Box>
                  <Typography fontWeight={700} mb={1} fontSize="1rem">{f.title}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', lineHeight: 1.6 }}>{f.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Pricing */}
      <Box sx={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 }, textAlign: 'center' }}>
          <Typography variant="h3" fontWeight={800} letterSpacing='-0.03em' mb={1}>Simple, transparent pricing</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', mb: 6, fontSize: '1.05rem' }}>One plan, everything included</Typography>
          <Grid container spacing={3} justifyContent="center">
            {/* Free */}
            <Grid item xs={12} sm={5}>
              <Card sx={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, p: 1 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography fontWeight={700} fontSize="1.1rem" mb={0.5}>Free</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', mb: 3 }}>For individuals getting started</Typography>
                  <Typography variant="h3" fontWeight={900} letterSpacing='-0.03em' mb={3}>$0<Typography component="span" sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>/mo</Typography></Typography>
                  {['Project management', 'Kanban & Timeline', 'Team collaboration', 'Up to 3 projects'].map(f => (
                    <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CheckCircle sx={{ color: '#10B981', fontSize: 18 }} />
                      <Typography fontSize="0.875rem" sx={{ color: 'rgba(255,255,255,0.7)' }}>{f}</Typography>
                    </Box>
                  ))}
                  <Button fullWidth onClick={() => navigate('/register')} variant="outlined" sx={{ mt: 3, borderColor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700, borderRadius: 2, '&:hover': { borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)' } }}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            {/* Pro */}
            <Grid item xs={12} sm={5}>
              <Card sx={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.2), rgba(124,58,237,0.15))', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 3, p: 1, position: 'relative' }}>
                <Chip label="Most Popular" size="small" sx={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: 'white', fontWeight: 700, fontSize: '0.72rem' }} />
                <CardContent sx={{ p: 3 }}>
                  <Typography fontWeight={700} fontSize="1.1rem" mb={0.5}>Pro</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', mb: 3 }}>For teams that move fast</Typography>
                  <Typography variant="h3" fontWeight={900} letterSpacing='-0.03em' mb={3}>$20<Typography component="span" sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>/mo</Typography></Typography>
                  {['Everything in Free', 'AI project generation', 'Daily AI standup', 'Performance analytics', 'Auto re-planning', 'Unlimited projects'].map(f => (
                    <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CheckCircle sx={{ color: '#818CF8', fontSize: 18 }} />
                      <Typography fontSize="0.875rem" sx={{ color: 'rgba(255,255,255,0.85)' }}>{f}</Typography>
                    </Box>
                  ))}
                  <Button fullWidth onClick={() => navigate('/register')} variant="contained" sx={{ mt: 3, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', fontWeight: 700, borderRadius: 2, py: 1.2, boxShadow: '0 4px 16px rgba(79,70,229,0.4)', '&:hover': { boxShadow: '0 6px 24px rgba(79,70,229,0.6)' } }}>
                    Start Pro Free
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight={800} letterSpacing='-0.03em' mb={2}>Ready to ship faster?</Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.4)', mb: 4, fontSize: '1.05rem' }}>Join teams using Julay to build smarter.</Typography>
        <Button onClick={() => navigate('/register')} variant="contained" size="large"
          sx={{ px: 5, py: 1.7, fontWeight: 700, fontSize: '1.05rem', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', borderRadius: 2.5, boxShadow: '0 8px 32px rgba(79,70,229,0.4)', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 40px rgba(79,70,229,0.6)' }, transition: 'all 0.2s' }}>
          Get Started — It's Free
        </Button>
      </Container>

      {/* Footer */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)', py: 3, textAlign: 'center' }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>© 2026 Julay. All rights reserved.</Typography>
      </Box>
    </Box>
  );
}
