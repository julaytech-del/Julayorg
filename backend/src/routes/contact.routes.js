import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { sendContactEmail } from '../utils/email.js';

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: req => req.ip,
  message: { success: false, message: 'Too many contact requests. Please try again in an hour.' },
});

const SUBJECTS = ['general', 'sales', 'support', 'privacy', 'bug'];

router.post('/', contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name?.trim() || !email?.trim() || !subject || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }
    if (!SUBJECTS.includes(subject)) {
      return res.status(400).json({ success: false, message: 'Invalid subject.' });
    }
    if (message.trim().length < 10 || message.trim().length > 5000) {
      return res.status(400).json({ success: false, message: 'Message must be 10–5000 characters.' });
    }

    await sendContactEmail({ name: name.trim(), email: email.trim(), subject, message: message.trim() });

    res.json({ success: true, message: 'Message received. We\'ll be in touch soon.' });
  } catch (err) {
    console.error('[Contact]', err);
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again.' });
  }
});

export default router;
