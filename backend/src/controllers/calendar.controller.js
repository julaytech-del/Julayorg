import Task from '../models/Task.js';
import User from '../models/User.js';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const getCalendarTasks = async (req, res, next) => {
  try {
    const { start, end, projectId, userId } = req.query;
    const orgId = req.user.organization._id || req.user.organization;
    const filter = { organization: orgId };
    if (projectId) filter.project = projectId;
    if (userId) filter.assignees = userId;
    if (start || end) {
      filter.$or = [
        { startDate: { $gte: new Date(start), $lte: new Date(end) } },
        { dueDate: { $gte: new Date(start), $lte: new Date(end) } },
        { startDate: { $lte: new Date(start) }, dueDate: { $gte: new Date(end) } }
      ];
    }
    const tasks = await Task.find(filter)
      .populate('assignees', 'name avatar')
      .populate('project', 'name color')
      .select('title status priority startDate dueDate assignees project estimatedHours');
    res.json({ success: true, data: tasks });
  } catch (err) { next(err); }
};

export const optimizeDeadline = async (req, res, next) => {
  try {
    const { taskId, projectId } = req.body;
    const orgId = req.user.organization._id || req.user.organization;
    const task = await Task.findById(taskId).populate('assignees', 'name availability');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const assigneeIds = task.assignees.map(a => a._id);
    const siblingTasks = await Task.find({
      organization: orgId,
      assignees: { $in: assigneeIds },
      _id: { $ne: taskId },
      dueDate: { $gte: new Date() }
    }).select('title dueDate estimatedHours status priority');

    const prompt = `You are a project scheduling AI. Suggest the optimal deadline for this task.

Task: "${task.title}"
Current deadline: ${task.dueDate ? task.dueDate.toISOString().split('T')[0] : 'not set'}
Estimated hours: ${task.estimatedHours || 'unknown'}
Priority: ${task.priority}
Status: ${task.status}

Team member workload (other tasks):
${siblingTasks.slice(0, 10).map(t => `- "${t.title}" due ${t.dueDate?.toISOString().split('T')[0]} (${t.estimatedHours || '?'}h, ${t.priority})`).join('\n')}

Return ONLY a JSON object:
{
  "suggestedDate": "YYYY-MM-DD",
  "reasoning": "2-3 sentence explanation",
  "confidence": "high|medium|low",
  "warnings": ["any scheduling conflicts or risks"]
}`;

    let suggestion;
    if (process.env.ANTHROPIC_API_KEY) {
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 512,
        messages: [{ role: 'user', content: prompt }]
      });
      const match = msg.content[0].text.match(/\{[\s\S]*\}/);
      suggestion = JSON.parse(match ? match[0] : '{}');
    } else {
      const days = task.priority === 'critical' ? 3 : task.priority === 'high' ? 7 : 14;
      suggestion = { suggestedDate: new Date(Date.now() + days * 86400000).toISOString().split('T')[0], reasoning: 'Based on priority level.', confidence: 'medium', warnings: [] };
    }
    res.json({ success: true, data: suggestion });
  } catch (err) { next(err); }
};
