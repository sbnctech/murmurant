import { test, expect } from "@playwright/test";

// TODO: Page not implemented yet - quarantine until comms feature is built
test.describe("@quarantine Admin Communications - Message Templates", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/comms/templates", { waitUntil: "networkidle" });
  });

  test("message templates page loads", async ({ page }) => {
    // Check root element exists
    const root = page.locator('[data-test-id="admin-comms-templates-root"]');
    await expect(root).toBeVisible();

    // Check heading
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText("Message templates");

    // Check create button exists
    const createButton = page.locator('[data-test-id="admin-message-templates-create-button"]');
    await expect(createButton).toBeVisible();
  });

  test("message templates table loads", async ({ page }) => {
    // Wait for table to appear
    const table = page.locator('[data-test-id="admin-message-templates-table"]');
    await expect(table).toBeVisible();
  });
});
