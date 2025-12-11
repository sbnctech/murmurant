import { test, expect } from "@playwright/test";

test("Admin registrations table renders joined member/event data", async ({ page }) => {
  await page.goto("http://localhost:3002/admin");

  // Table and rows exist
  const table = page.locator('[data-test-id="admin-registrations-table"]');
  await expect(table).toBeVisible();

  const rows = page.locator('[data-test-id="admin-registrations-row"]');
  await expect(rows).toHaveCount(2);

  // Row 1
  await expect(rows.nth(0)).toContainText("Alice Johnson");
  await expect(rows.nth(0)).toContainText("Welcome Hike");
  await expect(rows.nth(0)).toContainText("REGISTERED");

  // Row 2
  await expect(rows.nth(1)).toContainText("Bob Smith");
  await expect(rows.nth(1)).toContainText("Wine Mixer");
  await expect(rows.nth(1)).toContainText("WAITLISTED");
});
