import Project from '../models/Project.js';
import Task from '../models/Task.js';

const computeHealthScore = (taskStats) => {
  const { total, overdue, blocked } = taskStats;
  if (total === 0) return 'on_track';
  if (blocked > 0) return 'off_track';
  if (total > 0 && overdue / total > 0.2) return 'at_risk';
  return 'on_track';
};

export const getPortfolio = async (req, res) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;

    const projects = await Project.find({ organization: orgId })
      .populate('team.user', 'name avatar')
      .sort({ updatedAt: -1 })
      .lean();

    const now = new Date();

    const enriched = await Promise.all(projects.map(async (project) => {
      const allTasks = await Task.find({ project: project._id }).select('status dueDate').lean();

      const taskCounts = {
        total: allTasks.length,
        planned: allTasks.filter(t => t.status === 'planned').length,
        in_progress: allTasks.filter(t => t.status === 'in_progress').length,
        blocked: allTasks.filter(t => t.status === 'blocked').length,
        review: allTasks.filter(t => t.status === 'review').length,
        done: allTasks.filter(t => t.status === 'done').length,
        overdue: allTasks.filter(t =>
          t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
        ).length
      };

      const completionPercentage = taskCounts.total > 0
        ? Math.round((taskCounts.done / taskCounts.total) * 100)
        : 0;

      const health = computeHealthScore({
        total: taskCounts.total,
        overdue: taskCounts.overdue,
        blocked: taskCounts.blocked
      });

      return {
        ...project,
        taskCounts,
        completionPercentage,
        health
      };
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
