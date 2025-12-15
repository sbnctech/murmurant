import { test, expect } from "@playwright/test";

test.describe("Admin Content Pages", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and wait for network to settle
    await page.goto("/admin/content/pages", { waitUntil: "networkidle" });
  });

  test("pages list page loads", async ({ page }) => {
    // Check root element exists
    const root = page.locator('[data-test-id="admin-content-pages-root"]');
    await expect(root).toBeVisible();

    // Check heading via data-test-id pattern
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText("Pages");

    // Check create button exists
    const createButton = page.locator('[data-test-id="admin-pages-create-button"]');
    await expect(createButton).toBeVisible();
  });

  test("pages table loads with controls", async ({ page }) => {
    // Wait for table to appear
    const table = page.locator('[data-test-id="admin-pages-table"]');
    await expect(table).toBeVisible();

    // Check filters exist
    const filters = page.locator('[data-test-id="admin-pages-filters"]');
    await expect(filters).toBeVisible();

    // Check status filter dropdown
    const statusFilter = page.locator('[data-test-id="admin-pages-status-filter"]');
    await expect(statusFilter).toBeVisible();

    // Check filter has correct options
    const options = statusFilter.locator("option");
    await expect(options).toHaveCount(4); // All, Draft, Published, Archived
  });

  test("pages pagination controls exist", async ({ page }) => {
    // Wait for pagination to appear
    const pagination = page.locator('[data-test-id="admin-pages-pagination"]');
    await expect(pagination).toBeVisible();

    // Check pagination buttons exist
    const prevButton = page.locator('[data-test-id="admin-pages-pagination-prev"]');
    const nextButton = page.locator('[data-test-id="admin-pages-pagination-next"]');
    const pageLabel = page.locator('[data-test-id="admin-pages-pagination-label"]');

    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();
    await expect(pageLabel).toBeVisible();
  });
});
