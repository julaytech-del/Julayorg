import { Router } from 'express';
import PageView from '../models/PageView.js';

const router = Router();

const BOT_PATTERNS = /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|bingpreview/i;

// In-memory active sessions: sessionId -> last ping timestamp
const activeSessions = new Map();

function cleanSessions() {
  const cutoff = Date.now() - 5 * 60 * 1000;
  for (const [id, ts] of activeSessions) {
    if (ts < cutoff) activeSessions.delete(id);
  }
}

function checkKey(req, res) {
  const key = req.query.key || req.headers['x-analytics-key'];
  if (!process.env.ANALYTICS_SECRET || key !== process.env.ANALYTICS_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// POST /api/analytics/track  (public, called by tracker)
router.post('/track', async (req, res) => {
  try {
    const ua = req.headers['user-agent'] || '';
    if (BOT_PATTERNS.test(ua)) return res.status(204).end();

    const { url, referrer, sessionId } = req.body;
    if (!url || !sessionId) return res.status(204).end();

    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

    activeSessions.set(sessionId, Date.now());

    await PageView.create({ url, referrer: referrer || '', sessionId, ip, userAgent: ua });
    res.status(204).end();
  } catch {
    res.status(204).end();
  }
});

// GET /api/analytics/stats
router.get('/stats', async (req, res) => {
  if (!checkKey(req, res)) return;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  cleanSessions();

  const [todayViews, weekViews, monthViews, topPages, topReferrers, daily, recentEvents] = await Promise.all([
    PageView.countDocuments({ createdAt: { $gte: todayStart } }),
    PageView.countDocuments({ createdAt: { $gte: weekAgo } }),
    PageView.countDocuments({ createdAt: { $gte: monthAgo } }),

    PageView.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $group: { _id: '$url', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]),

    PageView.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, referrer: { $ne: '' } } },
      { $group: { _id: '$referrer', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]),

    PageView.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Jerusalem' } },
        views: { $sum: 1 },
        visitors: { $addToSet: '$sessionId' },
      }},
      { $project: { _id: 1, views: 1, visitors: { $size: '$visitors' } } },
      { $sort: { _id: 1 } },
    ]),

    PageView.find({}).sort({ createdAt: -1 }).limit(20).select('url referrer createdAt -_id'),
  ]);

  res.json({
    active: activeSessions.size,
    today: todayViews,
    week: weekViews,
    month: monthViews,
    topPages: topPages.map(p => ({ page: p._id, views: p.views })),
    topReferrers: topReferrers.map(r => ({ referrer: r._id, views: r.views })),
    daily,
    recentEvents,
  });
});

// GET /api/analytics/realtime  (SSE — live active visitor count)
router.get('/realtime', (req, res) => {
  if (!checkKey(req, res)) return;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = () => {
    cleanSessions();
    res.write(`data: ${activeSessions.size}\n\n`);
  };

  send();
  const interval = setInterval(send, 10_000);
  req.on('close', () => clearInterval(interval));
});

export default router;
