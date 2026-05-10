import { test, expect } from '@playwright/test';

const BASE = 'https://julay.org';

test.describe('Authentication', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto(BASE + '/');
    await expect(page).toHaveTitle(/.+/);
    // Page must not be a blank error page
    const body = await page.textContent('body');
    expect(body.length).toBeGreaterThan(100);
  });

  test('login page renders email and password fields', async ({ page }) => {
    await page.goto(BASE + '/login');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login|log in/i })).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto(BASE + '/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'nobody@nowhere.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.getByRole('button', { name: /sign in|login|log in/i }).click();
    // Should show an error, not navigate away
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/login/);
  });

  test('register page renders required fields', async ({ page }) => {
    await page.goto(BASE + '/register');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('register with mismatched passwords stays on register page', async ({ page }) => {
    await page.goto(BASE + '/register');
    await page.waitForLoadState('networkidle');
    const emailInput = page.locator('input[type="email"]');
    const passwordInputs = await page.locator('input[type="password"]').all();
    await emailInput.fill('test@example.com');
    if (passwordInputs.length >= 2) {
      await passwordInputs[0].fill('TestPass123!');
      await passwordInputs[1].fill('DifferentPass456!');
      await page.getByRole('button', { name: /create|register|sign up/i }).click();
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/register/);
    }
  });
});
