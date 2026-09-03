import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = path.resolve('artifacts/lab-02/screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Helper to capture responsive screenshots across Desktop (1280px), Tablet (768px), and Mobile (375px)
async function captureResponsiveScreenshots(page: Page, screenName: string) {
  const viewports = [
    { prefix: 'desktop', width: 1280, height: 800 },
    { prefix: 'tablet', width: 768, height: 1024 },
    { prefix: 'mobile', width: 375, height: 667 },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    // Small delay to ensure layout reflow completes
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${vp.prefix}-${screenName}.png`),
      fullPage: true,
    });
  }

  // Restore to desktop default viewport
  await page.setViewportSize({ width: 1280, height: 800 });
}

test.describe('Requester Ticket Flow & Comprehensive Visual Audit (Lab 02 - ISSUE-08)', () => {
  test('Complete End-to-End Requester Flow & Full Responsive Screenshots', async ({ page }) => {
    // -------------------------------------------------------------------------
    // PAGE 1: Requester Selection Screen
    // -------------------------------------------------------------------------
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // Wait for requester selection screen
    await expect(page.locator('[data-testid="requester-selection-screen"]')).toBeVisible();

    // Verify accessible labels on requester selection screen
    const selectLabel = page.locator('label[for="requester-select"]');
    await expect(selectLabel).toBeVisible();
    await expect(selectLabel).toHaveText(/Active User Context/i);

    // Capture responsive screenshots for Requester Selection (desktop, tablet, mobile)
    await captureResponsiveScreenshots(page, 'requester-select');

    // Select Requester 1 (Alice Johnson)
    const requesterDropdown = page.locator('[data-testid="requester-dropdown"]');
    await requesterDropdown.selectOption({ index: 0 }); // First user
    const selectedUserId = await requesterDropdown.inputValue();

    // Click Continue
    const continueBtn = page.locator('[data-testid="continue-btn"]');
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // Verify Navbar shows active user info
    await expect(page.locator('[data-testid="active-requester-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-requester-name"]')).toContainText('Alice Johnson');

    // -------------------------------------------------------------------------
    // PAGE 2: Create Ticket Form Screen
    // -------------------------------------------------------------------------
    // Navigate to Create Ticket form
    await page.locator('[data-testid="nav-create-ticket-btn"]').click();
    await expect(page.locator('[data-testid="create-ticket-page"]')).toBeVisible();

    // Accessible labels audit on form fields
    await expect(page.locator('label[for="category-select"]')).toBeVisible();
    await expect(page.locator('label[for="system-select"]')).toBeVisible();
    await expect(page.locator('label[for="summary-input"]')).toBeVisible();
    await expect(page.locator('label[for="description-input"]')).toBeVisible();

    // Select Category and Related System
    await page.locator('[data-testid="category-dropdown"]').selectOption({ index: 1 });
    await page.locator('[data-testid="related-system-dropdown"]').selectOption({ index: 1 });

    // Select Priority "High"
    await page.locator('[data-testid="priority-high"]').click();

    // Fill Summary and Description
    const testSummary = `E2E Responsive Audit Ticket - ${Date.now()}`;
    const testDescription = 'This ticket tests responsive visual audit screenshots across Desktop (1280px), Tablet (768px), and Mobile (375px) viewports.';
    await page.locator('[data-testid="summary-input"]').fill(testSummary);
    await page.locator('[data-testid="description-input"]').fill(testDescription);

    // Upload attachment
    const sampleAttachmentName = 'responsive-audit-doc.pdf';
    await page.locator('[data-testid="file-input"]').setInputFiles({
      name: sampleAttachmentName,
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 Mock PDF Content for Responsive Visual Audit'),
    });

    // Verify file chip appears in preview list
    await expect(page.locator('[data-testid="file-list"]')).toContainText(sampleAttachmentName);

    // Capture responsive screenshots for Create Ticket Form (desktop, tablet, mobile)
    await captureResponsiveScreenshots(page, 'create-ticket');

    // Submit form
    await page.locator('[data-testid="submit-ticket-btn"]').click();

    // Verify Success Confirmation & extract Ticket Code
    await expect(page.locator('[data-testid="success-confirmation"]')).toBeVisible();
    const createdTicketNumber = await page.locator('[data-testid="new-ticket-number"]').innerText();
    expect(createdTicketNumber).toMatch(/^(TKT|TCK)-/);

    // -------------------------------------------------------------------------
    // PAGE 3: My Tickets Dashboard Screen
    // -------------------------------------------------------------------------
    // Click Return to Dashboard
    await page.locator('button', { hasText: 'Return to Dashboard' }).click();

    // Verify Dashboard is visible
    await expect(page.locator('h1:has-text("My Tickets")')).toBeVisible();
    await expect(page.locator('[data-testid="tickets-table"]')).toBeVisible();

    // Capture responsive screenshots for Dashboard (desktop, tablet, mobile)
    await captureResponsiveScreenshots(page, 'dashboard');
    // Also save legacy alias desktop-my-tickets.png for backward compatibility
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'desktop-my-tickets.png'),
      fullPage: true,
    });

    // Locate the created ticket using search
    await page.locator('[data-testid="search-input"]').fill(createdTicketNumber);
    await expect(page.locator('[data-testid="tickets-table"]')).toContainText(createdTicketNumber);
    await expect(page.locator('[data-testid="tickets-table"]')).toContainText(testSummary);

    // -------------------------------------------------------------------------
    // PAGE 4: Ticket Detail Screen
    // -------------------------------------------------------------------------
    // Click ticket code link to view detail
    await page.locator(`[data-testid^="ticket-link-"]`, { hasText: createdTicketNumber }).click();

    // Verify Ticket Detail View
    await expect(page.locator('[data-testid="ticket-detail-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="ticket-code"]')).toHaveText(createdTicketNumber);
    await expect(page.locator('[data-testid="ticket-summary"]')).toHaveText(testSummary);
    await expect(page.locator('[data-testid="ticket-description"]')).toHaveText(testDescription);
    await expect(page.locator('[data-testid="ticket-attachments-section"]')).toContainText(sampleAttachmentName);

    // Soft-Remove Attachment
    const removeAttBtn = page.locator('[data-testid^="remove-attachment-"]');
    await expect(removeAttBtn).toBeVisible();
    await removeAttBtn.click();

    // Confirm Removal
    await expect(page.locator('[data-testid="removal-modal"]')).toBeVisible();
    const removalReasonText = 'Soft removal performed for visual audit.';
    await page.locator('[data-testid="removal-reason-input"]').fill(removalReasonText);
    await page.locator('[data-testid="confirm-remove-btn"]').click();

    // Verify attachment soft-removed badge
    await expect(page.locator('[data-testid="removal-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid^="removed-badge-"]')).toBeVisible();
    await expect(page.locator('[data-testid^="removed-badge-"]')).toHaveText('Soft Removed');

    // Capture responsive screenshots for Ticket Detail (desktop, tablet, mobile)
    await captureResponsiveScreenshots(page, 'ticket-detail');
    // Also save legacy alias desktop-soft-removed-attachment.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'desktop-soft-removed-attachment.png'),
      fullPage: true,
    });

    // -------------------------------------------------------------------------
    // STEP 5: Switch Requester & Verify Ticket Isolation
    // -------------------------------------------------------------------------
    await page.locator('[data-testid="change-requester-btn"]').click();
    await expect(page.locator('[data-testid="requester-selection-screen"]')).toBeVisible();

    // Select Requester 2 (Bob Smith)
    await requesterDropdown.selectOption({ index: 1 });
    const requester2Id = await requesterDropdown.inputValue();
    expect(requester2Id).not.toBe(selectedUserId);

    await continueBtn.click();
    await expect(page.locator('[data-testid="active-requester-name"]')).toContainText('Bob Smith');

    // On Bob Smith's dashboard, search for Alice's ticket number
    await page.locator('[data-testid="search-input"]').fill(createdTicketNumber);

    // Verify ticket isolation: created ticket must NOT be listed
    await expect(page.locator('[data-testid="no-results-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="tickets-table"]')).not.toBeVisible();

    // -------------------------------------------------------------------------
    // STEP 6: Layout Overflow Check across all 3 viewports
    // -------------------------------------------------------------------------
    for (const width of [1280, 768, 375]) {
      await page.setViewportSize({ width, height: 800 });
      const isOverflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(isOverflowing).toBe(false);
    }

    // -------------------------------------------------------------------------
    // STEP 7: Zen Green Token Audit
    // -------------------------------------------------------------------------
    await page.setViewportSize({ width: 1280, height: 800 });
    const primaryTokenHex = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--zg-primary').trim();
    });
    expect(primaryTokenHex.toLowerCase()).toBe('#006b3c');

    const navbarBgColor = await page.locator('nav').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(navbarBgColor).toMatch(/rgb\(0,\s*107,\s*60\)/);
  });
});
