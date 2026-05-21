import { Router } from 'express';
import Organization from '../models/Organization.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;
    const org = await Organization.findById(orgId).select('name industry description logo settings');
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
    res.json({ success: true, data: org });
  } catch (err) { next(err); }
});

router.put('/', async (req, res, next) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;
    const { name, industry, description, logo } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Organization name is required' });
    const updates = { name: name.trim() };
    if (industry) updates.industry = industry;
    if (description !== undefined) updates.description = description;
    if (logo !== undefined) updates.logo = logo;
    const org = await Organization.findByIdAndUpdate(orgId, updates, { new: true, runValidators: true })
      .select('name industry description logo settings');
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
    res.json({ success: true, data: org });
  } catch (err) { next(err); }
});

export default router;
