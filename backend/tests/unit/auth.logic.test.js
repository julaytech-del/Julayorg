import { describe, it, expect } from '@jest/globals';

// ─── Password validation (extracted logic mirror) ─────────────────────────
function validatePassword(pwd) {
  if (!pwd || pwd.length < 12) return 'Password must be at least 12 characters';
  if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
  if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number';
  if (!/[^A-Za-z0-9]/.test(pwd)) return 'Password must contain at least one special character';
  return null;
}

describe('validatePassword', () => {
  it('accepts strong password', () => {
    expect(validatePassword('StrongPass1!')).toBeNull();
    expect(validatePassword('MySecret123@')).toBeNull();
    expect(validatePassword('Julay2026#App')).toBeNull();
  });

  it('rejects password shorter than 12 chars', () => {
    expect(validatePassword('Short1!')).toMatch(/12 characters/);
    expect(validatePassword('Ab1!')).toMatch(/12 characters/);
  });

  it('rejects password without uppercase', () => {
    expect(validatePassword('alllowercase1!')).toMatch(/uppercase/);
  });

  it('rejects password without number', () => {
    expect(validatePassword('NoNumbers!Abc')).toMatch(/number/);
  });

  it('rejects password without special character', () => {
    expect(validatePassword('NoSpecialChar1A')).toMatch(/special character/);
  });

  it('rejects null/undefined', () => {
    expect(validatePassword(null)).toMatch(/12 characters/);
    expect(validatePassword(undefined)).toMatch(/12 characters/);
    expect(validatePassword('')).toMatch(/12 characters/);
  });
});

// ─── Email validation ──────────────────────────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('user@julay.org')).toBe(true);
    expect(isValidEmail('hello+tag@example.com')).toBe(true);
    expect(isValidEmail('a@b.co')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('missing@tld')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('spaces @test.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

// ─── Honeypot check ────────────────────────────────────────────────────────
function isBot(website) {
  return !!website;
}

describe('Honeypot (website field)', () => {
  it('detects bot when website is filled', () => {
    expect(isBot('http://spamsite.com')).toBe(true);
    expect(isBot('anything')).toBe(true);
  });

  it('passes legitimate users with empty website', () => {
    expect(isBot('')).toBe(false);
    expect(isBot(undefined)).toBe(false);
    expect(isBot(null)).toBe(false);
  });
});
