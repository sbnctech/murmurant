import { test, expect } from "@playwright/test";

test.describe("Admin Communications - Mailing Lists", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/comms/lists", { waitUntil: "networkidle" });
  });

  test("mailing lists page loads", async ({ page }) => {
    // Check root element exists
    const root = page.locator('[data-test-id="admin-comms-lists-root"]');
    await expect(root).toBeVisible();

    // Check heading
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText("Mailing lists");

    // Check create button exists
    const createButton = page.locator('[data-test-id="admin-mailing-lists-create-button"]');
    await expect(createButton).toBeVisible();
  });

  test("mailing lists table loads", async ({ page }) => {
    // Wait for table to appear
    const table = page.locator('[data-test-id="admin-mailing-lists-table"]');
    await expect(table).toBeVisible();
  });
});
