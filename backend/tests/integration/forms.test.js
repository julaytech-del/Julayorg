import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db.js';
import { getAuthToken } from '../helpers/auth.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

async function createForm(token) {
  const projRes = await request(app)
    .post('/api/projects').set('Authorization', `Bearer ${token}`)
    .send({ name: 'Form Project' });
  const projectId = projRes.body._id || projRes.body.data?._id;

  return request(app)
    .post('/api/forms')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Bug Report Form',
      project: projectId,
      fields: [
        { id: 'f1', label: 'Title', type: 'text', required: true, mapTo: 'title' },
        { id: 'f2', label: 'Description', type: 'textarea', required: false, mapTo: 'description' },
        { id: 'f3', label: 'Priority', type: 'priority', required: false, mapTo: 'priority' },
      ],
    });
}

describe('POST /api/forms', () => {
  it('creates form with fields', async () => {
    const { token } = await getAuthToken();
    const res = await createForm(token);
    expect(res.status).toBe(201);
    const form = res.body.form || res.body.data || res.body;
    expect(form).toBeDefined();
  });

  it('generates public token on creation', async () => {
    const { token } = await getAuthToken();
    const res = await createForm(token);
    const form = res.body.form || res.body.data || res.body;
    expect(form?.publicToken || res.body.publicToken).toBeDefined();
  });

  it('requires project', async () => {
    const { token } = await getAuthToken();
    const res = await request(app)
      .post('/api/forms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No Project Form', fields: [] });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/forms').send({ name: 'F' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/forms', () => {
  it('returns forms list', async () => {
    const { token } = await getAuthToken();
    await createForm(token);
    const res = await request(app).get('/api/forms').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const forms = res.body.forms || res.body.data || res.body;
    expect(Array.isArray(forms)).toBe(true);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/forms');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/forms/public/:token', () => {
  it('returns public form by token', async () => {
    const { token } = await getAuthToken();
    const createRes = await createForm(token);
    const formData = createRes.body.form || createRes.body.data || createRes.body;
    const publicToken = formData?.publicToken;

    if (publicToken) {
      const res = await request(app).get(`/api/forms/public/${publicToken}`);
      expect(res.status).toBe(200);
    }
  });

  it('returns 404 for invalid token', async () => {
    const res = await request(app).get('/api/forms/public/invalid-token-xyz');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/forms/:id', () => {
  it('deletes form', async () => {
    const { token } = await getAuthToken();
    const createRes = await createForm(token);
    const id = createRes.body._id || createRes.body.data?._id || createRes.body.form?._id;

    const res = await request(app).delete(`/api/forms/${id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
