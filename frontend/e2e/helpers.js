// Shared helpers for E2E tests

export const TEST_USER = {
  name: 'E2E Tester',
  email: `e2e_${Date.now()}@julay-test.org`,
  password: 'TestPass123!',
  orgName: 'E2E Test Org',
};

/**
 * Register a fresh user and land on the dashboard.
 * Returns the unique email used (for login tests).
 */
export async function registerAndLogin(page, overrides = {}) {
  const user = { ...TEST_USER, email: `e2e_${Date.now()}@julay-test.org`, ...overrides };

  await page.goto('/register');
  await page.waitForURL('**/register');

  await page.fill('input[type="text"]', user.name);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[name="organizationName"], input[placeholder*="organization" i], input[placeholder*="company" i]', user.orgName).catch(() => {});
  // Fill password fields
  const pwdInputs = await page.locator('input[type="password"]').all();
  for (const inp of pwdInputs) {
    await inp.fill(user.password);
  }

  await page.getByRole('button', { name: /create account|sign up|register/i }).click();

  // Wait for dashboard redirect
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  return user;
}

/**
 * Login with email + password, navigate to dashboard.
 */
export async function loginAs(page, email, password = TEST_USER.password) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.getByRole('button', { name: /sign in|login|log in/i }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
}
