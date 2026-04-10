import DashboardConfig from '../models/DashboardConfig.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DEFAULT_WIDGETS = [
  { id: 'w1', type: 'stat_counter', config: { metric: 'total_tasks', label: 'Total Tasks' }, position: { x: 0, y: 0, w: 1, h: 1 } },
  { id: 'w2', type: 'stat_counter', config: { metric: 'active_projects', label: 'Active Projects' }, position: { x: 1, y: 0, w: 1, h: 1 } },
  { id: 'w3', type: 'stat_counter', config: { metric: 'overdue_tasks', label: 'Overdue Tasks' }, position: { x: 2, y: 0, w: 1, h: 1 } },
  { id: 'w4', type: 'stat_counter', config: { metric: 'completion_rate', label: 'Completion Rate' }, position: { x: 3, y: 0, w: 1, h: 1 } },
  { id: 'w5', type: 'bar_chart', config: { metric: 'tasks_by_status', label: 'Tasks by Status' }, position: { x: 0, y: 1, w: 2, h: 2 } },
  { id: 'w6', type: 'pie_chart', config: { metric: 'projects_by_status', label: 'Projects by Status' }, position: { x: 2, y: 1, w: 2, h: 2 } },
  { id: 'w7', type: 'ai_insight', config: { label: 'AI Insight' }, position: { x: 0, y: 3, w: 4, h: 1 } },
  { id: 'w8', type: 'task_list', config: { filter: 'overdue', label: 'Overdue Tasks' }, position: { x: 0, y: 4, w: 2, h: 2 } },
  { id: 'w9', type: 'activity_feed', config: { label: 'Recent Activity' }, position: { x: 2, y: 4, w: 2, h: 2 } },
  { id: 'w10', type: 'deadline_list', config: { label: 'Upcoming Deadlines' }, position: { x: 0, y: 6, w: 4, h: 1 } },
];

export const getConfig = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    let config = await DashboardConfig.findOne({ user: req.user._id, organization: orgId });
    if (!config) {
      config = await DashboardConfig.create({ user: req.user._id, organization: orgId, widgets: DEFAULT_WIDGETS });
    }
    res.json({ success: true, data: config });
  } catch (err) { next(err); }
};

export const updateConfig = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const config = await DashboardConfig.findOneAndUpdate(
      { user: req.user._id, organization: orgId },
      { widgets: req.body.widgets },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: config });
  } catch (err) { next(err); }
};

export const getAIInsight = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const [totalTasks, doneTasks, overdueTasks, activeProjects] = await Promise.all([
      Task.countDocuments({ organization: orgId }),
      Task.countDocuments({ organization: orgId, status: 'done' }),
      Task.countDocuments({ organization: orgId, dueDate: { $lt: new Date() }, status: { $nin: ['done'] } }),
      Project.countDocuments({ organization: orgId, status: 'active' }),
    ]);
    const recentDone = await Task.find({ organization: orgId, status: 'done' }).sort({ updatedAt: -1 }).limit(5).select('title updatedAt');
    const blocked = await Task.find({ organization: orgId, status: 'blocked' }).limit(3).select('title');

    const prompt = `You are a project management AI advisor. Write a concise, actionable insight for this team's dashboard.

Stats:
- Total tasks: ${totalTasks}, Completed: ${doneTasks} (${totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0}%)
- Overdue: ${overdueTasks}
- Active projects: ${activeProjects}
- Recently completed: ${recentDone.map(t => t.title).join(', ') || 'none'}
- Blocked tasks: ${blocked.map(t => t.title).join(', ') || 'none'}

Write 2-3 sentences: first acknowledge progress, then highlight the most important thing to focus on today, then one actionable recommendation. Be specific and motivating. No markdown, plain text only.`;

    let insight = '';
    if (process.env.ANTHROPIC_API_KEY) {
      const msg = await client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 200, messages: [{ role: 'user', content: prompt }] });
      insight = msg.content[0].text.trim();
    } else {
      const rate = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0;
      insight = `Your team has completed ${doneTasks} of ${totalTasks} tasks (${rate}% completion rate) across ${activeProjects} active projects. ${overdueTasks > 0 ? `There are ${overdueTasks} overdue tasks that need immediate attention.` : 'Great job keeping tasks on schedule!'} Focus on clearing ${blocked.length > 0 ? `blocked tasks like "${blocked[0].title}"` : 'any bottlenecks'} to maintain momentum.`;
    }
    res.json({ success: true, data: { insight } });
  } catch (err) { next(err); }
};
