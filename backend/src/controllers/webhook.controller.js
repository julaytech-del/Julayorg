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
    await triggerWebhooks(orgId, 'test', { message: 'This is a test payload from Julay', timestamp: new Date().toISOString() });
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
