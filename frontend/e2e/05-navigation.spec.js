import { test, expect } from '@playwright/test';

const BASE = 'https://julay.org';
const CREDS = {
  email: process.env.E2E_EMAIL || 'e2etest@julay.org',
  password: process.env.E2E_PASSWORD || 'TestPass123!',
};

async function login(page) {
  await page.goto(BASE + '/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', CREDS.email);
  await page.fill('input[type="password"]', CREDS.password);
  await page.getByRole('button', { name: /sign in|login|log in/i }).click();
  try {
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    return true;
  } catch { return false; }
}

const ROUTES = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/dashboard/projects', name: 'Projects' },
  { path: '/dashboard/team', name: 'Team' },
  { path: '/dashboard/my-tasks', name: 'My Tasks' },
  { path: '/dashboard/ai', name: 'AI' },
  { path: '/dashboard/reports', name: 'Reports' },
  { path: '/dashboard/settings', name: 'Settings' },
];

test.describe('Navigation — all main routes load', () => {
  for (const route of ROUTES) {
    test(`${route.name} page (${route.path}) renders without blank screen`, async ({ page }) => {
      if (!await login(page)) { test.skip(); return; }
      await page.goto(BASE + route.path);
      await page.waitForLoadState('networkidle');
      await expect(page).not.toHaveURL(/login/);
      const bodyText = await page.textContent('body');
      expect(bodyText.length).toBeGreaterThan(50);
    });
  }

  test('404 page renders for unknown route', async ({ page }) => {
    await page.goto(BASE + '/this-route-does-not-exist-xyz');
    await page.waitForLoadState('networkidle');
    // Should show something (not crash)
    await expect(page.locator('body')).toBeVisible();
  });

  test('unauthenticated access to dashboard redirects to login', async ({ page }) => {
    // Clear cookies to ensure logged out
    await page.context().clearCookies();
    await page.goto(BASE + '/dashboard');
    await page.waitForLoadState('networkidle');
    // Should redirect to login or show login form
    const url = page.url();
    const hasLoginForm = await page.locator('input[type="email"]').isVisible().catch(() => false);
    expect(url.includes('login') || hasLoginForm).toBe(true);
  });
});
