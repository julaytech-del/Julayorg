import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const now = new Date();

    const [projects, tasks, users, recentActivity, upcomingDeadlines] = await Promise.all([
      Project.find({ organization: orgId }),
      Task.find({ project: { $in: (await Project.find({ organization: orgId }, '_id')).map(p => p._id) } }).populate('assignees', 'name avatar'),
      User.find({ organization: orgId }),
      ActivityLog.find({ organization: orgId }).sort({ timestamp: -1 }).limit(15).populate('user', 'name avatar'),
      Task.find({
        project: { $in: (await Project.find({ organization: orgId }, '_id')).map(p => p._id) },
        dueDate: { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
        status: { $ne: 'done' }
      }).sort({ dueDate: 1 }).limit(10).populate('assignees', 'name avatar').populate('project', 'name')
    ]);

    const overdueProjects = projects.filter(p => p.endDate && new Date(p.endDate) < now && p.status !== 'completed').length;
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length;

    const completionRate = tasks.length > 0
      ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
      : 0;

    const tasksByStatus = {
      planned: tasks.filter(t => t.status === 'planned').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length
    };

    const projectsByStatus = {
      planning: projects.filter(p => p.status === 'planning').length,
      active: projects.filter(p => p.status === 'active').length,
      on_hold: projects.filter(p => p.status === 'on_hold').length,
      completed: projects.filter(p => p.status === 'completed').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length
    };

    res.json({
      success: true,
      data: {
        projects: { total: projects.length, active: projects.filter(p => p.status === 'active').length, completed: projects.filter(p => p.status === 'completed').length, overdue: overdueProjects, byStatus: projectsByStatus },
        tasks: { total: tasks.length, completed: tasksByStatus.done, inProgress: tasksByStatus.in_progress, blocked: tasksByStatus.blocked, overdue: overdueTasks, byStatus: tasksByStatus },
        team: { total: users.length, active: users.filter(u => u.status === 'active').length, busy: users.filter(u => u.status === 'busy').length },
        completionRate,
        recentActivity,
        upcomingDeadlines,
        recentProjects: projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getActivityFeed = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [activity, total] = await Promise.all([
      ActivityLog.find({ organization: orgId }).sort({ timestamp: -1 }).skip(skip).limit(limit).populate('user', 'name avatar'),
      ActivityLog.countDocuments({ organization: orgId })
    ]);

    res.json({ success: true, data: { activity, total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};
