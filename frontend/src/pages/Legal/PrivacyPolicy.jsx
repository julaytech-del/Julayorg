import React from 'react';
import { Box, Typography, Container, Divider, Link, Chip } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const ACCENT = '#6366F1';
const ACCENT_DIM = 'rgba(99,102,241,0.15)';
const TEXT_PRIMARY = 'rgba(255,255,255,0.92)';
const TEXT_SECONDARY = 'rgba(255,255,255,0.55)';
const BORDER = 'rgba(255,255,255,0.07)';

const sections = [
  {
    title: '1. What Data We Collect',
    body: `We collect only the information necessary to provide our service:

• Account information: your name and email address when you register.
• Usage data: pages visited, features used, session duration, and error logs — collected to improve reliability and performance.
• Payment information: billing details (card number, expiry, CVC) are processed directly by Stripe and never stored on our servers. We only retain the last four digits of your card for display purposes.
• Communications: messages you send to our support team.

We do not collect sensitive personal data such as government IDs, health data, or biometric information.`,
  },
  {
    title: '2. How We Use Your Data',
    body: `Your data is used exclusively to:

• Provide, maintain, and improve the Julay platform and its features.
• Send transactional notifications (invoices, password resets, workspace invitations).
• Respond to support requests and resolve technical issues.
• Detect and prevent fraud, abuse, and security incidents.
• Comply with legal obligations where applicable.

We do not use your data for advertising or behavioral profiling.`,
  },
  {
    title: '3. Data Sharing',
    body: `We do not sell, rent, or trade your personal data to third parties. We share data only with trusted sub-processors required to operate the service:

• Stripe — payment processing. Stripe is PCI-DSS Level 1 certified.
• Amazon Web Services (AWS) — cloud hosting and infrastructure (servers located in the US and EU).
• Plausible Analytics — privacy-friendly, cookieless analytics. No personal data is shared with Plausible.

All sub-processors are contractually bound to handle data in accordance with applicable privacy laws.`,
  },
  {
    title: '4. Data Retention',
    body: `We retain your account data for as long as your account is active. When you delete your account:

• All personal data is permanently removed from our production systems within 30 days.
• Backups containing your data are purged within 90 days.
• Financial transaction records may be retained for up to 7 years to comply with tax and accounting regulations.

You may request early deletion by contacting support@julay.org.`,
  },
  {
    title: '5. Your Rights',
    body: `Depending on your jurisdiction, you may have the following rights regarding your personal data:

• Access: request a copy of the personal data we hold about you.
• Correction: request correction of inaccurate or incomplete data.
• Deletion: request permanent deletion of your data ("right to be forgotten").
• Portability: receive your data in a structured, machine-readable format.
• Objection: object to processing based on legitimate interests.

To exercise any of these rights, email support@julay.org. We will respond within 30 days.`,
  },
  {
    title: '6. Cookies',
    body: `We use a minimal set of cookies to make the service work:

• Essential cookies: required for authentication sessions and security (e.g., CSRF tokens). These cannot be disabled without breaking the service.
• Analytics: we use Plausible Analytics, which is cookieless and collects no personally identifiable information. No consent banner is required for Plausible.

We do not use advertising cookies, third-party tracking pixels, or persistent fingerprinting techniques.`,
  },
  {
    title: '7. Contact',
    body: `If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us:

Email: support@julay.org
Response time: within 2 business days.

For formal data protection inquiries, you may also reach our privacy team at privacy@julay.org.`,
  },
  {
    title: '8. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. When we make material changes, we will:

• Update the "Last updated" date at the top of this page.
• Notify active users by email at least 14 days before the changes take effect.

Continued use of the service after the effective date constitutes acceptance of the revised policy.`,
  },
];

export default function PrivacyPolicy() {
  return (
    <Box sx={{ minHeight: '100vh', background: '#0F172A' }}>
      {/* Navbar */}
      <Box sx={{ borderBottom: '1px solid #E5E7EB', px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 100 }}>
        <Box
          component={RouterLink}
          to="/"
          sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          <Box
            component="img"
            src="/julay-logo-full.png"
            alt="Julay.org"
            sx={{ height: 32, objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </Box>
        <Link
          component={RouterLink}
          to="/"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#6B7280', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, px: 1.5, py: 0.75, borderRadius: 2, border: '1px solid #E5E7EB', transition: 'all 0.15s', '&:hover': { color: '#111827', borderColor: '#D1D5DB' } }}
        >
          <ArrowBack sx={{ fontSize: 13 }} /> Back to Home
        </Link>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 }, px: { xs: 2.5, md: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Chip
            label="Legal"
            size="small"
            sx={{ background: ACCENT_DIM, color: ACCENT, fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.04em', mb: 2.5, border: `1px solid rgba(99,102,241,0.3)` }}
          />
          <Typography variant="h4" fontWeight={800} sx={{ color: 'white', letterSpacing: '-0.025em', mb: 1.5, lineHeight: 1.2 }}>
            Privacy Policy
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY, lineHeight: 1.7 }}>
            Last updated: May 2026
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY, lineHeight: 1.8, mt: 2, maxWidth: 620 }}>
            At Julay, we take your privacy seriously. This policy explains what data we collect, why we collect it, and how we protect it. We aim to be transparent and to collect only what is necessary.
          </Typography>
        </Box>

        {/* Sections */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {sections.map((s, i) => (
            <Box key={i}>
              <Box sx={{ py: 4 }}>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 2, letterSpacing: '-0.01em' }}>
                  {s.title}
                </Typography>
                <Typography variant="body2" sx={{ color: TEXT_SECONDARY, lineHeight: 1.9, whiteSpace: 'pre-line' }}>
                  {s.body}
                </Typography>
              </Box>
              {i < sections.length - 1 && <Divider sx={{ borderColor: BORDER }} />}
            </Box>
          ))}
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 8, pt: 4, borderTop: `1px solid ${BORDER}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Box component="img" src="/icon-julay.png" alt="Julay" sx={{ height: 24, objectFit: 'contain' }} />
            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Julay.org</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>
              © {new Date().getFullYear()} Julay Group LLC. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2.5 }}>
              <Link component={RouterLink} to="/terms" sx={{ color: TEXT_SECONDARY, fontSize: '0.82rem', textDecoration: 'none', '&:hover': { color: 'white' } }}>Terms</Link>
              <Link component={RouterLink} to="/privacy" sx={{ color: TEXT_SECONDARY, fontSize: '0.82rem', textDecoration: 'none', '&:hover': { color: 'white' } }}>Privacy</Link>
              <Link href="mailto:support@julay.org" sx={{ color: TEXT_SECONDARY, fontSize: '0.82rem', textDecoration: 'none', '&:hover': { color: 'white' } }}>support@julay.org</Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
