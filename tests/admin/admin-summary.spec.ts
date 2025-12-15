import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Dashboard Summary", () => {
  test("@quarantine Admin summary tiles show expected counts", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const section = page.locator('[data-test-id="admin-summary-section"]');
    await expect(section).toBeVisible();

    // Check that each tile is visible and contains expected mock data counts
    await expect(page.locator('[data-test-id="admin-summary-members"]')).toBeVisible();
    await expect(page.locator('[data-test-id="admin-summary-events"]')).toBeVisible();
    await expect(page.locator('[data-test-id="admin-summary-registrations"]')).toBeVisible();
    await expect(page.locator('[data-test-id="admin-summary-waitlisted"]')).toBeVisible();

    // Verify counts match mock data (2 active members, 2 events, 2 registrations, 1 waitlisted)
    await expect(page.locator('[data-test-id="admin-summary-members"]')).toContainText("2");
    await expect(page.locator('[data-test-id="admin-summary-events"]')).toContainText("2");
    await expect(page.locator('[data-test-id="admin-summary-registrations"]')).toContainText("2");
    await expect(page.locator('[data-test-id="admin-summary-waitlisted"]')).toContainText("1");
  });

  test("Dashboard summary heading is visible", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const heading = page.getByRole("heading", { name: "Dashboard summary" });
    await expect(heading).toBeVisible();
  });
});
