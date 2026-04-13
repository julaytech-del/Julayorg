import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Role from '../models/Role.js';
import Department from '../models/Department.js';
import Invite from '../models/Invite.js';
import OTP from '../models/OTP.js';
import { sendOTPEmail } from '../utils/email.js';

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

export const createInvite = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'User with this email already exists' });

    // Invalidate any previous unused invite for same email in this org
    await Invite.deleteMany({ email, organization: req.user.organization, used: false });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await Invite.create({
      email,
      organization: req.user.organization,
      createdBy: req.user._id,
      token,
      expiresAt,
    });

    const baseUrl = process.env.FRONTEND_URL || 'https://julay.org';
    const inviteLink = `${baseUrl}/accept-invite/${token}`;

    res.status(201).json({ success: true, data: { inviteLink, email, expiresAt } });
  } catch (err) {
    next(err);
  }
};

export const getInviteInfo = async (req, res, next) => {
  try {
    const { token } = req.params;
    const invite = await Invite.findOne({ token, used: false }).populate('organization', 'name industry');
    if (!invite) return res.status(404).json({ success: false, message: 'Invite link is invalid or has expired' });
    if (invite.expiresAt < new Date()) return res.status(410).json({ success: false, message: 'Invite link has expired' });

    res.json({ success: true, data: { email: invite.email, organization: invite.organization } });
  } catch (err) {
    next(err);
  }
};

export const acceptInvite = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { name, password } = req.body;
    if (!name || !password) return res.status(400).json({ success: false, message: 'Name and password are required' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const invite = await Invite.findOne({ token, used: false }).populate('organization');
    if (!invite) return res.status(404).json({ success: false, message: 'Invite link is invalid or has expired' });
    if (invite.expiresAt < new Date()) return res.status(410).json({ success: false, message: 'Invite link has expired' });

    const existing = await User.findOne({ email: invite.email });
    if (existing) return res.status(409).json({ success: false, message: 'An account with this email already exists' });

    // Get member role for this org
    const memberRole = await Role.findOne({ organization: invite.organization._id, level: 'member' });
    const defaultDept = await Department.findOne({ organization: invite.organization._id });

    const user = await User.create({
      name,
      email: invite.email,
      password,
      organization: invite.organization._id,
      role: memberRole?._id,
      department: defaultDept?._id,
      jobTitle: 'Team Member',
    });

    invite.used = true;
    invite.usedAt = new Date();
    await invite.save();

    const jwtToken = signToken(user._id);
    const userData = await User.findById(user._id).populate('role').populate('department').populate('organization');

    res.status(201).json({ success: true, data: { token: jwtToken, user: userData } });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Current and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
};

// ── OTP Auth ────────────────────────────────────────────────────────────────

export const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    const code = await OTP.generate(email.toLowerCase().trim());
    await sendOTPEmail(email.toLowerCase().trim(), code);
    res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (err) { next(err); }
};

export const verifyOTPLogin = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ success: false, message: 'Email and code are required' });
    const valid = await OTP.verify(email.toLowerCase().trim(), code.trim());
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid or expired code' });

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('role').populate('department').populate('organization');
    if (!user) return res.status(404).json({ success: false, message: 'No account found. Please register first.' });

    await User.findByIdAndUpdate(user._id, { lastActive: new Date() });
    const token = signToken(user._id);
    res.json({ success: true, data: { token, user: user.toJSON() } });
  } catch (err) { next(err); }
};

export const verifyOTPRegister = async (req, res, next) => {
  try {
    const { email, code, name, organizationName, industry } = req.body;
    if (!email || !code || !name) return res.status(400).json({ success: false, message: 'Email, code and name are required' });
    const valid = await OTP.verify(email.toLowerCase().trim(), code.trim());
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid or expired code' });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered. Please log in.' });

    const org = await Organization.create({ name: organizationName || `${name}'s Organization`, industry: industry || 'technology' });
    const roles = await createDefaultRoles(org._id);
    const adminRole = roles.find(r => r.level === 'admin');
    const dept = await Department.create({ name: 'General', organization: org._id, description: 'Default department', color: '#6366F1' });

    // Random password for OTP-registered users (they can set one later)
    const randomPass = crypto.randomBytes(20).toString('hex');
    const user = await User.create({ name, email: email.toLowerCase().trim(), password: randomPass, organization: org._id, role: adminRole._id, department: dept._id, isAdmin: true, jobTitle: 'Administrator' });

    const token = signToken(user._id);
    const userData = await User.findById(user._id).populate('role').populate('department');
    res.status(201).json({ success: true, data: { token, user: userData } });
  } catch (err) { next(err); }
};
