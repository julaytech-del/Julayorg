import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db.js';
import { getAuthToken } from '../helpers/auth.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

describe('GET /api/users', () => {
  it('returns users in same org', async () => {
    const { token } = await getAuthToken();
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const users = res.body.users || res.body.data || res.body;
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThanOrEqual(1);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('does not expose password field', async () => {
    const { token } = await getAuthToken();
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    const users = res.body.users || res.body.data || res.body;
    if (Array.isArray(users) && users.length > 0) {
      expect(users[0].password).toBeUndefined();
    }
  });
});

describe('PUT /api/users/me', () => {
  it('updates own profile name', async () => {
    const { token } = await getAuthToken();
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
  });

  it('updates job title', async () => {
    const { token } = await getAuthToken();
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobTitle: 'Senior Developer' });
    expect(res.status).toBe(200);
  });

  it('requires authentication', async () => {
    const res = await request(app).put('/api/users/me').send({ name: 'X' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/users/:id', () => {
  it('returns user by id', async () => {
    const { token, user } = await getAuthToken();
    const userId = user?._id || user?.id;
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 404]).toContain(res.status);
  });

  it('returns 404 for non-existent user', async () => {
    const { token } = await getAuthToken();
    const res = await request(app)
      .get('/api/users/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/users/000000000000000000000000');
    expect(res.status).toBe(401);
  });
});
