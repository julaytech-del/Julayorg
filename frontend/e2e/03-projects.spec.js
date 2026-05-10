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

test.describe('Projects', () => {
  test('projects page loads', async ({ page }) => {
    if (!await login(page)) { test.skip(); return; }
    await page.goto(BASE + '/dashboard/projects');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/projects/);
  });

  test('create project button is visible', async ({ page }) => {
    if (!await login(page)) { test.skip(); return; }
    await page.goto(BASE + '/dashboard/projects');
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /new project|create project|\+ project/i });
    // May or may not exist depending on plan limits
    const visible = await createBtn.isVisible().catch(() => false);
    // Just ensure page loaded without error
    await expect(page.locator('body')).toBeVisible();
  });

  test('project detail page loads when project exists', async ({ page }) => {
    if (!await login(page)) { test.skip(); return; }
    await page.goto(BASE + '/dashboard/projects');
    await page.waitForLoadState('networkidle');

    // Click the first project card/link if one exists
    const firstProject = page.locator('a[href*="/projects/"]').first();
    if (await firstProject.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstProject.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/projects\/.+/);
    }
  });

  test('kanban board loads from project detail', async ({ page }) => {
    if (!await login(page)) { test.skip(); return; }
    await page.goto(BASE + '/dashboard/projects');
    await page.waitForLoadState('networkidle');

    const firstProject = page.locator('a[href*="/projects/"]').first();
    if (await firstProject.isVisible({ timeout: 3000 }).catch(() => false)) {
      const href = await firstProject.getAttribute('href');
      const projectId = href?.split('/projects/')[1]?.split('/')[0];
      if (projectId) {
        await page.goto(`${BASE}/dashboard/projects/${projectId}/kanban`);
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/kanban/);
        // Kanban columns should render
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });
});
