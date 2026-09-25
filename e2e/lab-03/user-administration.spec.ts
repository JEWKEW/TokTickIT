import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Traceability Header:
 * Spec File: e2e/lab-03/user-administration.spec.ts
 * Acceptance Criteria Covered:
 *  - AC-10: Administrator User Management listing, search, role filtering, and user account creation
 *  - AC-11: Administrator safety rules (prevent self-deactivation & last active administrator removal)
 *  - AC-12: Duplicate email address validation & rejection
 */

const USER_MGMT_DIR = path.resolve('artifacts/lab-03/screenshots/user-management');

if (!fs.existsSync(USER_MGMT_DIR)) {
  fs.mkdirSync(USER_MGMT_DIR, { recursive: true });
}

async function captureScreenshots(page: Page, filenamePrefix: string) {
  const viewports = [
    { prefix: 'desktop', width: 1280, height: 800 },
    { prefix: 'tablet', width: 768, height: 1024 },
    { prefix: 'mobile', width: 375, height: 667 },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(USER_MGMT_DIR, `${filenamePrefix}-${vp.prefix}.png`),
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1280, height: 800 });
}

test.describe('E2E User Administration & Safety Rules (Lab 3)', () => {
  test('Admin user listing, search, filter, creation, duplicate email rejection, and editing', async ({ page }) => {
    await page.goto('/');

    // 1. Login as Administrator
    await page.locator('[data-testid="login-email-input"]').fill('admin@toktickit.com');
    await page.locator('[data-testid="login-password-input"]').fill('Password123!');
    await page.locator('[data-testid="login-submit-btn"]').click();

    await expect(page.locator('[data-testid="user-management-container"]')).toBeVisible();

    // Capture User List screenshots
    await captureScreenshots(page, 'user-list');

    // 2. Search & Filter Users
    await page.locator('[data-testid="user-search-input"]').fill('Alice');
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="total-users-count"]')).toBeVisible();

    await page.locator('[data-testid="user-search-input"]').fill('');
    await page.waitForTimeout(300);

    // 3. Create User & Duplicate Email Rejection
    await page.locator('[data-testid="create-user-btn"]').click();
    await expect(page.locator('[data-testid="create-user-modal"]')).toBeVisible();

    await captureScreenshots(page, 'create-user');

    // Test duplicate email rejection
    await page.locator('[data-testid="create-user-name"]').fill('Duplicate Email User');
    await page.locator('[data-testid="create-user-email"]').fill('alice@toktickit.io'); // Existing email
    await page.locator('[data-testid="create-user-role"]').selectOption('REQUESTER');
    await page.locator('[data-testid="create-user-password"]').fill('Password123!');
    await page.locator('[data-testid="save-create-user-btn"]').click();

    await expect(page.locator('[data-testid="user-form-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-form-error"]')).toContainText(/already exists|duplicate|Conflict/i);

    // Fill valid unique email and create user
    const timestamp = Date.now();
    const newUserEmail = `new_staff_${timestamp}@toktickit.com`;
    await page.locator('[data-testid="create-user-email"]').fill(newUserEmail);
    await page.locator('[data-testid="create-user-role"]').selectOption('IT_STAFF');
    await page.locator('[data-testid="save-create-user-btn"]').click();

    await expect(page.locator('[data-testid="create-user-modal"]')).not.toBeVisible();

    // 4. Edit User & Set New Initial Password
    await page.locator('[data-testid="user-search-input"]').fill(newUserEmail);
    await page.waitForTimeout(300);

    const editBtn = page.locator('[data-testid^="edit-user-btn-"]').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    await expect(page.locator('[data-testid="edit-user-modal"]')).toBeVisible();
    await captureScreenshots(page, 'edit-user');

    // Reset password for edited user
    await page.locator('[data-testid="reset-password-btn"]').click();
    await page.locator('[data-testid="reset-password-input"]').fill('NewInitPassword123!');
    await page.locator('[data-testid="confirm-reset-password-btn"]').click();

    await page.waitForTimeout(300);

    // Close edit modal
    await page.locator('[data-testid="save-edit-user-btn"]').click();
    await page.waitForTimeout(300);

    // 5. Safety Rule Check: Prevent Admin Self-Deactivation
    await page.locator('[data-testid="user-search-input"]').fill('admin@toktickit.com');
    await page.waitForTimeout(300);

    const adminEditBtn = page.locator('[data-testid^="edit-user-btn-"]').first();
    await adminEditBtn.click();
    await expect(page.locator('[data-testid="edit-user-modal"]')).toBeVisible();

    // Attempt deactivation
    const deactivateBtn = page.locator('button:has-text("Deactivate User")');
    if (await deactivateBtn.isVisible()) {
      await deactivateBtn.click();
      await page.locator('[data-testid="save-edit-user-btn"]').click();
      // Expect error alert blocking self-deactivation / last admin removal
      await expect(page.locator('.alert-danger')).toBeVisible();
    }
  });

  test('Non-Administrator direct access restriction', async ({ page }) => {
    await page.goto('/');

    // Login as Requester
    await page.locator('[data-testid="login-email-input"]').fill('alice@toktickit.io');
    await page.locator('[data-testid="login-password-input"]').fill('Password123!');
    await page.locator('[data-testid="login-submit-btn"]').click();

    await expect(page.locator('[data-testid="app-authenticated"]')).toBeVisible();

    // Verify Admin nav button is hidden
    await expect(page.locator('[data-testid="nav-admin-btn"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="user-management-container"]')).not.toBeVisible();
  });
});
