import { expect, test, Page } from "@playwright/test";

async function signIn(page: Page, email: string) {
  await page.goto("/");
  await page.locator('[data-testid="login-email-input"]').fill(email);
  await page.locator('[data-testid="login-password-input"]').fill("Password123!");
  await page.locator('[data-testid="login-submit-btn"]').click();
}

test("Requester dashboard is scoped to owned Tickets and drills down correctly", async ({ page }) => {
  await signIn(page, "alice@toktickit.io");
  await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible();
  await expect(page.getByText("Cannot connect to campus VPN from home")).toBeVisible();
  await expect(page.getByText("Laptop screen flickering continuously")).toHaveCount(0);
  await expect(page.locator('[data-testid="metric-my-open-tickets"]')).toContainText("2");
  await page.locator('[data-testid="metric-in-progress"]').click();
  await expect(page.locator('[data-testid="status-filter"]')).toHaveValue("In Progress");
  await expect(page.getByText("Cannot connect to campus VPN from home")).toBeVisible();
  await expect(page.getByText("Waiting for requester to confirm mailbox access")).toHaveCount(0);
});

test("staff and admin dashboards show authorized metrics and correct drill-downs", async () => {
  test.fixme(true, "Implement after Lab 4 dashboards are available");
});

test("dashboard loading, empty, forbidden, and safe-failure states are usable", async () => {
  test.fixme(true, "Requester dashboard states are covered by component tests; staff dashboard is Issue 8");
});

test("Requester dashboard has no horizontal overflow at desktop, tablet, or mobile widths", async ({ page }) => {
  await signIn(page, "alice@toktickit.io");
  await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible();
  for (const width of [1280, 768, 375]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth }));
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
  }
});
