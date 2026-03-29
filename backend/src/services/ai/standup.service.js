import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateStandup(project, tasks, teamMembers) {
  const stats = getTaskStats(tasks);

  if (!process.env.ANTHROPIC_API_KEY) {
    return getMockStandup(project, stats, teamMembers);
  }

  const context = {
    projectName: project.name,
    status: project.status,
    progress: project.progress?.percentage || 0,
    taskStats: stats,
    overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').map(t => ({ title: t.title, dueDate: t.dueDate })),
    blockedTasks: tasks.filter(t => t.status === 'blocked').map(t => t.title),
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').map(t => ({ title: t.title, assignees: t.assignees?.length }))
  };

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: `You are an AI project manager generating a daily standup report. Be concise, actionable, and professional. Return ONLY valid JSON.`,
    messages: [{
      role: 'user',
      content: `Generate a daily standup report for project: ${JSON.stringify(context)}

Return JSON:
{
  "date": "${new Date().toISOString()}",
  "summary": "2-sentence project health summary",
  "completedYesterday": ["task or milestone completed"],
  "todayPriorities": [{"task": "task title", "assignee": "name", "reason": "why priority"}],
  "blockers": [{"issue": "description", "impact": "what it blocks", "suggestion": "how to resolve"}],
  "risks": ["risk description"],
  "overallHealth": "green|yellow|red",
  "aiInsights": ["actionable insight 1", "insight 2", "insight 3"]
}`
    }]
  });

  const content = message.content[0].text.trim();
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
}

export async function analyzePerformance(project, tasks, teamMembers) {
  const stats = getTaskStats(tasks);

  if (!process.env.ANTHROPIC_API_KEY) {
    return getMockPerformance(project, stats, teamMembers);
  }

  const memberStats = teamMembers.map(m => {
    const assigned = tasks.filter(t => t.assignees?.some(a => a._id?.toString() === m._id?.toString()));
    const done = assigned.filter(t => t.status === 'done');
    const overdue = assigned.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done');
    return { name: m.name, jobTitle: m.jobTitle, assigned: assigned.length, completed: done.length, overdue: overdue.length };
  });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: `You are an AI performance analyst. Analyze project performance and return ONLY valid JSON.`,
    messages: [{
      role: 'user',
      content: `Analyze performance for project "${project.name}".
Stats: ${JSON.stringify(stats)}
Team performance: ${JSON.stringify(memberStats)}
Project end date: ${project.endDate}

Return JSON:
{
  "overallScore": 75,
  "onTrack": true,
  "completionForecast": "ISO date string",
  "teamMetrics": [{"member": "name", "score": 85, "strengths": ["str1"], "improvements": ["imp1"]}],
  "bottlenecks": ["bottleneck description"],
  "recommendations": ["recommendation"],
  "riskLevel": "low|medium|high",
  "insights": ["insight"]
}`
    }]
  });

  const content = message.content[0].text.trim();
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
}

export async function generateReplan(project, tasks, teamMembers, reason) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return getMockReplan(project, tasks, reason);
  }

  const pendingTasks = tasks.filter(t => t.status !== 'done').map(t => ({
    id: t._id, title: t.title, status: t.status, dueDate: t.dueDate, estimatedHours: t.estimatedHours
  }));

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `You are an AI project replanning engine. Suggest revised schedules. Return ONLY valid JSON.`,
    messages: [{
      role: 'user',
      content: `Replan project "${project.name}".
Reason for replan: ${reason}
Current end date: ${project.endDate}
Team size: ${teamMembers.length}
Pending tasks: ${JSON.stringify(pendingTasks)}

Return JSON:
{
  "newEndDate": "ISO date",
  "summary": "What changed and why",
  "taskUpdates": [{"taskId": "id", "newDueDate": "ISO date", "priority": "high|medium|low", "note": "adjustment reason"}],
  "removedTasks": ["task id if any should be cut"],
  "addedMilestones": ["new milestone"],
  "recommendations": ["recommendation"]
}`
    }]
  });

  const content = message.content[0].text.trim();
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
}

function getTaskStats(tasks) {
  return {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    planned: tasks.filter(t => t.status === 'planned').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    review: tasks.filter(t => t.status === 'review').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length
  };
}

function getMockStandup(project, stats, teamMembers) {
  const health = stats.blocked > 2 ? 'red' : stats.overdue > 3 ? 'yellow' : 'green';
  return {
    date: new Date().toISOString(),
    summary: `Project "${project.name}" is ${health === 'green' ? 'on track' : 'experiencing some delays'}. ${stats.done} of ${stats.total} tasks completed (${Math.round(stats.done / stats.total * 100)}% complete).`,
    completedYesterday: [`${stats.done} tasks completed overall`],
    todayPriorities: teamMembers.slice(0, 3).map(m => ({ task: 'Continue current assignments', assignee: m.name, reason: 'Maintain momentum' })),
    blockers: stats.blocked > 0 ? [{ issue: `${stats.blocked} tasks are blocked`, impact: 'May delay project timeline', suggestion: 'Review and remove blockers in daily standup' }] : [],
    risks: stats.overdue > 0 ? [`${stats.overdue} tasks are overdue`] : ['Project is on schedule'],
    overallHealth: health,
    aiInsights: [
      `Current completion rate: ${Math.round(stats.done / stats.total * 100)}%`,
      `Focus on clearing ${stats.blocked} blocked tasks`,
      `${stats.inProgress} tasks currently in progress`
    ]
  };
}

function getMockPerformance(project, stats, teamMembers) {
  return {
    overallScore: Math.round((stats.done / stats.total) * 100),
    onTrack: stats.overdue < 3,
    completionForecast: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    teamMetrics: teamMembers.map(m => ({ member: m.name, score: 80 + Math.floor(Math.random() * 20), strengths: ['Consistent delivery'], improvements: ['Communication'] })),
    bottlenecks: stats.blocked > 0 ? ['Blocked tasks need attention'] : [],
    recommendations: ['Hold weekly review meetings', 'Clear blocked tasks immediately'],
    riskLevel: stats.overdue > 5 ? 'high' : stats.overdue > 2 ? 'medium' : 'low',
    insights: [`${stats.done} tasks completed out of ${stats.total}`, `Team utilization is healthy`]
  };
}

function getMockReplan(project, tasks, reason) {
  const newEndDate = new Date(project.endDate || Date.now());
  newEndDate.setDate(newEndDate.getDate() + 14);
  return {
    newEndDate: newEndDate.toISOString(),
    summary: `Due to ${reason}, the project timeline has been extended by 2 weeks. Priority tasks have been re-scheduled accordingly.`,
    taskUpdates: tasks.filter(t => t.status !== 'done').slice(0, 5).map(t => ({
      taskId: t._id?.toString(),
      newDueDate: new Date(new Date(t.dueDate || Date.now()).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority: t.priority,
      note: 'Adjusted due to replan'
    })),
    removedTasks: [],
    addedMilestones: ['Mid-project review checkpoint'],
    recommendations: ['Increase daily check-ins', 'Review resource allocation']
  };
}
