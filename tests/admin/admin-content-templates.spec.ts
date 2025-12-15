import { test, expect } from "@playwright/test";

test.describe("Admin Content Templates", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/content/templates", { waitUntil: "networkidle" });
  });

  test("templates list page loads", async ({ page }) => {
    // Check root element exists
    const root = page.locator('[data-test-id="admin-content-templates-root"]');
    await expect(root).toBeVisible();

    // Check heading
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText("Templates");

    // Check create button exists
    const createButton = page.locator('[data-test-id="admin-templates-create-button"]');
    await expect(createButton).toBeVisible();
  });

  test("templates table loads", async ({ page }) => {
    // Wait for table to appear
    const table = page.locator('[data-test-id="admin-templates-table"]');
    await expect(table).toBeVisible();
  });
});
