import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

    const user = await User.findById(decoded.id).populate('role').populate('department').populate('organization');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export const requireSubscription = (req, res, next) => {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: 'Not authenticated' });

  const org = user.organization;
  const { plan, expiresAt } = org?.subscription || {};

  if (plan !== 'pro') {
    return res.status(403).json({ success: false, code: 'SUBSCRIPTION_REQUIRED', message: 'هذه الميزة متاحة للمشتركين فقط — $20/شهر' });
  }
  if (expiresAt && new Date() > new Date(expiresAt)) {
    return res.status(403).json({ success: false, code: 'SUBSCRIPTION_EXPIRED', message: 'انتهى اشتراك منظمتك، يرجى التجديد' });
  }
  next();
};

export const requirePermission = (resource, action) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    if (user.isAdmin) return next();

    const permissions = user.role?.permissions;
    if (!permissions || !permissions[resource] || !permissions[resource][action]) {
      return res.status(403).json({ success: false, message: `Permission denied: ${resource}:${action}` });
    }
    next();
  };
};
