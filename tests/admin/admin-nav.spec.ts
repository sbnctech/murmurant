import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Section Navigation", () => {
  test("Admin nav renders with all links", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    // Assert that the nav exists
    const nav = page.locator('[data-test-id="admin-nav"]');
    await expect(nav).toBeVisible();

    // Assert that each link is visible
    await expect(page.locator('[data-test-id="admin-nav-summary"]')).toBeVisible();
    await expect(page.locator('[data-test-id="admin-nav-members"]')).toBeVisible();
    await expect(page.locator('[data-test-id="admin-nav-events"]')).toBeVisible();
    await expect(page.locator('[data-test-id="admin-nav-registrations"]')).toBeVisible();
    await expect(page.locator('[data-test-id="admin-nav-emails"]')).toBeVisible();
    await expect(page.locator('[data-test-id="admin-nav-system-comms"]')).toBeVisible();
  });

  test("@quarantine Admin nav links update the hash when clicked", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    // Click the Members nav link
    await page.locator('[data-test-id="admin-nav-members"]').click();
    let hash = await page.evaluate(() => window.location.hash);
    expect(hash).toBe("#admin-members-section");

    // Click the Events nav link
    await page.locator('[data-test-id="admin-nav-events"]').click();
    hash = await page.evaluate(() => window.location.hash);
    expect(hash).toBe("#admin-events-section");
  });
});
