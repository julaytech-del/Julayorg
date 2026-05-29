import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  Search,
  Help,
  Email,
  Chat,
} from '@mui/icons-material';

/* ─────────────────────────── theme tokens ─────────────────────────── */
const BG       = '#0F172A';
const SURFACE  = '#1E293B';
const ACCENT   = '#6366F1';
const BORDER   = 'rgba(255,255,255,0.08)';
const MUTED    = 'rgba(255,255,255,0.45)';
const SUBTLE   = 'rgba(255,255,255,0.07)';

/* ─────────────────────────── FAQ data ─────────────────────────────── */
const FAQ_CATEGORIES = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    color: '#10B981',
    items: [
      {
        q: 'How do I create my first project?',
        a: 'After logging in, click the "+ New Project" button in the sidebar or on your dashboard. Give your project a name, choose a color, and optionally set a due date. You\'ll be taken straight into the project where you can start adding tasks and inviting your team.',
      },
      {
        q: 'How do I invite team members?',
        a: 'Open any project, go to the Members tab, and click "Invite Member". Enter their email address and choose a role (Admin, Member, or Viewer). They\'ll receive an email invitation with a link to join the workspace.',
      },
      {
        q: 'What is the difference between a project and a task?',
        a: 'A project is a high-level container that groups related work together — for example, "Website Redesign" or "Q3 Marketing Campaign". Tasks live inside projects and represent individual units of work that can be assigned, tracked, and completed. Projects can also contain sprints, boards, and automations.',
      },
    ],
  },
  {
    id: 'billing',
    label: 'Plans & Billing',
    color: '#F59E0B',
    items: [
      {
        q: 'How do I upgrade my plan?',
        a: 'Go to Settings → Billing → Upgrade Plan. Choose the plan that fits your team size and click "Upgrade". You\'ll be taken to a secure Stripe checkout page. Once payment is confirmed, your workspace is upgraded instantly.',
      },
      {
        q: 'Can I cancel my subscription anytime?',
        a: 'Yes — you can cancel at any time with no cancellation fees. Go to Settings → Billing → Manage Subscription and click "Cancel Plan". Your access continues until the end of your current billing period.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex, Discover) processed securely via Stripe. We do not store card details on our servers.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'We offer pro-rated refunds within 7 days of a charge if you feel the product did not meet your expectations. Contact support@julay.org with your account email and reason, and we\'ll process the refund promptly.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Yes — we offer a permanent Free plan that requires no credit card. You get access to core features for up to 3 projects and 5 members. When you\'re ready to scale, upgrading takes just a few clicks.',
      },
    ],
  },
  {
    id: 'features',
    label: 'Features',
    color: ACCENT,
    items: [
      {
        q: 'How do I use the AI assistant?',
        a: 'Click the sparkle (✦) icon in the top navigation bar or press Ctrl+K (Cmd+K on Mac) to open the AI assistant panel. You can ask it to summarize project status, draft task descriptions, generate sprint goals, or answer questions about your workspace data.',
      },
      {
        q: 'How do automations work?',
        a: 'Automations let you create "if this, then that" rules inside a project. Go to your project → Automations → "+ Add Rule". Choose a trigger (e.g., "When a task is moved to Done") and one or more actions (e.g., "Send a notification" or "Assign to reviewer"). Automations run instantly in the background.',
      },
      {
        q: 'What are sprints?',
        a: 'Sprints are fixed-length work cycles — typically 1 or 2 weeks — used in agile workflows. Inside a project, open the Sprint view to create a new sprint, set its start and end dates, and drag tasks into it. At the end of the sprint you can review progress and carry unfinished tasks forward.',
      },
      {
        q: 'How do I track time on tasks?',
        a: 'Open any task and click the clock icon to start a timer. The timer runs in the background even if you navigate away. Click it again to stop and log the session. You can also manually enter time by clicking "Log Time". All time entries are visible in the Time Tracking report.',
      },
    ],
  },
  {
    id: 'security',
    label: 'Account & Security',
    color: '#EF4444',
    items: [
      {
        q: 'How do I enable two-factor authentication?',
        a: 'Go to Settings → Security → Two-Factor Authentication and click "Enable 2FA". Scan the QR code with an authenticator app (e.g., Google Authenticator or Authy), then enter the 6-digit code to confirm. From that point on, every login will require your password plus a one-time code.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings → Account → Delete Account. You\'ll be asked to confirm by typing your email address. Note that deleting your account is permanent — all your projects, tasks, and data will be removed and cannot be recovered. If you own a workspace, transfer ownership first.',
      },
      {
        q: 'How do I export my data?',
        a: 'Go to Settings → Account → Export Data and click "Request Export". We\'ll prepare a ZIP archive containing all your projects, tasks, comments, and attachments in JSON and CSV formats. You\'ll receive a download link via email within a few minutes.',
      },
      {
        q: 'Is my data secure?',
        a: 'Yes. All data is encrypted in transit using TLS 1.3 and encrypted at rest using AES-256. We host on AWS with multi-region backups, SOC 2 Type II compliance, and regular third-party penetration testing. We never sell or share your data with third parties.',
      },
    ],
  },
  {
    id: 'mobile',
    label: 'Mobile App',
    color: '#06B6D4',
    items: [
      {
        q: 'Is there an Android app?',
        a: 'Yes! Download the Julay Android app directly from julay.org/julay.apk. Install it like any APK — you may need to allow "Install from unknown sources" in your Android settings. We\'re also working on a Google Play Store listing.',
      },
      {
        q: 'Is there an iOS app?',
        a: 'An iOS app is coming soon. We\'re currently in TestFlight beta. If you\'d like early access, send us an email at support@julay.org with the subject "iOS Beta" and we\'ll add you to the waitlist.',
      },
    ],
  },
];

/* ─────────────────────────── shared sx ────────────────────────────── */
const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: SURFACE,
    color: 'white',
    borderRadius: '12px',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT },
    '& input': { color: 'white' },
  },
  '& .MuiInputLabel-root': { color: MUTED },
  '& .MuiInputLabel-root.Mui-focused': { color: '#818CF8' },
};

const accordionSx = {
  backgroundColor: SURFACE,
  color: 'white',
  border: `1px solid ${BORDER}`,
  borderRadius: '10px !important',
  mb: 1.5,
  '&:before': { display: 'none' },
  '&.Mui-expanded': { borderColor: `${ACCENT}55` },
  boxShadow: 'none',
};

const summaryIconSx = {
  color: MUTED,
  '&.Mui-expanded': { color: ACCENT },
};

/* ─────────────────────────── component ────────────────────────────── */
export default function HelpPage() {
  const [expanded, setExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const handleChange = (panel) => (_e, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const visibleCategories =
    activeCategory === 'all'
      ? FAQ_CATEGORIES
      : FAQ_CATEGORIES.filter((c) => c.id === activeCategory);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: BG, color: 'white', pb: 10 }}>

      {/* ── Hero ── */}
      <Box
        sx={{
          background: `linear-gradient(135deg, #0F172A 0%, #1a1040 50%, #0F172A 100%)`,
          borderBottom: `1px solid ${BORDER}`,
          pt: { xs: 8, md: 12 },
          pb: { xs: 6, md: 8 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: `${ACCENT}22`,
              border: `1px solid ${ACCENT}55`,
              borderRadius: '999px',
              px: 2,
              py: 0.75,
              mb: 3,
            }}
          >
            <Help sx={{ fontSize: 16, color: ACCENT }} />
            <Typography sx={{ fontSize: 13, color: ACCENT, fontWeight: 600, letterSpacing: 0.5 }}>
              Help Center
            </Typography>
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' },
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              mb: 2,
            }}
          >
            How can we{' '}
            <Box
              component="span"
              sx={{
                background: `linear-gradient(135deg, ${ACCENT}, #818CF8)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              help you?
            </Box>
          </Typography>

          <Typography sx={{ color: MUTED, fontSize: { xs: '1rem', md: '1.125rem' }, mb: 5 }}>
            Browse our frequently asked questions or search for a specific topic below.
          </Typography>

          {/* Search bar — visual only */}
          <TextField
            fullWidth
            placeholder="Search for answers..."
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: MUTED }} />
                </InputAdornment>
              ),
            }}
            sx={{ ...inputSx, maxWidth: 560, mx: 'auto', display: 'flex' }}
          />
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 6 }}>

        {/* ── Category filter chips ── */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 5, justifyContent: 'center' }}>
          <Chip
            label="All Topics"
            onClick={() => setActiveCategory('all')}
            sx={{
              backgroundColor: activeCategory === 'all' ? ACCENT : SUBTLE,
              color: activeCategory === 'all' ? 'white' : MUTED,
              border: `1px solid ${activeCategory === 'all' ? ACCENT : BORDER}`,
              fontWeight: 600,
              '&:hover': { backgroundColor: activeCategory === 'all' ? '#4F51D4' : 'rgba(255,255,255,0.1)' },
              cursor: 'pointer',
            }}
          />
          {FAQ_CATEGORIES.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.label}
              onClick={() => setActiveCategory(cat.id)}
              sx={{
                backgroundColor: activeCategory === cat.id ? `${cat.color}22` : SUBTLE,
                color: activeCategory === cat.id ? cat.color : MUTED,
                border: `1px solid ${activeCategory === cat.id ? `${cat.color}66` : BORDER}`,
                fontWeight: 600,
                '&:hover': { backgroundColor: `${cat.color}18` },
                cursor: 'pointer',
              }}
            />
          ))}
        </Box>

        {/* ── FAQ Sections ── */}
        {visibleCategories.map((category) => (
          <Box key={category.id} sx={{ mb: 6 }}>
            {/* Section header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  width: 4,
                  height: 28,
                  borderRadius: 999,
                  backgroundColor: category.color,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, fontSize: '1.15rem', color: 'white' }}
              >
                {category.label}
              </Typography>
              <Chip
                label={`${category.items.length} questions`}
                size="small"
                sx={{
                  backgroundColor: `${category.color}18`,
                  color: category.color,
                  border: `1px solid ${category.color}44`,
                  fontSize: 11,
                  fontWeight: 600,
                  height: 22,
                }}
              />
            </Box>

            {/* Accordions */}
            {category.items.map((item, idx) => {
              const panelId = `${category.id}-${idx}`;
              return (
                <Accordion
                  key={panelId}
                  expanded={expanded === panelId}
                  onChange={handleChange(panelId)}
                  sx={accordionSx}
                  disableGutters
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore sx={summaryIconSx} />}
                    sx={{
                      px: 3,
                      py: 0.5,
                      '&:hover': { backgroundColor: SUBTLE },
                      borderRadius: '10px',
                      minHeight: 56,
                    }}
                  >
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: 'white' }}>
                      {item.q}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 3, pt: 0, pb: 2.5 }}>
                    <Divider sx={{ borderColor: BORDER, mb: 2 }} />
                    <Typography
                      sx={{
                        color: 'rgba(255,255,255,0.72)',
                        fontSize: '0.9rem',
                        lineHeight: 1.75,
                      }}
                    >
                      {item.a}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        ))}

        {/* ── Contact Section ── */}
        <Divider sx={{ borderColor: BORDER, mb: 6 }} />

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Still need help?
          </Typography>
          <Typography sx={{ color: MUTED, fontSize: '0.95rem' }}>
            Our support team is ready to assist you.
          </Typography>
        </Box>

        <Grid container spacing={3} justifyContent="center">
          {/* Email Support card */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                backgroundColor: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: '16px',
                boxShadow: 'none',
                textAlign: 'center',
                p: 1,
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: `${ACCENT}66` },
              }}
            >
              <CardContent sx={{ px: 3, py: 3.5 }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '14px',
                    backgroundColor: `${ACCENT}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Email sx={{ color: ACCENT, fontSize: 26 }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.5 }}>
                  Email Support
                </Typography>
                <Typography sx={{ color: MUTED, fontSize: '0.85rem', mb: 2.5 }}>
                  Send us an email and we'll get back to you within 24 hours.
                </Typography>
                <Typography
                  sx={{
                    color: '#818CF8',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    mb: 2.5,
                    fontFamily: 'monospace',
                  }}
                >
                  support@julay.org
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Email />}
                  href="mailto:support@julay.org"
                  fullWidth
                  sx={{
                    backgroundColor: ACCENT,
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    py: 1.2,
                    '&:hover': { backgroundColor: '#4F51D4' },
                  }}
                >
                  Send Email
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Live Chat card */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                backgroundColor: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: '16px',
                boxShadow: 'none',
                textAlign: 'center',
                p: 1,
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: `${ACCENT}66` },
              }}
            >
              <CardContent sx={{ px: 3, py: 3.5 }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '14px',
                    backgroundColor: '#10B98122',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Chat sx={{ color: '#10B981', fontSize: 26 }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.5 }}>
                  Response Time
                </Typography>
                <Typography sx={{ color: MUTED, fontSize: '0.85rem', mb: 2.5 }}>
                  We typically respond within 24 hours on business days.
                </Typography>
                <Box
                  sx={{
                    backgroundColor: '#10B98118',
                    border: '1px solid #10B98144',
                    borderRadius: '10px',
                    px: 2,
                    py: 1.5,
                    mb: 2.5,
                  }}
                >
                  <Typography sx={{ color: '#10B981', fontWeight: 700, fontSize: '1.5rem' }}>
                    &lt; 24h
                  </Typography>
                  <Typography sx={{ color: MUTED, fontSize: '0.75rem' }}>
                    average response time
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<Chat />}
                  href="mailto:support@julay.org?subject=Chat%20Support"
                  fullWidth
                  sx={{
                    borderColor: '#10B981',
                    color: '#10B981',
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    py: 1.2,
                    '&:hover': { borderColor: '#059669', backgroundColor: '#10B98114' },
                  }}
                >
                  Contact Us
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      </Container>
    </Box>
  );
}
