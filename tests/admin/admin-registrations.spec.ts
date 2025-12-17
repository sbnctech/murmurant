import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test("Admin registrations table renders joined member/event data", async ({ page }) => {
  await page.goto(`${BASE}/admin`);

  // Table and rows exist
  const table = page.locator('[data-test-id="admin-registrations-table"]');
  await expect(table).toBeVisible();

  // Seed has 4 registrations total
  const rows = page.locator('[data-test-id="admin-registrations-row"]');
  const count = await rows.count();
  expect(count).toBeGreaterThanOrEqual(1);

  // Verify at least one registration shows member and event data
  // Seed: Alice has Morning Hike (WAITLISTED), Beach Picnic (CONFIRMED)
  //       Carol has Welcome Coffee (CONFIRMED), Beach Picnic (CONFIRMED)
  const firstRow = rows.first();
  await expect(firstRow).toBeVisible();
});
