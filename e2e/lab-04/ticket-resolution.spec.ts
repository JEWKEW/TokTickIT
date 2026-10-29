import { expect, test, Page } from "@playwright/test";

async function signIn(page: Page, email: string) {
  await page.goto("/");
  await page.locator('[data-testid="login-email-input"]').fill(email);
  await page.locator('[data-testid="login-password-input"]').fill("Password123!");
  await page.locator('[data-testid="login-submit-btn"]').click();
}

test("Requester indication stays advisory while IT Staff performs formal status transitions", async ({ page }) => {
  await signIn(page, "alice@toktickit.io");
  await page.locator('[data-testid="ticket-link-5"]').click();
  await expect(page.locator('[data-testid="ticket-detail-view"]')).toBeVisible();
  await expect(page.locator('[data-testid="status-select"]')).toHaveCount(0);

  if (await page.locator('[data-testid="indicate-resolved-btn"]').isVisible()) {
    const indicationResponse = page.waitForResponse((response) =>
      response.url().includes("/api/tickets/5/indicate-resolved") && response.request().method() === "PATCH",
    );
    await page.locator('[data-testid="indicate-resolved-btn"]').click();
    const response = await indicationResponse;
    expect(response.ok()).toBeTruthy();
    const indication = await response.json();
    expect(indication.data.requesterResolvedIndicated).toBe(true);
    expect(indication.data.currentStatus).toBe("Waiting for Requester");
  }
  await expect(page.locator('[data-testid="requester-resolved-badge"]')).toContainText("Awaiting IT Staff formal resolution");

  await page.locator('[data-testid="logout-btn"]').first().click();
  await signIn(page, "michael.brown@toktickit.com");
  await page.locator('[data-testid="ticket-code-5"]').click();
  const status = page.locator('[data-testid="status-select"]');
  await expect(status).toBeVisible();
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
  let ticketId = 5;
  let currentStatus = "";
  let availableTransitions: string[] = [];
  for (const candidateId of [5, 6, 7]) {
    await page.locator(`[data-testid="ticket-code-${candidateId}"]`).click();
    await expect(status).toBeVisible();
    currentStatus = await status.inputValue();
    availableTransitions = permitted[currentStatus].filter((option) => option !== currentStatus);
    if (availableTransitions.length > 0) {
      ticketId = candidateId;
      break;
    }
    await page.goBack();
  }
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
