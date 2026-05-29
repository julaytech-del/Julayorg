import { Router } from 'express';
import { getUsers, getUser, updateUser, deleteUser, getMe, updateMe, createMember, getRoles, addExistingUser } from '../controllers/user.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';

const router = Router();
router.use(protect);

router.get('/', getUsers);
router.get('/roles', getRoles);
router.post('/', requirePermission('users', 'create'), createMember);
router.post('/add-existing', requirePermission('users', 'create'), addExistingUser);
router.get('/me', getMe);
router.put('/me', updateMe);
router.delete('/me', async (req, res) => {
  try {
    const ownerEmail = process.env.OWNER_EMAIL || 'assimohammad489@gmail.com';
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.email === ownerEmail) {
      return res.status(403).json({ message: 'Owner account cannot be deleted' });
    }

    const orgId = user.organization;
    const isLastAdmin = user.isAdmin && (await User.countDocuments({ organization: orgId, isAdmin: true })) === 1;

    if (isLastAdmin) {
      await Task.deleteMany({ organization: orgId });
      await Project.deleteMany({ organization: orgId });
      await Organization.findByIdAndDelete(orgId);
      await User.deleteMany({ organization: orgId });
    } else {
      await User.findByIdAndDelete(user._id);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to delete account' });
  }
});

router.get('/:id', getUser);
router.put('/:id', requirePermission('users', 'update'), updateUser);
router.delete('/:id', requirePermission('users', 'delete'), deleteUser);

export default router;
