import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { computeCriticalPath } from '../services/criticalPath.service.js';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const getGanttData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tasks = await Task.find({ project: id })
      .populate('assignees', 'name avatar')
      .populate('dependencies', 'title startDate dueDate status')
      .select('title status priority startDate dueDate estimatedHours assignees dependencies goal type');

    const { criticalTaskIds, taskFloat } = computeCriticalPath(tasks);
    const project = await Project.findById(id).select('ganttBaseline name startDate endDate');

    res.json({ success: true, data: { tasks, criticalTaskIds, taskFloat, baseline: project?.ganttBaseline || null, project: { name: project?.name, startDate: project?.startDate, endDate: project?.endDate } } });
  } catch (err) { next(err); }
};

export const saveBaseline = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tasks = await Task.find({ project: id }).select('title startDate dueDate estimatedHours status');
    const baseline = { savedAt: new Date(), tasks: tasks.map(t => ({ taskId: t._id, title: t.title, startDate: t.startDate, dueDate: t.dueDate, estimatedHours: t.estimatedHours, status: t.status })) };
    await Project.findByIdAndUpdate(id, { ganttBaseline: baseline });
    res.json({ success: true, data: baseline });
  } catch (err) { next(err); }
};

export const getAIRisks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tasks = await Task.find({ project: id })
      .populate('assignees', 'name')
      .select('title status priority startDate dueDate estimatedHours assignees dependencies');
    const project = await Project.findById(id).select('name endDate');

    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done');
    const blockedTasks = tasks.filter(t => t.status === 'blocked');
    const noDateTasks = tasks.filter(t => !t.dueDate);

    const prompt = `You are a project risk analyst. Analyze this project schedule and identify risks.

Project: "${project?.name}"
End date: ${project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : 'not set'}
Total tasks: ${tasks.length}
Overdue tasks: ${overdueTasks.length}
Blocked tasks: ${blockedTasks.length}
Tasks without dates: ${noDateTasks.length}

Tasks overview:
${tasks.slice(0, 20).map(t => `- "${t.title}" | ${t.status} | ${t.priority} | due: ${t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : 'no date'} | assignees: ${t.assignees?.map(a => a.name).join(', ') || 'unassigned'}`).join('\n')}

Return ONLY a JSON array of risks:
[{
  "taskTitle": "task name or 'Project Overall'",
  "riskLevel": "high|medium|low",
  "riskType": "deadline|resource|dependency|scope|blocker",
  "description": "specific risk description",
  "recommendation": "actionable recommendation",
  "impact": "what happens if not addressed"
}]

Return 3-7 risks sorted by severity. Focus on actionable insights.`;

    let risks = [];
    if (process.env.ANTHROPIC_API_KEY) {
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      });
      const match = msg.content[0].text.match(/\[[\s\S]*\]/);
      risks = JSON.parse(match ? match[0] : '[]');
    } else {
      if (overdueTasks.length > 0) risks.push({ taskTitle: 'Project Overall', riskLevel: 'high', riskType: 'deadline', description: `${overdueTasks.length} tasks are overdue`, recommendation: 'Review and reschedule overdue tasks immediately', impact: 'Project delay' });
      if (blockedTasks.length > 0) risks.push({ taskTitle: 'Project Overall', riskLevel: 'high', riskType: 'blocker', description: `${blockedTasks.length} tasks are blocked`, recommendation: 'Identify and resolve blockers', impact: 'Team productivity loss' });
    }
    res.json({ success: true, data: { risks } });
  } catch (err) { next(err); }
};
