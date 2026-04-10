import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const generateReport = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const { type = 'tasks', filters = {}, groupBy = 'status' } = req.body;
    let data = {};

    if (type === 'tasks') {
      const filter = { organization: orgId };
      if (filters.projectId) filter.project = filters.projectId;
      if (filters.status) filter.status = filters.status;
      if (filters.priority) filter.priority = filters.priority;
      if (filters.assigneeId) filter.assignees = filters.assigneeId;
      if (filters.dateRange?.start) filter.createdAt = { $gte: new Date(filters.dateRange.start) };
      if (filters.dateRange?.end) filter.createdAt = { ...filter.createdAt, $lte: new Date(filters.dateRange.end) };

      const tasks = await Task.find(filter).populate('assignees', 'name').populate('project', 'name').select('title status priority type estimatedHours dueDate createdAt assignees project');
      const grouped = {};
      tasks.forEach(t => {
        const key = groupBy === 'assignee' ? (t.assignees?.[0]?.name || 'Unassigned') : groupBy === 'priority' ? t.priority : t.status;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(t);
      });
      const summary = Object.entries(grouped).map(([key, items]) => ({ label: key, count: items.length, totalHours: items.reduce((s, t) => s + (t.estimatedHours || 0), 0), overdue: items.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length }));
      data = { tasks, summary, total: tasks.length, groupBy };
    }

    if (type === 'projects') {
      const projects = await Project.find({ organization: orgId }).select('name status priority startDate endDate progress');
      const tasks = await Task.find({ organization: orgId }).select('project status');
      data.projects = projects.map(p => {
        const pTasks = tasks.filter(t => t.project?.toString() === p._id.toString());
        const done = pTasks.filter(t => t.status === 'done').length;
        return { ...p.toObject(), taskCount: pTasks.length, completionRate: pTasks.length > 0 ? Math.round(done / pTasks.length * 100) : 0 };
      });
    }

    if (type === 'team') {
      const users = await User.find({ organization: orgId }).select('name email performance jobTitle department');
      const tasks = await Task.find({ organization: orgId }).select('assignees status dueDate');
      data.team = users.map(u => {
        const uTasks = tasks.filter(t => t.assignees?.some(a => a.toString() === u._id.toString()));
        const done = uTasks.filter(t => t.status === 'done').length;
        const overdue = uTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
        return { ...u.toObject(), assignedTasks: uTasks.length, completedTasks: done, overdueTasks: overdue, completionRate: uTasks.length > 0 ? Math.round(done / uTasks.length * 100) : 0 };
      });
    }

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getAINarrative = async (req, res, next) => {
  try {
    const { reportData, reportType } = req.body;
    const prompt = `You are a professional project management analyst. Write an executive summary for this ${reportType} report.

Report data:
${JSON.stringify(reportData, null, 2).slice(0, 2000)}

Write exactly 2 paragraphs:
1. Overview of current state and key metrics (what's going well)
2. Issues, risks, and specific recommendations for improvement

Be specific, use numbers from the data, be professional. No markdown, plain text only.`;

    let narrative = '';
    if (process.env.ANTHROPIC_API_KEY) {
      const msg = await client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 400, messages: [{ role: 'user', content: prompt }] });
      narrative = msg.content[0].text.trim();
    } else {
      narrative = 'Executive summary not available. Configure ANTHROPIC_API_KEY to enable AI-generated narratives.\n\nThis report contains your project management data. Review the metrics above for insights.';
    }
    res.json({ success: true, data: { narrative } });
  } catch (err) { next(err); }
};

export const exportExcel = async (req, res, next) => {
  try {
    // Generate CSV as fallback (xlsx requires package install)
    const { reportData } = req.body;
    const tasks = reportData?.tasks || [];
    const headers = ['Title', 'Status', 'Priority', 'Assignees', 'Due Date', 'Estimated Hours', 'Project'];
    const rows = tasks.map(t => [
      t.title || '',
      t.status || '',
      t.priority || '',
      (t.assignees || []).map(a => a.name || a).join('; '),
      t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
      t.estimatedHours || '',
      t.project?.name || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=julay-report.csv');
    res.send(csv);
  } catch (err) { next(err); }
};
