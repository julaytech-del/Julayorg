import AutomationRule from '../models/AutomationRule.js';

export const getRules = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const rules = await AutomationRule.find({ organization: orgId }).sort({ createdAt: -1 });
    res.json({ success: true, data: rules });
  } catch (err) { next(err); }
};

export const createRule = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const rule = await AutomationRule.create({ ...req.body, organization: orgId, createdBy: req.user._id });
    res.status(201).json({ success: true, data: rule });
  } catch (err) { next(err); }
};

export const updateRule = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const rule = await AutomationRule.findOneAndUpdate({ _id: req.params.id, organization: orgId }, req.body, { new: true });
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
    res.json({ success: true, data: rule });
  } catch (err) { next(err); }
};

export const deleteRule = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    await AutomationRule.findOneAndDelete({ _id: req.params.id, organization: orgId });
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const toggleRule = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const rule = await AutomationRule.findOne({ _id: req.params.id, organization: orgId });
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
    rule.active = !rule.active;
    await rule.save();
    res.json({ success: true, data: rule });
  } catch (err) { next(err); }
};
