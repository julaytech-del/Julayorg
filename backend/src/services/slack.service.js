const PRIORITY_EMOJI = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
const STATUS_EMOJI = { done: '✅', in_progress: '🔄', blocked: '🚫', review: '👀', planned: '📋' };

const send = async (webhookUrl, payload) => {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[Slack]', err.message);
  }
};

export const notifyTaskCreated = async (webhookUrl, task, projectName, creatorName) => {
  await send(webhookUrl, {
    text: `📋 New task created in *${projectName}*`,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `📋 *New task* in *${projectName}*\n*${task.title}*` } },
      { type: 'context', elements: [
        { type: 'mrkdwn', text: `${PRIORITY_EMOJI[task.priority] || '🟡'} ${task.priority} priority · Created by ${creatorName}` }
      ]},
    ],
  });
};

export const notifyTaskCompleted = async (webhookUrl, task, projectName, completedBy) => {
  await send(webhookUrl, {
    text: `✅ Task completed in *${projectName}*`,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `✅ *Task completed* in *${projectName}*\n~${task.title}~` } },
      { type: 'context', elements: [{ type: 'mrkdwn', text: `Completed by ${completedBy}` }] },
    ],
  });
};

export const notifyTaskOverdue = async (webhookUrl, task, projectName) => {
  await send(webhookUrl, {
    text: `⚠️ Overdue task in *${projectName}*`,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `⚠️ *Overdue task* in *${projectName}*\n*${task.title}*` } },
      { type: 'context', elements: [{ type: 'mrkdwn', text: `Was due: ${new Date(task.dueDate).toLocaleDateString()}` }] },
    ],
  });
};

export const notifyProjectCreated = async (webhookUrl, project, creatorName) => {
  await send(webhookUrl, {
    text: `🚀 New project created: *${project.name}*`,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `🚀 *New project*: *${project.name}*` } },
      { type: 'context', elements: [{ type: 'mrkdwn', text: `Created by ${creatorName}` }] },
    ],
  });
};
