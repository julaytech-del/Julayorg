import Webhook from '../models/Webhook.js';
import crypto from 'crypto';
import { triggerWebhooks } from '../services/webhook.service.js';

export const getWebhooks = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const webhooks = await Webhook.find({ organization: orgId }).select('-deliveryLog');
    res.json({ success: true, data: webhooks });
  } catch (err) { next(err); }
};

export const createWebhook = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const secret = crypto.randomBytes(20).toString('hex');
    const webhook = await Webhook.create({ ...req.body, organization: orgId, secret });
    res.status(201).json({ success: true, data: webhook });
  } catch (err) { next(err); }
};

export const updateWebhook = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const webhook = await Webhook.findOneAndUpdate({ _id: req.params.id, organization: orgId }, req.body, { new: true });
    if (!webhook) return res.status(404).json({ success: false, message: 'Webhook not found' });
    res.json({ success: true, data: webhook });
  } catch (err) { next(err); }
};

export const deleteWebhook = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    await Webhook.findOneAndDelete({ _id: req.params.id, organization: orgId });
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const testWebhook = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const webhook = await Webhook.findOne({ _id: req.params.id, organization: orgId });
    if (!webhook) return res.status(404).json({ success: false, message: 'Webhook not found' });

    const body = JSON.stringify({ event: 'test', timestamp: new Date().toISOString(), data: { message: 'This is a test payload from Julay' } });
    const signature = webhook.secret
      ? crypto.createHmac('sha256', webhook.secret).update(body).digest('hex')
      : null;
    const start = Date.now();
    let statusCode = 0, success = false, response = '';
    try {
      const r = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(signature ? { 'X-Julay-Signature': `sha256=${signature}` } : {}) },
        body,
        signal: AbortSignal.timeout(5000),
      });
      statusCode = r.status;
      success = r.ok;
      response = await r.text().catch(() => '');
    } catch (err) {
      response = err.message;
    }
    webhook.deliveryLog.push({ event: 'test', statusCode, success, response: response.slice(0, 500), durationMs: Date.now() - start });
    if (webhook.deliveryLog.length > 50) webhook.deliveryLog = webhook.deliveryLog.slice(-50);
    webhook.lastTriggeredAt = new Date();
    await webhook.save();

    if (!success) return res.status(502).json({ success: false, message: `Endpoint responded with ${statusCode || 'no response'}` });
    res.json({ success: true, message: 'Test webhook sent' });
  } catch (err) { next(err); }
};

export const getDeliveryLog = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const webhook = await Webhook.findOne({ _id: req.params.id, organization: orgId }).select('deliveryLog name');
    if (!webhook) return res.status(404).json({ success: false, message: 'Webhook not found' });
    res.json({ success: true, data: webhook.deliveryLog.slice(-20).reverse() });
  } catch (err) { next(err); }
};
