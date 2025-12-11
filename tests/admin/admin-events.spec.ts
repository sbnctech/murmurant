import { test, expect } from "@playwright/test";
import { waitForAdminFrame } from "../helpers/waitForAdminFrame";

test("Admin events table renders mock events", async ({ page }) => {
  await page.goto("/admin-frame");

  const frame = await waitForAdminFrame(page);

  const rows = frame.locator('[data-test-id="admin-events-row"]');
  await expect(rows).toHaveCount(2);

  await expect(rows.nth(0)).toContainText("Welcome Hike");
  await expect(rows.nth(1)).toContainText("Wine Mixer");
});
