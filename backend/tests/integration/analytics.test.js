import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db.js';

process.env.ANALYTICS_SECRET = 'test-analytics-secret-123';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

const SECRET = 'test-analytics-secret-123';

function track(payload) {
  return request(app)
    .post('/api/analytics/track')
    .send(payload)
    .set('Content-Type', 'application/json');
}

describe('POST /api/analytics/track', () => {
  it('accepts valid pageview', async () => {
    const res = await track({ url: '/', sessionId: 'sess1', eventType: 'pageview', referrer: '' });
    expect(res.status).toBe(204);
  });

  it('accepts click event', async () => {
    const res = await track({ url: '/', sessionId: 'sess2', eventType: 'click', element: 'سجل مجاناً' });
    expect(res.status).toBe(204);
  });

  it('accepts scroll event', async () => {
    const res = await track({ url: '/', sessionId: 'sess3', eventType: 'scroll', scrollDepth: 75 });
    expect(res.status).toBe(204);
  });

  it('accepts session_end with duration', async () => {
    const res = await track({ url: '/', sessionId: 'sess4', eventType: 'session_end', duration: 120 });
    expect(res.status).toBe(204);
  });

  it('ignores bots (Googlebot)', async () => {
    const res = await request(app)
      .post('/api/analytics/track')
      .set('User-Agent', 'Googlebot/2.1')
      .send({ url: '/', sessionId: 'bot1' });
    expect(res.status).toBe(204);
  });

  it('returns 204 even without sessionId (graceful reject)', async () => {
    const res = await track({ url: '/' });
    expect(res.status).toBe(204);
  });
});

describe('GET /api/analytics/stats', () => {
  it('returns stats with correct secret', async () => {
    await track({ url: '/', sessionId: 's1', eventType: 'pageview', referrer: '' });
    await track({ url: '/pricing', sessionId: 's1', eventType: 'pageview', referrer: '' });

    const res = await request(app).get(`/api/analytics/stats?key=${SECRET}`);
    expect(res.status).toBe(200);
    expect(res.body.today).toBeGreaterThanOrEqual(2);
    expect(res.body.week).toBeGreaterThanOrEqual(2);
    expect(res.body).toHaveProperty('funnel');
    expect(res.body).toHaveProperty('deviceBreakdown');
    expect(res.body).toHaveProperty('bounceRate');
    expect(res.body).toHaveProperty('avgDuration');
    expect(res.body).toHaveProperty('topPages');
    expect(res.body).toHaveProperty('topReferrers');
    expect(res.body).toHaveProperty('daily');
  });

  it('returns 401 without key', async () => {
    const res = await request(app).get('/api/analytics/stats');
    expect(res.status).toBe(401);
  });

  it('returns 401 with wrong key', async () => {
    const res = await request(app).get('/api/analytics/stats?key=wrongkey');
    expect(res.status).toBe(401);
  });

  it('tracks funnel correctly', async () => {
    // session goes through full funnel
    await track({ url: '/',         sessionId: 'funnel1', eventType: 'pageview' });
    await track({ url: '/pricing',  sessionId: 'funnel1', eventType: 'pageview' });
    await track({ url: '/register', sessionId: 'funnel1', eventType: 'pageview' });
    await track({ url: '/dashboard',sessionId: 'funnel1', eventType: 'pageview' });

    const res = await request(app).get(`/api/analytics/stats?key=${SECRET}`);
    expect(res.body.funnel.home).toBeGreaterThanOrEqual(1);
    expect(res.body.funnel.pricing).toBeGreaterThanOrEqual(1);
    expect(res.body.funnel.register).toBeGreaterThanOrEqual(1);
    expect(res.body.funnel.dashboard).toBeGreaterThanOrEqual(1);
  });

  it('tracks click events separately from pageviews', async () => {
    await track({ url: '/', sessionId: 'clk1', eventType: 'pageview' });
    await track({ url: '/', sessionId: 'clk1', eventType: 'click', element: 'سجل مجاناً' });

    const res = await request(app).get(`/api/analytics/stats?key=${SECRET}`);
    expect(res.body.topClicks.length).toBeGreaterThanOrEqual(1);
    expect(res.body.topClicks[0].element).toBe('سجل مجاناً');
  });
});
