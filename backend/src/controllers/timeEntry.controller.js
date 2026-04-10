import TimeEntry from '../models/TimeEntry.js';

export const getTimeEntries = async (req, res) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;
    const filter = { organization: orgId };
    if (req.query.taskId) filter.task = req.query.taskId;

    const entries = await TimeEntry.find(filter)
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createTimeEntry = async (req, res) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;
    const entry = await TimeEntry.create({
      ...req.body,
      user: req.user._id,
      organization: orgId
    });
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateTimeEntry = async (req, res) => {
  try {
    const entry = await TimeEntry.findOne({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ success: false, message: 'Time entry not found or not yours' });

    Object.assign(entry, req.body);
    await entry.save();

    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteTimeEntry = async (req, res) => {
  try {
    const entry = await TimeEntry.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ success: false, message: 'Time entry not found or not yours' });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyTimeReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const orgId = req.user.organization?._id || req.user.organization;

    const filter = { user: req.user._id, organization: orgId };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const entries = await TimeEntry.find(filter)
      .populate('task', 'title project')
      .sort({ createdAt: -1 });

    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const billableMinutes = entries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration || 0), 0);

    // Group by task
    const byTask = {};
    for (const entry of entries) {
      const key = entry.task?._id?.toString() || 'unknown';
      if (!byTask[key]) {
        byTask[key] = {
          task: entry.task,
          entries: [],
          totalMinutes: 0,
          billableMinutes: 0
        };
      }
      byTask[key].entries.push(entry);
      byTask[key].totalMinutes += entry.duration || 0;
      if (entry.billable) byTask[key].billableMinutes += entry.duration || 0;
    }

    res.json({
      success: true,
      data: {
        totalMinutes,
        billableMinutes,
        entriesByTask: Object.values(byTask)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
