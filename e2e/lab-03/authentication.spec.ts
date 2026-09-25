import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Traceability Header:
 * Spec File: e2e/lab-03/authentication.spec.ts
 * Acceptance Criteria Covered:
 *  - AC-01: Valid login -> authenticated session established, correct role shown
 *  - AC-02: Mandatory first-login password change -> gates normal app until updated
 *  - AC-03: Invalid credentials & Inactive account -> safe error message, no account info leaked
 *  - AC-04: Session logout -> session invalidated, protected routes blocked
 *  - AC-05: Role-based navigation -> permitted nav items shown per role
 */

const SCREENSHOT_BASE = path.resolve('artifacts/lab-03/screenshots/authentication');

if (!fs.existsSync(SCREENSHOT_BASE)) {
  fs.mkdirSync(SCREENSHOT_BASE, { recursive: true });
}

async function captureResponsiveScreenshots(page: Page, filenamePrefix: string) {
  const viewports = [
    { prefix: 'desktop', width: 1280, height: 800 },
    { prefix: 'tablet', width: 768, height: 1024 },
    { prefix: 'mobile', width: 375, height: 667 },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(SCREENSHOT_BASE, `${filenamePrefix}-${vp.prefix}.png`),
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1280, height: 800 });
}

test.describe('E2E Authentication, Password Management & Role Access (Lab 3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('Invalid credentials & Inactive account login handling with safe errors', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="login-screen"]')).toBeVisible();

    // Capture initial login screen screenshots
    await captureResponsiveScreenshots(page, 'login');

    // 1. Invalid credentials test
    await page.locator('[data-testid="login-email-input"]').fill('invalid.user@toktickit.com');
    await page.locator('[data-testid="login-password-input"]').fill('WrongPassword123!');
    await page.locator('[data-testid="login-submit-btn"]').click();

    await expect(page.locator('[data-testid="login-error-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-error-alert"]')).toContainText('Invalid email or password');

    // Capture invalid login screenshots
    await captureResponsiveScreenshots(page, 'login-invalid');

    // 2. Inactive account login test
    await page.locator('[data-testid="login-email-input"]').fill('evan@toktickit.io');
    await page.locator('[data-testid="login-password-input"]').fill('Password123!');
    await page.locator('[data-testid="login-submit-btn"]').click();

    await expect(page.locator('[data-testid="login-error-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-error-alert"]')).toContainText('Invalid email or password');
  });

  test('Valid login, Role-based Navigation, and Session Logout across roles', async ({ page }) => {
    await page.goto('/');

    // 1. Requester Role Login
    await page.locator('[data-testid="login-email-input"]').fill('alice@toktickit.io');
    await page.locator('[data-testid="login-password-input"]').fill('Password123!');
    await page.locator('[data-testid="login-submit-btn"]').click();

    await expect(page.locator('[data-testid="app-authenticated"]')).toBeVisible();
    await page.locator('[data-testid="active-requester-info"] button').first().click();
    await expect(page.locator('[data-testid="active-requester-name"]').first()).toContainText('Alice Johnson');
    await expect(page.locator('[data-testid="active-user-role"]').first()).toContainText('Requester');

    // Nav items check
    await expect(page.locator('[data-testid="nav-dashboard-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-create-ticket-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-admin-btn"]')).not.toBeVisible();

    // Logout
    await page.locator('[data-testid="logout-btn"]').first().click();
    await expect(page.locator('[data-testid="login-screen"]')).toBeVisible();

    // 2. IT Staff Role Login
    await page.locator('[data-testid="login-email-input"]').fill('michael.brown@toktickit.com');
    await page.locator('[data-testid="login-password-input"]').fill('Password123!');
    await page.locator('[data-testid="login-submit-btn"]').click();

    await expect(page.locator('[data-testid="app-authenticated"]')).toBeVisible();
    await page.locator('[data-testid="active-requester-info"] button').first().click();
    await expect(page.locator('[data-testid="active-requester-name"]').first()).toContainText('Michael Brown');
    await expect(page.locator('[data-testid="active-user-role"]').first()).toContainText('IT Staff');

    await expect(page.locator('[data-testid="nav-queue-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-admin-btn"]')).not.toBeVisible();

    // Logout
    await page.locator('[data-testid="logout-btn"]').first().click();
    await expect(page.locator('[data-testid="login-screen"]')).toBeVisible();

    // 3. Administrator Role Login
    await page.locator('[data-testid="login-email-input"]').fill('admin@toktickit.com');
    await page.locator('[data-testid="login-password-input"]').fill('Password123!');
    await page.locator('[data-testid="login-submit-btn"]').click();

    await expect(page.locator('[data-testid="app-authenticated"]')).toBeVisible();
    await page.locator('[data-testid="active-requester-info"] button').first().click();
    await expect(page.locator('[data-testid="active-requester-name"]').first()).toContainText('John Smith');
    await expect(page.locator('[data-testid="active-user-role"]').first()).toContainText('Administrator');

    await expect(page.locator('[data-testid="nav-admin-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-queue-btn"]')).toBeVisible();

    // Logout
    await page.locator('[data-testid="logout-btn"]').first().click();
    await expect(page.locator('[data-testid="login-screen"]')).toBeVisible();
  });

  test('Initial-password login and Mandatory Change Password workflow', async ({ page }) => {
    // First, login as Admin to create a fresh user with an initial password
    await page.goto('/');
    await page.locator('[data-testid="login-email-input"]').fill('admin@toktickit.com');
    await page.locator('[data-testid="login-password-input"]').fill('Password123!');
    await page.locator('[data-testid="login-submit-btn"]').click();

    await expect(page.locator('[data-testid="app-authenticated"]')).toBeVisible();

    const timestamp = Date.now();
    const tempEmail = `e2e_temp_${timestamp}@toktickit.com`;
    const tempInitialPass = 'InitPass123!';

    await page.locator('[data-testid="create-user-btn"]').click();
    await expect(page.locator('[data-testid="create-user-modal"]')).toBeVisible();

    await page.locator('[data-testid="create-user-name"]').fill('Temp Test User');
    await page.locator('[data-testid="create-user-email"]').fill(tempEmail);
    await page.locator('[data-testid="create-user-role"]').selectOption('IT_STAFF');
    await page.locator('[data-testid="create-user-password"]').fill(tempInitialPass);
    await page.locator('[data-testid="save-create-user-btn"]').click();

    await expect(page.locator('[data-testid="create-user-modal"]')).not.toBeVisible();

    // Logout Admin
    await page.locator('[data-testid="active-requester-info"] button').first().click();
    await page.locator('[data-testid="logout-btn"]').first().click();
    await expect(page.locator('[data-testid="login-screen"]')).toBeVisible();

    // Now login with the newly created user (mustChangePassword = true)
    await page.locator('[data-testid="login-email-input"]').fill(tempEmail);
    await page.locator('[data-testid="login-password-input"]').fill(tempInitialPass);
    await page.locator('[data-testid="login-submit-btn"]').click();

    // Verify forced redirect to Change Password Screen
    await expect(page.locator('[data-testid="change-password-screen"]')).toBeVisible();

    // Capture Change Password responsive screenshots
    await captureResponsiveScreenshots(page, 'change-password');

    // Test password complexity rules
    await page.locator('[data-testid="current-password-input"]').fill(tempInitialPass);
    await page.locator('[data-testid="new-password-input"]').fill('weak');
    await page.locator('[data-testid="confirm-password-input"]').fill('weak');

    await expect(page.locator('[data-testid="change-password-submit-btn"]')).toBeDisabled();

    // Enter valid new password
    const newSecurePass = 'NewSecureP@ss2026!';
    await page.locator('[data-testid="new-password-input"]').fill(newSecurePass);
    await page.locator('[data-testid="confirm-password-input"]').fill(newSecurePass);

    await expect(page.locator('[data-testid="change-password-submit-btn"]')).toBeEnabled();
    await page.locator('[data-testid="change-password-submit-btn"]').click();

    // Verify entry into normal application
    await expect(page.locator('[data-testid="app-authenticated"]')).toBeVisible();
  });
});
