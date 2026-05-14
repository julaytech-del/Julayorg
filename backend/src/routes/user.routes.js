import { Router } from 'express';
import { getUsers, getUser, updateUser, deleteUser, getMe, updateMe, createMember, getRoles, addExistingUser } from '../controllers/user.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/', getUsers);
router.get('/roles', getRoles);
router.post('/', requirePermission('users', 'create'), createMember);
router.post('/add-existing', requirePermission('users', 'create'), addExistingUser);
router.get('/me', getMe);
router.put('/me', updateMe);
router.get('/:id', getUser);
router.put('/:id', requirePermission('users', 'update'), updateUser);
router.delete('/:id', requirePermission('users', 'delete'), deleteUser);

export default router;
