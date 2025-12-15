import { test, expect } from "@playwright/test";
import { lookupMemberIdByEmail } from "./helpers/lookupIds";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Member Detail Page (API-backed)", () => {
  test("Shows member detail page with correct data-test-id root", async ({ page }) => {
    const memberId = await lookupMemberIdByEmail(page.request, "alice@example.com");
    await page.goto(`${BASE}/admin/members/${memberId}`);

    const root = page.locator('[data-test-id="admin-member-detail-root"]');
    await expect(root).toBeVisible();
  });

  test("Displays member name, email, and status", async ({ page }) => {
    const memberId = await lookupMemberIdByEmail(page.request, "alice@example.com");
    await page.goto(`${BASE}/admin/members/${memberId}`);

    const name = page.locator('[data-test-id="member-detail-name"]');
    await expect(name).toBeVisible();
    await expect(name).toContainText("Alice Johnson");

    const email = page.locator('[data-test-id="member-detail-email"]');
    await expect(email).toBeVisible();
    await expect(email).toContainText("alice@example.com");

    const status = page.locator('[data-test-id="member-detail-status"]');
    await expect(status).toBeVisible();
    await expect(status).toContainText("ACTIVE");
  });

  test("Shows registrations table with at least one row", async ({ page }) => {
    const memberId = await lookupMemberIdByEmail(page.request, "alice@example.com");
    await page.goto(`${BASE}/admin/members/${memberId}`);

    const table = page.locator('[data-test-id="member-detail-registrations-table"]');
    await expect(table).toBeVisible();

    const rows = page.locator('[data-test-id="member-detail-registration-row"]');
    await expect(rows).toHaveCount(1);

    await expect(rows.first()).toContainText("Welcome Hike");
    await expect(rows.first()).toContainText("REGISTERED");
  });

  test("Returns 404 for invalid member ID", async ({ page }) => {
    const response = await page.goto(`${BASE}/admin/members/invalid-id-xyz`);
    expect(response?.status()).toBe(404);
  });
});