import User from '../models/User.js';
import Task from '../models/Task.js';

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
    const user = await User.findById(req.params.id).populate('role', 'name level permissions').populate('department', 'name color icon');
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
    const { password, email, isAdmin, ...updates } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('role', 'name level').populate('department', 'name color');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    await user.deleteOne();
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { next(err); }
};
