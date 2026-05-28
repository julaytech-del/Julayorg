import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { sendReportEmail } from '../utils/email.js';

const router = express.Router();

// Owner-only middleware — only assimohammad489@gmail.com (or OWNER_EMAIL env) can access
const ownerOnly = (req, res, next) => {
  const ownerEmail = process.env.OWNER_EMAIL || 'assimohammad489@gmail.com';
  if (req.user?.email !== ownerEmail) {
    return res.status(403).json({ success: false, message: 'Owner access only.' });
  }
  next();
};

// POST /api/owner/email-report — any authenticated user can trigger; always sends to owner only
router.post('/email-report', protect, async (req, res) => {
  try {
    const { subject = 'Julay QA Report', body } = req.body;
    if (!body) return res.status(400).json({ success: false, message: 'body is required' });
    await sendReportEmail({ subject, body });
    res.json({ success: true, message: 'Report sent to owner email.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.use(protect, ownerOnly);

// GET /api/owner/stats — platform overview
router.get('/stats', async (req, res) => {
  try {
    const [totalOrgs, totalUsers, paidOrgs, tasks, projects] = await Promise.all([
      Organization.countDocuments(),
      User.countDocuments(),
      Organization.countDocuments({ 'subscription.plan': { $ne: 'free' } }),
      Task.countDocuments(),
      Project.countDocuments(),
    ]);

    const planBreakdown = await Organization.aggregate([
      { $group: { _id: '$subscription.plan', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const recentSignups = await Organization.find()
      .sort({ createdAt: -1 }).limit(5)
      .select('name subscription.plan createdAt');

    // MRR estimate based on plan prices
    const PLAN_PRICES = { free: 0, starter: 19, professional: 59, business: 99, enterprise: 299 };
    const mrr = planBreakdown.reduce((sum, p) => sum + (PLAN_PRICES[p._id] || 0) * p.count, 0);

    res.json({
      success: true, data: {
        totalOrgs, totalUsers, paidOrgs, freeOrgs: totalOrgs - paidOrgs,
        totalTasks: tasks, totalProjects: projects,
        mrr, planBreakdown, recentSignups,
        conversionRate: totalOrgs > 0 ? Math.round((paidOrgs / totalOrgs) * 100) : 0,
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/owner/organizations — all orgs with full details
router.get('/organizations', async (req, res) => {
  try {
    const { plan, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (plan && plan !== 'all') filter['subscription.plan'] = plan;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const [orgs, total] = await Promise.all([
      Organization.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .select('name industry subscription createdAt settings'),
      Organization.countDocuments(filter)
    ]);

    // Enrich each org with user count
    const enriched = await Promise.all(orgs.map(async org => {
      const memberCount = await User.countDocuments({ organization: org._id });
      const projectCount = await Project.countDocuments({ organization: org._id });
      return { ...org.toObject(), memberCount, projectCount };
    }));

    res.json({ success: true, data: enriched, total, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/owner/users — all users across all orgs
router.get('/users', async (req, res) => {
  try {
    const { search, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('organization', 'name subscription.plan')
        .select('name email avatar createdAt lastActive status twoFactor.enabled'),
      User.countDocuments(filter)
    ]);

    res.json({ success: true, data: users, total, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/owner/organizations/:id/plan — change org plan
router.patch('/organizations/:id/plan', async (req, res) => {
  try {
    const { plan } = req.body;
    const valid = ['free', 'starter', 'professional', 'business', 'enterprise'];
    if (!valid.includes(plan)) return res.status(400).json({ success: false, message: 'Invalid plan' });

    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { 'subscription.plan': plan, 'subscription.expiresAt': plan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      { new: true }
    );
    if (!org) return res.status(404).json({ success: false, message: 'Org not found' });
    res.json({ success: true, data: org });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/owner/users/:id — delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const ownerEmail = process.env.OWNER_EMAIL || 'assimohammad489@gmail.com';
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.email === ownerEmail) return res.status(400).json({ success: false, message: 'Cannot delete owner account' });
    await user.deleteOne();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/owner/growth — signup growth per month (last 6 months)
router.get('/growth', async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const growth = await Organization.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({ success: true, data: growth });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
