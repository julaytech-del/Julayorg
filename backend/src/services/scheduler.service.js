import cron from 'node-cron';
import Task from '../models/Task.js';
import { evaluateRules } from './automation.service.js';

export function startScheduler() {
  // Run every hour: check due_soon (within 48h) and overdue tasks
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      // Tasks due within 48h that are not done
      const dueSoonTasks = await Task.find({
        status: { $nin: ['done'] },
        dueDate: { $gte: now, $lte: in48h },
      }).select('_id title project organization assignees');

      for (const task of dueSoonTasks) {
        const orgId = task.organization;
        if (!orgId) continue;
        evaluateRules(orgId, 'task.due_soon', { task });
      }

      // Overdue tasks (dueDate in the past, not done)
      const overdueTasks = await Task.find({
        status: { $nin: ['done'] },
        dueDate: { $lt: now },
      }).select('_id title project organization assignees');

      for (const task of overdueTasks) {
        const orgId = task.organization;
        if (!orgId) continue;
        evaluateRules(orgId, 'task.overdue', { task });
      }
    } catch (err) {
      console.error('Scheduler error:', err.message);
    }
  });

  console.log('Automation scheduler started (runs every hour)');
}
