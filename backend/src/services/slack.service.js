import https from 'https';
import http from 'http';

const PRIORITY_EMOJI = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };

const send = (webhookUrl, payload) => {
  if (!webhookUrl) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      const body = JSON.stringify(payload);
      const url = new URL(webhookUrl);
      const lib = url.protocol === 'https:' ? https : http;
      const req = lib.request({ hostname: url.hostname, path: url.pathname + url.search, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, resolve);
      req.on('error', (e) => { console.error('[Slack]', e.message); resolve(); });
      req.write(body);
      req.end();
    } catch (err) {
      console.error('[Slack]', err.message);
      resolve();
    }
  });
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
