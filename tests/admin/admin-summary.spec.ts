import { test, expect } from "@playwright/test";
import { SEED_COUNTS } from "../fixtures/seed-data";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Dashboard Summary", () => {
  test("Admin summary tiles show expected counts", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const section = page.locator('[data-test-id="admin-summary-section"]');
    await expect(section).toBeVisible();

    // Check that each tile is visible
    await expect(page.locator('[data-test-id="admin-summary-members"]')).toBeVisible();
    await expect(page.locator('[data-test-id="admin-summary-events"]')).toBeVisible();
    await expect(page.locator('[data-test-id="admin-summary-registrations"]')).toBeVisible();
    await expect(page.locator('[data-test-id="admin-summary-waitlisted"]')).toBeVisible();

    // Verify counts match seed data
    await expect(page.locator('[data-test-id="admin-summary-members"]')).toContainText(String(SEED_COUNTS.members));
    await expect(page.locator('[data-test-id="admin-summary-events"]')).toContainText(String(SEED_COUNTS.publishedEvents));
    await expect(page.locator('[data-test-id="admin-summary-registrations"]')).toContainText(String(SEED_COUNTS.registrations));
    await expect(page.locator('[data-test-id="admin-summary-waitlisted"]')).toContainText(String(SEED_COUNTS.waitlistedRegistrations));
  });

  test("Dashboard summary heading is visible", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const heading = page.getByRole("heading", { name: "Dashboard summary" });
    await expect(heading).toBeVisible();
  });
});
