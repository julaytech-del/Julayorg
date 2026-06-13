import User from '../models/User.js';
import Task from '../models/Task.js';
import Role from '../models/Role.js';
import Department from '../models/Department.js';

export const getUsers = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const { department, status, search } = req.query;
    const filter = { organization: orgId };
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const users = await User.find(filter).populate('role', 'name level').populate('department', 'name color');
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

export const getUser = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const user = await User.findOne({ _id: req.params.id, organization: orgId }).populate('role', 'name level permissions').populate('department', 'name color icon');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [assignedTasks, completedTasks, overdueTasks] = await Promise.all([
      Task.countDocuments({ assignees: user._id }),
      Task.countDocuments({ assignees: user._id, status: 'done' }),
      Task.countDocuments({ assignees: user._id, dueDate: { $lt: new Date() }, status: { $ne: 'done' } })
    ]);

    const currentTasks = await Task.find({ assignees: user._id, status: { $in: ['in_progress', 'planned'] } })
      .populate('project', 'name color').limit(5).sort({ dueDate: 1 });

    res.json({ success: true, data: { ...user.toObject(), stats: { assignedTasks, completedTasks, overdueTasks }, currentTasks } });
  } catch (err) { next(err); }
};

export const updateUser = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const { password, email, isAdmin, roleLevel, organization, ...updates } = req.body;
    if (roleLevel) {
      const role = await Role.findOne({ organization: orgId, level: roleLevel });
      if (role) {
        updates.role = role._id;
        updates.isAdmin = roleLevel === 'admin';
      }
    }
    const user = await User.findOneAndUpdate({ _id: req.params.id, organization: orgId }, updates, { new: true, runValidators: true })
      .populate('role', 'name level').populate('department', 'name color');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

export const deleteUser = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const user = await User.findOne({ _id: req.params.id, organization: orgId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    await user.deleteOne();
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { next(err); }
};

export const addExistingUser = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email' });

    if (user.organization?.toString() === orgId.toString()) {
      return res.status(409).json({ success: false, message: 'This user is already in your organization' });
    }

    // Move user to this org with member role
    const memberRole = await Role.findOne({ organization: orgId, level: 'member' });
    const defaultDept = await Department.findOne({ organization: orgId, isDefault: true })
      || await Department.findOne({ organization: orgId });

    await User.findByIdAndUpdate(user._id, {
      organization: orgId,
      role: memberRole?._id,
      department: defaultDept?._id,
    });

    const populated = await User.findById(user._id).populate('role', 'name level').populate('department', 'name color');
    res.json({ success: true, data: populated });
  } catch (err) { next(err); }
};

export const getRoles = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const roles = await Role.find({ organization: orgId }).select('name level permissions isDefault').sort({ level: 1 });
    res.json({ success: true, data: roles });
  } catch (err) { next(err); }
};

export const createMember = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const { name, email, password, jobTitle, department: deptId, roleLevel } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

    // Find role by level (default: member)
    const role = await Role.findOne({ organization: orgId, level: roleLevel || 'member' });

    // Use provided dept, or org default dept, or first dept
    const dept = deptId ||
      (await Department.findOne({ organization: orgId, isDefault: true }))?._id ||
      (await Department.findOne({ organization: orgId }))?._id;

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      jobTitle: jobTitle || '',
      organization: orgId,
      role: role?._id,
      department: dept,
      status: 'active',
    });

    const populated = await User.findById(user._id).populate('role', 'name level').populate('department', 'name color');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('role', 'name level permissions').populate('department', 'name color');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

export const updateMe = async (req, res, next) => {
  try {
    const { password, email, isAdmin, organization, ...updates } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
      .populate('role', 'name level').populate('department', 'name color');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};
