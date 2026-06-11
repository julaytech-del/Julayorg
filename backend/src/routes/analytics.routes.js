import { Router } from 'express';
import PageView from '../models/PageView.js';
import { activeSessions, touchSession, cleanSessions, getAnalyticsStats } from '../services/analytics.service.js';

const router = Router();

const BOT_PATTERNS = /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|bingpreview/i;

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

    touchSession(sessionId);

    await PageView.create({ url, referrer: referrer || '', sessionId, ip, userAgent: ua, eventType, element, device, language, duration, scrollDepth });
    res.status(204).end();
  } catch {
    res.status(204).end();
  }
});

// GET /api/analytics/stats — key-protected (standalone dashboard)
router.get('/stats', async (req, res) => {
  if (!checkKey(req, res)) return;
  try {
    res.json(await getAnalyticsStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
