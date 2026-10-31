import { expect, test, Page } from "@playwright/test";

async function signIn(page: Page, email: string) {
  await page.goto("/");
  await page.locator('[data-testid="login-email-input"]').fill(email);
  await page.locator('[data-testid="login-password-input"]').fill("Password123!");
  await page.locator('[data-testid="login-submit-btn"]').click();
}

async function createRequesterTicket(page: Page): Promise<string> {
  await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible();
  await page.locator('[data-testid="dashboard-create-ticket"]').click();
  await page.locator('[data-testid="category-dropdown"]').selectOption({ index: 1 });
  await page.locator('[data-testid="related-system-dropdown"]').selectOption({ index: 1 });
  await page.locator('[data-testid="priority-high"]').click();
  await page.locator('[data-testid="summary-input"]').fill(`Issue 9 workflow ${Date.now()}`);
  await page.locator('[data-testid="description-input"]').fill("Disposable regression fixture for status workflow.");
  await page.locator('[data-testid="submit-ticket-btn"]').click();
  await expect(page.locator('[data-testid="success-confirmation"]')).toBeVisible();
  const ticketNumber = await page.locator('[data-testid="new-ticket-number"]').innerText();
  await page.getByRole("button", { name: "Return to Dashboard" }).click();
  return ticketNumber;
}

async function openRequesterTicket(page: Page, ticketNumber: string) {
  await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible();
  await page.locator('[data-testid="dashboard-view-tickets"]').click();
  await page.locator('[data-testid="search-input"]').fill(ticketNumber);
  const link = page.locator('[data-testid^="ticket-link-"]').filter({ hasText: ticketNumber }).first();
  await expect(link).toBeVisible();
  await link.click();
}

async function openStaffTicket(page: Page, ticketNumber: string): Promise<string> {
  await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible();
  await page.locator('[data-testid="nav-queue-btn"]').click();
  await page.locator('[data-testid="queue-search-input"]').fill(ticketNumber);
  const link = page.locator('[data-testid^="ticket-code-"]').filter({ hasText: ticketNumber }).first();
  await expect(link).toBeVisible();
  const testId = await link.getAttribute("data-testid");
  await link.click();
  return (testId || "").replace("ticket-code-", "");
}

async function signOut(page: Page) {
  await page.locator('[data-testid="active-requester-info"] button').first().click();
  await page.locator('[data-testid="logout-btn"]').first().click();
}

test("Requester indication stays advisory while IT Staff performs formal status transitions", async ({ page }) => {
  await signIn(page, "alice@toktickit.io");
  const ticketNumber = await createRequesterTicket(page);
  await openRequesterTicket(page, ticketNumber);
  await expect(page.locator('[data-testid="ticket-detail-view"]')).toBeVisible();
  await expect(page.locator('[data-testid="status-select"]')).toHaveCount(0);

  const indicateButton = page.locator('[data-testid="indicate-resolved-btn"]');
  await expect(indicateButton).toBeVisible();
  const indicationResponse = page.waitForResponse((response) =>
    response.url().includes("/indicate-resolved") && response.request().method() === "PATCH",
  );
  await indicateButton.click();
  const response = await indicationResponse;
  expect(response.ok()).toBeTruthy();
  const indication = await response.json();
  expect(indication.data.requesterResolvedIndicated).toBe(true);
  expect(indication.data.currentStatus).toBe("New");
  await expect(page.locator('[data-testid="requester-resolved-badge"]')).toContainText("Awaiting IT Staff formal resolution");

  await signOut(page);
  await signIn(page, "michael.brown@toktickit.com");
  await openStaffTicket(page, ticketNumber);
  const status = page.locator('[data-testid="status-select"]');
  await expect(status).toBeVisible();
  expect(await status.inputValue()).toBe("New");
  const currentStatus = await status.inputValue();
  const optionsByStatus: Record<string, string[]> = {
    "New": ["New", "Open", "In Progress", "Cancelled"],
    "Open": ["Open", "In Progress", "Waiting for Requester", "Resolved", "Cancelled"],
    "In Progress": ["In Progress", "Waiting for Requester", "Resolved", "Cancelled"],
    "Waiting for Requester": ["Waiting for Requester", "In Progress", "Resolved", "Cancelled"],
    "Resolved": ["Resolved", "Closed", "Reopened"],
    "Reopened": ["Reopened", "In Progress", "Resolved", "Cancelled"],
    "Closed": ["Closed"],
    "Cancelled": ["Cancelled"],
  };
  await expect(status.locator("option")).toHaveText(optionsByStatus[currentStatus]);
  const nextStatus = optionsByStatus[currentStatus].includes("Resolved") ? "Resolved" : currentStatus === "Resolved" ? "" : optionsByStatus[currentStatus][1];
  if (nextStatus) {
    await status.selectOption(nextStatus);
    await page.locator('[data-testid="update-status-btn"]').click();
    await expect(status).toHaveValue(nextStatus);
  }
});

test("disallowed transitions stay absent and stale status updates refresh with safe feedback", async ({ page }) => {
  await signIn(page, "alice@toktickit.io");
  const ticketNumber = await createRequesterTicket(page);
  await signOut(page);
  await signIn(page, "michael.brown@toktickit.com");
  const status = page.locator('[data-testid="status-select"]');
  const permitted: Record<string, string[]> = {
    "New": ["New", "Open", "In Progress", "Cancelled"],
    "Open": ["Open", "In Progress", "Waiting for Requester", "Resolved", "Cancelled"],
    "In Progress": ["In Progress", "Waiting for Requester", "Resolved", "Cancelled"],
    "Waiting for Requester": ["Waiting for Requester", "In Progress", "Resolved", "Cancelled"],
    "Resolved": ["Resolved", "Closed", "Reopened"],
    "Reopened": ["Reopened", "In Progress", "Resolved", "Cancelled"],
    "Closed": ["Closed"],
    "Cancelled": ["Cancelled"],
  };
  const ticketId = await openStaffTicket(page, ticketNumber);
  await expect(status).toBeVisible();
  const currentStatus = await status.inputValue();
  const availableTransitions = permitted[currentStatus].filter((option) => option !== currentStatus);
  expect(availableTransitions.length).toBeGreaterThan(0);
  await expect(status.locator("option")).toHaveText(permitted[currentStatus]);

  await page.route(`**/api/tickets/${ticketId}/status`, async (route) => {
    await route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({
      success: false,
      error: { code: "STALE_UPDATE", message: "This Ticket was modified by another user. Refreshing..." },
    }) });
  });
  await status.selectOption(availableTransitions[0]);
  await page.locator('[data-testid="update-status-btn"]').click();
  await expect(page.locator('[data-testid="operation-error"]')).toContainText("modified by another user");
  await expect(status).toHaveValue(currentStatus);
});
