import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, Box, Typography, Button, TextField, IconButton,
  Step, Stepper, StepLabel, Chip, Avatar
} from '@mui/material';
import { CheckCircle, Add, Close, Celebration, FolderOpen, Group, AutoAwesome, ArrowForward, ArrowBack, Rocket } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import api, { projectsAPI } from '../../services/api.js';

const STEPS = ['Welcome', 'Create Project', 'Invite Team', 'All Set!'];

const INDUSTRIES = ['Software', 'Marketing', 'Design', 'Finance', 'Healthcare', 'Education', 'Other'];

function ConfettiPiece({ color, left, delay, duration }) {
  return (
    <Box sx={{
      position: 'absolute', top: '-10px', left: `${left}%`, width: 8, height: 8, borderRadius: 1,
      bgcolor: color, pointerEvents: 'none',
      animation: `confettiFall ${duration}s ease-in ${delay}s infinite`,
      '@keyframes confettiFall': {
        '0%': { transform: 'translateY(-10px) rotate(0deg)', opacity: 1 },
        '100%': { transform: 'translateY(300px) rotate(720deg)', opacity: 0 },
      },
    }} />
  );
}

const CONFETTI_COLORS = ['#6366f1', '#a855f7', '#34d399', '#f472b6', '#fbbf24', '#818cf8'];
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left: (i * 5.5) % 100,
  delay: (i * 0.15) % 1.5,
  duration: 1.8 + (i % 5) * 0.3,
}));

export default function OnboardingWizard() {
  const user = useSelector(s => s.auth.user);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [industry, setIndustry] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [emails, setEmails] = useState(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [inviteResults, setInviteResults] = useState([]);

  useEffect(() => {
    const done = localStorage.getItem('julay_onboarding_done');
    if (done) return;
    if (!user) return;
    const createdAt = user.createdAt ? new Date(user.createdAt) : null;
    if (!createdAt) return;
    const diffHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (diffHours < 48) {
      setOpen(true);
    }
  }, [user]);

  const handleSkip = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      finish();
    }
  };

  const finish = () => {
    localStorage.setItem('julay_onboarding_done', 'true');
    setOpen(false);
  };

  const handleNext = async () => {
    if (step === 1 && projectName.trim()) {
      setLoading(true);
      try {
        await projectsAPI.create({ name: projectName.trim(), description: projectDesc, industry });
      } catch {
        // silent — don't block onboarding
      } finally {
        setLoading(false);
      }
    }
    if (step === 2) {
      const filled = emails.filter(e => e.trim());
      if (filled.length > 0) {
        setLoading(true);
        const results = await Promise.all(
          filled.map(async (email) => {
            try {
              const res = await api.post('/auth/invite', { email: email.trim() });
              return { email: email.trim(), link: res.data.inviteLink, ok: true };
            } catch (e) {
              return { email: email.trim(), error: e.message || 'Failed', ok: false };
            }
          })
        );
        setInviteResults(results);
        setLoading(false);
        return; // stay on step 2 to show results
      }
    }
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      finish();
    }
  };

  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const updateEmail = (idx, val) => {
    setEmails(prev => { const next = [...prev]; next[idx] = val; return next; });
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      onClose={() => {}}
      PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' } }}
    >
      {/* Purple top bar */}
      <Box sx={{ height: 4, background: 'linear-gradient(90deg, #6366f1, #a855f7, #f472b6)' }} />

      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ px: 3.5, pt: 3, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AutoAwesome sx={{ color: 'white', fontSize: 16 }} />
            </Box>
            <Typography fontWeight={800} fontSize="1rem" color="text.primary">julay</Typography>
          </Box>
          <Button size="small" onClick={handleSkip} sx={{ color: 'text.secondary', textTransform: 'none', fontSize: '0.8rem' }}>
            Skip {step < STEPS.length - 1 ? 'step' : ''}
          </Button>
        </Box>

        {/* Progress dots */}
        <Box sx={{ px: 3.5, pb: 2.5, display: 'flex', gap: 1 }}>
          {STEPS.map((s, i) => (
            <Box key={s} sx={{ height: 4, borderRadius: 99, flex: 1, bgcolor: i <= step ? '#6366f1' : 'divider', transition: 'background-color 0.3s' }} />
          ))}
        </Box>

        {/* Step content */}
        <Box sx={{ px: 3.5, pb: 3.5, minHeight: 320 }}>

          {/* Step 0: Welcome */}
          {step === 0 && (
            <Box>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 56, height: 56, background: 'linear-gradient(135deg, #6366f1, #a855f7)', fontSize: '1.4rem', fontWeight: 800 }}>
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </Avatar>
                <Box>
                  <Typography fontWeight={800} fontSize="1.4rem" color="text.primary" letterSpacing="-0.02em">
                    Welcome to Julay! 🎉
                  </Typography>
                  <Typography color="text.secondary" fontSize="0.875rem">{user?.name}</Typography>
                </Box>
              </Box>
              <Typography color="text.secondary" fontSize="0.95rem" lineHeight={1.7} mb={3}>
                Julay is your AI-powered work operating system. Plan projects in seconds, assign tasks intelligently, and keep your whole team aligned — all in one place.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
                {[
                  { icon: <AutoAwesome sx={{ fontSize: 18, color: '#6366f1' }} />, text: 'AI generates complete project plans from a single prompt' },
                  { icon: <Group sx={{ fontSize: 18, color: '#a855f7' }} />, text: 'Smart team assignment based on skills & availability' },
                  { icon: <CheckCircle sx={{ fontSize: 18, color: '#10B981' }} />, text: 'Real-time progress tracking across all your projects' },
                ].map(({ icon, text }) => (
                  <Box key={text} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ mt: 0.1, flexShrink: 0 }}>{icon}</Box>
                    <Typography fontSize="0.875rem" color="text.primary">{text}</Typography>
                  </Box>
                ))}
              </Box>
              <Button fullWidth variant="contained" onClick={handleNext} endIcon={<ArrowForward />}
                sx={{ py: 1.3, fontWeight: 700, fontSize: '0.95rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 2.5, textTransform: 'none', boxShadow: '0 4px 16px rgba(99,102,241,0.35)', '&:hover': { boxShadow: '0 8px 24px rgba(99,102,241,0.5)' } }}>
                Let's get started
              </Button>
            </Box>
          )}

          {/* Step 1: Create Project */}
          {step === 1 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <FolderOpen sx={{ color: '#6366f1', fontSize: 28 }} />
                <Typography fontWeight={800} fontSize="1.3rem" color="text.primary" letterSpacing="-0.02em">Create your first project</Typography>
              </Box>
              <Typography color="text.secondary" fontSize="0.875rem" mb={3}>
                Give your project a name and we'll set it up in seconds.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <TextField
                  label="Project name"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g. Mobile App Redesign"
                  fullWidth
                  autoFocus
                />
                <Box>
                  <Typography fontSize="0.8rem" fontWeight={600} color="text.secondary" mb={1}>Industry / Type</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {INDUSTRIES.map(ind => (
                      <Chip
                        key={ind} label={ind} size="small" clickable
                        onClick={() => setIndustry(ind)}
                        sx={{ fontWeight: 600, fontSize: '0.78rem', borderWidth: '1.5px',
                          bgcolor: industry === ind ? 'rgba(99,102,241,0.1)' : 'transparent',
                          color: industry === ind ? '#6366f1' : 'text.secondary',
                          borderColor: industry === ind ? '#6366f1' : 'divider',
                          border: '1.5px solid',
                        }}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
                <TextField
                  label="Short description (optional)"
                  value={projectDesc}
                  onChange={e => setProjectDesc(e.target.value)}
                  placeholder="What is this project about?"
                  fullWidth
                  multiline
                  rows={2}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button onClick={handleBack} startIcon={<ArrowBack />} sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>Back</Button>
                <Button fullWidth variant="contained" onClick={handleNext} disabled={loading}
                  sx={{ py: 1.2, fontWeight: 700, fontSize: '0.9rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 2.5, textTransform: 'none' }}>
                  {loading ? 'Creating...' : projectName.trim() ? 'Create & Continue' : 'Skip for now'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 2: Invite Team */}
          {step === 2 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Group sx={{ color: '#a855f7', fontSize: 28 }} />
                <Typography fontWeight={800} fontSize="1.3rem" color="text.primary" letterSpacing="-0.02em">Invite your team</Typography>
              </Box>
              <Typography color="text.secondary" fontSize="0.875rem" mb={3}>
                Add teammates by email. They'll get a unique link to create their account.
              </Typography>

              {inviteResults.length === 0 ? (
                <>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                    {emails.map((email, idx) => (
                      <TextField
                        key={idx}
                        label={`Teammate ${idx + 1} email`}
                        value={email}
                        onChange={e => updateEmail(idx, e.target.value)}
                        placeholder="colleague@company.com"
                        type="email"
                        fullWidth
                        autoFocus={idx === 0}
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button onClick={handleBack} startIcon={<ArrowBack />} sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>Back</Button>
                    <Button fullWidth variant="contained" onClick={handleNext} disabled={loading}
                      sx={{ py: 1.2, fontWeight: 700, fontSize: '0.9rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 2.5, textTransform: 'none' }}>
                      {loading ? 'Sending…' : emails.some(e => e.trim()) ? 'Generate Invite Links' : 'Skip for now'}
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                    {inviteResults.map((r, i) => (
                      <Box key={i} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: r.ok ? 'success.light' : 'error.light', bgcolor: r.ok ? 'success.50' : 'error.50' }}>
                        <Typography fontSize="0.8rem" fontWeight={700} color={r.ok ? 'success.dark' : 'error.dark'}>{r.email}</Typography>
                        {r.ok ? (
                          <Typography fontSize="0.72rem" color="text.secondary" sx={{ wordBreak: 'break-all', fontFamily: 'monospace', mt: 0.5 }}>{r.link}</Typography>
                        ) : (
                          <Typography fontSize="0.72rem" color="error.main">{r.error}</Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                  <Typography fontSize="0.78rem" color="text.secondary" mb={2}>
                    Copy the links above and share via WhatsApp, email, or any messaging app. Links are valid for 7 days.
                  </Typography>
                  <Button fullWidth variant="contained" onClick={() => { setStep(s => s + 1); }}
                    sx={{ py: 1.2, fontWeight: 700, fontSize: '0.9rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 2.5, textTransform: 'none' }}>
                    Continue →
                  </Button>
                </>
              )}
            </Box>
          )}

          {/* Step 3: Done! */}
          {step === 3 && (
            <Box sx={{ textAlign: 'center', position: 'relative', overflow: 'hidden', py: 2 }}>
              {/* Confetti */}
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', pointerEvents: 'none' }}>
                {CONFETTI.map((c, i) => <ConfettiPiece key={i} {...c} />)}
              </Box>

              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{
                  width: 80, height: 80, borderRadius: '50%', mx: 'auto', mb: 3,
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
                  animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                  '@keyframes popIn': { '0%': { transform: 'scale(0)' }, '100%': { transform: 'scale(1)' } },
                }}>
                  <Rocket sx={{ color: 'white', fontSize: 36 }} />
                </Box>

                <Typography fontWeight={900} fontSize="1.6rem" color="text.primary" letterSpacing="-0.03em" mb={1}>
                  You're all set! 🚀
                </Typography>
                <Typography color="text.secondary" fontSize="0.95rem" lineHeight={1.7} mb={4}>
                  Your workspace is ready. Start by exploring your dashboard or let AI generate your first project plan.
                </Typography>

                <Box sx={{ display: 'flex', gap: 1.5, flexDirection: 'column' }}>
                  <Button fullWidth variant="contained" onClick={finish} endIcon={<AutoAwesome />}
                    sx={{ py: 1.3, fontWeight: 700, fontSize: '0.95rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 2.5, textTransform: 'none', boxShadow: '0 4px 16px rgba(99,102,241,0.35)', '&:hover': { boxShadow: '0 8px 24px rgba(99,102,241,0.5)' } }}>
                    Go to Dashboard
                  </Button>
                  <Button fullWidth onClick={finish} sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>
                    Explore on my own
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
