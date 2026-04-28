import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db.js';
import { getAuthToken } from '../helpers/auth.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

async function setupTask(token) {
  const projRes = await request(app)
    .post('/api/projects').set('Authorization', `Bearer ${token}`)
    .send({ name: 'Time Project' });
  const projectId = projRes.body._id || projRes.body.data?._id;

  const taskRes = await request(app)
    .post('/api/tasks').set('Authorization', `Bearer ${token}`)
    .send({ title: 'Timed Task', project: projectId });
  const taskId = taskRes.body._id || taskRes.body.data?._id || taskRes.body.task?._id;
  return { projectId, taskId };
}

describe('POST /api/time-entries', () => {
  it('creates time entry', async () => {
    const { token } = await getAuthToken();
    const { taskId } = await setupTask(token);
    const res = await request(app)
      .post('/api/time-entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        task: taskId,
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date().toISOString(),
        description: 'Working on bug fix',
      });
    expect(res.status).toBe(201);
  });

  it('requires task reference', async () => {
    const { token } = await getAuthToken();
    const res = await request(app)
      .post('/api/time-entries')
      .set('Authorization', `Bearer ${token}`)
      .send({ startTime: new Date().toISOString() });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/time-entries').send({ task: 'id', startTime: new Date() });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/time-entries', () => {
  it('returns time entries', async () => {
    const { token } = await getAuthToken();
    const res = await request(app).get('/api/time-entries').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/time-entries');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/time-entries/my-report', () => {
  it('returns personal time report', async () => {
    const { token } = await getAuthToken();
    const res = await request(app).get('/api/time-entries/my-report').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });
});

describe('PUT /api/time-entries/:id', () => {
  it('updates time entry', async () => {
    const { token } = await getAuthToken();
    const { taskId } = await setupTask(token);
    const createRes = await request(app)
      .post('/api/time-entries')
      .set('Authorization', `Bearer ${token}`)
      .send({ task: taskId, startTime: new Date(Date.now() - 3600000).toISOString(), endTime: new Date().toISOString() });
    const id = createRes.body._id || createRes.body.data?._id;

    const res = await request(app)
      .put(`/api/time-entries/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Updated description' });
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/time-entries/:id', () => {
  it('deletes time entry', async () => {
    const { token } = await getAuthToken();
    const { taskId } = await setupTask(token);
    const createRes = await request(app)
      .post('/api/time-entries')
      .set('Authorization', `Bearer ${token}`)
      .send({ task: taskId, startTime: new Date(Date.now() - 3600000).toISOString(), endTime: new Date().toISOString() });
    const id = createRes.body._id || createRes.body.data?._id;

    const res = await request(app).delete(`/api/time-entries/${id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
