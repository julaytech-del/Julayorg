import { Router } from 'express';
import PageView from '../models/PageView.js';

const router = Router();

const BOT_PATTERNS = /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|bingpreview/i;
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

function getDevice(ua) {
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
    return /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
  }
  return 'desktop';
}

// POST /api/analytics/track
router.post('/track', async (req, res) => {
  try {
    const ua = req.headers['user-agent'] || '';
    if (BOT_PATTERNS.test(ua)) return res.status(204).end();

    const { url, referrer, sessionId, eventType = 'pageview', element = '', language = '', duration = 0, scrollDepth = 0 } = req.body;
    if (!url || !sessionId) return res.status(204).end();

    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const device = getDevice(ua);

    activeSessions.set(sessionId, Date.now());

    await PageView.create({ url, referrer: referrer || '', sessionId, ip, userAgent: ua, eventType, element, device, language, duration, scrollDepth });
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
  const weekAgo  = new Date(Date.now() - 7  * 24 * 3600 * 1000);
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  cleanSessions();

  const [
    todayViews, weekViews, monthViews,
    topPages, topReferrers, daily, recentEvents,
    deviceBreakdown, topClicks,
    funnelHome, funnelPricing, funnelRegister, funnelDashboard,
    bounceData, avgDurationData, topLanguages,
  ] = await Promise.all([
    PageView.countDocuments({ createdAt: { $gte: todayStart }, eventType: 'pageview' }),
    PageView.countDocuments({ createdAt: { $gte: weekAgo  }, eventType: 'pageview' }),
    PageView.countDocuments({ createdAt: { $gte: monthAgo }, eventType: 'pageview' }),

    PageView.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, eventType: 'pageview' } },
      { $group: { _id: '$url', views: { $sum: 1 } } },
      { $sort: { views: -1 } }, { $limit: 10 },
    ]),

    PageView.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, eventType: 'pageview', referrer: { $ne: '' } } },
      { $group: { _id: '$referrer', views: { $sum: 1 } } },
      { $sort: { views: -1 } }, { $limit: 10 },
    ]),

    PageView.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, eventType: 'pageview' } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Jerusalem' } },
        views: { $sum: 1 },
        visitors: { $addToSet: '$sessionId' },
      }},
      { $project: { _id: 1, views: 1, visitors: { $size: '$visitors' } } },
      { $sort: { _id: 1 } },
    ]),

    PageView.find({ eventType: 'pageview' }).sort({ createdAt: -1 }).limit(20).select('url referrer createdAt device language -_id'),

    // Device breakdown
    PageView.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, eventType: 'pageview' } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
    ]),

    // Top clicked elements
    PageView.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, eventType: 'click', element: { $ne: '' } } },
      { $group: { _id: '$element', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 10 },
    ]),

    // Conversion funnel
    PageView.distinct('sessionId', { createdAt: { $gte: weekAgo }, eventType: 'pageview', url: '/' }),
    PageView.distinct('sessionId', { createdAt: { $gte: weekAgo }, eventType: 'pageview', url: '/pricing' }),
    PageView.distinct('sessionId', { createdAt: { $gte: weekAgo }, eventType: 'pageview', url: { $in: ['/register', '/login'] } }),
    PageView.distinct('sessionId', { createdAt: { $gte: weekAgo }, eventType: 'pageview', url: { $regex: '^/dashboard' } }),

    // Bounce rate: sessions with only 1 pageview
    PageView.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, eventType: 'pageview' } },
      { $group: { _id: '$sessionId', count: { $sum: 1 } } },
      { $group: { _id: null, total: { $sum: 1 }, bounced: { $sum: { $cond: [{ $eq: ['$count', 1] }, 1, 0] } } } },
    ]),

    // Avg session duration
    PageView.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, eventType: 'session_end', duration: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$duration' } } },
    ]),

    // Top languages
    PageView.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, eventType: 'pageview', language: { $ne: '' } } },
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 8 },
    ]),
  ]);

  const bounceRate = bounceData[0]
    ? Math.round((bounceData[0].bounced / bounceData[0].total) * 100)
    : 0;
  const avgDuration = avgDurationData[0] ? Math.round(avgDurationData[0].avg) : 0;

  res.json({
    active: activeSessions.size,
    today: todayViews,
    week:  weekViews,
    month: monthViews,
    bounceRate,
    avgDuration,
    topPages:     topPages.map(p => ({ page: p._id, views: p.views })),
    topReferrers: topReferrers.map(r => ({ referrer: r._id, views: r.views })),
    topClicks:    topClicks.map(c => ({ element: c._id, count: c.count })),
    topLanguages: topLanguages.map(l => ({ language: l._id, count: l.count })),
    daily,
    recentEvents,
    deviceBreakdown: deviceBreakdown.map(d => ({ device: d._id || 'unknown', count: d.count })),
    funnel: {
      home:      funnelHome.length,
      pricing:   funnelPricing.length,
      register:  funnelRegister.length,
      dashboard: funnelDashboard.length,
    },
  });
});

// GET /api/analytics/realtime (SSE)
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
