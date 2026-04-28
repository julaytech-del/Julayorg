import request from 'supertest';
import app from '../../src/app.js';

const VALID_PASSWORD = 'TestPass123!';

export async function registerUser(overrides = {}) {
  const payload = {
    name: 'Test User',
    email: `test_${Date.now()}_${Math.random().toString(36).slice(2)}@julay.org`,
    password: VALID_PASSWORD,
    organizationName: 'Test Org',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  return { res, payload };
}

export async function loginUser(email, password = VALID_PASSWORD) {
  return request(app).post('/api/auth/login').send({ email, password });
}

export async function getAuthToken(overrides = {}) {
  const { res, payload } = await registerUser(overrides);
  const token = res.body.data?.token || res.body.token;
  const user  = res.body.data?.user  || res.body.user;
  return { token, user, email: payload.email };
}

export { VALID_PASSWORD };
