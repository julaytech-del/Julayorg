import Task from '../models/Task.js';
import Project from '../models/Project.js';

export const globalSearch = async (req, res) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;
    const q = req.query.q?.trim();

    if (!q) return res.json({ success: true, data: { tasks: [], projects: [], total: 0 } });

    const regex = { $regex: q, $options: 'i' };

    const [tasks, projects] = await Promise.all([
      Task.find({
        $and: [
          { project: { $exists: true } },
          { $or: [{ title: regex }, { description: regex }] }
        ]
      })
        .populate('project', 'name organization')
        .populate('assignees', 'name avatar')
        .limit(20)
        .lean(),

      Project.find({
        organization: orgId,
        $or: [{ name: regex }, { description: regex }]
      })
        .limit(5)
        .lean()
    ]);

    // Filter tasks to org scope via populated project.organization
    const orgTasks = tasks
      .filter(t => t.project?.organization?.toString() === orgId.toString())
      .slice(0, 5);

    const total = orgTasks.length + projects.length;

    res.json({ success: true, data: { tasks: orgTasks, projects, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
