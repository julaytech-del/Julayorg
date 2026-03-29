import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Role from '../models/Role.js';
import Department from '../models/Department.js';

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret', {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
});

const createDefaultRoles = async (orgId) => {
  const roles = [
    { name: 'Admin', level: 'admin', isDefault: true, permissions: { projects: { create: true, read: true, update: true, delete: true }, tasks: { create: true, read: true, update: true, delete: true, assign: true }, users: { create: true, read: true, update: true, delete: true }, departments: { create: true, read: true, update: true, delete: true }, ai: { use: true, configure: true }, reports: { view: true, export: true } } },
    { name: 'Manager', level: 'manager', permissions: { projects: { create: true, read: true, update: true, delete: false }, tasks: { create: true, read: true, update: true, delete: true, assign: true }, users: { create: false, read: true, update: true, delete: false }, departments: { create: false, read: true, update: true, delete: false }, ai: { use: true, configure: false }, reports: { view: true, export: true } } },
    { name: 'Lead', level: 'lead', permissions: { projects: { create: false, read: true, update: true, delete: false }, tasks: { create: true, read: true, update: true, delete: false, assign: true }, users: { create: false, read: true, update: false, delete: false }, departments: { create: false, read: true, update: false, delete: false }, ai: { use: true, configure: false }, reports: { view: true, export: false } } },
    { name: 'Member', level: 'member', permissions: { projects: { create: false, read: true, update: false, delete: false }, tasks: { create: true, read: true, update: true, delete: false, assign: false }, users: { create: false, read: true, update: false, delete: false }, departments: { create: false, read: true, update: false, delete: false }, ai: { use: false, configure: false }, reports: { view: false, export: false } } },
    { name: 'Viewer', level: 'viewer', permissions: { projects: { create: false, read: true, update: false, delete: false }, tasks: { create: false, read: true, update: false, delete: false, assign: false }, users: { create: false, read: true, update: false, delete: false }, departments: { create: false, read: true, update: false, delete: false }, ai: { use: false, configure: false }, reports: { view: true, export: false } } }
  ];

  return Role.insertMany(roles.map(r => ({ ...r, organization: orgId })));
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, organizationName, industry } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

    const org = await Organization.create({ name: organizationName || `${name}'s Organization`, industry: industry || 'technology' });
    const roles = await createDefaultRoles(org._id);
    const adminRole = roles.find(r => r.level === 'admin');

    const dept = await Department.create({ name: 'General', organization: org._id, description: 'Default department', color: '#6366F1' });

    const user = await User.create({ name, email, password, organization: org._id, role: adminRole._id, department: dept._id, isAdmin: true, jobTitle: 'Administrator' });

    const token = signToken(user._id);
    const userData = await User.findById(user._id).populate('role').populate('department');

    res.status(201).json({ success: true, data: { token, user: userData } });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password').populate('role').populate('department').populate('organization');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await User.findByIdAndUpdate(user._id, { lastActive: new Date() });

    const token = signToken(user._id);
    const userObj = user.toJSON();

    res.json({ success: true, data: { token, user: userObj } });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('role').populate('department').populate('organization');
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
