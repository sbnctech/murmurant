import { test, expect } from "@playwright/test";
import { waitForAdminFrame } from "../helpers/waitForAdminFrame";

test("Admin page loaded: iframe ready", async ({ page }) => {
  // Navigate to the wrapper page that hosts the iframe
  await page.goto("/admin-frame");

  // Wait for the iframe to be fully ready
  const frame = await waitForAdminFrame(page);

  // Basic sanity checks inside the iframe
  await expect(frame.locator("body")).toBeVisible();

  // Check that the admin header exists and is visible
  const header = frame.locator('[data-test-id="admin-header"]');
  await expect(header).toBeVisible();
  await expect(header).toHaveText(/Admin/i);
});
