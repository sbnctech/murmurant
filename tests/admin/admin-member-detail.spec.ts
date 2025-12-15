import { test, expect } from "@playwright/test";
import { DEMO_MEMBERS } from "../fixtures/demo-seed";
import { lookupMemberIdByEmail } from "./helpers/lookupIds";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("@quarantine Admin Member Detail Page", () => {
  test("Loads member detail page for Alice with correct info", async ({ page, request }) => {
    // Lookup Alice's UUID from API
    const aliceId = await lookupMemberIdByEmail(request, DEMO_MEMBERS.ALICE.email);

    await page.goto(`${BASE}/admin/members/${aliceId}`);

    // Assert name is displayed (Alice Chen from seed)
    const name = page.locator('[data-test-id="member-detail-name"]');
    await expect(name).toBeVisible();
    await expect(name).toContainText(DEMO_MEMBERS.ALICE.fullName);

    // Assert email is displayed
    const email = page.locator('[data-test-id="member-detail-email"]');
    await expect(email).toBeVisible();
    await expect(email).toContainText(DEMO_MEMBERS.ALICE.email);

    // Assert status is displayed (Alice is EXTENDED which is active)
    const status = page.locator('[data-test-id="member-detail-status"]');
    await expect(status).toBeVisible();
  });

  test("Displays registrations table with at least 1 row", async ({ page, request }) => {
    // Alice has 2 registrations in seed (Morning Hike - WAITLISTED, Beach Picnic - CONFIRMED)
    const aliceId = await lookupMemberIdByEmail(request, DEMO_MEMBERS.ALICE.email);

    await page.goto(`${BASE}/admin/members/${aliceId}`);

    // Assert registrations table exists
    const table = page.locator('[data-test-id="member-detail-registrations-table"]');
    await expect(table).toBeVisible();

    // Assert at least 1 registration row (Alice has 2 in seed)
    const rows = page.locator('[data-test-id="member-detail-registration-row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("Carol member detail shows her registrations", async ({ page, request }) => {
    // Carol has 2 registrations in seed (Welcome Coffee, Morning Hike - both CONFIRMED)
    const carolId = await lookupMemberIdByEmail(request, DEMO_MEMBERS.CAROL.email);

    await page.goto(`${BASE}/admin/members/${carolId}`);

    const name = page.locator('[data-test-id="member-detail-name"]');
    await expect(name).toContainText(DEMO_MEMBERS.CAROL.fullName);

    // Carol is a NEWCOMER
    const rows = page.locator('[data-test-id="member-detail-registration-row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("Returns 404 for non-existent member", async ({ page }) => {
    // Use a clearly invalid UUID format
    const response = await page.goto(`${BASE}/admin/members/00000000-0000-0000-0000-000000000000`);
    expect(response?.status()).toBe(404);
  });
});
