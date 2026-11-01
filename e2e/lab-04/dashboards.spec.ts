import { expect, test, Page } from "@playwright/test";
import { expectNoClippedOrOverlappingControls } from "./responsive-a11y-helpers.js";

async function signIn(page: Page, email: string) {
  await page.goto("/");
  await page.locator('[data-testid="login-email-input"]').fill(email);
  await page.locator('[data-testid="login-password-input"]').fill("Password123!");
  await page.locator('[data-testid="login-submit-btn"]').click();
}

async function createRequesterTicket(page: Page) {
  await page.locator('[data-testid="dashboard-create-ticket"]').click();
  await page.locator('[data-testid="category-dropdown"]').selectOption({ index: 1 });
  await page.locator('[data-testid="related-system-dropdown"]').selectOption({ index: 1 });
  const summary = `Dashboard ownership ${Date.now()}`;
  await page.locator('[data-testid="priority-high"]').click();
  await page.locator('[data-testid="summary-input"]').fill(summary);
  await page.locator('[data-testid="description-input"]').fill("Regression fixture for requester dashboard ownership.");
  await page.locator('[data-testid="submit-ticket-btn"]').click();
  await expect(page.locator('[data-testid="success-confirmation"]')).toBeVisible();
  const number = await page.locator('[data-testid="new-ticket-number"]').innerText();
  await page.getByRole("button", { name: "Return to Dashboard" }).click();
  await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible();
  return number;
}

async function signOut(page: Page) {
  await page.locator('[data-testid="active-requester-info"] button').first().click();
  await page.locator('[data-testid="logout-btn"]').first().click();
}

test("Requester dashboard is scoped to owned Tickets and drills down correctly", async ({ page }) => {
  await signIn(page, "alice@toktickit.io");
  await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible();
  const ownTicketNumber = await createRequesterTicket(page);
  await expect(page.locator('[data-testid="metric-my-open-tickets"]')).toBeVisible();
  await page.locator('[data-testid="metric-in-progress"]').click();
  await expect(page.locator('[data-testid="status-filter"]')).toHaveValue("In Progress");
  await page.locator('[data-testid="status-filter"]').selectOption("all");
  await page.locator('[data-testid="search-input"]').fill(ownTicketNumber);
  await expect(page.locator('[data-testid="tickets-table"]')).toContainText(ownTicketNumber);
  await signOut(page);
  await signIn(page, "bob@toktickit.io");
  await page.locator('[data-testid="dashboard-view-tickets"]').click();
  await page.locator('[data-testid="search-input"]').fill(ownTicketNumber);
  await expect(page.locator('[data-testid^="ticket-link-"]').filter({ hasText: ownTicketNumber })).toHaveCount(0);
});

test("staff and admin dashboards show authorized metrics and correct drill-downs", async ({ page }) => {
  await signIn(page, "michael.brown@toktickit.com");
  await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible();
  await expect(page.locator('[data-testid="staff-metric-new"]')).toBeVisible();
  await expect(page.locator('[data-testid="staff-status-cancelled"]')).toBeVisible();
  await page.locator('[data-testid="staff-metric-new"]').click();
  await expect(page.locator('[data-testid="status-filter-select"]')).toHaveValue("New");
});

test("Administrator can open staff dashboard with active account totals", async ({ page }) => {
  await signIn(page, "admin@toktickit.com");
  await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible();
  await expect(page.locator('[data-testid="staff-active-user-counts"]')).toBeVisible();
});

test("staff dashboard fits desktop, tablet, and mobile widths", async ({ page }) => {
  await signIn(page, "michael.brown@toktickit.com");
  await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible();
  for (const width of [1280, 768, 375]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth }));
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
    await expectNoClippedOrOverlappingControls(page);
  }
});

test("Requester dashboard has no horizontal overflow at desktop, tablet, or mobile widths", async ({ page }) => {
  await signIn(page, "alice@toktickit.io");
  await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible();
  for (const width of [1280, 768, 375]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth }));
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
    await expectNoClippedOrOverlappingControls(page);
  }
});

test("dashboard controls have semantic names, text status cues, and keyboard-visible focus", async ({ page }) => {
  await signIn(page, "michael.brown@toktickit.com");
  await expect(page.getByRole("heading", { level: 1, name: "IT Staff Operational Dashboard" })).toBeVisible();
  await expect(page.locator('[data-testid="nav-staff-dashboard-btn"]')).toHaveAttribute("aria-current", "page");
  await expect(page.locator('[data-testid="staff-metric-new"]')).toHaveAccessibleName(/View \d+ New tickets/);
  await expect(page.locator('[data-testid="staff-status-new"]')).toContainText("New");
  await expect(page.locator('[data-testid="staff-status-new"]')).toContainText(/\d+/);

  await page.locator('[data-testid="staff-metric-new"]').focus();
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => {
    const element = document.activeElement as HTMLElement;
    return {
      keyboardVisible: element.matches(":focus-visible"),
      outlineWidth: getComputedStyle(element).outlineWidth,
      outlineColor: getComputedStyle(element).outlineColor,
    };
  });
  expect(focus.keyboardVisible).toBeTruthy();
  expect(focus.outlineWidth).toBe("3px");
  expect(focus.outlineColor).toBe("rgb(0, 96, 57)");
});
