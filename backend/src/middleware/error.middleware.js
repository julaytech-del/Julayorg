import { notifyOwner } from '../services/notify.service.js';

// Throttle server-error alerts: at most 1 per 60s for the same route+message,
// so a recurring crash doesn't flood the owner with hundreds of pings.
const recentAlerts = new Map();
function shouldAlert(key) {
  const now = Date.now();
  const last = recentAlerts.get(key) || 0;
  if (now - last < 60 * 1000) return false;
  recentAlerts.set(key, now);
  if (recentAlerts.size > 200) {
    for (const [k, t] of recentAlerts) if (now - t > 5 * 60 * 1000) recentAlerts.delete(k);
  }
  return true;
}

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: 'Validation error', errors });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid ${err.path}: ${err.value}` });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  const status = err.statusCode || err.status || 500;

  // Alert the owner only on real server errors (5xx), throttled.
  if (status >= 500) {
    const key = `${req.method} ${req.originalUrl}:${err.message}`;
    if (shouldAlert(key)) {
      notifyOwner({
        emoji: '🔥',
        title: 'Server error (app crash)',
        fields: { Route: `${req.method} ${req.originalUrl}`, Error: err.message },
      });
    }
  }

  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};

export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};
