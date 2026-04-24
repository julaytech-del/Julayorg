import cron from 'node-cron';
import Task from '../models/Task.js';

const shouldCreate = (task) => {
  const now = new Date();
  if (task.recurring.endDate && now > new Date(task.recurring.endDate)) return false;
  if (!task.recurring.lastCreated) return true;

  const last = new Date(task.recurring.lastCreated);
  const { frequency, interval } = task.recurring;
  const next = new Date(last);

  if (frequency === 'daily') next.setDate(next.getDate() + interval);
  else if (frequency === 'weekly') next.setDate(next.getDate() + interval * 7);
  else if (frequency === 'monthly') next.setMonth(next.getMonth() + interval);

  return now >= next;
};

const processRecurring = async () => {
  try {
    const tasks = await Task.find({ 'recurring.enabled': true });
    for (const task of tasks) {
      if (!shouldCreate(task)) continue;

      const newDue = task.dueDate ? (() => {
        const d = new Date(task.dueDate);
        const { frequency, interval } = task.recurring;
        if (frequency === 'daily') d.setDate(d.getDate() + interval);
        else if (frequency === 'weekly') d.setDate(d.getDate() + interval * 7);
        else if (frequency === 'monthly') d.setMonth(d.getMonth() + interval);
        return d;
      })() : undefined;

      await Task.create({
        title: task.title,
        description: task.description,
        project: task.project,
        goal: task.goal,
        status: 'planned',
        priority: task.priority,
        type: task.type,
        assignees: task.assignees,
        department: task.department,
        estimatedHours: task.estimatedHours,
        dueDate: newDue,
        tags: task.tags,
        labels: task.labels,
        createdBy: task.createdBy,
        aiGenerated: false,
      });

      await Task.findByIdAndUpdate(task._id, { 'recurring.lastCreated': new Date() });
    }
  } catch (err) {
    console.error('[Recurring]', err.message);
  }
};

export const startRecurringJobs = () => {
  // Run every day at 00:05
  cron.schedule('5 0 * * *', processRecurring);
  console.log('[Recurring] Cron job started');
};
