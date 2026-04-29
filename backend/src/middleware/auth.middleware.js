import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, jwtSecret);

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

  const paidPlans = ['starter', 'professional', 'business', 'enterprise'];
  if (!paidPlans.includes(plan)) {
    return res.status(403).json({ success: false, code: 'SUBSCRIPTION_REQUIRED', message: 'This feature requires a paid plan. Upgrade to unlock AI features.' });
  }
  if (expiresAt && new Date() > new Date(expiresAt)) {
    return res.status(403).json({ success: false, code: 'SUBSCRIPTION_EXPIRED', message: 'Your organization subscription has expired. Please renew to continue.' });
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
