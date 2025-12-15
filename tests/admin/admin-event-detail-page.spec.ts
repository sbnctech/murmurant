import { test, expect } from "@playwright/test";
import { lookupEventIdByTitle } from "./helpers/lookupIds";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Event Detail Page", () => {
  test("shows event detail page for Welcome Hike", async ({ page }) => {
    const eventId = await lookupEventIdByTitle(page.request, "Welcome");
    await page.goto(`${BASE}/admin/events/${eventId}`);

    const root = page.locator('[data-test-id="admin-event-detail-root"]');
    await expect(root).toBeVisible();

    // Check heading contains event title
    const heading = page.locator("h1");
    await expect(heading).toContainText("Welcome Hike");

    // Check registrations table is visible
    const table = page.locator('[data-test-id="admin-event-detail-registrations-table"]');
    await expect(table).toBeVisible();
  });

  test("shows at least one registration row", async ({ page }) => {
    const eventId = await lookupEventIdByTitle(page.request, "Welcome");
    await page.goto(`${BASE}/admin/events/${eventId}`);

    const rows = page.locator('[data-test-id="admin-event-detail-registration-row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("returns 404 for invalid event id", async ({ page }) => {
    const eventId = await lookupEventIdByTitle(page.request, "Welcome");
    const response = await page.goto(`${BASE}/admin/events/${eventId}`);

    expect(response?.status()).toBe(404);
  });
});