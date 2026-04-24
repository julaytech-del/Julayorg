import { Router } from 'express';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { protect } from '../middleware/auth.middleware.js';
import User from '../models/User.js';

const router = Router();
router.use(protect);

// Setup 2FA — generate secret + QR
router.post('/setup', async (req, res) => {
  try {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(req.user.email, 'Julay', secret);
    const qrCode = await QRCode.toDataURL(otpauth);
    // Store secret temporarily (not enabled yet until verified)
    await User.findByIdAndUpdate(req.user._id, { 'twoFactor.secret': secret });
    res.json({ success: true, qrCode, secret });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Verify token and enable 2FA
router.post('/enable', async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.twoFactor?.secret) return res.status(400).json({ success: false, message: 'Run /setup first' });
    const valid = authenticator.verify({ token, secret: user.twoFactor.secret });
    if (!valid) return res.status(400).json({ success: false, message: 'Invalid code' });
    await User.findByIdAndUpdate(req.user._id, { 'twoFactor.enabled': true });
    res.json({ success: true, message: '2FA enabled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Disable 2FA
router.post('/disable', async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.twoFactor?.enabled) return res.status(400).json({ success: false, message: '2FA not enabled' });
    const valid = authenticator.verify({ token, secret: user.twoFactor.secret });
    if (!valid) return res.status(400).json({ success: false, message: 'Invalid code' });
    await User.findByIdAndUpdate(req.user._id, { 'twoFactor.enabled': false, 'twoFactor.secret': null });
    res.json({ success: true, message: '2FA disabled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Verify during login
router.post('/verify', async (req, res) => {
  try {
    const { token, userId } = req.body;
    const user = await User.findById(userId);
    if (!user?.twoFactor?.enabled) return res.status(400).json({ success: false, message: '2FA not enabled' });
    const valid = authenticator.verify({ token, secret: user.twoFactor.secret });
    res.json({ success: valid, message: valid ? 'Verified' : 'Invalid code' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
