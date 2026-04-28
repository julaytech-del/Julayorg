import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db.js';
import { getAuthToken } from '../helpers/auth.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

async function createDept(token, name = 'Engineering') {
  return request(app)
    .post('/api/departments')
    .set('Authorization', `Bearer ${token}`)
    .send({ name, description: 'Test department', color: '#6366F1' });
}

describe('POST /api/departments', () => {
  it('creates department', async () => {
    const { token } = await getAuthToken();
    const res = await createDept(token);
    expect(res.status).toBe(201);
    expect(res.body.name || res.body.data?.name).toBeDefined();
  });

  it('requires name', async () => {
    const { token } = await getAuthToken();
    const res = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'No name' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/departments').send({ name: 'Dept' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/departments', () => {
  it('returns departments list', async () => {
    const { token } = await getAuthToken();
    await createDept(token, 'Design');
    await createDept(token, 'Marketing');

    const res = await request(app).get('/api/departments').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const depts = res.body.departments || res.body.data || res.body;
    expect(Array.isArray(depts)).toBe(true);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/departments');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/departments/:id', () => {
  it('updates department', async () => {
    const { token } = await getAuthToken();
    const createRes = await createDept(token);
    const id = createRes.body._id || createRes.body.data?._id;

    const res = await request(app)
      .put(`/api/departments/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Dept', color: '#10B981' });
    expect(res.status).toBe(200);
  });

  it('requires authentication', async () => {
    const res = await request(app).put('/api/departments/000000000000000000000000').send({ name: 'X' });
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/departments/:id', () => {
  it('deletes department', async () => {
    const { token } = await getAuthToken();
    const createRes = await createDept(token);
    const id = createRes.body._id || createRes.body.data?._id;

    const res = await request(app)
      .delete(`/api/departments/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('requires authentication', async () => {
    const res = await request(app).delete('/api/departments/000000000000000000000000');
    expect(res.status).toBe(401);
  });
});
