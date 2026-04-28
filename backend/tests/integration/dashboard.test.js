import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db.js';
import { getAuthToken } from '../helpers/auth.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

describe('GET /api/dashboard', () => {
  it('returns dashboard stats', async () => {
    const { token } = await getAuthToken();
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/dashboard/activity', () => {
  it('returns activity feed', async () => {
    const { token } = await getAuthToken();
    const res = await request(app).get('/api/dashboard/activity').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/dashboard/activity');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/search', () => {
  it('returns search results (empty query)', async () => {
    const { token } = await getAuthToken();
    const res = await request(app)
      .get('/api/search?q=')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 400]).toContain(res.status);
  });

  it('returns search results for query', async () => {
    const { token } = await getAuthToken();
    const res = await request(app)
      .get('/api/search?q=test')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/search?q=test');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/notifications', () => {
  it('returns notifications list', async () => {
    const { token } = await getAuthToken();
    const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const notifs = res.body.notifications || res.body.data || res.body;
    expect(Array.isArray(notifs)).toBe(true);
  });

  it('returns notification count', async () => {
    const { token } = await getAuthToken();
    const res = await request(app).get('/api/notifications/count').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.count !== undefined || res.body.unread !== undefined).toBe(true);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/my-tasks', () => {
  it('returns personal task list', async () => {
    const { token } = await getAuthToken();
    const res = await request(app).get('/api/my-tasks').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/my-tasks');
    expect(res.status).toBe(401);
  });
});
