import express, { Router } from 'express';
import crypto from 'crypto';
import { protect } from '../middleware/auth.middleware.js';
import Organization from '../models/Organization.js';
import { notifyOwner } from '../services/notify.service.js';

const router = Router();

// Map Lemon Squeezy variant IDs → plan names (set these in .env after creating products)
const VARIANT_TO_PLAN = {
  [process.env.LS_VARIANT_STARTER]:      'starter',
  [process.env.LS_VARIANT_PROFESSIONAL]: 'professional',
  [process.env.LS_VARIANT_BUSINESS]:     'business',
};

// Plan → Lemon Squeezy checkout URL
const PLAN_CHECKOUT_URLS = {
  starter:      process.env.LS_CHECKOUT_STARTER,
  professional: process.env.LS_CHECKOUT_PROFESSIONAL,
  business:     process.env.LS_CHECKOUT_BUSINESS,
};

// GET /api/lemonsqueezy/checkout?plan=professional
// Returns the Lemon Squeezy checkout URL with orgId embedded
router.get('/checkout', protect, (req, res) => {
  const { plan } = req.query;
  const baseUrl = PLAN_CHECKOUT_URLS[plan];
  if (!baseUrl) return res.status(400).json({ success: false, message: 'Invalid plan' });

  const orgId = (req.user.organization?._id || req.user.organization).toString();
  const userId = req.user._id.toString();

  // Append custom data so the webhook knows which org to update
  const url = `${baseUrl}?checkout[custom][org_id]=${orgId}&checkout[custom][user_id]=${userId}&checkout[email]=${encodeURIComponent(req.user.email)}`;

  res.json({ success: true, url });
});

// POST /api/lemonsqueezy/webhook — Lemon Squeezy sends events here
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // Verify signature
  const secret = process.env.LS_WEBHOOK_SECRET;
  const signature = req.headers['x-signature'];

  if (!secret || !signature) return res.status(401).send('Unauthorized');

  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(req.body).digest('hex');

  try {
    if (!crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(signature, 'hex'))) {
      return res.status(401).send('Invalid signature');
    }
  } catch {
    return res.status(401).send('Invalid signature');
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  const eventName = payload.meta?.event_name;
  const data      = payload.data?.attributes;
  const custom    = payload.meta?.custom_data || {};
  const orgId     = custom.org_id;

  console.log('[LS webhook]', eventName, 'orgId:', orgId);

  try {
    if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
      const variantId = String(data?.variant_id);
      const VALID_PLANS = ['starter', 'professional', 'business', 'enterprise'];
      const plan = VALID_PLANS.includes(custom.plan) ? custom.plan : VARIANT_TO_PLAN[variantId];

      if (orgId && plan && data?.status === 'active') {
        const expiresAt = data.renews_at ? new Date(data.renews_at) : null;
        await Organization.findByIdAndUpdate(orgId, {
          'subscription.plan': plan,
          'subscription.expiresAt': expiresAt,
          'subscription.lsSubscriptionId': payload.data?.id,
          'subscription.lsCustomerId': data.customer_id,
          'subscription.lsVariantId': variantId,
          'subscription.billingPeriodStart': new Date(),
          'subscription.aiUsedThisMonth': 0,
        });
        console.log('[LS webhook] upgraded org', orgId, '→', plan);
        if (eventName === 'subscription_created') {
          notifyOwner({
            emoji: '💰',
            title: 'New paid subscription!',
            fields: { Plan: plan, Customer: data?.user_email || custom.email, Renews: data?.renews_at },
          });
        }
      }
    }

    if (eventName === 'subscription_cancelled') {
      // Still active until period ends — keep plan but mark cancelled
      if (orgId) {
        const expiresAt = data?.ends_at ? new Date(data.ends_at) : null;
        await Organization.findByIdAndUpdate(orgId, {
          'subscription.expiresAt': expiresAt,
          'subscription.cancelledAt': new Date(),
        });
        console.log('[LS webhook] subscription cancelled for org', orgId, 'expires:', expiresAt);
      }
    }

    if (eventName === 'subscription_expired' || eventName === 'subscription_payment_failed') {
      if (orgId) {
        await Organization.findByIdAndUpdate(orgId, {
          'subscription.plan': 'free',
          'subscription.lsSubscriptionId': null,
          'subscription.expiresAt': null,
        });
        console.log('[LS webhook] downgraded org', orgId, '→ free');
      }
      notifyOwner({
        emoji: eventName === 'subscription_payment_failed' ? '⚠️' : '📉',
        title: eventName === 'subscription_payment_failed' ? 'Payment failed' : 'Subscription expired',
        fields: { Customer: data?.user_email || custom.email, Event: eventName },
      });
    }

    if (eventName === 'subscription_cancelled') {
      notifyOwner({
        emoji: '🚪',
        title: 'Subscription cancelled',
        fields: { Customer: data?.user_email || custom.email, 'Active until': data?.ends_at },
      });
    }
  } catch (err) {
    console.error('[LS webhook] error:', err.message);
    return res.status(500).send('Internal error');
  }

  res.json({ received: true });
});

export default router;
