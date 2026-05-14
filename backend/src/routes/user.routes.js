import { Router } from 'express';
import { getUsers, getUser, updateUser, deleteUser, getMe, updateMe, createMember, getRoles, addExistingUser } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/', getUsers);
router.get('/roles', getRoles);
router.post('/', createMember);
router.post('/add-existing', addExistingUser);
router.get('/me', getMe);
router.put('/me', updateMe);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
