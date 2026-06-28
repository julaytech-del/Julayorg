import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

const router = Router();
router.use(protect);

const orgOf = (req) => req.user.organization?._id || req.user.organization;
const dmKeyOf = (a, b) => [String(a), String(b)].sort().join('__');

// Only allow attachments that point at our own /uploads/ store (no arbitrary URLs).
const sanitizeAttachments = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 10).map(a => ({
    url:  String(a?.url || ''),
    name: String(a?.name || '').slice(0, 200),
    type: String(a?.type || '').slice(0, 100),
    size: Number(a?.size) || 0,
  })).filter(a => a.url.startsWith('/uploads/'));
};

// Load the caller's per-conversation read map as a plain object.
const readsOf = async (userId) => {
  const u = await User.findById(userId).select('chatReads').lean();
  const r = u?.chatReads || {};
  return (key) => (r[key] ? new Date(r[key]) : new Date(0));
};

// GET /api/chat/messages?with=<userId>&after=<ISO>
// `with` → 1:1 DM with that user; omitted → shared team channel.
router.get('/messages', async (req, res) => {
  try {
    const filter = { organization: orgOf(req) };
    filter.dmKey = req.query.with ? dmKeyOf(req.user._id, req.query.with) : null;
    if (req.query.after) {
      const after = new Date(req.query.after);
      if (!isNaN(after)) filter.createdAt = { $gt: after };
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const docs = await Message.find(filter)
      .sort({ createdAt: -1 }).limit(limit)
      .populate('sender', 'name avatar email');
    res.json({ success: true, data: docs.reverse() });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/chat/conversations — team + every teammate, with last message + unread.
router.get('/conversations', async (req, res) => {
  try {
    const meId  = req.user._id;
    const orgId = orgOf(req);
    const readAt = await readsOf(meId);

    const teamLast = await Message.findOne({ organization: orgId, dmKey: null }).sort({ createdAt: -1 });
    const teamUnread = await Message.countDocuments({ organization: orgId, dmKey: null, sender: { $ne: meId }, createdAt: { $gt: readAt('team') } });

    const members = await User.find({ organization: orgId, _id: { $ne: meId }, blocked: { $ne: true } })
      .select('name avatar email').lean();

    const dms = await Promise.all(members.map(async (m) => {
      const key  = dmKeyOf(meId, m._id);
      const last = await Message.findOne({ organization: orgId, dmKey: key }).sort({ createdAt: -1 });
      const unread = await Message.countDocuments({ organization: orgId, dmKey: key, sender: { $ne: meId }, createdAt: { $gt: readAt(key) } });
      return {
        user: m,
        unread,
        lastMessage: last ? { text: last.text, hasAttachment: (last.attachments || []).length > 0, createdAt: last.createdAt } : null,
      };
    }));
    // most recently active first
    dms.sort((a, b) => new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0));

    res.json({
      success: true,
      data: {
        team: { unread: teamUnread, lastMessage: teamLast ? { text: teamLast.text, hasAttachment: (teamLast.attachments || []).length > 0, createdAt: teamLast.createdAt } : null },
        dms,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/chat/unread — total across team + all DMs (for the sidebar badge).
router.get('/unread', async (req, res) => {
  try {
    const meId  = req.user._id;
    const orgId = orgOf(req);
    const readAt = await readsOf(meId);
    let count = await Message.countDocuments({ organization: orgId, dmKey: null, sender: { $ne: meId }, createdAt: { $gt: readAt('team') } });
    const members = await User.find({ organization: orgId, _id: { $ne: meId } }).select('_id').lean();
    for (const m of members) {
      const key = dmKeyOf(meId, m._id);
      count += await Message.countDocuments({ organization: orgId, dmKey: key, sender: { $ne: meId }, createdAt: { $gt: readAt(key) } });
    }
    res.json({ success: true, count });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/chat/read { conversation: 'team' | <userId> }
router.post('/read', async (req, res) => {
  try {
    const conv = req.body.conversation || 'team';
    const key = conv === 'team' ? 'team' : dmKeyOf(req.user._id, conv);
    await User.updateOne({ _id: req.user._id }, { $set: { [`chatReads.${key}`]: new Date() } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/chat/messages { text, attachments, to? }
// `to` (a teammate's userId) → DM; omitted → team channel.
router.post('/messages', async (req, res) => {
  try {
    const text = String(req.body.text || '').trim();
    const attachments = sanitizeAttachments(req.body.attachments);
    if (!text && attachments.length === 0) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    if (text.length > 4000) return res.status(400).json({ success: false, message: 'Message is too long' });

    let dmKey = null, participants = [];
    if (req.body.to) {
      const other = await User.findOne({ _id: req.body.to, organization: orgOf(req) }).select('_id');
      if (!other) return res.status(400).json({ success: false, message: 'Recipient not found' });
      dmKey = dmKeyOf(req.user._id, other._id);
      participants = [req.user._id, other._id];
    }

    const msg = await Message.create({ organization: orgOf(req), sender: req.user._id, text, attachments, dmKey, participants });
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
