import PageView from '../models/PageView.js';

// In-memory active-session tracker (shared across routes)
export const activeSessions = new Map();

export function touchSession(sessionId) {
  if (sessionId) activeSessions.set(sessionId, Date.now());
}

export function cleanSessions() {
  const cutoff = Date.now() - 5 * 60 * 1000;
  for (const [id, ts] of activeSessions) {
    if (ts < cutoff) activeSessions.delete(id);
  }
}

// Build the full analytics stats payload (visitors, funnel, devices, etc.)
export async function getAnalyticsStats() {
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

    PageView.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, eventType: 'pageview' } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
    ]),

    PageView.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, eventType: 'click', element: { $ne: '' } } },
      { $group: { _id: '$element', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 10 },
    ]),

    PageView.distinct('sessionId', { createdAt: { $gte: weekAgo }, eventType: 'pageview', url: '/' }),
    PageView.distinct('sessionId', { createdAt: { $gte: weekAgo }, eventType: 'pageview', url: '/pricing' }),
    PageView.distinct('sessionId', { createdAt: { $gte: weekAgo }, eventType: 'pageview', url: { $in: ['/register', '/login'] } }),
    PageView.distinct('sessionId', { createdAt: { $gte: weekAgo }, eventType: 'pageview', url: { $regex: '^/dashboard' } }),

    PageView.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, eventType: 'pageview' } },
      { $group: { _id: '$sessionId', count: { $sum: 1 } } },
      { $group: { _id: null, total: { $sum: 1 }, bounced: { $sum: { $cond: [{ $eq: ['$count', 1] }, 1, 0] } } } },
    ]),

    PageView.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, eventType: 'session_end', duration: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$duration' } } },
    ]),

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

  return {
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
  };
}
