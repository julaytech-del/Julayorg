import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Goal from '../models/Goal.js';
import Task from '../models/Task.js';
import ActivityLog from '../models/ActivityLog.js';

const logActivity = async (orgId, userId, userName, action, entityType, entity) => {
  try {
    await ActivityLog.create({ organization: orgId, user: userId, userName, action, entityType, entityId: entity._id, entityName: entity.name || entity.title });
  } catch (e) { console.error('Activity log error:', e.message); }
};

export const getProjects = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const { status, search, priority } = req.query;
    const filter = { organization: orgId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const projects = await Project.find(filter)
      .populate('team.user', 'name avatar email jobTitle')
      .populate('departments', 'name color')
      .populate('createdBy', 'name')
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: projects });
  } catch (err) { next(err); }
};

export const createProject = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const project = await Project.create({ ...req.body, organization: orgId, createdBy: req.user._id });
    await logActivity(orgId, req.user._id, req.user.name, 'created', 'project', project);
    res.status(201).json({ success: true, data: project });
  } catch (err) { next(err); }
};

export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('team.user', 'name avatar email jobTitle skills')
      .populate('departments', 'name color icon')
      .populate('createdBy', 'name');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const goals = await Goal.find({ project: project._id }).sort({ order: 1 }).populate('assignees', 'name avatar');
    const taskCounts = await Task.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({ success: true, data: { ...project.toObject(), goals, taskCounts } });
  } catch (err) { next(err); }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('team.user', 'name avatar email');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const orgId = req.user.organization._id || req.user.organization;
    await logActivity(orgId, req.user._id, req.user.name, 'updated', 'project', project);
    res.json({ success: true, data: project });
  } catch (err) { next(err); }
};

export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    await Promise.all([
      Task.deleteMany({ project: project._id }),
      Goal.deleteMany({ project: project._id }),
      project.deleteOne()
    ]);
    const orgId = req.user.organization._id || req.user.organization;
    await logActivity(orgId, req.user._id, req.user.name, 'deleted', 'project', project);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) { next(err); }
};

export const getProjectStats = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const tasks = await Task.find({ project: projectId });
    const now = new Date();

    const byStatus = tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});
    const byPriority = tasks.reduce((acc, t) => { acc[t.priority] = (acc[t.priority] || 0) + 1; return acc; }, {});
    const byType = tasks.reduce((acc, t) => { acc[t.type] = (acc[t.type] || 0) + 1; return acc; }, {});
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length;
    const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const completedHours = tasks.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    res.json({ success: true, data: { total: tasks.length, byStatus, byPriority, byType, overdue, totalHours, completedHours } });
  } catch (err) { next(err); }
};

// Goals CRUD
export const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ project: req.params.id }).sort({ order: 1 }).populate('assignees', 'name avatar');
    const tasksPerGoal = await Task.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(req.params.id) } },
      { $group: { _id: '$goal', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } }
    ]);
    const taskMap = tasksPerGoal.reduce((m, t) => { m[t._id?.toString()] = t; return m; }, {});
    const goalsWithCounts = goals.map(g => ({ ...g.toObject(), taskCount: taskMap[g._id.toString()]?.total || 0, completedCount: taskMap[g._id.toString()]?.done || 0 }));
    res.json({ success: true, data: goalsWithCounts });
  } catch (err) { next(err); }
};

export const createGoal = async (req, res, next) => {
  try {
    const goal = await Goal.create({ ...req.body, project: req.params.id });
    res.status(201).json({ success: true, data: goal });
  } catch (err) { next(err); }
};

export const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findByIdAndUpdate(req.params.goalId, req.body, { new: true });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.json({ success: true, data: goal });
  } catch (err) { next(err); }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.goalId);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    await Task.updateMany({ goal: goal._id }, { $unset: { goal: 1 } });
    await goal.deleteOne();
    res.json({ success: true, message: 'Goal deleted' });
  } catch (err) { next(err); }
};
