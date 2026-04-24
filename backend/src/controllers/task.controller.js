import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Goal from '../models/Goal.js';
import ActivityLog from '../models/ActivityLog.js';
import Organization from '../models/Organization.js';
import { notifyTaskCreated, notifyTaskCompleted } from '../services/slack.service.js';
import { sendTaskAssigned } from '../services/email.service.js';

const triggerSlack = async (orgId, type, task, projectName, userName) => {
  try {
    const org = await Organization.findById(orgId).select('integrations');
    const url = org?.integrations?.slackWebhookUrl;
    const notify = org?.integrations?.slackNotifyOn || {};
    if (!url) return;
    if (type === 'created' && notify.taskCreated) await notifyTaskCreated(url, task, projectName, userName);
    if (type === 'completed' && notify.taskCompleted) await notifyTaskCompleted(url, task, projectName, userName);
  } catch {}
};

const recalcProjectProgress = async (projectId) => {
  const tasks = await Task.find({ project: projectId });
  if (!tasks.length) return;
  const done = tasks.filter(t => t.status === 'done').length;
  const percentage = Math.round((done / tasks.length) * 100);
  await Project.findByIdAndUpdate(projectId, { 'progress.percentage': percentage, 'progress.completedTasks': done, 'progress.totalTasks': tasks.length });
};

const recalcGoalProgress = async (goalId) => {
  if (!goalId) return;
  const tasks = await Task.find({ goal: goalId });
  if (!tasks.length) return;
  const done = tasks.filter(t => t.status === 'done').length;
  const progress = Math.round((done / tasks.length) * 100);
  const status = done === tasks.length ? 'completed' : tasks.some(t => t.status === 'in_progress') ? 'in_progress' : 'not_started';
  await Goal.findByIdAndUpdate(goalId, { progress, status });
};

export const getTasks = async (req, res, next) => {
  try {
    const { projectId, goalId, status, assignee, priority, type, search } = req.query;
    const filter = {};
    if (projectId) filter.project = projectId;
    if (goalId) filter.goal = goalId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;
    if (assignee) filter.assignees = assignee;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(filter)
      .populate('assignees', 'name avatar email jobTitle')
      .populate('reporter', 'name avatar')
      .populate('goal', 'title')
      .populate('project', 'name color')
      .sort({ position: 1, createdAt: -1 });

    res.json({ success: true, data: tasks });
  } catch (err) { next(err); }
};

export const createTask = async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user._id });
    if (task.project) {
      await recalcProjectProgress(task.project);
      await Project.findByIdAndUpdate(task.project, { $inc: { 'progress.totalTasks': 1 } });
    }
    if (task.goal) await recalcGoalProgress(task.goal);
    const orgId = req.user.organization._id || req.user.organization;
    await ActivityLog.create({ organization: orgId, user: req.user._id, userName: req.user.name, action: 'created', entityType: 'task', entityId: task._id, entityName: task.title });
    const project = await Project.findById(task.project).select('name');
    triggerSlack(orgId, 'created', task, project?.name || '', req.user.name);
    res.status(201).json({ success: true, data: task });
  } catch (err) { next(err); }
};

export const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name avatar email jobTitle skills')
      .populate('reporter', 'name avatar')
      .populate('goal', 'title color')
      .populate('project', 'name color status')
      .populate('comments.author', 'name avatar')
      .populate('subtasks.assignee', 'name avatar')
      .populate('dependencies', 'title status');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) { next(err); }
};

export const updateTask = async (req, res, next) => {
  try {
    const oldTask = await Task.findById(req.params.id);
    if (!oldTask) return res.status(404).json({ success: false, message: 'Task not found' });

    const updates = { ...req.body };
    if (updates.status === 'done' && oldTask.status !== 'done') updates.completedAt = new Date();
    if (updates.status !== 'done' && oldTask.status === 'done') updates.completedAt = null;

    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('assignees', 'name avatar email');

    if (task.project) await recalcProjectProgress(task.project);
    if (task.goal) await recalcGoalProgress(task.goal);

    const orgId = req.user.organization._id || req.user.organization;
    if (oldTask.status !== task.status) {
      await ActivityLog.create({ organization: orgId, user: req.user._id, userName: req.user.name, action: 'status_changed', entityType: 'task', entityId: task._id, entityName: task.title, changes: { before: { status: oldTask.status }, after: { status: task.status } } });
      if (task.status === 'done') {
        const project = await Project.findById(task.project).select('name');
        triggerSlack(orgId, 'completed', task, project?.name || '', req.user.name);
      }
    }

    res.json({ success: true, data: task });
  } catch (err) { next(err); }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const { project, goal } = task;
    await task.deleteOne();
    if (project) await recalcProjectProgress(project);
    if (goal) await recalcGoalProgress(goal);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) { next(err); }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const updates = { status };
    if (status === 'done') updates.completedAt = new Date();
    if (status !== 'done') updates.completedAt = null;

    await task.updateOne(updates);
    if (task.project) await recalcProjectProgress(task.project);
    if (task.goal) await recalcGoalProgress(task.goal);

    const orgId = req.user.organization._id || req.user.organization;
    await ActivityLog.create({ organization: orgId, user: req.user._id, userName: req.user.name, action: 'status_changed', entityType: 'task', entityId: task._id, entityName: task.title, changes: { before: { status: task.status }, after: { status } } });

    res.json({ success: true, data: { ...task.toObject(), status } });
  } catch (err) { next(err); }
};

export const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { author: req.user._id, content, createdAt: new Date() } } },
      { new: true }
    ).populate('comments.author', 'name avatar');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const orgId = req.user.organization._id || req.user.organization;
    await ActivityLog.create({ organization: orgId, user: req.user._id, userName: req.user.name, action: 'commented', entityType: 'task', entityId: task._id, entityName: task.title });
    res.json({ success: true, data: task.comments });
  } catch (err) { next(err); }
};

export const addSubtask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $push: { subtasks: req.body } },
      { new: true }
    ).populate('subtasks.assignee', 'name avatar');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task.subtasks });
  } catch (err) { next(err); }
};

export const updateSubtask = async (req, res, next) => {
  try {
    const { taskId, subtaskId } = req.params;
    const updates = {};
    for (const [k, v] of Object.entries(req.body)) {
      updates[`subtasks.$.${k}`] = v;
    }
    if (req.body.status === 'done') updates['subtasks.$.completedAt'] = new Date();

    const task = await Task.findOneAndUpdate(
      { _id: taskId, 'subtasks._id': subtaskId },
      { $set: updates },
      { new: true }
    );
    if (!task) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: task.subtasks });
  } catch (err) { next(err); }
};

export const reorderTasks = async (req, res, next) => {
  try {
    const { tasks } = req.body;
    const bulkOps = tasks.map(({ id, position, status }) => ({
      updateOne: { filter: { _id: id }, update: { position, ...(status && { status }) } }
    }));
    await Task.bulkWrite(bulkOps);

    if (tasks.length > 0) {
      const sampleTask = await Task.findById(tasks[0].id);
      if (sampleTask?.project) await recalcProjectProgress(sampleTask.project);
    }

    res.json({ success: true, message: 'Tasks reordered' });
  } catch (err) { next(err); }
};
