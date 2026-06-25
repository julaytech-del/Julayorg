import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import Message from '../models/Message.js';

const router = Router();
router.use(protect);

// Every query is scoped to the caller's organization — members only ever see
// their own workspace's chat.
const orgOf = (req) => req.user.organization?._id || req.user.organization;

// GET /api/chat/messages?after=<ISO timestamp>&limit=50
router.get('/messages', async (req, res) => {
  try {
    const filter = { organization: orgOf(req) };
    if (req.query.after) {
      const after = new Date(req.query.after);
      if (!isNaN(after)) filter.createdAt = { $gt: after };
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const docs = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name avatar email');
    res.json({ success: true, data: docs.reverse() }); // chronological (oldest first)
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/chat/messages { text }
router.post('/messages', async (req, res) => {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ success: false, message: 'Message is required' });
    if (text.length > 4000) return res.status(400).json({ success: false, message: 'Message is too long' });
    const msg = await Message.create({ organization: orgOf(req), sender: req.user._id, text });
    await msg.populate('sender', 'name avatar email');
    res.status(201).json({ success: true, data: msg });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE /api/chat/messages/:id — sender or admin only
router.delete('/messages/:id', async (req, res) => {
  try {
    const msg = await Message.findOne({ _id: req.params.id, organization: orgOf(req) });
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    if (String(msg.sender) !== String(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }
    await msg.deleteOne();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
