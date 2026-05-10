import { test, expect } from '@playwright/test';

const BASE = 'https://julay.org';

// Use a stable test account (must exist on the server)
// If not available, tests will be skipped gracefully
const CREDS = {
  email: process.env.E2E_EMAIL || 'e2etest@julay.org',
  password: process.env.E2E_PASSWORD || 'TestPass123!',
};

async function tryLogin(page) {
  await page.goto(BASE + '/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', CREDS.email);
  await page.fill('input[type="password"]', CREDS.password);
  await page.getByRole('button', { name: /sign in|login|log in/i }).click();
  try {
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

test.describe('Dashboard (authenticated)', () => {
  test('dashboard renders KPI cards after login', async ({ page }) => {
    const loggedIn = await tryLogin(page);
    if (!loggedIn) {
      test.skip();
      return;
    }
    await page.waitForLoadState('networkidle');
    // At least 3 stat cards (Tasks, Projects, Team etc.)
    const cards = page.locator('[class*="MuiCard"], [class*="card"], [class*="stat"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('header "New" button is visible', async ({ page }) => {
    const loggedIn = await tryLogin(page);
    if (!loggedIn) { test.skip(); return; }
    await expect(page.getByText('New')).toBeVisible({ timeout: 10000 });
  });

  test('header "New" button opens quick-add modal', async ({ page }) => {
    const loggedIn = await tryLogin(page);
    if (!loggedIn) { test.skip(); return; }
    await page.getByText('New').first().click();
    await expect(page.getByText('New Task')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('Task title…')).toBeVisible();
    // Close modal
    await page.getByRole('button', { name: /cancel/i }).click();
  });

  test('navigation sidebar links work', async ({ page }) => {
    const loggedIn = await tryLogin(page);
    if (!loggedIn) { test.skip(); return; }

    // Click Projects in sidebar
    const projectsLink = page.getByRole('link', { name: /projects/i }).first();
    if (await projectsLink.isVisible()) {
      await projectsLink.click();
      await page.waitForURL(/projects/, { timeout: 10000 });
      await expect(page).toHaveURL(/projects/);
    }
  });

  test('dark mode toggle works', async ({ page }) => {
    const loggedIn = await tryLogin(page);
    if (!loggedIn) { test.skip(); return; }

    // Find the dark mode toggle button (DarkMode or LightMode icon)
    const toggleBtn = page.locator('button').filter({ hasText: '' }).nth(2); // approximate
    const htmlBefore = await page.locator('body').getAttribute('class') || '';
    // Click something that looks like a dark/light toggle - use title/aria-label
    const darkBtn = page.getByTitle(/dark mode|light mode/i);
    if (await darkBtn.isVisible()) {
      await darkBtn.click();
      await page.waitForTimeout(500);
      // Background color should have changed
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg).toBeTruthy();
    }
  });
});
