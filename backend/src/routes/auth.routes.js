import { Router } from 'express';
import { register, login, getMe, changePassword, createInvite, getInviteInfo, acceptInvite, sendOTP, verifyOTPLogin, verifyOTPRegister, googleAuth, googleCodeAuth } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);
router.post('/invite', protect, createInvite);
router.get('/invite/:token', getInviteInfo);
router.post('/accept-invite/:token', acceptInvite);
// OTP (email code) auth
router.post('/otp/send', sendOTP);
router.post('/otp/verify-login', verifyOTPLogin);
router.post('/otp/verify-register', verifyOTPRegister);
// Google OAuth
router.post('/google', googleAuth);
router.post('/google-token', googleAuth);
router.post('/google-code', googleCodeAuth);
export default router;
