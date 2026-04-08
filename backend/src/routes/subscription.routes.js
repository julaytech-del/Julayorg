import express, { Router } from 'express';
import Stripe from 'stripe';
import { protect } from '../middleware/auth.middleware.js';
import User from '../models/User.js';

const router = Router();

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe not configured');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

// Create Stripe checkout session
router.post('/checkout', protect, async (req, res) => {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: req.user.email,
      metadata: { userId: req.user._id.toString() },
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Julay Pro', description: 'AI-powered project management — unlimited everything' },
          unit_amount: 2000,
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

// Stripe webhook — auto-activate subscription
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
    const userId = session.metadata?.userId;
    if (userId) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      await User.findByIdAndUpdate(userId, {
        'subscription.plan': 'pro',
        'subscription.subscribedAt': new Date(),
        'subscription.expiresAt': expiresAt,
        'subscription.stripeSessionId': session.id,
      });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const user = await User.findOne({ 'subscription.stripeCustomerId': sub.customer });
    if (user) await user.updateOne({ 'subscription.plan': 'free' });
  }

  res.json({ received: true });
});

// Admin: manually set subscription
router.post('/admin/set', protect, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ success: false, message: 'Admin only' });
  const { userId, plan } = req.body;
  const expiresAt = plan === 'pro' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
  await User.findByIdAndUpdate(userId, { 'subscription.plan': plan, 'subscription.expiresAt': expiresAt, 'subscription.subscribedAt': new Date() });
  res.json({ success: true });
});

// Get subscription status
router.get('/status', protect, (req, res) => {
  const { plan, expiresAt } = req.user.subscription || {};
  const active = plan === 'pro' && (!expiresAt || new Date() < new Date(expiresAt));
  res.json({ success: true, plan: plan || 'free', active, expiresAt });
});

export default router;
