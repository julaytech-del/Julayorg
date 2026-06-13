import express from 'express';
import os from 'os';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import PlatformSettings, { getSettings } from '../models/PlatformSettings.js';
import Announcement from '../models/Announcement.js';
import { sendReportEmail } from '../utils/email.js';
import { getAnalyticsStats } from '../services/analytics.service.js';
import nodemailer from 'nodemailer';

const router = express.Router();

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'assimohammad489@gmail.com';
const PLAN_PRICES = { free: 0, starter: 19, professional: 59, business: 99, enterprise: 299 };

const ownerOnly = (req, res, next) => {
  if (req.user?.email !== OWNER_EMAIL) {
    return res.status(403).json({ success: false, message: 'Owner access only.' });
  }
  next();
};

// ── Public (authenticated) endpoints ─────────────────────────────────────────

// POST /api/owner/email-report
router.post('/email-report', protect, async (req, res) => {
  try {
    const { subject = 'Julay Report', body } = req.body;
    if (!body) return res.status(400).json({ success: false, message: 'body is required' });
    await sendReportEmail({ subject, body });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/owner/announcements/active — active banners for all users
router.get('/announcements/active', protect, async (req, res) => {
  try {
    const now = new Date();
    const userPlan = req.user?.organization?.subscription?.plan || 'free';
    const query = {
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    };
    let items = await Announcement.find(query).sort({ createdAt: -1 });
    // Filter by plan targeting
    items = items.filter(a => !a.targetPlans.length || a.targetPlans.includes(userPlan));
    res.json({ success: true, data: items });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/owner/settings/public — maintenance + feature flags (for all users)
router.get('/settings/public', protect, async (req, res) => {
  try {
    const s = await getSettings();
    res.json({
      success: true,
      data: {
        maintenanceMode: s.maintenanceMode,
        maintenanceMessage: s.maintenanceMessage,
        allowNewSignups: s.allowNewSignups,
        featureFlags: s.featureFlags,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Owner-only from here ──────────────────────────────────────────────────────
router.use(protect, ownerOnly);

// ── Traffic analytics (visitors) — owner-authenticated ────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    res.json({ success: true, data: await getAnalyticsStats() });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Stats ─────────────────────────────────────────────────────────────────────
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

// ── Growth ────────────────────────────────────────────────────────────────────
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

// ── Organizations ─────────────────────────────────────────────────────────────
router.get('/organizations', async (req, res) => {
  try {
    const { plan, search, page = 1, limit = 15 } = req.query;
    const filter = {};
    if (plan && plan !== 'all') filter['subscription.plan'] = plan;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const [orgs, total] = await Promise.all([
      Organization.find(filter).sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(Number(limit))
        .select('name industry subscription createdAt settings'),
      Organization.countDocuments(filter)
    ]);

    const enriched = await Promise.all(orgs.map(async org => {
      const [memberCount, projectCount] = await Promise.all([
        User.countDocuments({ organization: org._id }),
        Project.countDocuments({ organization: org._id }),
      ]);
      return { ...org.toObject(), memberCount, projectCount };
    }));

    res.json({ success: true, data: enriched, total, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

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

// Edit organization (name and/or plan) in one call
router.patch('/organizations/:id', async (req, res) => {
  try {
    const { name, plan } = req.body;
    const update = {};
    if (typeof name === 'string' && name.trim()) update.name = name.trim();
    if (plan) {
      const valid = ['free', 'starter', 'professional', 'business', 'enterprise'];
      if (!valid.includes(plan)) return res.status(400).json({ success: false, message: 'Invalid plan' });
      update['subscription.plan'] = plan;
      update['subscription.expiresAt'] = plan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    if (!Object.keys(update).length) return res.status(400).json({ success: false, message: 'Nothing to update' });
    const org = await Organization.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!org) return res.status(404).json({ success: false, message: 'Org not found' });
    res.json({ success: true, data: org });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE org
router.delete('/organizations/:id', async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ success: false, message: 'Org not found' });
    await Promise.all([
      User.deleteMany({ organization: org._id }),
      Project.deleteMany({ organization: org._id }),
      Task.deleteMany({ organization: org._id }),
      org.deleteOne(),
    ]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(Number(limit))
        .populate('organization', 'name subscription.plan')
        .select('name email avatar createdAt lastActive status blocked twoFactor.enabled'),
      User.countDocuments(filter)
    ]);
    res.json({ success: true, data: users, total, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Block / unblock a user (suspend without deleting)
router.patch('/users/:id/block', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.email === OWNER_EMAIL) return res.status(400).json({ success: false, message: 'Cannot block owner account' });
    user.blocked = req.body.blocked === true;
    await user.save();
    res.json({ success: true, data: { id: user._id, blocked: user.blocked } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.email === OWNER_EMAIL) return res.status(400).json({ success: false, message: 'Cannot delete owner account' });
    await user.deleteOne();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Platform Settings ─────────────────────────────────────────────────────────
router.get('/settings', async (req, res) => {
  try {
    const s = await getSettings();
    res.json({ success: true, data: s });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/settings', async (req, res) => {
  try {
    const allowed = [
      'maintenanceMode', 'maintenanceMessage', 'allowNewSignups', 'allowGoogleAuth',
      'featureFlags', 'contactEmail', 'supportUrl', 'termsUrl', 'privacyUrl',
    ];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    update.updatedAt = new Date();

    const s = await PlatformSettings.findByIdAndUpdate(
      'singleton',
      { $set: update },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: s });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Plans ─────────────────────────────────────────────────────────────────────
router.get('/plans', async (req, res) => {
  try {
    const s = await getSettings();
    const plans = {};
    (s.plans || new Map()).forEach((v, k) => { plans[k] = v; });
    res.json({ success: true, data: plans });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/plans/:planName', async (req, res) => {
  try {
    const { planName } = req.params;
    const valid = ['free', 'starter', 'professional', 'business', 'enterprise'];
    if (!valid.includes(planName)) return res.status(400).json({ success: false, message: 'Invalid plan name' });

    const s = await getSettings();
    const current = s.plans?.get(planName) || {};
    const updated = { ...current.toObject?.() || current, ...req.body };

    await PlatformSettings.findByIdAndUpdate(
      'singleton',
      { $set: { [`plans.${planName}`]: updated, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Announcements ─────────────────────────────────────────────────────────────
router.get('/announcements', async (req, res) => {
  try {
    const items = await Announcement.find().sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/announcements', async (req, res) => {
  try {
    const { message, type, active, link, linkText, dismissible, targetPlans, expiresAt } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'message is required' });
    const item = await Announcement.create({ message, type, active, link, linkText, dismissible, targetPlans, expiresAt, createdBy: req.user.email });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/announcements/:id', async (req, res) => {
  try {
    const item = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Email Blast ───────────────────────────────────────────────────────────────
router.post('/email-blast', async (req, res) => {
  try {
    const { subject, body, targetPlans = [], limit: maxRecipients = 500 } = req.body;
    if (!subject || !body) return res.status(400).json({ success: false, message: 'subject and body required' });

    // Find target users
    let orgFilter = {};
    if (targetPlans.length) orgFilter['subscription.plan'] = { $in: targetPlans };
    const orgs = await Organization.find(orgFilter).select('_id');
    const orgIds = orgs.map(o => o._id);

    const users = await User.find({ organization: { $in: orgIds } })
      .select('email name').limit(Number(maxRecipients));

    if (!users.length) return res.status(400).json({ success: false, message: 'No recipients found' });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const results = { sent: 0, failed: 0 };
    for (const user of users) {
      try {
        await transporter.sendMail({
          from: `"Julay" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: user.email,
          subject,
          html: `<p>Hi ${user.name || 'there'},</p>${body}<p>— Julay Team</p>`,
        });
        results.sent++;
      } catch { results.failed++; }
    }

    res.json({ success: true, data: results });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── System Health ─────────────────────────────────────────────────────────────
router.get('/system', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    const uptime = process.uptime();
    const mem = process.memoryUsage();
    const load = os.loadavg();

    const now = new Date();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [newUsersToday, newUsersWeek, newOrgsToday, activeToday] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: dayAgo } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      Organization.countDocuments({ createdAt: { $gte: dayAgo } }),
      User.countDocuments({ lastActive: { $gte: dayAgo } }).catch(() => 0),
    ]);

    res.json({
      success: true,
      data: {
        database: { status: dbStateMap[dbState] || 'unknown', state: dbState },
        server: {
          uptime: Math.floor(uptime),
          uptimeFormatted: formatUptime(uptime),
          nodeVersion: process.version,
          platform: os.platform(),
          arch: os.arch(),
        },
        memory: {
          heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
          rss: Math.round(mem.rss / 1024 / 1024),
          external: Math.round(mem.external / 1024 / 1024),
        },
        os: {
          loadAvg1: load[0].toFixed(2),
          loadAvg5: load[1].toFixed(2),
          totalMem: Math.round(os.totalmem() / 1024 / 1024 / 1024),
          freeMem: Math.round(os.freemem() / 1024 / 1024 / 1024),
          cpus: os.cpus().length,
        },
        activity: {
          newUsersToday,
          newUsersWeek,
          newOrgsToday,
          activeToday,
        },
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

export default router;
