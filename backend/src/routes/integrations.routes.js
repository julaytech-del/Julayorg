import https from 'https';
import http from 'http';
import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import Organization from '../models/Organization.js';

const router = Router();
router.use(protect);

// GET integrations config
router.get('/', async (req, res) => {
  const orgId = req.user.organization?._id || req.user.organization;
  const org = await Organization.findById(orgId).select('integrations');
  res.json({ success: true, data: org?.integrations || {} });
});

// Update Slack webhook
router.put('/slack', async (req, res) => {
  try {
    const { webhookUrl, notifyOn } = req.body;
    const orgId = req.user.organization?._id || req.user.organization;
    const update = { 'integrations.slackWebhookUrl': webhookUrl };
    if (notifyOn) {
      if (notifyOn.taskCreated !== undefined) update['integrations.slackNotifyOn.taskCreated'] = notifyOn.taskCreated;
      if (notifyOn.taskCompleted !== undefined) update['integrations.slackNotifyOn.taskCompleted'] = notifyOn.taskCompleted;
      if (notifyOn.taskOverdue !== undefined) update['integrations.slackNotifyOn.taskOverdue'] = notifyOn.taskOverdue;
    }
    await Organization.findByIdAndUpdate(orgId, update);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Test Slack webhook
router.post('/slack/test', async (req, res) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;
    const org = await Organization.findById(orgId);
    const url = org?.integrations?.slackWebhookUrl;
    if (!url) return res.status(400).json({ success: false, message: 'No Slack webhook configured' });
      const body = JSON.stringify({ text: '✅ Julay is connected to your Slack workspace!' });
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    await new Promise((resolve, reject) => {
      const req = lib.request({ hostname: parsed.hostname, path: parsed.pathname + parsed.search, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, resolve);
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Toggle email notifications
router.put('/email', async (req, res) => {
  try {
    const { enabled } = req.body;
    const orgId = req.user.organization?._id || req.user.organization;
    await Organization.findByIdAndUpdate(orgId, { 'integrations.emailNotifications': enabled });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
