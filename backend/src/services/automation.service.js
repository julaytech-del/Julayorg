import AutomationRule from '../models/AutomationRule.js';
import Task from '../models/Task.js';
import { createNotification } from './notification.service.js';

export async function evaluateRules(orgId, event, context) {
  try {
    const rules = await AutomationRule.find({ organization: orgId, active: true, 'trigger.event': event });
    for (const rule of rules) {
      if (!matchesConditions(rule.trigger.conditions, context)) continue;
      for (const action of rule.actions) {
        await executeAction(action, context, orgId);
      }
      rule.lastTriggered = new Date();
      rule.runCount = (rule.runCount || 0) + 1;
      await rule.save();
    }
  } catch (err) {
    console.error('Automation evaluation failed:', err.message);
  }
}

function matchesConditions(conditions, context) {
  if (!conditions || Object.keys(conditions).length === 0) return true;
  if (conditions.status && context.newStatus && conditions.status !== context.newStatus) return false;
  if (conditions.priority && context.task?.priority && conditions.priority !== context.task.priority) return false;
  return true;
}

async function executeAction(action, context, orgId) {
  const { type, params } = action;
  const task = context.task;

  if (type === 'notify_user' && params?.userId && task) {
    await createNotification(params.userId, orgId, 'automation_triggered', {
      title: params.title || 'Automation triggered',
      body: params.message || `Task "${task.title}" triggered an automation.`,
      link: `/dashboard/projects/${task.project}`,
      entityId: task._id,
      entityType: 'task',
    });
  }

  if (type === 'change_status' && params?.status && task) {
    await Task.findByIdAndUpdate(task._id, { status: params.status });
  }

  if (type === 'add_comment' && params?.text && task) {
    await Task.findByIdAndUpdate(task._id, {
      $push: { comments: { content: params.text, author: context.userId, authorName: 'Automation', createdAt: new Date() } }
    });
  }

  if (type === 'create_subtask' && params?.title && task) {
    await Task.findByIdAndUpdate(task._id, {
      $push: { subtasks: { title: params.title, status: 'pending', createdAt: new Date() } }
    });
  }
}
