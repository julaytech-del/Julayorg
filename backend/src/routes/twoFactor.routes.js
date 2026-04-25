import { Router } from 'express';
import * as OTPAuth from 'otpauth';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const QRCode = require('qrcode');
import { protect } from '../middleware/auth.middleware.js';
import User from '../models/User.js';

const router = Router();
router.use(protect);

const makeTotp = (email, secret) => new OTPAuth.TOTP({
  issuer: 'Julay',
  label: email,
  algorithm: 'SHA1',
  digits: 6,
  period: 30,
  secret: OTPAuth.Secret.fromBase32(secret),
});

// Setup 2FA — generate secret + QR
router.post('/setup', async (req, res) => {
  try {
    const secret = new OTPAuth.Secret().base32;
    const totp = makeTotp(req.user.email, secret);
    const otpauth = totp.toString();
    const qrCode = await QRCode.toDataURL(otpauth);
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
    const totp = makeTotp(user.email, user.twoFactor.secret);
    const delta = totp.validate({ token, window: 1 });
    if (delta === null) return res.status(400).json({ success: false, message: 'Invalid code' });
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
    const totp = makeTotp(user.email, user.twoFactor.secret);
    const delta = totp.validate({ token, window: 1 });
    if (delta === null) return res.status(400).json({ success: false, message: 'Invalid code' });
    await User.findByIdAndUpdate(req.user._id, { 'twoFactor.enabled': false, 'twoFactor.secret': null });
    res.json({ success: true, message: '2FA disabled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
