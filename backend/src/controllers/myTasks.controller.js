import Task from '../models/Task.js';
import TimeEntry from '../models/TimeEntry.js';

export const getMyTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, priority, dueFilter } = req.query;
    const now = new Date();

    const filter = { assignees: userId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    if (dueFilter) {
      if (dueFilter === 'overdue') {
        filter.dueDate = { $lt: now };
        filter.status = { $ne: 'done' };
      } else if (dueFilter === 'today') {
        const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
        filter.dueDate = { $gte: todayStart, $lte: todayEnd };
      } else if (dueFilter === 'week') {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + 7);
        filter.dueDate = { $gte: now, $lte: weekEnd };
      } else if (dueFilter === 'upcoming') {
        filter.dueDate = { $gte: now };
      }
    }

    const tasks = await Task.find(filter)
      .populate('project', 'name color')
      .sort({ dueDate: 1 });

    // Compute counts
    const allMyTasks = await Task.find({ assignees: userId }).select('status dueDate');
    const nowForCount = new Date();
    const counts = {
      total: allMyTasks.length,
      todo: allMyTasks.filter(t => t.status === 'planned').length,
      in_progress: allMyTasks.filter(t => t.status === 'in_progress').length,
      done: allMyTasks.filter(t => t.status === 'done').length,
      overdue: allMyTasks.filter(t => t.dueDate && new Date(t.dueDate) < nowForCount && t.status !== 'done').length
    };

    res.json({ success: true, data: { tasks, counts } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organization?._id || req.user.organization;
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const [tasksCompleted, hoursEntries, overdueTasks, upcomingDeadlines] = await Promise.all([
      Task.countDocuments({
        assignees: userId,
        status: 'done',
        completedAt: { $gte: thirtyDaysAgo }
      }),
      TimeEntry.find({
        user: userId,
        organization: orgId,
        createdAt: { $gte: thirtyDaysAgo }
      }).select('duration'),
      Task.countDocuments({
        assignees: userId,
        status: { $ne: 'done' },
        dueDate: { $lt: now }
      }),
      Task.countDocuments({
        assignees: userId,
        status: { $ne: 'done' },
        dueDate: { $gte: now, $lte: sevenDaysLater }
      })
    ]);

    const hoursLogged = Math.round(
      hoursEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / 60 * 10
    ) / 10;

    res.json({
      success: true,
      data: {
        tasksCompleted,
        hoursLogged,
        overdueTasks,
        upcomingDeadlines
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
