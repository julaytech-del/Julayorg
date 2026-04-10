import Sprint from '../models/Sprint.js';
import Task from '../models/Task.js';

export const getSprints = async (req, res) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;
    const filter = { organization: orgId };
    if (req.query.project) filter.project = req.query.project;

    const sprints = await Sprint.find(filter)
      .populate('tasks', 'title status priority estimatedHours')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: sprints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createSprint = async (req, res) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;
    const sprint = await Sprint.create({
      ...req.body,
      organization: orgId,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: sprint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getSprint = async (req, res) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;
    const sprint = await Sprint.findOne({ _id: req.params.id, organization: orgId })
      .populate('tasks');

    if (!sprint) return res.status(404).json({ success: false, message: 'Sprint not found' });

    res.json({ success: true, data: sprint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateSprint = async (req, res) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;
    const sprint = await Sprint.findOne({ _id: req.params.id, organization: orgId });
    if (!sprint) return res.status(404).json({ success: false, message: 'Sprint not found' });

    // If setting to active, complete any other active sprint for same project
    if (req.body.status === 'active' && sprint.status !== 'active') {
      await Sprint.updateMany(
        { project: sprint.project, organization: orgId, status: 'active', _id: { $ne: sprint._id } },
        { $set: { status: 'completed' } }
      );
    }

    Object.assign(sprint, req.body);
    await sprint.save();

    res.json({ success: true, data: sprint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteSprint = async (req, res) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;
    const sprint = await Sprint.findOneAndDelete({ _id: req.params.id, organization: orgId });
    if (!sprint) return res.status(404).json({ success: false, message: 'Sprint not found' });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addTaskToSprint = async (req, res) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;
    const { taskId } = req.body;

    const sprint = await Sprint.findOne({ _id: req.params.id, organization: orgId });
    if (!sprint) return res.status(404).json({ success: false, message: 'Sprint not found' });

    if (!sprint.tasks.map(t => t.toString()).includes(taskId)) {
      sprint.tasks.push(taskId);
      await sprint.save();
    }

    res.json({ success: true, data: sprint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const removeTaskFromSprint = async (req, res) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;
    const sprint = await Sprint.findOneAndUpdate(
      { _id: req.params.id, organization: orgId },
      { $pull: { tasks: req.params.taskId } },
      { new: true }
    );
    if (!sprint) return res.status(404).json({ success: false, message: 'Sprint not found' });
    res.json({ success: true, data: sprint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getSprintBurndown = async (req, res) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;
    const sprint = await Sprint.findOne({ _id: req.params.id, organization: orgId })
      .populate('tasks', 'status completedAt estimatedHours');

    if (!sprint) return res.status(404).json({ success: false, message: 'Sprint not found' });

    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const totalMs = end - start;
    const totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24)) || 1;
    const capacity = sprint.capacity || sprint.tasks.length;

    const burndown = [];

    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const planned = Math.round(capacity * (1 - i / totalDays));

      const completedByDay = sprint.tasks.filter(t =>
        t.status === 'done' && t.completedAt && new Date(t.completedAt) <= dayEnd
      ).length;

      const actual = capacity - completedByDay;

      burndown.push({
        date: date.toISOString().split('T')[0],
        planned,
        actual
      });
    }

    res.json({ success: true, data: burndown });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
