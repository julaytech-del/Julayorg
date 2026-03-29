import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function assignTeam(tasks, teamMembers) {
  if (!teamMembers || teamMembers.length === 0) return [];
  if (!process.env.ANTHROPIC_API_KEY) {
    return getMockAssignments(tasks, teamMembers);
  }

  const teamSummary = teamMembers.map(m => ({
    email: m.email,
    name: m.name,
    jobTitle: m.jobTitle,
    skills: m.skills?.map(s => s.name) || [],
    hoursPerDay: m.availability?.hoursPerDay || 8
  }));

  const taskSummary = tasks.slice(0, 50).map(t => ({
    title: t.title,
    type: t.type,
    skillsRequired: t.aiMetadata?.skillsRequired || [],
    estimatedHours: t.estimatedHours,
    departmentHint: t.departmentHint
  }));

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `You are a smart resource allocation AI. Match tasks to team members based on skills. Return ONLY valid JSON.`,
    messages: [{
      role: 'user',
      content: `Assign each task to the most suitable team member based on skills.

Team members: ${JSON.stringify(teamSummary)}

Tasks: ${JSON.stringify(taskSummary)}

Return JSON array:
[
  { "taskTitle": "exact task title", "assigneeEmail": "email@example.com", "reason": "Why this person" }
]

Rules:
- Match skills to task requirements
- Distribute workload evenly
- Consider job titles and department hints
- Every task must be assigned`
    }]
  });

  const content = message.content[0].text.trim();
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : '[]');
}

function getMockAssignments(tasks, teamMembers) {
  const assignments = [];
  const designerKeywords = ['design', 'figma', 'ui', 'ux', 'wireframe', 'mockup', 'brand', 'style', 'visual', 'image'];
  const frontendKeywords = ['frontend', 'react', 'javascript', 'css', 'html', 'homepage', 'page', 'responsive'];
  const backendKeywords = ['backend', 'api', 'database', 'server', 'cms', 'integration', 'deployment', 'infrastructure'];
  const qaKeywords = ['test', 'qa', 'quality', 'audit', 'bug', 'browser', 'performance'];
  const marketingKeywords = ['seo', 'marketing', 'analytics', 'content', 'copy', 'social', 'campaign'];
  const pmKeywords = ['planning', 'requirement', 'stakeholder', 'meeting', 'workshop', 'architecture'];

  const getAssignee = (task) => {
    const title = task.title.toLowerCase();
    const type = task.type?.toLowerCase() || '';

    const findMember = (keywords, titleHint) => {
      return teamMembers.find(m => {
        const jt = (m.jobTitle || '').toLowerCase();
        return keywords.some(k => jt.includes(k)) ||
          (m.skills || []).some(s => keywords.some(k => s.name.toLowerCase().includes(k)));
      }) || teamMembers.find(m => (m.jobTitle || '').toLowerCase().includes(titleHint));
    };

    if (type === 'design' || designerKeywords.some(k => title.includes(k))) {
      return findMember(['design', 'ui', 'ux', 'figma'], 'designer') || teamMembers[0];
    }
    if (backendKeywords.some(k => title.includes(k)) || type === 'deployment') {
      return findMember(['backend', 'node', 'database', 'devops'], 'backend') || teamMembers[0];
    }
    if (frontendKeywords.some(k => title.includes(k))) {
      return findMember(['frontend', 'react', 'javascript'], 'frontend') || teamMembers[0];
    }
    if (qaKeywords.some(k => title.includes(k)) || type === 'testing') {
      return findMember(['qa', 'testing', 'quality'], 'qa') || teamMembers[0];
    }
    if (marketingKeywords.some(k => title.includes(k)) || type === 'content') {
      return findMember(['marketing', 'seo', 'content', 'writing'], 'market') || teamMembers[0];
    }
    if (pmKeywords.some(k => title.includes(k)) || type === 'meeting' || type === 'planning') {
      return findMember(['project manager', 'pm', 'planning'], 'manager') || teamMembers[0];
    }
    return teamMembers[Math.floor(Math.random() * teamMembers.length)];
  };

  for (const task of tasks) {
    const assignee = getAssignee(task);
    if (assignee) {
      assignments.push({
        taskTitle: task.title,
        assigneeEmail: assignee.email,
        reason: `Matched based on skills and job title: ${assignee.jobTitle}`
      });
    }
  }

  return assignments;
}
