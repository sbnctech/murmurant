import { test, expect } from "@playwright/test";
import { lookupMemberIdByEmail } from "./helpers/lookupIds";
import { SEED_MEMBERS } from "../fixtures/seed-data";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Member Detail Page", () => {
  test("Loads member detail page for Alice with correct info", async ({ page, request }) => {
    const memberId = await lookupMemberIdByEmail(request, SEED_MEMBERS.ALICE.email);
    await page.goto(`${BASE}/admin/members/${memberId}`);

    // Assert name is displayed
    const name = page.locator('[data-test-id="member-detail-name"]');
    await expect(name).toBeVisible();
    await expect(name).toContainText(SEED_MEMBERS.ALICE.fullName);

    // Assert email is displayed
    const email = page.locator('[data-test-id="member-detail-email"]');
    await expect(email).toBeVisible();
    await expect(email).toContainText(SEED_MEMBERS.ALICE.email);

    // Assert status is displayed
    const status = page.locator('[data-test-id="member-detail-status"]');
    await expect(status).toBeVisible();
    await expect(status).toContainText(SEED_MEMBERS.ALICE.status);
  });

  test("Displays registrations table with at least 1 row", async ({ page, request }) => {
    const memberId = await lookupMemberIdByEmail(request, SEED_MEMBERS.ALICE.email);
    await page.goto(`${BASE}/admin/members/${memberId}`);

    // Assert registrations table exists
    const table = page.locator('[data-test-id="member-detail-registrations-table"]');
    await expect(table).toBeVisible();

    // Assert at least 1 registration row (Alice has Morning Hike WAITLISTED, Beach Picnic CONFIRMED)
    const rows = page.locator('[data-test-id="member-detail-registration-row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("Returns 404 for non-existent member", async ({ page }) => {
    // Use valid UUID format that doesn't exist
    const response = await page.goto(`${BASE}/admin/members/00000000-0000-0000-0000-000000000000`);
    expect(response?.status()).toBe(404);
  });
});
