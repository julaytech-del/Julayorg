import express, { Router } from 'express';
import Stripe from 'stripe';
import { protect } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';

const router = Router();

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe not configured');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const PLAN_PRICES = {
  starter: { amount: 900, name: 'Julay Starter', description: 'Up to 10 projects, 100 AI requests/month' },
  professional: { amount: 2900, name: 'Julay Professional', description: 'Unlimited projects, 500 AI requests/month' },
  business: { amount: 7900, name: 'Julay Business', description: 'Unlimited everything, 2000 AI requests/month' },
};

// GET /subscription/plans — public, no auth required
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'free', name: 'Free', price: 0, yearlyPrice: 0, aiRequests: 5, projects: 3, members: 3, features: ['3 projects', '3 team members', '5 AI requests/month', 'Basic Kanban & List views', '1 GB storage'] },
      { id: 'starter', name: 'Starter', price: 9, yearlyPrice: 7, aiRequests: 100, projects: 10, members: 10, popular: false, features: ['10 projects', '10 team members', '100 AI requests/month', 'All views (Calendar, Gantt, Workload)', '10 GB storage', 'Email support'] },
      { id: 'professional', name: 'Professional', price: 29, yearlyPrice: 23, aiRequests: 500, projects: -1, members: 25, popular: true, features: ['Unlimited projects', '25 team members', '500 AI requests/month', 'Automations, Reports, Webhooks, Forms', 'Time Tracking & Custom Fields', '50 GB storage', 'Priority support'] },
      { id: 'business', name: 'Business', price: 79, yearlyPrice: 63, aiRequests: 2000, projects: -1, members: -1, popular: false, features: ['Everything in Professional', 'Unlimited team members', '2000 AI requests/month', 'API access', 'Custom Dashboards & Analytics', '200 GB storage', 'Dedicated support'] },
      { id: 'enterprise', name: 'Enterprise', price: null, yearlyPrice: null, aiRequests: -1, projects: -1, members: -1, popular: false, features: ['Unlimited everything', 'Unlimited AI requests', 'SSO / SAML authentication', 'Custom contracts & SLA', 'White-label options', '24/7 dedicated support'] }
    ]
  });
});

// Create Stripe checkout session
router.post('/checkout', protect, async (req, res) => {
  try {
    const stripe = getStripe();
    const orgId = req.user.organization?._id || req.user.organization;
    const plan = req.body.plan || 'professional';
    const planConfig = PLAN_PRICES[plan];

    if (!planConfig) return res.status(400).json({ success: false, message: 'Invalid plan. Choose: starter, professional, business' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: req.user.email,
      metadata: { orgId: orgId.toString(), userId: req.user._id.toString(), plan },
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: planConfig.name, description: planConfig.description },
          unit_amount: planConfig.amount,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL || 'https://julay.org'}/dashboard?upgraded=1`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://julay.org'}/dashboard/ai`,
    });
    res.json({ success: true, url: session.url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Stripe webhook — auto-activate org subscription
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).send('Webhook Error');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orgId = session.metadata?.orgId;
    const plan = session.metadata?.plan || 'professional';
    if (orgId) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      await Organization.findByIdAndUpdate(orgId, {
        'subscription.plan': plan,
        'subscription.expiresAt': expiresAt,
        'subscription.stripeSessionId': session.id,
        'subscription.stripeCustomerId': session.customer,
        'subscription.stripeSubscriptionId': session.subscription,
        'subscription.billingPeriodStart': new Date(),
        'subscription.aiUsedThisMonth': 0,
      });
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object;
    const orgId = sub.metadata?.orgId;
    if (orgId && sub.status === 'active') {
      const expiresAt = new Date(sub.current_period_end * 1000);
      await Organization.findByIdAndUpdate(orgId, {
        'subscription.expiresAt': expiresAt,
        'subscription.stripeSubscriptionId': sub.id,
      });
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    const customerId = invoice.customer;
    if (customerId) {
      await Organization.findOneAndUpdate(
        { 'subscription.stripeCustomerId': customerId },
        { 'subscription.plan': 'free' }
      );
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const orgId = sub.metadata?.orgId;
    const customerId = sub.customer;
    const filter = orgId ? { _id: orgId } : { 'subscription.stripeCustomerId': customerId };
    await Organization.findOneAndUpdate(filter, { 'subscription.plan': 'free', 'subscription.stripeSubscriptionId': null });
  }

  res.json({ received: true });
});

// Admin: manually activate org subscription
router.post('/admin/set', protect, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ success: false, message: 'Admin only' });
  const { orgId, plan } = req.body;
  const expiresAt = plan === 'pro' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
  await Organization.findByIdAndUpdate(orgId, {
    'subscription.plan': plan,
    'subscription.expiresAt': expiresAt,
  });
  res.json({ success: true });
});

// Get subscription status for current org
router.get('/status', protect, async (req, res) => {
  const orgId = req.user.organization?._id || req.user.organization;
  const org = await Organization.findById(orgId);
  const sub = org?.subscription || {};
  const paid = ['starter', 'professional', 'business', 'enterprise'];
  const active = paid.includes(sub.plan) && (!sub.expiresAt || new Date() < new Date(sub.expiresAt));
  const aiLimits = { free: 5, starter: 100, professional: 500, business: 2000, enterprise: -1 };
  res.json({
    success: true,
    plan: sub.plan || 'free',
    active,
    expiresAt: sub.expiresAt,
    aiUsedThisMonth: sub.aiUsedThisMonth || 0,
    aiLimit: aiLimits[sub.plan || 'free'] ?? 5,
  });
});

// Customer Portal — let user manage/cancel subscription
router.post('/portal', protect, async (req, res) => {
  try {
    const stripe = getStripe();
    const orgId = req.user.organization?._id || req.user.organization;
    const org = await Organization.findById(orgId);
    const customerId = org?.subscription?.stripeCustomerId;
    if (!customerId) return res.status(400).json({ success: false, message: 'No active subscription found' });
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL || 'https://julay.org'}/dashboard/settings?tab=billing`,
    });
    res.json({ success: true, url: session.url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
