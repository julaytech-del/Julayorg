import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db.js';
import { getAuthToken } from '../helpers/auth.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

async function setupProjectAndTask(token, taskOverrides = {}) {
  const projRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test Project' });
  const projectId = projRes.body._id || projRes.body.data?._id || projRes.body.project?._id;

  const taskRes = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Test Task', project: projectId, ...taskOverrides });

  const taskId = taskRes.body._id || taskRes.body.data?._id || taskRes.body.task?._id;
  return { projectId, taskId, taskRes };
}

describe('POST /api/tasks', () => {
  it('creates task with required fields', async () => {
    const { token } = await getAuthToken();
    const { taskRes } = await setupProjectAndTask(token);
    expect(taskRes.status).toBe(201);
  });

  it('creates task with all priorities', async () => {
    const { token } = await getAuthToken();
    for (const priority of ['critical', 'high', 'medium', 'low']) {
      const { taskRes } = await setupProjectAndTask(token, { title: `Task-${priority}`, priority });
      expect(taskRes.status).toBe(201);
    }
  });

  it('creates task with all valid types', async () => {
    const { token } = await getAuthToken();
    const types = ['feature', 'bug', 'research', 'design', 'meeting', 'review', 'deployment', 'content', 'testing'];
    for (const type of types) {
      const { taskRes } = await setupProjectAndTask(token, { title: `Task-${type}`, type });
      expect(taskRes.status).toBe(201);
    }
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Task', project: 'fake-id' });
    expect(res.status).toBe(401);
  });

  it('requires project reference', async () => {
    const { token } = await getAuthToken();
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task without project' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('GET /api/tasks', () => {
  it('returns tasks for the user org', async () => {
    const { token } = await getAuthToken();
    await setupProjectAndTask(token, { title: 'Task A' });
    await setupProjectAndTask(token, { title: 'Task B' });

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const tasks = res.body.tasks || res.body.data || res.body;
    expect(Array.isArray(tasks)).toBe(true);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/tasks/:id', () => {
  it('returns task by id', async () => {
    const { token } = await getAuthToken();
    const { taskId } = await setupProjectAndTask(token);

    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent task', async () => {
    const { token } = await getAuthToken();
    const res = await request(app)
      .get('/api/tasks/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/tasks/:id — status transitions', () => {
  it('changes status from planned to in_progress', async () => {
    const { token } = await getAuthToken();
    const { taskId } = await setupProjectAndTask(token);

    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' });
    expect(res.status).toBe(200);
  });

  it('changes status to done', async () => {
    const { token } = await getAuthToken();
    const { taskId } = await setupProjectAndTask(token);

    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' });
    expect(res.status).toBe(200);
  });

  it('changes status to blocked', async () => {
    const { token } = await getAuthToken();
    const { taskId } = await setupProjectAndTask(token);

    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'blocked' });
    expect(res.status).toBe(200);
  });

  it('updates priority', async () => {
    const { token } = await getAuthToken();
    const { taskId } = await setupProjectAndTask(token);

    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ priority: 'critical' });
    expect(res.status).toBe(200);
  });

  it('adds a comment', async () => {
    const { token, user } = await getAuthToken();
    const { taskId } = await setupProjectAndTask(token);

    const res = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'This looks great!' });
    expect([200, 201]).toContain(res.status);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes task', async () => {
    const { token } = await getAuthToken();
    const { taskId } = await setupProjectAndTask(token);

    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('requires authentication', async () => {
    const res = await request(app).delete('/api/tasks/000000000000000000000000');
    expect(res.status).toBe(401);
  });
});
