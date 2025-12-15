import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Registrations Explorer", () => {
  test("shows registrations list page with table", async ({ page }) => {
    await page.goto(`${BASE}/admin/registrations`);

    const root = page.locator('[data-test-id="admin-registrations-list-root"]');
    await expect(root).toBeVisible();

    const table = page.locator('[data-test-id="admin-registrations-list-table"]');
    await expect(table).toBeVisible();
  });

  test("displays at least one registration row", async ({ page }) => {
    await page.goto(`${BASE}/admin/registrations`);

    // Wait for at least one row to appear (client-side fetching)
    const rows = page.locator('[data-test-id="admin-registrations-list-row"]');
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("@quarantine clicking member name navigates to detail page", async ({ page }) => {
    await page.goto(`${BASE}/admin/registrations`);

    const memberLink = page.locator('[data-test-id="admin-registrations-list-member-link"]').first();
    await expect(memberLink).toBeVisible();

    await memberLink.click();

    await expect(page).toHaveURL(/\/admin\/registrations\/r\d+/);
  });

  test("@quarantine nav link from main admin page works", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const navLink = page.locator('[data-test-id="admin-nav-registrations-explorer"]');
    await expect(navLink).toBeVisible();

    await navLink.click();

    await expect(page).toHaveURL(`${BASE}/admin/registrations`);

    const root = page.locator('[data-test-id="admin-registrations-list-root"]');
    await expect(root).toBeVisible();
  });
});
