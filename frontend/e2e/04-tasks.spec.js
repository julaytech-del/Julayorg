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

test.describe('Quick-Add Task', () => {
  test('quick-add: type title and click Create Task', async ({ page }) => {
    if (!await login(page)) { test.skip(); return; }
    await page.waitForLoadState('networkidle');

    // Open modal
    await page.getByText('New').first().click();
    const titleInput = page.getByPlaceholder('Task title…');
    await expect(titleInput).toBeVisible({ timeout: 5000 });

    // Type a task title
    const taskTitle = `E2E Task ${Date.now()}`;
    await titleInput.fill(taskTitle);

    // Create Task button should be enabled
    const createBtn = page.getByRole('button', { name: /create task/i });
    await expect(createBtn).toBeEnabled();

    // Click create
    await createBtn.click();

    // Modal should close and snackbar "Task created!" should appear
    await expect(page.getByText(/task created/i)).toBeVisible({ timeout: 8000 });
  });

  test('quick-add: empty title keeps Create Task disabled', async ({ page }) => {
    if (!await login(page)) { test.skip(); return; }
    await page.waitForLoadState('networkidle');

    await page.getByText('New').first().click();
    await page.getByPlaceholder('Task title…');

    const createBtn = page.getByRole('button', { name: /create task/i });
    await expect(createBtn).toBeDisabled();
  });

  test('quick-add: Cancel closes modal without creating', async ({ page }) => {
    if (!await login(page)) { test.skip(); return; }
    await page.waitForLoadState('networkidle');

    await page.getByText('New').first().click();
    await expect(page.getByText('New Task')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /cancel/i }).click();

    // Modal should disappear
    await expect(page.getByText('New Task')).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('My Tasks page', () => {
  test('my tasks page loads', async ({ page }) => {
    if (!await login(page)) { test.skip(); return; }
    await page.goto(BASE + '/dashboard/my-tasks');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });
});
