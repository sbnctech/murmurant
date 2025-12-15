import { test, expect } from "@playwright/test";
import { lookupMemberIdByEmail } from "./helpers/lookupIds";
import { SEED_MEMBERS } from "../fixtures/seed-data";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Member Detail Page (API-backed)", () => {
  test("Shows member detail page with correct data-test-id root", async ({ page, request }) => {
    const memberId = await lookupMemberIdByEmail(request, SEED_MEMBERS.ALICE.email);
    await page.goto(`${BASE}/admin/members/${memberId}`);

    const root = page.locator('[data-test-id="admin-member-detail-root"]');
    await expect(root).toBeVisible();
  });

  test("Displays member name, email, and status", async ({ page, request }) => {
    const memberId = await lookupMemberIdByEmail(request, SEED_MEMBERS.ALICE.email);
    await page.goto(`${BASE}/admin/members/${memberId}`);

    const name = page.locator('[data-test-id="member-detail-name"]');
    await expect(name).toBeVisible();
    // Seed has Alice Chen, not Alice Johnson
    await expect(name).toContainText(SEED_MEMBERS.ALICE.fullName);

    const email = page.locator('[data-test-id="member-detail-email"]');
    await expect(email).toBeVisible();
    await expect(email).toContainText(SEED_MEMBERS.ALICE.email);

    const status = page.locator('[data-test-id="member-detail-status"]');
    await expect(status).toBeVisible();
  });

  test("Shows registrations table with at least one row", async ({ page, request }) => {
    const memberId = await lookupMemberIdByEmail(request, SEED_MEMBERS.ALICE.email);
    await page.goto(`${BASE}/admin/members/${memberId}`);

    const table = page.locator('[data-test-id="member-detail-registrations-table"]');
    await expect(table).toBeVisible();

    // Alice has 2 registrations in seed: Morning Hike (WAITLISTED), Beach Picnic (CONFIRMED)
    const rows = page.locator('[data-test-id="member-detail-registration-row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("Returns 404 for invalid member ID", async ({ page }) => {
    const response = await page.goto(`${BASE}/admin/members/00000000-0000-0000-0000-000000000000`);
    expect(response?.status()).toBe(404);
  });
});
