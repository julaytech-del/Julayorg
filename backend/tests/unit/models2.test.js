import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db.js';
import Sprint from '../../src/models/Sprint.js';
import AutomationRule from '../../src/models/AutomationRule.js';
import Webhook from '../../src/models/Webhook.js';
import TimeEntry from '../../src/models/TimeEntry.js';
import Notification from '../../src/models/Notification.js';
import PageView from '../../src/models/PageView.js';
import Organization from '../../src/models/Organization.js';
import User from '../../src/models/User.js';
import Project from '../../src/models/Project.js';
import Task from '../../src/models/Task.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

const makeIds = () => ({
  org:  new mongoose.Types.ObjectId(),
  user: new mongoose.Types.ObjectId(),
  proj: new mongoose.Types.ObjectId(),
  task: new mongoose.Types.ObjectId(),
});

// ─── Sprint ───────────────────────────────────────────────────────────────────
describe('Sprint model', () => {
  it('creates sprint with required fields', async () => {
    const ids = makeIds();
    const sprint = await Sprint.create({
      name: 'Sprint 1', project: ids.proj, organization: ids.org,
      startDate: new Date(), endDate: new Date(Date.now() + 7 * 86400000),
    });
    expect(sprint.name).toBe('Sprint 1');
    expect(sprint.status).toBe('planning');
    expect(sprint.tasks).toHaveLength(0);
  });

  it('fails without required fields', async () => {
    await expect(Sprint.create({ name: 'S' })).rejects.toThrow(); // missing project/org/dates
  });

  it('accepts all valid statuses', async () => {
    const ids = makeIds();
    for (const status of ['planning', 'active', 'completed', 'cancelled']) {
      const s = await Sprint.create({
        name: `Sprint-${status}`, project: ids.proj, organization: ids.org,
        startDate: new Date(), endDate: new Date(Date.now() + 86400000), status,
      });
      expect(s.status).toBe(status);
    }
  });

  it('rejects invalid status', async () => {
    const ids = makeIds();
    await expect(Sprint.create({
      name: 'S', project: ids.proj, organization: ids.org,
      startDate: new Date(), endDate: new Date(), status: 'invalid',
    })).rejects.toThrow();
  });

  it('stores goal and capacity', async () => {
    const ids = makeIds();
    const s = await Sprint.create({
      name: 'Sprint Goal', project: ids.proj, organization: ids.org,
      startDate: new Date(), endDate: new Date(Date.now() + 86400000),
      goal: 'Ship feature X', capacity: 40,
    });
    expect(s.goal).toBe('Ship feature X');
    expect(s.capacity).toBe(40);
  });
});

// ─── AutomationRule ───────────────────────────────────────────────────────────
describe('AutomationRule model', () => {
  const ids = makeIds();

  it('creates rule with required fields', async () => {
    const rule = await AutomationRule.create({
      organization: ids.org, name: 'Notify on overdue',
      trigger: { event: 'task.overdue', conditions: {} },
      actions: [{ type: 'notify_user', params: { userId: ids.user } }],
    });
    expect(rule.name).toBe('Notify on overdue');
    expect(rule.active).toBe(true);
    expect(rule.runCount).toBe(0);
  });

  it('accepts all valid trigger events', async () => {
    const events = ['task.status_changed', 'task.created', 'task.assigned', 'task.due_soon', 'project.created', 'task.overdue'];
    for (const event of events) {
      const r = await AutomationRule.create({
        organization: ids.org, name: `Rule-${event}`,
        trigger: { event },
        actions: [{ type: 'notify_user', params: {} }],
      });
      expect(r.trigger.event).toBe(event);
    }
  });

  it('accepts all valid action types', async () => {
    const types = ['notify_user', 'change_status', 'assign_user', 'create_subtask', 'add_comment', 'send_webhook'];
    const r = await AutomationRule.create({
      organization: ids.org, name: 'Multi action',
      trigger: { event: 'task.created' },
      actions: types.map(t => ({ type: t, params: {} })),
    });
    expect(r.actions).toHaveLength(types.length);
  });

  it('fails without org', async () => {
    await expect(AutomationRule.create({
      name: 'R', trigger: { event: 'task.created' }, actions: [{ type: 'notify_user' }],
    })).rejects.toThrow();
  });

  it('can be toggled active/inactive', async () => {
    const r = await AutomationRule.create({
      organization: ids.org, name: 'Toggle me',
      trigger: { event: 'task.created' },
      actions: [{ type: 'notify_user', params: {} }],
    });
    r.active = false;
    await r.save();
    const found = await AutomationRule.findById(r._id);
    expect(found.active).toBe(false);
  });
});

// ─── Webhook ──────────────────────────────────────────────────────────────────
describe('Webhook model', () => {
  const ids = makeIds();

  it('creates webhook with required fields', async () => {
    const wh = await Webhook.create({
      organization: ids.org, name: 'My Webhook', url: 'https://example.com/hook',
      events: ['task.created', 'task.updated'],
    });
    expect(wh.name).toBe('My Webhook');
    expect(wh.active).toBe(true);
    expect(wh.events).toHaveLength(2);
  });

  it('accepts all valid events', async () => {
    const events = ['task.created', 'task.updated', 'task.deleted', 'task.status_changed', 'project.created', 'project.updated', 'comment.added', 'member.assigned'];
    const wh = await Webhook.create({
      organization: ids.org, name: 'All Events', url: 'https://example.com/hook', events,
    });
    expect(wh.events).toHaveLength(events.length);
  });

  it('stores delivery log', async () => {
    const wh = await Webhook.create({
      organization: ids.org, name: 'Logged', url: 'https://example.com/hook',
      events: ['task.created'],
      deliveryLog: [{ event: 'task.created', statusCode: 200, success: true, durationMs: 120 }],
    });
    expect(wh.deliveryLog[0].statusCode).toBe(200);
    expect(wh.deliveryLog[0].success).toBe(true);
  });

  it('fails without url', async () => {
    await expect(Webhook.create({ organization: ids.org, name: 'No URL', events: [] })).rejects.toThrow();
  });
});

// ─── TimeEntry ────────────────────────────────────────────────────────────────
describe('TimeEntry model', () => {
  const ids = makeIds();

  it('creates time entry', async () => {
    const te = await TimeEntry.create({
      task: ids.task, user: ids.user, organization: ids.org,
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(),
    });
    expect(te.billable).toBe(true);
  });

  it('auto-calculates duration from start/end', async () => {
    const start = new Date(Date.now() - 60 * 60000); // 60 min ago
    const end   = new Date();
    const te = await TimeEntry.create({ task: ids.task, user: ids.user, organization: ids.org, startTime: start, endTime: end });
    expect(te.duration).toBeGreaterThanOrEqual(59);
    expect(te.duration).toBeLessThanOrEqual(61);
  });

  it('fails without required fields', async () => {
    await expect(TimeEntry.create({ description: 'No task or user' })).rejects.toThrow();
  });

  it('stores description and billable flag', async () => {
    const te = await TimeEntry.create({
      task: ids.task, user: ids.user, organization: ids.org,
      startTime: new Date(), description: 'Code review', billable: false,
    });
    expect(te.description).toBe('Code review');
    expect(te.billable).toBe(false);
  });
});

// ─── Notification ─────────────────────────────────────────────────────────────
describe('Notification model', () => {
  const ids = makeIds();

  it('creates notification', async () => {
    const n = await Notification.create({
      recipient: ids.user, organization: ids.org,
      type: 'task_assigned', title: 'New task assigned to you',
      body: 'Fix the bug',
    });
    expect(n.read).toBe(false);
    expect(n.type).toBe('task_assigned');
  });

  it('accepts all notification types', async () => {
    const types = ['task_assigned', 'task_due_soon', 'task_overdue', 'comment_added', 'status_changed', 'automation_triggered', 'project_created', 'member_joined'];
    for (const type of types) {
      const n = await Notification.create({
        recipient: ids.user, organization: ids.org, type, title: `Notif-${type}`,
      });
      expect(n.type).toBe(type);
    }
  });

  it('can be marked as read', async () => {
    const n = await Notification.create({
      recipient: ids.user, organization: ids.org, type: 'task_assigned', title: 'T',
    });
    n.read = true; n.readAt = new Date();
    await n.save();
    const found = await Notification.findById(n._id);
    expect(found.read).toBe(true);
    expect(found.readAt).toBeDefined();
  });

  it('fails without required fields', async () => {
    await expect(Notification.create({ title: 'No recipient' })).rejects.toThrow();
  });
});

// ─── PageView (analytics) ─────────────────────────────────────────────────────
describe('PageView model', () => {
  it('creates pageview with defaults', async () => {
    const pv = await PageView.create({ url: '/', sessionId: 'sess1' });
    expect(pv.eventType).toBe('pageview');
    expect(pv.scrollDepth).toBe(0);
    expect(pv.duration).toBe(0);
  });

  it('stores all event types', async () => {
    for (const eventType of ['pageview', 'click', 'scroll', 'session_end']) {
      const pv = await PageView.create({ url: '/', sessionId: 's', eventType });
      expect(pv.eventType).toBe(eventType);
    }
  });

  it('stores device type', async () => {
    const pv = await PageView.create({ url: '/', sessionId: 's', device: 'mobile', language: 'ar' });
    expect(pv.device).toBe('mobile');
    expect(pv.language).toBe('ar');
  });

  it('fails without url', async () => {
    await expect(PageView.create({ sessionId: 'no-url' })).rejects.toThrow();
  });

  it('fails without sessionId', async () => {
    await expect(PageView.create({ url: '/' })).rejects.toThrow();
  });
});
