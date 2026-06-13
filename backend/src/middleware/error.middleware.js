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

function fireServerErrorAlert(req, message) {
  const key = `${req.method} ${req.originalUrl}:${message}`;
  if (!shouldAlert(key)) return;
  notifyOwner({
    emoji: '🔥',
    title: 'Server error on the site',
    fields: { Route: `${req.method} ${req.originalUrl}`, Error: message || 'Unknown error' },
  });
}

// Global safety net: intercept ANY response and alert the owner on a 5xx,
// no matter which route produced it (direct res.status(500), thrown error, etc.).
export const alertOn5xx = (req, res, next) => {
  const origJson = res.json.bind(res);
  const origSend = res.send.bind(res);
  let alerted = false;
  const maybeAlert = (body) => {
    if (alerted || res.statusCode < 500) return;
    alerted = true;
    const message = (body && typeof body === 'object' && body.message) ? body.message : `HTTP ${res.statusCode}`;
    fireServerErrorAlert(req, message);
  };
  res.json = (body) => { maybeAlert(body); return origJson(body); };
  res.send = (body) => { maybeAlert(body); return origSend(body); };
  next();
};

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
  // 5xx alerting is handled centrally by alertOn5xx (intercepts this res.json call).
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};

export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};
