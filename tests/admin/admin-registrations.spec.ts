import { test, expect } from "@playwright/test";
import {
  DEMO_MEMBERS,
  DEMO_REGISTRATION_COUNT,
} from "../fixtures/demo-seed";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("@quarantine Admin Registrations Table", () => {
  test("renders joined member/event data", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    // Table and rows exist
    const table = page.locator('[data-test-id="admin-registrations-table"]');
    await expect(table).toBeVisible();

    const rows = page.locator('[data-test-id="admin-registrations-row"]');
    // Seed creates 4 registrations
    await expect(rows).toHaveCount(DEMO_REGISTRATION_COUNT);

    // Verify data from seed is present
    const rowTexts = await rows.allTextContents();
    const allText = rowTexts.join(" ");

    // Check for known member names from seed (Alice Chen, Carol Johnson)
    expect(allText).toContain(DEMO_MEMBERS.ALICE.firstName);

    // Check for expected statuses from seed
    expect(allText).toContain("CONFIRMED");
    expect(allText).toContain("WAITLISTED");
  });

  test("shows registration status badges", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const rows = page.locator('[data-test-id="admin-registrations-row"]');
    const rowTexts = await rows.allTextContents();
    const allText = rowTexts.join(" ");

    // Seed has both CONFIRMED and WAITLISTED registrations
    expect(allText).toContain("CONFIRMED");
    expect(allText).toContain("WAITLISTED");
  });
});
