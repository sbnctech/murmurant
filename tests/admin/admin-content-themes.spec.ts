import { test, expect } from "@playwright/test";

test.describe("Admin Content Themes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/content/themes", { waitUntil: "networkidle" });
  });

  test("themes list page loads", async ({ page }) => {
    // Check root element exists
    const root = page.locator('[data-test-id="admin-content-themes-root"]');
    await expect(root).toBeVisible();

    // Check heading
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText("Themes");

    // Check create button exists
    const createButton = page.locator('[data-test-id="admin-themes-create-button"]');
    await expect(createButton).toBeVisible();
  });

  test("themes table loads with filter", async ({ page }) => {
    // Wait for table to appear
    const table = page.locator('[data-test-id="admin-themes-table"]');
    await expect(table).toBeVisible();

    // Check status filter exists
    const statusFilter = page.locator('[data-test-id="admin-themes-status-filter"]');
    await expect(statusFilter).toBeVisible();

    // Check filter has correct options
    const options = statusFilter.locator("option");
    await expect(options).toHaveCount(3); // All, Active, Inactive
  });
});
