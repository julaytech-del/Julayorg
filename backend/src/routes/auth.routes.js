import { Router } from 'express';
import { register, login, getMe, changePassword, createInvite, getInviteInfo, acceptInvite } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);
router.post('/invite', protect, createInvite);
router.get('/invite/:token', getInviteInfo);
router.post('/accept-invite/:token', acceptInvite);
export default router;
