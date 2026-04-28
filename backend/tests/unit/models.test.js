import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db.js';
import User from '../../src/models/User.js';
import Organization from '../../src/models/Organization.js';
import Project from '../../src/models/Project.js';
import Task from '../../src/models/Task.js';
import Department from '../../src/models/Department.js';
import Role from '../../src/models/Role.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

// ─── Organization ────────────────────────────────────────────────────────────
describe('Organization model', () => {
  it('creates org with required fields', async () => {
    const org = await Organization.create({ name: 'Julay Inc' });
    expect(org._id).toBeDefined();
    expect(org.name).toBe('Julay Inc');
  });

  it('fails without name', async () => {
    await expect(Organization.create({})).rejects.toThrow();
  });
});

// ─── User ────────────────────────────────────────────────────────────────────
describe('User model', () => {
  let org;
  beforeAll(async () => { org = await Organization.create({ name: 'Test Org' }); });

  it('creates user with required fields', async () => {
    const user = await User.create({
      name: 'Ali',
      email: 'ali@julay.org',
      password: 'hashed_pw',
      organization: org._id,
    });
    expect(user._id).toBeDefined();
    expect(user.email).toBe('ali@julay.org');
    expect(user.status).toBe('active');
    expect(user.isAdmin).toBe(false);
  });

  it('lowercases email automatically', async () => {
    const user = await User.create({
      name: 'Bob',
      email: 'BOB@JULAY.ORG',
      password: 'hashedpassword123',
      organization: org._id,
    });
    expect(user.email).toBe('bob@julay.org');
  });

  it('fails with duplicate email', async () => {
    await User.create({ name: 'A', email: 'dup@julay.org', password: 'hashedpassword123', organization: org._id });
    await expect(
      User.create({ name: 'B', email: 'dup@julay.org', password: 'hashedpassword123', organization: org._id })
    ).rejects.toThrow();
  });

  it('has default performance values', async () => {
    const user = await User.create({ name: 'C', email: 'c@julay.org', password: 'hashedpassword123', organization: org._id });
    expect(user.performance.score).toBe(100);
    expect(user.performance.onTimeRate).toBe(100);
    expect(user.availability.hoursPerDay).toBe(8);
  });

  it('rejects invalid status', async () => {
    await expect(
      User.create({ name: 'D', email: 'd@julay.org', password: 'hashedpassword123', organization: org._id, status: 'invalid_status' })
    ).rejects.toThrow();
  });
});

// ─── Project ─────────────────────────────────────────────────────────────────
describe('Project model', () => {
  let org, user;
  beforeAll(async () => {
    org = await Organization.create({ name: 'Org' });
    user = await User.create({ name: 'U', email: 'u@j.org', password: 'hashedpassword123', organization: org._id });
  });

  it('creates project with required fields', async () => {
    const project = await Project.create({
      name: 'My Project',
      organization: org._id,
      createdBy: user._id,
    });
    expect(project.name).toBe('My Project');
    expect(project.status).toBe('planning');
    expect(project.priority).toBe('medium');
    expect(project.progress.percentage).toBe(0);
  });

  it('fails without name', async () => {
    await expect(Project.create({ organization: org._id, createdBy: user._id })).rejects.toThrow();
  });

  it('rejects invalid status', async () => {
    await expect(
      Project.create({ name: 'P', organization: org._id, createdBy: user._id, status: 'deleted' })
    ).rejects.toThrow();
  });

  it('rejects invalid priority', async () => {
    await expect(
      Project.create({ name: 'P', organization: org._id, createdBy: user._id, priority: 'extreme' })
    ).rejects.toThrow();
  });

  it('stores aiGenerated flag', async () => {
    const p = await Project.create({
      name: 'AI Project', organization: org._id, createdBy: user._id,
      aiGenerated: true, aiMetadata: { originalPrompt: 'build app' },
    });
    expect(p.aiGenerated).toBe(true);
    expect(p.aiMetadata.originalPrompt).toBe('build app');
  });
});

// ─── Task ────────────────────────────────────────────────────────────────────
describe('Task model', () => {
  let org, user, project;
  beforeAll(async () => {
    org     = await Organization.create({ name: 'O' });
    user    = await User.create({ name: 'U', email: 'tu@j.org', password: 'hashedpassword123', organization: org._id });
    project = await Project.create({ name: 'P', organization: org._id, createdBy: user._id });
  });

  it('creates task with defaults', async () => {
    const task = await Task.create({ title: 'Fix bug', project: project._id });
    expect(task.status).toBe('planned');
    expect(task.priority).toBe('medium');
    expect(task.type).toBe('other');
    expect(task.estimatedHours).toBe(0);
  });

  it('fails without title', async () => {
    await expect(Task.create({ project: project._id })).rejects.toThrow();
  });

  it('rejects invalid status', async () => {
    await expect(
      Task.create({ title: 'T', project: project._id, status: 'maybe' })
    ).rejects.toThrow();
  });

  it('accepts all valid statuses', async () => {
    const statuses = ['planned', 'in_progress', 'blocked', 'review', 'done'];
    for (const status of statuses) {
      const t = await Task.create({ title: `T-${status}`, project: project._id, status });
      expect(t.status).toBe(status);
    }
  });

  it('accepts all valid task types', async () => {
    const types = ['feature', 'bug', 'research', 'design', 'planning', 'meeting', 'review', 'deployment', 'content', 'testing', 'other'];
    for (const type of types) {
      const t = await Task.create({ title: `T-${type}`, project: project._id, type });
      expect(t.type).toBe(type);
    }
  });

  it('stores subtasks', async () => {
    const task = await Task.create({
      title: 'Parent',
      project: project._id,
      subtasks: [{ title: 'Sub 1' }, { title: 'Sub 2' }],
    });
    expect(task.subtasks).toHaveLength(2);
    expect(task.subtasks[0].status).toBe('pending');
  });

  it('stores comments', async () => {
    const task = await Task.create({
      title: 'Commented task',
      project: project._id,
      comments: [{ author: user._id, content: 'Looking good' }],
    });
    expect(task.comments[0].content).toBe('Looking good');
    expect(task.comments[0].edited).toBe(false);
  });
});

// ─── Department ───────────────────────────────────────────────────────────────
describe('Department model', () => {
  let org;
  beforeAll(async () => { org = await Organization.create({ name: 'D-Org' }); });

  it('creates department', async () => {
    const dept = await Department.create({ name: 'Engineering', organization: org._id });
    expect(dept.name).toBe('Engineering');
  });

  it('fails without org', async () => {
    await expect(Department.create({ name: 'Dept' })).rejects.toThrow();
  });
});

// ─── Role ────────────────────────────────────────────────────────────────────
describe('Role model', () => {
  let org;
  beforeAll(async () => { org = await Organization.create({ name: 'R-Org' }); });

  it('creates role with permissions', async () => {
    const role = await Role.create({
      name: 'Admin',
      level: 'admin',
      organization: org._id,
      permissions: { projects: { create: true, read: true, update: true, delete: true } },
    });
    expect(role.level).toBe('admin');
    expect(role.permissions.projects.create).toBe(true);
  });
});
