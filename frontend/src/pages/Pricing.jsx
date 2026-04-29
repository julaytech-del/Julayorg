import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
  useTheme,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle,
  CheckCircleOutlined,
  ExpandMore,
  AutoAwesome,
  Verified,
  Menu as MenuIcon,
  Close,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

/* ─────────────────────────── constants ─────────────────────────── */

const BG = '#0F172A';
const PRIMARY = '#6366F1';
const PRIMARY_LIGHT = '#818CF8';
const SURFACE = '#1E293B';
const SURFACE2 = '#0F1829';
const CHECK_COLOR = '#22C55E';
const DASH_COLOR = '#334155';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    annualMonthlyPrice: 0,
    description: 'For individuals and small teams getting started.',
    cta: 'Start for free',
    ctaNote: 'No credit card required',
    ctaVariant: 'outlined',
    ctaHref: '/register',
    popular: false,
    highlights: ['3 projects', '3 team members', '1 GB storage', 'Kanban & List views', 'No AI features'],
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29,
    annualPrice: 228,
    annualMonthlyPrice: 19,
    description: 'For growing teams that need more power.',
    cta: 'Get Started',
    ctaNote: null,
    ctaVariant: 'outlined',
    ctaHref: '/register?plan=starter',
    popular: false,
    highlights: ['10 projects', '10 team members', '10 GB storage', '30 AI requests/month', 'Gantt / Timeline', 'Time tracking', 'Calendar & Workload views'],
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 79,
    annualPrice: 708,
    annualMonthlyPrice: 59,
    description: 'For teams serious about shipping faster with AI.',
    cta: 'Get Started',
    ctaNote: null,
    ctaVariant: 'contained',
    ctaHref: '/register?plan=professional',
    popular: true,
    highlights: ['Unlimited projects', '50 team members', '50 GB storage', 'AI project generation', 'Automations', 'Custom dashboards', 'Sprints & Workload view', 'Reports & exports'],
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 120,
    annualPrice: 1188,
    annualMonthlyPrice: 99,
    description: 'For organisations that need enterprise-grade reliability.',
    cta: 'Contact Sales',
    ctaNote: null,
    ctaVariant: 'outlined',
    ctaHref: '/contact',
    popular: false,
    highlights: ['Unlimited everything', 'Unlimited users', '500 GB storage', 'API access & Webhooks', 'SSO / SAML', 'Dedicated support', 'Custom integrations', '99.9% SLA'],
  },
];

const FEATURE_ROWS = [
  { label: 'Projects',            free: '3',        starter: '10',        pro: 'Unlimited',  biz: 'Unlimited' },
  { label: 'Team members',        free: '3',        starter: '10',        pro: '25',         biz: 'Unlimited' },
  { label: 'Storage',             free: '1 GB',     starter: '10 GB',     pro: '50 GB',      biz: '200 GB'    },
  { label: 'AI requests/month',   free: false,      starter: '30',        pro: '500',        biz: '2,000'     },
  { label: 'AI project gen.',     free: false,      starter: true,        pro: true,         biz: true        },
  { label: 'AI task suggestions', free: false,      starter: true,        pro: true,         biz: true        },
  { label: 'Kanban board',        free: true,       starter: true,        pro: true,         biz: true        },
  { label: 'Gantt / Timeline',    free: false,      starter: true,        pro: true,         biz: true        },
  { label: 'Sprint board',        free: false,      starter: false,       pro: true,         biz: true        },
  { label: 'Time tracking',       free: false,      starter: true,        pro: true,         biz: true        },
  { label: 'Automations',         free: false,      starter: false,       pro: true,         biz: true        },
  { label: 'Custom dashboards',   free: false,      starter: false,       pro: true,         biz: true        },
  { label: 'Workload view',       free: false,      starter: true,        pro: true,         biz: true        },
  { label: 'Reports & exports',   free: false,      starter: false,       pro: true,         biz: true        },
  { label: 'Webhooks',            free: false,      starter: false,       pro: true,         biz: true        },
  { label: 'API access',          free: false,      starter: false,       pro: false,        biz: true        },
  { label: 'SSO / SAML',          free: false,      starter: false,       pro: false,        biz: true        },
  { label: 'Priority support',    free: false,      starter: 'Email',     pro: 'Priority',   biz: 'Dedicated' },
  { label: 'SLA guarantee',       free: false,      starter: false,       pro: false,        biz: '99.9%'     },
];

const FAQS = [
  {
    q: 'What happens when I exceed plan limits?',
    a: "We'll send you a notification well before you hit the limit. Your service won't be interrupted — you'll simply need to upgrade to continue creating new projects or adding members once limits are reached.",
  },
  {
    q: 'Can I change plans at any time?',
    a: 'Yes. Upgrades take effect immediately and you only pay the prorated difference. Downgrades are applied at the end of your current billing period so you keep full access in the meantime.',
  },
  {
    q: 'Is there a free trial on paid plans?',
    a: 'All paid plans come with a 14-day money-back guarantee on your first payment — no questions asked. Just email support@julay.org within 14 days of your first charge.',
  },
  {
    q: 'Do you offer discounts for non-profits or education?',
    a: 'We offer a 50% discount for registered non-profits and accredited educational institutions. Reach out to us at hello@julay.org with proof of eligibility and we\'ll apply the discount right away.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: "You can cancel at any time from Settings → Billing inside the app. Your subscription will remain active until the end of the current billing period and you won't be charged again.",
  },
];

/* ─────────────────────────── helpers ─────────────────────────── */

function FeatureCell({ value }) {
  if (value === true) {
    return (
      <TableCell align="center" sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 1.2 }}>
        <CheckCircle sx={{ color: CHECK_COLOR, fontSize: 20 }} />
      </TableCell>
    );
  }
  if (value === false) {
    return (
      <TableCell align="center" sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 1.2 }}>
        <Typography sx={{ color: DASH_COLOR, fontWeight: 700, fontSize: 18, lineHeight: 1 }}>—</Typography>
      </TableCell>
    );
  }
  // text value
  return (
    <TableCell align="center" sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 1.2 }}>
      <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{value}</Typography>
    </TableCell>
  );
}

function MobileFeatureList({ plan }) {
  const cols = { free: 'free', starter: 'starter', professional: 'pro', business: 'biz' };
  const key = cols[plan.id];
  return (
    <Box sx={{ mt: 1.5 }}>
      {FEATURE_ROWS.map((row) => {
        const val = row[key];
        return (
          <Box key={row.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
            {val === true ? (
              <CheckCircle sx={{ color: CHECK_COLOR, fontSize: 16, flexShrink: 0 }} />
            ) : val === false ? (
              <Typography sx={{ color: DASH_COLOR, fontSize: 16, lineHeight: 1, width: 16, textAlign: 'center', flexShrink: 0 }}>—</Typography>
            ) : (
              <CheckCircleOutlined sx={{ color: PRIMARY_LIGHT, fontSize: 16, flexShrink: 0 }} />
            )}
            <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
              {row.label}{typeof val === 'string' && val !== '' ? `: ${val}` : ''}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

/* ─────────────────────────── JSON-LD ─────────────────────────── */

function useJsonLd() {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Julay — AI Work Operating System',
      url: 'https://julay.org/pricing',
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        offerCount: PLANS.length,
        lowPrice: 0,
        highPrice: 79,
        offers: PLANS.map((p) => ({
          '@type': 'Offer',
          name: p.name,
          price: p.monthlyPrice,
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: p.monthlyPrice,
            priceCurrency: 'USD',
            unitText: 'month',
          },
          url: `https://julay.org${p.ctaHref}`,
        })),
      },
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'pricing-jsonld';
    script.textContent = JSON.stringify(schema);
    const existing = document.getElementById('pricing-jsonld');
    if (existing) existing.remove();
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById('pricing-jsonld');
      if (el) el.remove();
    };
  }, []);
}

/* ─────────────────────────── Nav ─────────────────────────── */

function TopNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  return (
    <Box
      component="nav"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        bgcolor: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5, gap: 2 }}>
          {/* Logo */}
          <Box
            component={RouterLink}
            to="/"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', flexShrink: 0 }}
          >
            <Box
              component="img"
              src="/logo-main.svg"
              alt="Julay"
              sx={{ height: 36, objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </Box>

          <Box sx={{ flex: 1 }} />

          {isMobile ? (
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: 'white' }}>
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Button
                component={RouterLink}
                to="/login"
                variant="text"
                sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500, '&:hover': { color: 'white' } }}
              >
                Login
              </Button>
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                sx={{
                  bgcolor: PRIMARY,
                  px: 2.5,
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#4F46E5' },
                }}
              >
                Start Free
              </Button>
            </Box>
          )}
        </Box>
      </Container>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { bgcolor: SURFACE, width: 240 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
        <List>
          <ListItemButton component={RouterLink} to="/login" onClick={() => setDrawerOpen(false)}>
            <ListItemText primary="Login" primaryTypographyProps={{ color: 'white' }} />
          </ListItemButton>
          <ListItemButton
            component={RouterLink}
            to="/register"
            onClick={() => setDrawerOpen(false)}
            sx={{ bgcolor: PRIMARY, mx: 2, borderRadius: 1, mt: 1, '&:hover': { bgcolor: '#4F46E5' } }}
          >
            <ListItemText primary="Start Free" primaryTypographyProps={{ color: 'white', fontWeight: 700 }} />
          </ListItemButton>
        </List>
      </Drawer>
    </Box>
  );
}

/* ─────────────────────────── Plan Card ─────────────────────────── */

function PlanCard({ plan, annual, showMobileFeatures }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const displayPrice = annual ? plan.annualMonthlyPrice : plan.monthlyPrice;
  const savePct = plan.monthlyPrice > 0 ? Math.round((1 - plan.annualMonthlyPrice / plan.monthlyPrice) * 100) : 0;

  const borderSx = plan.popular
    ? {
        background: `linear-gradient(${SURFACE}, ${SURFACE}) padding-box, linear-gradient(135deg, ${PRIMARY}, #A855F7) border-box`,
        border: '1.5px solid transparent',
      }
    : {
        border: '1.5px solid rgba(255,255,255,0.10)',
      };

  return (
    <Box
      sx={{
        flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 0' },
        minWidth: { md: 200 },
        maxWidth: { md: 280 },
        borderRadius: 3,
        bgcolor: plan.popular ? 'rgba(99,102,241,0.08)' : SURFACE,
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        ...borderSx,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: plan.popular
            ? '0 16px 48px rgba(99,102,241,0.35)'
            : '0 12px 32px rgba(0,0,0,0.4)',
        },
      }}
    >
      {/* Most Popular badge */}
      {plan.popular && (
        <Chip
          icon={<AutoAwesome sx={{ fontSize: '14px !important', color: 'white !important' }} />}
          label="Most Popular"
          size="small"
          sx={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: PRIMARY,
            color: 'white',
            fontWeight: 700,
            fontSize: 11,
            px: 0.5,
            height: 26,
          }}
        />
      )}

      {/* Plan name */}
      <Typography sx={{ fontWeight: 700, fontSize: 17, color: plan.popular ? PRIMARY_LIGHT : 'white', mb: 0.5 }}>
        {plan.name}
      </Typography>
      <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', mb: 2, minHeight: 32 }}>
        {plan.description}
      </Typography>

      {/* Price */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, mb: 0.5 }}>
        <Typography sx={{ fontSize: 36, fontWeight: 800, color: 'white', lineHeight: 1 }}>
          {plan.monthlyPrice === 0 ? 'Free' : `$${displayPrice}`}
        </Typography>
        {plan.monthlyPrice > 0 && (
          <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', mb: 0.5 }}>
            / mo
          </Typography>
        )}
      </Box>

      {/* Annual note */}
      {annual && plan.monthlyPrice > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>
            ${plan.monthlyPrice}/mo
          </Typography>
          <Chip
            label={`Save ${savePct}%`}
            size="small"
            sx={{ bgcolor: 'rgba(34,197,94,0.15)', color: '#4ADE80', fontWeight: 700, fontSize: 10, height: 18, px: 0 }}
          />
        </Box>
      )}
      {!annual && plan.monthlyPrice > 0 && (
        <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', mb: 0.5 }}>
          or ${plan.annualMonthlyPrice}/mo billed annually
        </Typography>
      )}
      {plan.monthlyPrice === 0 && <Box sx={{ mb: 2.5 }} />}

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', my: 2 }} />

      {/* CTA */}
      <Button
        component={RouterLink}
        to={plan.ctaHref}
        variant={plan.ctaVariant}
        fullWidth
        sx={
          plan.ctaVariant === 'contained'
            ? {
                bgcolor: PRIMARY,
                fontWeight: 700,
                py: 1.2,
                fontSize: 14,
                '&:hover': { bgcolor: '#4F46E5' },
                mb: plan.ctaNote ? 0.5 : 0,
              }
            : {
                borderColor: plan.popular ? PRIMARY : 'rgba(255,255,255,0.2)',
                color: plan.popular ? PRIMARY_LIGHT : 'rgba(255,255,255,0.85)',
                fontWeight: 700,
                py: 1.2,
                fontSize: 14,
                '&:hover': {
                  borderColor: PRIMARY_LIGHT,
                  bgcolor: 'rgba(99,102,241,0.08)',
                },
                mb: plan.ctaNote ? 0.5 : 0,
              }
        }
      >
        {plan.cta}
      </Button>
      {plan.ctaNote && (
        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          {plan.ctaNote}
        </Typography>
      )}

      {/* Feature highlights */}
      <Box sx={{ mt: 2.5, flex: 1 }}>
        {plan.highlights.map((h) => (
          <Box key={h} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.85 }}>
            <CheckCircle sx={{ color: CHECK_COLOR, fontSize: 15, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>{h}</Typography>
          </Box>
        ))}
      </Box>

      {/* Mobile: full feature list */}
      {isMobile && showMobileFeatures && <MobileFeatureList plan={plan} />}
    </Box>
  );
}

/* ─────────────────────────── Main Page ─────────────────────────── */

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useJsonLd();

  return (
    <Box sx={{ bgcolor: BG, minHeight: '100vh', color: 'white' }}>
      <TopNav />

      {/* ── Hero ── */}
      <Container maxWidth="lg" sx={{ pt: { xs: 7, md: 10 }, pb: 4, textAlign: 'center', position: 'relative' }}>
        {/* Background glow */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 600,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <Chip
          icon={<Verified sx={{ fontSize: '14px !important', color: `${PRIMARY_LIGHT} !important` }} />}
          label="Simple, transparent pricing"
          size="small"
          sx={{ bgcolor: 'rgba(99,102,241,0.12)', color: PRIMARY_LIGHT, fontWeight: 600, mb: 2.5, fontSize: 12, px: 0.5 }}
        />

        <Typography
          variant="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: 32, md: 52 },
            lineHeight: 1.1,
            letterSpacing: '-1px',
            mb: 2,
            background: 'linear-gradient(135deg, #fff 30%, #A5B4FC 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Plans that grow<br />with your team
        </Typography>
        <Typography sx={{ fontSize: { xs: 15, md: 18 }, color: 'rgba(255,255,255,0.55)', maxWidth: 520, mx: 'auto', mb: 5 }}>
          Start free. Upgrade when you're ready. No hidden fees, cancel anytime.
        </Typography>

        {/* ── Billing Toggle ── */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: SURFACE,
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 99,
            px: 2.5,
            py: 1,
          }}
        >
          <Typography
            onClick={() => setAnnual(false)}
            sx={{
              fontSize: 14,
              fontWeight: annual ? 400 : 700,
              color: annual ? 'rgba(255,255,255,0.45)' : 'white',
              cursor: 'pointer',
              transition: 'color 0.2s',
              userSelect: 'none',
            }}
          >
            Monthly
          </Typography>
          <Switch
            checked={annual}
            onChange={(e) => setAnnual(e.target.checked)}
            size="small"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: PRIMARY },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: PRIMARY },
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography
              onClick={() => setAnnual(true)}
              sx={{
                fontSize: 14,
                fontWeight: annual ? 700 : 400,
                color: annual ? 'white' : 'rgba(255,255,255,0.45)',
                cursor: 'pointer',
                transition: 'color 0.2s',
                userSelect: 'none',
              }}
            >
              Annual
            </Typography>
            <Chip
              label="Save 20%"
              size="small"
              sx={{
                bgcolor: annual ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.06)',
                color: annual ? '#4ADE80' : 'rgba(255,255,255,0.3)',
                fontWeight: 700,
                fontSize: 10,
                height: 18,
                transition: 'all 0.2s',
              }}
            />
          </Box>
        </Box>
      </Container>

      {/* ── Plan Cards ── */}
      <Container maxWidth="lg" sx={{ pb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            gap: 2.5,
            justifyContent: 'center',
            mt: 3,
          }}
        >
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              annual={annual}
              showMobileFeatures={isMobile}
            />
          ))}
        </Box>

        {/* ── Money-back Guarantee ── */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3.5 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.25,
              bgcolor: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 99,
              px: 2.5,
              py: 1,
            }}
          >
            <Verified sx={{ color: '#4ADE80', fontSize: 18 }} />
            <Typography sx={{ fontSize: 13, color: '#4ADE80', fontWeight: 600 }}>
              30-day money-back guarantee on all paid plans
            </Typography>
          </Box>
        </Box>
      </Container>

      {/* ── Feature Comparison Table (desktop only) ── */}
      {!isMobile && (
        <Container maxWidth="lg" sx={{ mt: 8, mb: 6 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: 24, md: 32 },
              textAlign: 'center',
              mb: 4,
              background: 'linear-gradient(135deg, #fff 30%, #A5B4FC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Full feature comparison
          </Typography>

          <TableContainer
            sx={{
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.07)',
              overflow: 'hidden',
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: SURFACE }}>
                  <TableCell
                    sx={{
                      color: 'rgba(255,255,255,0.5)',
                      fontWeight: 700,
                      fontSize: 13,
                      borderColor: 'rgba(255,255,255,0.06)',
                      width: '28%',
                      py: 2,
                    }}
                  >
                    Feature
                  </TableCell>
                  {PLANS.map((p) => (
                    <TableCell
                      key={p.id}
                      align="center"
                      sx={{
                        borderColor: 'rgba(255,255,255,0.06)',
                        py: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: p.popular ? PRIMARY_LIGHT : 'white',
                          }}
                        >
                          {p.name}
                        </Typography>
                        {p.popular && (
                          <Chip
                            label="Most Popular"
                            size="small"
                            sx={{ bgcolor: PRIMARY, color: 'white', fontWeight: 700, fontSize: 9, height: 16 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {FEATURE_ROWS.map((row, i) => (
                  <TableRow
                    key={row.label}
                    sx={{
                      bgcolor: i % 2 === 0 ? 'rgba(30,41,59,0.5)' : 'rgba(15,23,42,0.5)',
                      '&:last-child td': { border: 0 },
                    }}
                  >
                    <TableCell
                      sx={{
                        color: 'rgba(255,255,255,0.75)',
                        fontWeight: 500,
                        fontSize: 13,
                        borderColor: 'rgba(255,255,255,0.06)',
                        py: 1.2,
                      }}
                    >
                      {row.label}
                    </TableCell>
                    <FeatureCell value={row.free} />
                    <FeatureCell value={row.starter} />
                    <FeatureCell value={row.pro} />
                    <FeatureCell value={row.biz} />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Container>
      )}

      {/* ── FAQ ── */}
      <Container maxWidth="md" sx={{ mt: isMobile ? 6 : 2, mb: 6 }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: { xs: 24, md: 32 },
            textAlign: 'center',
            mb: 4,
            background: 'linear-gradient(135deg, #fff 30%, #A5B4FC 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Frequently asked questions
        </Typography>
        {FAQS.map((faq, i) => (
          <Accordion
            key={i}
            disableGutters
            elevation={0}
            sx={{
              bgcolor: 'transparent',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '10px !important',
              mb: 1.5,
              '&:before': { display: 'none' },
              overflow: 'hidden',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore sx={{ color: PRIMARY_LIGHT }} />}
              sx={{
                bgcolor: SURFACE,
                px: 3,
                '&.Mui-expanded': { bgcolor: 'rgba(99,102,241,0.08)' },
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: 15, color: 'white' }}>{faq.q}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ bgcolor: 'rgba(15,23,42,0.6)', px: 3, py: 2 }}>
              <Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75 }}>{faq.a}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>

      {/* ── Enterprise CTA ── */}
      <Container maxWidth="md" sx={{ mb: 8 }}>
        <Box
          sx={{
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.08)',
            background: `linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)`,
            p: { xs: 4, md: 6 },
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: 22, md: 30 },
              mb: 1.5,
              background: 'linear-gradient(135deg, #fff 30%, #A5B4FC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Enterprise or large team?
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, mb: 3.5, maxWidth: 420, mx: 'auto' }}>
            Get a custom plan tailored to your organisation — volume discounts, dedicated infrastructure, and white-glove onboarding.
          </Typography>
          <Button
            component={RouterLink}
            to="/contact"
            variant="contained"
            size="large"
            sx={{
              bgcolor: PRIMARY,
              fontWeight: 700,
              px: 4,
              py: 1.4,
              fontSize: 15,
              borderRadius: 2,
              '&:hover': { bgcolor: '#4F46E5' },
            }}
          >
            Talk to Sales
          </Button>
        </Box>
      </Container>

      {/* ── Footer ── */}
      <Box
        component="footer"
        sx={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          py: 3,
          textAlign: 'center',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 2.5, md: 4 }, flexWrap: 'wrap' }}>
          {[
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
            { label: 'Cookies', href: '/cookies' },
          ].map(({ label, href }) => (
            <Typography
              key={label}
              component={RouterLink}
              to={href}
              sx={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.35)',
                textDecoration: 'none',
                '&:hover': { color: 'rgba(255,255,255,0.7)' },
                transition: 'color 0.2s',
              }}
            >
              {label}
            </Typography>
          ))}
        </Box>
        <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', mt: 1.5 }}>
          © {new Date().getFullYear()} Julay Technologies, Inc. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
