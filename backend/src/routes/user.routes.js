import { Router } from 'express';
import { getUsers, getUser, updateUser, deleteUser, updateMe } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/', getUsers);
router.put('/me', updateMe);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
