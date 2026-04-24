import cron from 'node-cron';
import Task from '../models/Task.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { notifyTaskOverdue } from './slack.service.js';
import { sendTaskOverdue, sendDueSoon } from './email.service.js';

const processOverdue = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    // Find overdue tasks (not done)
    const overdue = await Task.find({
      dueDate: { $lt: now },
      status: { $nin: ['done'] },
    }).populate('project', 'name').populate('assignees', 'name email');

    for (const task of overdue) {
      const orgId = task.project?.organization;
      if (!orgId) continue;
      const org = await Organization.findById(orgId).select('integrations');
      if (org?.integrations?.slackWebhookUrl && org?.integrations?.slackNotifyOn?.taskOverdue) {
        await notifyTaskOverdue(org.integrations.slackWebhookUrl, task, task.project?.name || '');
      }
      if (org?.integrations?.emailNotifications) {
        for (const assignee of task.assignees || []) {
          if (assignee.email) await sendTaskOverdue(assignee.email, assignee.name, task, task.project?.name || '');
        }
      }
    }

    // Due soon (tomorrow)
    const dueSoon = await Task.find({
      dueDate: { $gte: tomorrow, $lt: dayAfter },
      status: { $nin: ['done'] },
    }).populate('project', 'name').populate('assignees', 'name email');

    for (const task of dueSoon) {
      const orgId = task.project?.organization;
      if (!orgId) continue;
      const org = await Organization.findById(orgId).select('integrations');
      if (org?.integrations?.emailNotifications) {
        for (const assignee of task.assignees || []) {
          if (assignee.email) await sendDueSoon(assignee.email, assignee.name, task, task.project?.name || '');
        }
      }
    }
  } catch (err) {
    console.error('[Overdue]', err.message);
  }
};

export const startOverdueCron = () => {
  // Run every day at 08:00
  cron.schedule('0 8 * * *', processOverdue);
  console.log('[Overdue] Cron job started');
};
