import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("@quarantine Admin Registrations Filter", () => {
  test("filter control is visible and defaults to All statuses", async ({ page }) => {
    await page.goto(`${BASE}/admin/registrations`);

    const filterWrapper = page.locator('[data-test-id="admin-registrations-filter"]');
    await expect(filterWrapper).toBeVisible();

    const filterSelect = page.locator('[data-test-id="admin-registrations-filter-select"]');
    await expect(filterSelect).toHaveValue("ALL");

    // Mock data has 2 registrations
    const rows = page.locator('[data-test-id="admin-registrations-list-row"]');
    await expect(rows).toHaveCount(2);
  });

  test("Registered only filter shows only REGISTERED rows", async ({ page }) => {
    await page.goto(`${BASE}/admin/registrations`);

    const filterSelect = page.locator('[data-test-id="admin-registrations-filter-select"]');
    await filterSelect.selectOption("REGISTERED");

    const rows = page.locator('[data-test-id="admin-registrations-list-row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Verify all visible rows have REGISTERED status
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText("REGISTERED");
    }

    // Verify WAITLISTED is not present in any row
    const tableBody = page.locator('[data-test-id="admin-registrations-list-table"] tbody');
    await expect(tableBody).not.toContainText("WAITLISTED");
  });

  test("Waitlisted only filter shows only WAITLISTED rows", async ({ page }) => {
    await page.goto(`${BASE}/admin/registrations`);

    // Wait for initial data to load before interacting with filter
    const rows = page.locator('[data-test-id="admin-registrations-list-row"]');
    await expect(rows.first()).toBeVisible();

    const filterSelect = page.locator('[data-test-id="admin-registrations-filter-select"]');
    await filterSelect.selectOption("WAITLISTED");

    // Wait for filter to apply and verify at least one WAITLISTED row
    await expect(rows.first()).toContainText("WAITLISTED");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Verify all visible rows have WAITLISTED status
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText("WAITLISTED");
    }

    // Verify REGISTERED is not present in any row
    const tableBody = page.locator('[data-test-id="admin-registrations-list-table"] tbody');
    await expect(tableBody).not.toContainText("REGISTERED");
  });

  test("changing filters does not break navigation to registration detail", async ({ page }) => {
    await page.goto(`${BASE}/admin/registrations`);

    // Set filter to WAITLISTED
    const filterSelect = page.locator('[data-test-id="admin-registrations-filter-select"]');
    await filterSelect.selectOption("WAITLISTED");

    // Click the member link in the filtered row
    const memberLink = page.locator('[data-test-id="admin-registrations-list-member-link"]').first();
    await expect(memberLink).toBeVisible();
    await memberLink.click();

    // Verify detail page loads
    const detailRoot = page.locator('[data-test-id="admin-registration-detail-root"]');
    await expect(detailRoot).toBeVisible();

    // Verify it shows WAITLISTED status
    const statusField = page.locator('[data-test-id="admin-registration-status"]');
    await expect(statusField).toContainText("WAITLISTED");

    // Verify event title is present
    const eventField = page.locator('[data-test-id="admin-registration-event-title"]');
    await expect(eventField).toBeVisible();
  });
});
