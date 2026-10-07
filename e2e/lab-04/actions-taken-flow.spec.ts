import { expect, test } from "@playwright/test";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/");
  await page.locator('[data-testid="login-email-input"]').fill(email);
  await page.locator('[data-testid="login-password-input"]').fill("Password123!");
  await page.locator('[data-testid="login-submit-btn"]').click();
}

test("staff records and edits an Action Taken; its Requester sees it read-only", async ({ page }) => {
  const unique = `Lab 4 action ${Date.now()}`;
  await signIn(page, "michael.brown@toktickit.com");
  await expect(page.locator('[data-testid="ticket-queue-container"]')).toBeVisible();
  await page.locator('[data-testid="ticket-code-1"]').click();
  await expect(page.locator('[data-testid="ticket-detail-view"]')).toBeVisible();
  await page.getByRole("button", { name: /Actions Taken/ }).click();
  await expect(page.getByRole("heading", { name: "Actions Taken" })).toBeVisible();

  await page.getByLabel("Action description").fill(unique);
  await page.getByLabel("Result").fill("Verified from the integrated browser flow");
  await page.getByRole("button", { name: "Record Action", exact: true }).click();
  const actionCard = page.locator('[data-testid^="action-taken-"]').filter({ hasText: unique });
  await expect(actionCard).toBeVisible();
  await actionCard.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Action description").fill(`${unique} edited`);
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText(`${unique} edited`)).toBeVisible();

  await page.locator('[data-testid="logout-btn"]').first().click();
  await signIn(page, "alice@toktickit.io");
  const ticketLink = page.locator('[data-testid="ticket-link-1"]');
  await expect(ticketLink).toBeVisible();
  await ticketLink.click();
  await page.getByRole("button", { name: /Actions Taken/ }).click();
  await expect(page.getByText(`${unique} edited`)).toBeVisible();
  await expect(page.getByRole("button", { name: "Record Action" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
});

test("follow-up validation and stale edit feedback work end to end", async ({ page }) => {
  await signIn(page, "michael.brown@toktickit.com");
  await page.locator('[data-testid="ticket-code-1"]').click();
  await page.getByRole("button", { name: /Actions Taken/ }).click();

  const priorDescription = `Follow-up validation ${Date.now()}`;
  if (!(await page.getByLabel("Action description").isVisible())) {
    await page.getByRole("button", { name: "Record Action" }).click();
  }
  await page.getByLabel("Action description").fill(priorDescription);
  await page.getByLabel("Result").fill("Needs another check");
  await page.getByLabel("Follow-up required").check();
  await page.getByRole("button", { name: "Record Action", exact: true }).click();
  await expect(page.getByText("Enter a follow-up note when follow-up is required.")).toBeVisible();
  await page.getByLabel(/Follow-up note/).fill("Retry after scheduled maintenance");
  await page.getByRole("button", { name: "Record Action", exact: true }).click();

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
