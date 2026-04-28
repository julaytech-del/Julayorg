import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db.js';
import { getAuthToken } from '../helpers/auth.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

describe('GET /api/calendar', () => {
  it('returns calendar events', async () => {
    const { token } = await getAuthToken();
    const res = await request(app).get('/api/calendar').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('accepts date range params', async () => {
    const { token } = await getAuthToken();
    const start = new Date().toISOString();
    const end = new Date(Date.now() + 30 * 86400000).toISOString();
    const res = await request(app)
      .get(`/api/calendar?start=${start}&end=${end}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/calendar');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/workload', () => {
  it('returns workload data', async () => {
    const { token } = await getAuthToken();
    const res = await request(app).get('/api/workload').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/workload');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/portfolio', () => {
  it('returns portfolio view data', async () => {
    const { token } = await getAuthToken();
    const res = await request(app).get('/api/portfolio').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/portfolio');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/reports/generate', () => {
  it('generates a report', async () => {
    const { token } = await getAuthToken();
    const res = await request(app)
      .post('/api/reports/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ period: 'week', projectId: null });
    // accepts 200 or 400 (if no data) but never 401/404
    expect([200, 400]).toContain(res.status);
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/reports/generate').send({});
    expect(res.status).toBe(401);
  });
});

describe('GET /api/activity', () => {
  it('returns activity log', async () => {
    const { token } = await getAuthToken();
    const res = await request(app).get('/api/activity').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/activity');
    expect(res.status).toBe(401);
  });
});
