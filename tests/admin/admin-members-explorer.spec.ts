import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Members Explorer", () => {
  test("Shows members list page at /admin/members", async ({ page }) => {
    await page.goto(`${BASE}/admin/members`);

    const root = page.locator('[data-test-id="admin-members-root"]');
    await expect(root).toBeVisible();

    const table = page.locator('[data-test-id="admin-members-table"]');
    await expect(table).toBeVisible();
  });

  test("Displays at least one member row", async ({ page }) => {
    await page.goto(`${BASE}/admin/members`);

    // Wait for at least one row to appear (client-side fetching)
    const rows = page.locator('[data-test-id="admin-members-row"]');
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("@quarantine Clicking member name navigates to detail page", async ({ page }) => {
    await page.goto(`${BASE}/admin/members`);

    const link = page.locator('[data-test-id="admin-members-link"]').first();
    await expect(link).toBeVisible();

    await link.click();

    // Should navigate to member detail page
    await expect(page).toHaveURL(/\/admin\/members\/m\d+/);

    const detailRoot = page.locator('[data-test-id="admin-member-detail-root"]');
    await expect(detailRoot).toBeVisible();
  });

  test("@quarantine Nav link from main admin page works", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const navLink = page.locator('[data-test-id="admin-nav-members-explorer"]');
    await expect(navLink).toBeVisible();

    await navLink.click();

    await expect(page).toHaveURL(`${BASE}/admin/members`);

    const root = page.locator('[data-test-id="admin-members-root"]');
    await expect(root).toBeVisible();
  });
});
