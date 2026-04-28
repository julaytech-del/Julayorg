import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';

describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/this-does-not-exist');
    expect(res.status).toBe(404);
  });
});
