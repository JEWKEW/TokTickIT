import { expect, test } from "@playwright/test";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/");
  await page.locator('[data-testid="login-email-input"]').fill(email);
  await page.locator('[data-testid="login-password-input"]').fill("Password123!");
  await page.locator('[data-testid="login-submit-btn"]').click();
}

async function openStaffTicket(page: import("@playwright/test").Page, ticketNumber: string) {
  await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible();
  await page.locator('[data-testid="nav-queue-btn"]').click();
  await page.locator('[data-testid="queue-search-input"]').fill(ticketNumber);
  const link = page.locator('[data-testid^="ticket-code-"]').filter({ hasText: ticketNumber }).first();
  await expect(link).toBeVisible();
  await link.click();
}

async function createRequesterTicket(page: import("@playwright/test").Page) {
  await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible();
  await page.locator('[data-testid="dashboard-create-ticket"]').click();
  await page.locator('[data-testid="category-dropdown"]').selectOption({ index: 1 });
  await page.locator('[data-testid="related-system-dropdown"]').selectOption({ index: 1 });
  await page.locator('[data-testid="priority-high"]').click();
  const summary = `Issue 9 Actions Taken ${Date.now()}`;
  await page.locator('[data-testid="summary-input"]').fill(summary);
  await page.locator('[data-testid="description-input"]').fill("Disposable regression fixture for Actions Taken." );
  await page.locator('[data-testid="submit-ticket-btn"]').click();
  await expect(page.locator('[data-testid="success-confirmation"]')).toBeVisible();
  const ticketNumber = await page.locator('[data-testid="new-ticket-number"]').innerText();
  await page.getByRole("button", { name: "Return to Dashboard" }).click();
  return ticketNumber;
}

async function signOut(page: import("@playwright/test").Page) {
  await page.locator('[data-testid="active-requester-info"] button').first().click();
  await page.locator('[data-testid="logout-btn"]').first().click();
}

async function openRequesterTicket(page: import("@playwright/test").Page, ticketNumber: string) {
  await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible();
  await page.locator('[data-testid="dashboard-view-tickets"]').click();
  await page.locator('[data-testid="search-input"]').fill(ticketNumber);
  const link = page.locator('[data-testid^="ticket-link-"]').filter({ hasText: ticketNumber }).first();
  await expect(link).toBeVisible();
  await link.click();
}

test("staff records and edits an Action Taken; its Requester sees it read-only", async ({ page }) => {
  const unique = `Lab 4 action ${Date.now()}`;
  await signIn(page, "alice@toktickit.io");
  const ticketNumber = await createRequesterTicket(page);
  await signOut(page);
  await signIn(page, "michael.brown@toktickit.com");
  await openStaffTicket(page, ticketNumber);
  await expect(page.locator('[data-testid="ticket-detail-view"]')).toBeVisible();
  await page.getByRole("button", { name: /Actions Taken/ }).click();
  await expect(page.getByRole("heading", { name: "Actions Taken" })).toBeVisible();

  if (!(await page.getByLabel("Action description").isVisible())) await page.getByRole("button", { name: "Record Action" }).click();
  await page.getByLabel("Action description").fill(unique);
  await page.getByLabel("Result").fill("Verified from the integrated browser flow");
  await page.locator('[data-testid="actions-taken-panel"] form button[type="submit"]').click();
  const actionCard = page.locator('[data-testid^="action-taken-"]').filter({ hasText: unique });
  await expect(actionCard).toBeVisible();
  await actionCard.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Action description").fill(`${unique} edited`);
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText(`${unique} edited`)).toBeVisible();

  await signOut(page);
  await signIn(page, "alice@toktickit.io");
  await openRequesterTicket(page, ticketNumber);
  await page.getByRole("button", { name: /Actions Taken/ }).click();
  await expect(page.getByText(`${unique} edited`)).toBeVisible();
  await expect(page.getByRole("button", { name: "Record Action" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
});

test("follow-up validation and stale edit feedback work end to end", async ({ page }) => {
  await signIn(page, "alice@toktickit.io");
  const ticketNumber = await createRequesterTicket(page);
  await signOut(page);
  await signIn(page, "michael.brown@toktickit.com");
  await openStaffTicket(page, ticketNumber);
  await page.getByRole("button", { name: /Actions Taken/ }).click();

  const priorDescription = `Follow-up validation ${Date.now()}`;
  if (!(await page.getByLabel("Action description").isVisible())) {
    await page.getByRole("button", { name: "Record Action" }).click();
  }
  await page.getByLabel("Action description").fill(priorDescription);
  await page.getByLabel("Result").fill("Needs another check");
  await page.getByLabel("Follow-up required").check();
  await page.locator('[data-testid="actions-taken-panel"] form button[type="submit"]').click();
  await expect(page.getByText("Enter a follow-up note when follow-up is required.")).toBeVisible();
  await page.getByLabel(/Follow-up note/).fill("Retry after scheduled maintenance");
  await page.locator('[data-testid="actions-taken-panel"] form button[type="submit"]').click();

  const actionCard = page.locator('[data-testid^="action-taken-"]').filter({ hasText: priorDescription });
  await expect(actionCard).toBeVisible();
  await actionCard.getByRole("button", { name: "Edit" }).click();
  await page.route("**/api/tickets/*/actions-taken/*", async (route) => {
    if (route.request().method() === "PATCH") {
      await route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({
        success: false,
        error: { code: "STALE_UPDATE", message: "This Action Taken record has been modified. Refresh and retry." },
      }) });
      return;
    }
    await route.continue();
  });
  await page.getByLabel("Action description").fill(`${priorDescription} revised`);
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText(/changed while you were editing/i)).toBeVisible();
  await expect(page.getByLabel("Action description")).toHaveValue(`${priorDescription} revised`);
});
