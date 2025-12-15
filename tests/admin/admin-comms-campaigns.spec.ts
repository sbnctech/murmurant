import { test, expect } from "@playwright/test";

test.describe("Admin Communications - Campaigns", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/comms/campaigns", { waitUntil: "networkidle" });
  });

  test("campaigns page loads", async ({ page }) => {
    // Check root element exists
    const root = page.locator('[data-test-id="admin-comms-campaigns-root"]');
    await expect(root).toBeVisible();

    // Check heading
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText("Campaigns");

    // Check create button exists
    const createButton = page.locator('[data-test-id="admin-campaigns-create-button"]');
    await expect(createButton).toBeVisible();
  });

  test("campaigns table loads with controls", async ({ page }) => {
    // Wait for table to appear
    const table = page.locator('[data-test-id="admin-campaigns-table"]');
    await expect(table).toBeVisible();

    // Check status filter exists
    const statusFilter = page.locator('[data-test-id="admin-campaigns-status-filter"]');
    await expect(statusFilter).toBeVisible();

    // Check filter has correct options
    const options = statusFilter.locator("option");
    await expect(options).toHaveCount(5); // All, Draft, Scheduled, Sending, Sent
  });

  test("campaigns pagination controls exist", async ({ page }) => {
    // Wait for pagination to appear
    const pagination = page.locator('[data-test-id="admin-campaigns-pagination"]');
    await expect(pagination).toBeVisible();

    // Check pagination buttons exist
    const prevButton = page.locator('[data-test-id="admin-campaigns-pagination-prev"]');
    const nextButton = page.locator('[data-test-id="admin-campaigns-pagination-next"]');

    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();
  });
});
