import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db.js';
import { registerUser, loginUser, getAuthToken, VALID_PASSWORD } from '../helpers/auth.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

// helper to extract token/user from either response shape
function extractToken(body) { return body.data?.token || body.token; }
function extractUser(body)  { return body.data?.user  || body.user;  }

describe('POST /api/auth/register', () => {
  it('registers a new user successfully', async () => {
    const { res } = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(extractToken(res.body)).toBeDefined();
    expect(extractUser(res.body).email).toBeDefined();
    expect(extractUser(res.body).password).toBeUndefined();
  });

  it('returns 409 for duplicate email', async () => {
    const email = `dup_${Date.now()}@julay.org`;
    await registerUser({ email });
    const { res } = await registerUser({ email });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects weak password — too short', async () => {
    const { res } = await registerUser({ password: 'Short1!' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/12 characters/);
  });

  it('rejects password without uppercase', async () => {
    const { res } = await registerUser({ password: 'alllower1234!' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/uppercase/);
  });

  it('rejects password without number', async () => {
    const { res } = await registerUser({ password: 'NoNumbers!Abc' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/number/);
  });

  it('rejects password without special character', async () => {
    const { res } = await registerUser({ password: 'NoSpecialChar1A' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/special character/);
  });

  it('blocks honeypot (website field filled)', async () => {
    const { res } = await registerUser({ website: 'http://spambot.com' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid email format', async () => {
    const { res } = await registerUser({ email: 'notanemail' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });

  it('creates default org when none provided', async () => {
    const { res } = await registerUser({ organizationName: undefined });
    expect(res.status).toBe(201);
    expect(extractUser(res.body)).toBeDefined();
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const { payload } = await registerUser();
    const res = await loginUser(payload.email);
    expect(res.status).toBe(200);
    expect(extractToken(res.body)).toBeDefined();
    expect(extractUser(res.body)).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const { payload } = await registerUser();
    const res = await loginUser(payload.email, 'WrongPass123!');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects non-existent email', async () => {
    const res = await loginUser('nobody@julay.org');
    expect(res.status).toBe(401);
  });

  it('does not return password in response', async () => {
    const { payload } = await registerUser();
    const res = await loginUser(payload.email);
    expect(extractUser(res.body)?.password).toBeUndefined();
  });
});

describe('GET /api/auth/me', () => {
  it('returns current user with valid token', async () => {
    const { token } = await getAuthToken();
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const user = res.body.data || res.body.user || res.body;
    expect(user).toBeDefined();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });

  it('returns 401 with malformed auth header', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'NotBearer sometoken');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/change-password', () => {
  it('changes password successfully', async () => {
    const { token, email } = await getAuthToken();
    const newPassword = 'NewStrongPass2!';
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: VALID_PASSWORD, newPassword });
    expect(res.status).toBe(200);
    const loginRes = await loginUser(email, newPassword);
    expect(loginRes.status).toBe(200);
  });

  it('rejects wrong current password', async () => {
    const { token } = await getAuthToken();
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPass123!', newPassword: 'NewPass123!@' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('requires auth', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .send({ currentPassword: VALID_PASSWORD, newPassword: 'NewPass123!@' });
    expect(res.status).toBe(401);
  });
});
