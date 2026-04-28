import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db.js';
import { getAuthToken } from '../helpers/auth.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

// ─── Automations ──────────────────────────────────────────────────────────────
describe('POST /api/automations', () => {
  it('creates automation rule', async () => {
    const { token } = await getAuthToken();
    const res = await request(app)
      .post('/api/automations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Notify on overdue',
        trigger: { event: 'task.overdue', conditions: {} },
        actions: [{ type: 'notify_user', params: {} }],
      });
    expect(res.status).toBe(201);
  });

  it('requires trigger event', async () => {
    const { token } = await getAuthToken();
    const res = await request(app)
      .post('/api/automations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No trigger', actions: [] });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/automations').send({ name: 'R' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/automations', () => {
  it('returns automation rules', async () => {
    const { token } = await getAuthToken();
    const res = await request(app).get('/api/automations').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const rules = res.body.rules || res.body.data || res.body;
    expect(Array.isArray(rules)).toBe(true);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/automations');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/automations/:id/toggle', () => {
  it('toggles automation rule', async () => {
    const { token } = await getAuthToken();
    const createRes = await request(app)
      .post('/api/automations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Toggle me', trigger: { event: 'task.created' }, actions: [{ type: 'notify_user', params: {} }] });
    const id = createRes.body._id || createRes.body.data?._id;

    const res = await request(app)
      .patch(`/api/automations/${id}/toggle`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/automations/:id', () => {
  it('deletes automation rule', async () => {
    const { token } = await getAuthToken();
    const createRes = await request(app)
      .post('/api/automations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Delete me', trigger: { event: 'task.created' }, actions: [{ type: 'notify_user', params: {} }] });
    const id = createRes.body._id || createRes.body.data?._id;

    const res = await request(app).delete(`/api/automations/${id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

// ─── Webhooks ────────────────────────────────────────────────────────────────
describe('POST /api/webhooks', () => {
  it('creates webhook', async () => {
    const { token } = await getAuthToken();
    const res = await request(app)
      .post('/api/webhooks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'My Hook', url: 'https://example.com/hook',
        events: ['task.created', 'task.updated'],
      });
    expect(res.status).toBe(201);
  });

  it('requires url', async () => {
    const { token } = await getAuthToken();
    const res = await request(app)
      .post('/api/webhooks')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No URL', events: ['task.created'] });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/webhooks').send({ name: 'W', url: 'https://x.com' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/webhooks', () => {
  it('returns webhooks list', async () => {
    const { token } = await getAuthToken();
    const res = await request(app).get('/api/webhooks').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const hooks = res.body.webhooks || res.body.data || res.body;
    expect(Array.isArray(hooks)).toBe(true);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/webhooks');
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/webhooks/:id', () => {
  it('deletes webhook', async () => {
    const { token } = await getAuthToken();
    const createRes = await request(app)
      .post('/api/webhooks')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Delete Hook', url: 'https://example.com/hook', events: ['task.created'] });
    const id = createRes.body._id || createRes.body.data?._id;

    const res = await request(app).delete(`/api/webhooks/${id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
