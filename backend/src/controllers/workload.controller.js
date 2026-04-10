import Task from '../models/Task.js';
import User from '../models/User.js';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const getWorkload = async (req, res, next) => {
  try {
    const { start, end, projectId } = req.query;
    const orgId = req.user.organization._id || req.user.organization;
    const startDate = start ? new Date(start) : new Date(Date.now() - 7 * 86400000);
    const endDate = end ? new Date(end) : new Date(Date.now() + 7 * 86400000);

    const taskFilter = { organization: orgId, status: { $nin: ['done', 'cancelled'] } };
    if (projectId) taskFilter.project = projectId;
    taskFilter.$or = [
      { startDate: { $lte: endDate }, dueDate: { $gte: startDate } },
      { dueDate: { $gte: startDate, $lte: endDate } }
    ];

    const tasks = await Task.find(taskFilter)
      .populate('assignees', 'name avatar availability')
      .select('title status priority startDate dueDate estimatedHours assignees project');

    const users = await User.find({ organization: orgId, status: 'active' }).select('name avatar availability');

    // Generate days in range
    const days = [];
    const cur = new Date(startDate);
    while (cur <= endDate) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }

    const result = users.map(user => {
      const uid = user._id.toString();
      const userTasks = tasks.filter(t => t.assignees.some(a => a._id.toString() === uid));
      const dailyLoad = days.map(day => {
        const dayStr = day.toISOString().split('T')[0];
        const dayTasks = userTasks.filter(t => {
          const s = t.startDate ? new Date(t.startDate) : new Date(t.dueDate);
          const e = t.dueDate ? new Date(t.dueDate) : s;
          return s <= day && e >= day;
        });
        const hours = dayTasks.reduce((sum, t) => {
          const s = t.startDate ? new Date(t.startDate) : new Date(t.dueDate);
          const e = t.dueDate ? new Date(t.dueDate) : s;
          const duration = Math.max(1, Math.ceil((e - s) / 86400000));
          return sum + (t.estimatedHours || 4) / duration;
        }, 0);
        return { date: dayStr, hours: Math.round(hours * 10) / 10, tasks: dayTasks.map(t => ({ _id: t._id, title: t.title, priority: t.priority, status: t.status })) };
      });
      return { userId: user._id, name: user.name, avatar: user.avatar, hoursPerDay: user.availability?.hoursPerDay || 8, dailyLoad };
    });

    res.json({ success: true, data: { users: result, days: days.map(d => d.toISOString().split('T')[0]) } });
  } catch (err) { next(err); }
};

export const aiRebalance = async (req, res, next) => {
  try {
    const { workloadData } = req.body;
    const prompt = `You are a workload balancing expert. Analyze this team workload and suggest reassignments.

Workload data:
${JSON.stringify(workloadData?.users?.map(u => ({
  name: u.name,
  capacity: u.hoursPerDay,
  overloadedDays: u.dailyLoad?.filter(d => d.hours > u.hoursPerDay).map(d => ({ date: d.date, hours: d.hours, tasks: d.tasks?.map(t => t.title) }))
})), null, 2)}

Return ONLY a JSON array of reassignment suggestions:
[{
  "fromUser": "user name",
  "toUser": "user name",
  "taskTitle": "task title",
  "reason": "brief explanation",
  "impact": "how this helps workload balance"
}]

Return empty array [] if workload is balanced. Maximum 5 suggestions.`;

    let suggestions = [];
    if (process.env.ANTHROPIC_API_KEY) {
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      });
      const match = msg.content[0].text.match(/\[[\s\S]*\]/);
      suggestions = JSON.parse(match ? match[0] : '[]');
    }
    res.json({ success: true, data: { suggestions } });
  } catch (err) { next(err); }
};
