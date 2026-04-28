import { describe, it, expect } from '@jest/globals';

// ─── Device detection (mirrors analytics.routes.js logic) ────────────────────
function getDevice(ua) {
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
    return /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
  }
  return 'desktop';
}

describe('getDevice()', () => {
  it('detects desktop browser', () => {
    expect(getDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120')).toBe('desktop');
    expect(getDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/120')).toBe('desktop');
  });

  it('detects Android mobile', () => {
    expect(getDevice('Mozilla/5.0 (Linux; Android 13; Pixel 7) Chrome/120 Mobile')).toBe('mobile');
    expect(getDevice('Dalvik/2.1.0 (Linux; Android 12)')).toBe('mobile');
  });

  it('detects iPhone', () => {
    expect(getDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17) Mobile/Safari')).toBe('mobile');
  });

  it('detects iPad as tablet', () => {
    expect(getDevice('Mozilla/5.0 (iPad; CPU OS 16) AppleWebKit')).toBe('tablet');
  });

  it('returns desktop for empty UA', () => {
    expect(getDevice('')).toBe('desktop');
    expect(getDevice(undefined)).toBe('desktop');
  });
});

// ─── Bot detection ────────────────────────────────────────────────────────────
const BOT_PATTERNS = /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|bingpreview/i;
function isBot(ua) { return BOT_PATTERNS.test(ua || ''); }

describe('Bot detection', () => {
  it('detects Googlebot', () => {
    expect(isBot('Googlebot/2.1 (+http://www.google.com/bot.html)')).toBe(true);
  });

  it('detects Bingbot', () => {
    expect(isBot('Mozilla/5.0 (compatible; bingbot/2.0)')).toBe(true);
  });

  it('detects crawlers', () => {
    expect(isBot('crawler/1.0')).toBe(true);
    expect(isBot('spider-test')).toBe(true);
  });

  it('does not flag real browsers', () => {
    expect(isBot('Mozilla/5.0 (Macintosh) Chrome/120')).toBe(false);
    expect(isBot('Mozilla/5.0 (iPhone; CPU iPhone OS 17)')).toBe(false);
  });

  it('handles empty/null UA gracefully', () => {
    expect(isBot('')).toBe(false);
    expect(isBot(null)).toBe(false);
    expect(isBot(undefined)).toBe(false);
  });
});

// ─── Pagination helpers ───────────────────────────────────────────────────────
function paginate(page = 1, limit = 20) {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 20));
  return { skip: (p - 1) * l, limit: l };
}

describe('paginate()', () => {
  it('defaults to page 1 limit 20', () => {
    expect(paginate()).toEqual({ skip: 0, limit: 20 });
  });

  it('calculates skip correctly', () => {
    expect(paginate(2, 20)).toEqual({ skip: 20, limit: 20 });
    expect(paginate(3, 10)).toEqual({ skip: 20, limit: 10 });
  });

  it('clamps limit to max 100', () => {
    expect(paginate(1, 999).limit).toBe(100);
  });

  it('clamps page to min 1', () => {
    expect(paginate(-5, 10).skip).toBe(0);
    expect(paginate(0, 10).skip).toBe(0);
  });

  it('handles string inputs', () => {
    expect(paginate('2', '15')).toEqual({ skip: 15, limit: 15 });
  });

  it('handles NaN inputs', () => {
    expect(paginate('abc', 'xyz')).toEqual({ skip: 0, limit: 20 });
  });
});

// ─── JWT token format validation ──────────────────────────────────────────────
function isValidJWTFormat(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(p => p.length > 0);
}

describe('JWT format validation', () => {
  it('accepts valid JWT format', () => {
    expect(isValidJWTFormat('aaa.bbb.ccc')).toBe(true);
    expect(isValidJWTFormat('eyJhbGci.eyJ1c2Vy.signature')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(isValidJWTFormat('notajwt')).toBe(false);
    expect(isValidJWTFormat('only.two')).toBe(false);
    expect(isValidJWTFormat('a.b.c.d')).toBe(false);
    expect(isValidJWTFormat('')).toBe(false);
    expect(isValidJWTFormat(null)).toBe(false);
    expect(isValidJWTFormat(undefined)).toBe(false);
    expect(isValidJWTFormat(123)).toBe(false);
  });
});

// ─── Date range helpers ───────────────────────────────────────────────────────
function isOverdue(dueDate, now = new Date()) {
  if (!dueDate) return false;
  return new Date(dueDate) < now;
}

describe('isOverdue()', () => {
  it('detects overdue tasks', () => {
    const yesterday = new Date(Date.now() - 86400000);
    expect(isOverdue(yesterday)).toBe(true);
  });

  it('future tasks are not overdue', () => {
    const tomorrow = new Date(Date.now() + 86400000);
    expect(isOverdue(tomorrow)).toBe(false);
  });

  it('handles null dueDate', () => {
    expect(isOverdue(null)).toBe(false);
    expect(isOverdue(undefined)).toBe(false);
  });
});

// ─── Scroll depth categorization ──────────────────────────────────────────────
function scrollCategory(depth) {
  if (depth >= 100) return 'full';
  if (depth >= 75)  return 'deep';
  if (depth >= 50)  return 'mid';
  if (depth >= 25)  return 'shallow';
  return 'minimal';
}

describe('scrollCategory()', () => {
  it('categorizes correctly', () => {
    expect(scrollCategory(100)).toBe('full');
    expect(scrollCategory(90)).toBe('deep');
    expect(scrollCategory(75)).toBe('deep');
    expect(scrollCategory(60)).toBe('mid');
    expect(scrollCategory(50)).toBe('mid');
    expect(scrollCategory(30)).toBe('shallow');
    expect(scrollCategory(25)).toBe('shallow');
    expect(scrollCategory(10)).toBe('minimal');
    expect(scrollCategory(0)).toBe('minimal');
  });
});
