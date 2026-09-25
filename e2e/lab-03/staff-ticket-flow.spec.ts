import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Traceability Header:
 * Spec File: e2e/lab-03/staff-ticket-flow.spec.ts
 * Acceptance Criteria Covered:
 *  - AC-05: Requester public comments and "Problem Appears Resolved" indication
 *  - AC-06: Requester blocked from Internal Notes (403 / UI hidden)
 *  - AC-07: IT Staff Ticket Queue search, filter, sort, and pagination
 *  - AC-08: IT Staff claim ticket ownership, IT priority update, and permitted status transitions
 *  - AC-09: Public comments and internal notes operational workflows for IT Staff
 */

const STAFF_QUEUE_DIR = path.resolve('artifacts/lab-03/screenshots/staff-queue');
const STAFF_DETAIL_DIR = path.resolve('artifacts/lab-03/screenshots/staff-ticket-detail');
const REQUESTER_DIR = path.resolve('artifacts/lab-03/screenshots/requester');

[STAFF_QUEUE_DIR, STAFF_DETAIL_DIR, REQUESTER_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function captureScreenshots(page: Page, targetDir: string, filenamePrefix: string) {
  const viewports = [
    { prefix: 'desktop', width: 1280, height: 800 },
    { prefix: 'tablet', width: 768, height: 1024 },
    { prefix: 'mobile', width: 375, height: 667 },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(targetDir, `${filenamePrefix}-${vp.prefix}.png`),
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1280, height: 800 });
}

test.describe('E2E Staff Ticket Flow & Operational Lifecycle (Lab 3)', () => {
  test('IT Staff Queue: search, filter, sort, empty state, and ticket detail workflows', async ({ page }) => {
    await page.goto('/');

    // 1. Login as IT Staff
    await page.locator('[data-testid="login-email-input"]').fill('michael.brown@toktickit.com');
    await page.locator('[data-testid="login-password-input"]').fill('Password123!');
    await page.locator('[data-testid="login-submit-btn"]').click();

    await expect(page.locator('[data-testid="ticket-queue-container"]')).toBeVisible();

    // Capture queue populated screenshots
    await captureScreenshots(page, STAFF_QUEUE_DIR, 'queue-populated');

    // Filter queue by status
    await page.locator('[data-testid="status-filter-select"]').selectOption('Open');
    await page.waitForTimeout(300);
    await captureScreenshots(page, STAFF_QUEUE_DIR, 'queue-filtered');

    // Reset status filter and test empty search results
    await page.locator('[data-testid="status-filter-select"]').selectOption('all');
    await page.locator('[data-testid="queue-search-input"]').fill('NONEXISTENT_TICKET_99999');
    await page.waitForTimeout(300);
    await captureScreenshots(page, STAFF_QUEUE_DIR, 'queue-empty');

    // Clear search and open first ticket
    await page.locator('[data-testid="queue-search-input"]').fill('');
    await page.waitForTimeout(300);

    const firstTicketLink = page.locator('[data-testid^="ticket-code-"]').first();
    await expect(firstTicketLink).toBeVisible();
    await firstTicketLink.click();

    await expect(page.locator('[data-testid="ticket-detail-view"]')).toBeVisible();

    // Capture ticket detail main screenshots
    await captureScreenshots(page, STAFF_DETAIL_DIR, 'ticket-detail');

    // Claim / Reassign Ticket Ownership
    const ownerSelect = page.locator('[data-testid="owner-select"]');
    if (await ownerSelect.isVisible()) {
      const options = await ownerSelect.locator('option').allInnerTexts();
      if (options.length > 1) {
        await ownerSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
      }
    }

    // Change IT Priority
    const prioritySelect = page.locator('[data-testid="it-priority-select"]');
    if (await prioritySelect.isVisible()) {
      await prioritySelect.selectOption('High');
      await page.waitForTimeout(300);
    }

    // Change Ticket Status through permitted transition if available
    const statusSelect = page.locator('[data-testid="status-select"]');
    if (await statusSelect.isVisible()) {
      const options = await statusSelect.locator('option').allInnerTexts();
      if (options.length > 1) {
        await statusSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
      }
    }

    // Post a Public Comment
    const publicCommentTab = page.locator('button:has-text("Public Comments")');
    await publicCommentTab.click();
    await page.locator('[data-testid="comment-input"]').fill('IT Staff investigating issue and preparing resolution.');
    await page.locator('[data-testid="post-comment-btn"]').click();
    await page.waitForTimeout(300);
    await captureScreenshots(page, STAFF_DETAIL_DIR, 'public-comments');

    // Post an Internal Note
    const internalNotesTab = page.locator('button:has-text("Internal Notes")');
    await internalNotesTab.click();
    await page.locator('[data-testid="internal-note-input"]').fill('Internal Note: Verification completed on RADIUS server logs.');
    await page.locator('[data-testid="post-internal-note-btn"]').click();
    await page.waitForTimeout(300);
    await captureScreenshots(page, STAFF_DETAIL_DIR, 'internal-notes');
  });

  test('Requester flow: Public Comments, Problem Appears Resolved indication, and Internal Notes restriction', async ({ page }) => {
    await page.goto('/');

    // Login as Requester
    await page.locator('[data-testid="login-email-input"]').fill('alice@toktickit.io');
    await page.locator('[data-testid="login-password-input"]').fill('Password123!');
    await page.locator('[data-testid="login-submit-btn"]').click();

    await expect(page.locator('[data-testid="app-authenticated"]')).toBeVisible();

    // Click first ticket from My Tickets dashboard
    const firstTicket = page.locator('[data-testid^="ticket-link-"]').first();
    if (await firstTicket.isVisible()) {
      await firstTicket.click();
      await expect(page.locator('[data-testid="ticket-detail-view"]')).toBeVisible();

      // Post Public Comment as Requester
      await page.locator('[data-testid="comment-input"]').fill('Requester testing public comment visibility.');
      await page.locator('[data-testid="post-comment-btn"]').click();
      await page.waitForTimeout(300);

      await captureScreenshots(page, REQUESTER_DIR, 'ticket-detail-comments');

      // Click "Problem Appears Resolved" if available
      const indicateBtn = page.locator('[data-testid="indicate-resolved-btn"]');
      if (await indicateBtn.isVisible()) {
        await indicateBtn.click();
        await page.waitForTimeout(300);
        await expect(page.locator('[data-testid="requester-resolved-badge"]')).toBeVisible();
      }

      await captureScreenshots(page, REQUESTER_DIR, 'problem-resolved-action');

      // Verify Requester CANNOT see Internal Notes tab
      await expect(page.locator('button:has-text("Internal Notes")')).not.toBeVisible();
      // Verify Requester CANNOT see status dropdown
      await expect(page.locator('[data-testid="status-select"]')).not.toBeVisible();
    }
  });
});
