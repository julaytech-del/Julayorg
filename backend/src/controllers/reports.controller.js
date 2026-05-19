import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const generateReport = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const { type = 'tasks', filters = {}, groupBy = 'status' } = req.body;

    const orgProjects = await Project.find({ organization: orgId }).select('_id name status priority startDate endDate progress').lean();
    const orgProjectIds = orgProjects.map(p => p._id);

    let rows = [];
    let summary = [];

    if (type === 'tasks') {
      const filter = { project: { $in: orgProjectIds } };
      if (filters.project) filter.project = filters.project;
      if (filters.status) filter.status = filters.status;
      if (filters.priority) filter.priority = filters.priority;
      if (filters.dateFrom) filter.createdAt = { $gte: new Date(filters.dateFrom) };
      if (filters.dateTo) filter.createdAt = { ...filter.createdAt, $lte: new Date(filters.dateTo) };

      const tasks = await Task.find(filter)
        .populate('assignees', 'name')
        .populate('project', 'name')
        .select('title status priority estimatedHours dueDate createdAt assignees project');

      rows = tasks.map(t => ({
        title:    t.title,
        project:  t.project?.name || '—',
        status:   t.status,
        priority: t.priority,
        assignee: t.assignees?.[0]?.name || 'Unassigned',
        dueDate:  t.dueDate,
      }));

      const grouped = {};
      rows.forEach(r => {
        const key = groupBy === 'assignee' ? r.assignee : groupBy === 'priority' ? r.priority : r.status;
        grouped[key] = (grouped[key] || 0) + 1;
      });
      summary = Object.entries(grouped).map(([label, count]) => ({ label, count }));
    }

    if (type === 'projects') {
      const allTasks = await Task.find({ project: { $in: orgProjectIds } }).select('project status dueDate').lean();
      rows = orgProjects.map(p => {
        const pTasks = allTasks.filter(t => t.project?.toString() === p._id.toString());
        const done = pTasks.filter(t => t.status === 'done').length;
        return {
          name:       p.name,
          status:     p.status,
          progress:   pTasks.length > 0 ? Math.round(done / pTasks.length * 100) : 0,
          tasksTotal: pTasks.length,
          tasksDone:  done,
          endDate:    p.endDate,
        };
      });
    }

    if (type === 'team') {
      const users = await User.find({ organization: orgId }).select('name department jobTitle').lean();
      const allTasks = await Task.find({ project: { $in: orgProjectIds } }).select('assignees status dueDate').lean();
      const now = new Date();
      rows = users.map(u => {
        const uTasks = allTasks.filter(t => t.assignees?.some(a => a.toString() === u._id.toString()));
        const done = uTasks.filter(t => t.status === 'done').length;
        const overdue = uTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length;
        const inProgress = uTasks.filter(t => t.status === 'in_progress').length;
        return {
          name:            u.name,
          department:      u.department || u.jobTitle || '—',
          tasksCompleted:  done,
          tasksOverdue:    overdue,
          tasksInProgress: inProgress,
          score:           uTasks.length > 0 ? Math.round(done / uTasks.length * 100) : 0,
        };
      });
    }

    if (type === 'timeline') {
      const tasks = await Task.find({ project: { $in: orgProjectIds } })
        .populate('project', 'name')
        .select('title project startDate dueDate status createdAt').lean();
      rows = tasks.map(t => ({
        title:        t.title,
        project:      t.project?.name || '—',
        plannedStart: t.startDate || t.createdAt,
        actualStart:  t.startDate || t.createdAt,
        plannedEnd:   t.dueDate,
        actualEnd:    t.status === 'done' ? t.dueDate : null,
        variance:     t.dueDate ? Math.ceil((new Date(t.dueDate) - new Date(t.startDate || t.createdAt)) / 86400000) : '—',
      }));
    }

    res.json({ success: true, data: { rows, summary, total: rows.length } });
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
