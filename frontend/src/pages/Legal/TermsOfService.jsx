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
    title: '1. Acceptance of Terms',
    body: `By creating an account or using any part of the Julay platform, you agree to be bound by these Terms of Service ("Terms") and our Privacy Policy, which is incorporated herein by reference.

If you are using Julay on behalf of an organization, you represent that you have the authority to bind that organization to these Terms. If you do not agree, you must not access or use the service.

We reserve the right to update these Terms at any time. Continued use of the service after changes are posted constitutes acceptance of the revised Terms.`,
  },
  {
    title: '2. Description of Service',
    body: `Julay is a cloud-based project management and team collaboration platform ("Service") designed for individuals, teams, and organizations. The Service includes features such as task management, Kanban boards, sprint planning, time tracking, team workspaces, and reporting dashboards.

The Service is provided on a subscription basis. Features available to you depend on your subscription plan. We reserve the right to add, modify, or discontinue features with reasonable notice.`,
  },
  {
    title: '3. Account Registration and Security',
    body: `To use the Service, you must register for an account using a valid email address. You agree to:

• Provide accurate and complete registration information.
• Keep your password confidential and not share it with others.
• Notify us immediately at support@julay.org if you suspect unauthorized access to your account.
• Be solely responsible for all activity that occurs under your account.

You must be at least 16 years of age to create an account. Accounts registered by bots or automated methods are prohibited.`,
  },
  {
    title: '4. Acceptable Use Policy',
    body: `You agree not to use the Service to:

• Upload, store, or transmit any content that is unlawful, harmful, defamatory, or infringes any third-party rights.
• Attempt to reverse-engineer, decompile, or extract source code from the platform.
• Use the Service to send spam, phishing messages, or unsolicited bulk communications.
• Overburden the infrastructure through automated scraping, denial-of-service attacks, or excessive API requests.
• Resell or sublicense access to the Service without written consent from Julay.

Violations may result in immediate account suspension or termination without refund.`,
  },
  {
    title: '5. Subscription and Payments',
    body: `Julay offers monthly and annual subscription plans. By subscribing, you authorize us to charge your payment method on a recurring basis.

• Billing: subscriptions are billed at the start of each billing period (monthly or annually).
• Payments: all payments are processed securely by Stripe. We do not store your full card details.
• Price changes: we will provide at least 30 days' notice before changing subscription prices. Continued use after the effective date constitutes acceptance of the new price.
• Taxes: prices shown exclude applicable taxes. You are responsible for any sales, use, or VAT taxes applicable in your jurisdiction.

Annual plans are billed as a single upfront payment and offer a discount compared to monthly billing.`,
  },
  {
    title: '6. Cancellation and Refunds',
    body: `You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period — you retain access to the Service until then.

Refund policy:
• Monthly subscriptions: no refunds are issued for partial months.
• Annual subscriptions: if you cancel within 14 days of initial purchase or annual renewal, you are eligible for a full refund. After 14 days, no refund is issued for the remainder of the term.
• Exceptional cases: refunds outside this policy may be granted at our sole discretion. Contact support@julay.org to request a review.

To cancel, visit Settings → Billing → Cancel Subscription, or contact support@julay.org.`,
  },
  {
    title: '7. Intellectual Property',
    body: `Julay retains all ownership and intellectual property rights to the platform, including its software, design, trademarks, and documentation.

Your content: you retain ownership of all data, files, and content you upload to the Service ("User Content"). By uploading User Content, you grant Julay a limited, non-exclusive license to store and process it solely for the purpose of providing the Service to you.

Feedback: if you submit feedback or suggestions about the Service, you grant us the right to use that feedback without compensation or attribution.`,
  },
  {
    title: '8. Limitation of Liability',
    body: `To the maximum extent permitted by applicable law:

• The Service is provided "as is" without warranties of any kind, express or implied.
• Julay is not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service.
• Our total liability to you for any claims arising under these Terms shall not exceed the total amount you paid to us in the 12 months preceding the claim.

Some jurisdictions do not allow the exclusion of certain warranties or limitations of liability, so some of the above may not apply to you.`,
  },
  {
    title: '9. Termination',
    body: `Either party may terminate these Terms at any time.

You may terminate by cancelling your subscription and deleting your account.

We may suspend or terminate your account without notice if we determine you have violated these Terms, engaged in fraudulent activity, or posed a security risk to other users.

Upon termination, your right to access the Service ceases immediately. We will delete your data in accordance with our Privacy Policy.`,
  },
  {
    title: '10. Governing Law',
    body: `These Terms are governed by and construed in accordance with the laws of the State of Israel, without regard to its conflict of law provisions.

Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the competent courts of Israel.

Notwithstanding the above, either party may seek injunctive or other equitable relief in any court of competent jurisdiction.`,
  },
  {
    title: '11. Contact',
    body: `If you have questions about these Terms or need to report a violation, please contact us:

Email: support@julay.org
Legal inquiries: legal@julay.org
Response time: within 3 business days.

Julay Group
A registered business in Israel.`,
  },
];

export default function TermsOfService() {
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
            Terms of Service
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY, lineHeight: 1.7 }}>
            Last updated: May 2026
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY, lineHeight: 1.8, mt: 2, maxWidth: 620 }}>
            Please read these Terms of Service carefully before using Julay. They describe your rights and responsibilities as a user of our platform.
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
              © {new Date().getFullYear()} Julay Group. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2.5 }}>
              <Link component={RouterLink} to="/privacy" sx={{ color: TEXT_SECONDARY, fontSize: '0.82rem', textDecoration: 'none', '&:hover': { color: 'white' } }}>Privacy</Link>
              <Link component={RouterLink} to="/terms" sx={{ color: TEXT_SECONDARY, fontSize: '0.82rem', textDecoration: 'none', '&:hover': { color: 'white' } }}>Terms</Link>
              <Link href="mailto:support@julay.org" sx={{ color: TEXT_SECONDARY, fontSize: '0.82rem', textDecoration: 'none', '&:hover': { color: 'white' } }}>support@julay.org</Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
