import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db.js';
import { getAuthToken } from '../helpers/auth.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

async function createProject(token, overrides = {}) {
  return request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test Project', description: 'A test project', ...overrides });
}

describe('POST /api/projects', () => {
  it('creates project with valid data', async () => {
    const { token } = await getAuthToken();
    const res = await createProject(token);
    expect(res.status).toBe(201);
    expect(res.body.name || res.body.data?.name || res.body.project?.name).toBeDefined();
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/projects').send({ name: 'Proj' });
    expect(res.status).toBe(401);
  });

  it('requires project name', async () => {
    const { token } = await getAuthToken();
    const res = await createProject(token, { name: '' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('creates project with all optional fields', async () => {
    const { token } = await getAuthToken();
    const res = await createProject(token, {
      name: 'Full Project',
      description: 'Complete project',
      status: 'active',
      priority: 'high',
      industry: 'technology',
    });
    expect(res.status).toBe(201);
  });
});

describe('GET /api/projects', () => {
  it('returns list of projects for authenticated user', async () => {
    const { token } = await getAuthToken();
    await createProject(token, { name: 'Project A' });
    await createProject(token, { name: 'Project B' });

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const projects = res.body.projects || res.body.data || res.body;
    expect(Array.isArray(projects)).toBe(true);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });

  it('does not return projects from other orgs', async () => {
    const { token: token1 } = await getAuthToken({ email: `org1_${Date.now()}@julay.org` });
    const { token: token2 } = await getAuthToken({ email: `org2_${Date.now()}@julay.org` });

    await createProject(token1, { name: 'Org1 Project' });

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token2}`);
    expect(res.status).toBe(200);
    const projects = res.body.projects || res.body.data || res.body;
    expect(Array.isArray(projects) ? projects.length : 0).toBe(0);
  });
});

describe('GET /api/projects/:id', () => {
  it('returns project by id', async () => {
    const { token } = await getAuthToken();
    const createRes = await createProject(token);
    const id = createRes.body._id || createRes.body.data?._id || createRes.body.project?._id;

    const res = await request(app)
      .get(`/api/projects/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent project', async () => {
    const { token } = await getAuthToken();
    const res = await request(app)
      .get('/api/projects/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/projects/some-id');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/projects/:id', () => {
  it('updates project name', async () => {
    const { token } = await getAuthToken();
    const createRes = await createProject(token);
    const id = createRes.body._id || createRes.body.data?._id || createRes.body.project?._id;

    const res = await request(app)
      .put(`/api/projects/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
  });

  it('updates project status', async () => {
    const { token } = await getAuthToken();
    const createRes = await createProject(token);
    const id = createRes.body._id || createRes.body.data?._id || createRes.body.project?._id;

    const res = await request(app)
      .put(`/api/projects/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'active' });
    expect(res.status).toBe(200);
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .put('/api/projects/000000000000000000000000')
      .send({ name: 'X' });
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/projects/:id', () => {
  it('deletes project', async () => {
    const { token } = await getAuthToken();
    const createRes = await createProject(token);
    const id = createRes.body._id || createRes.body.data?._id || createRes.body.project?._id;

    const res = await request(app)
      .delete(`/api/projects/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('requires authentication', async () => {
    const res = await request(app).delete('/api/projects/000000000000000000000000');
    expect(res.status).toBe(401);
  });
});
