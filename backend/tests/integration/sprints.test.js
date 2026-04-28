import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db.js';
import { getAuthToken } from '../helpers/auth.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

async function setupSprint(token) {
  const projRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Sprint Project' });
  const projectId = projRes.body._id || projRes.body.data?._id || projRes.body.project?._id;

  const sprintRes = await request(app)
    .post('/api/sprints')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Sprint 1', project: projectId,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      goal: 'Ship MVP',
    });
  const sprintId = sprintRes.body._id || sprintRes.body.data?._id || sprintRes.body.sprint?._id;
  return { projectId, sprintId, sprintRes };
}

describe('POST /api/sprints', () => {
  it('creates sprint', async () => {
    const { token } = await getAuthToken();
    const { sprintRes } = await setupSprint(token);
    expect(sprintRes.status).toBe(201);
  });

  it('requires start and end dates', async () => {
    const { token } = await getAuthToken();
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'P' });
    const projectId = projRes.body._id || projRes.body.data?._id;

    const res = await request(app)
      .post('/api/sprints')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No dates sprint', project: projectId });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/sprints').send({ name: 'S' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/sprints', () => {
  it('returns sprints list', async () => {
    const { token } = await getAuthToken();
    await setupSprint(token);
    const res = await request(app).get('/api/sprints').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const sprints = res.body.sprints || res.body.data || res.body;
    expect(Array.isArray(sprints)).toBe(true);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/sprints');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/sprints/:id', () => {
  it('returns sprint by id', async () => {
    const { token } = await getAuthToken();
    const { sprintId } = await setupSprint(token);
    const res = await request(app).get(`/api/sprints/${sprintId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent sprint', async () => {
    const { token } = await getAuthToken();
    const res = await request(app).get('/api/sprints/000000000000000000000000').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/sprints/:id', () => {
  it('updates sprint name', async () => {
    const { token } = await getAuthToken();
    const { sprintId } = await setupSprint(token);
    const res = await request(app)
      .put(`/api/sprints/${sprintId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sprint 1 Updated', status: 'active' });
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/sprints/:id', () => {
  it('deletes sprint', async () => {
    const { token } = await getAuthToken();
    const { sprintId } = await setupSprint(token);
    const res = await request(app).delete(`/api/sprints/${sprintId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('requires authentication', async () => {
    const res = await request(app).delete('/api/sprints/000000000000000000000000');
    expect(res.status).toBe(401);
  });
});
