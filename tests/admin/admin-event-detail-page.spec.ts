import { test, expect } from "@playwright/test";
import { lookupEventIdByTitle } from "./helpers/lookupIds";
import { SEED_EVENTS } from "../fixtures/seed-data";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Event Detail Page", () => {
  test("shows event detail page for Welcome Coffee", async ({ page, request }) => {
    // Seed has "Welcome Coffee", not "Welcome Hike"
    const eventId = await lookupEventIdByTitle(request, "Welcome Coffee");
    await page.goto(`${BASE}/admin/events/${eventId}`);

    const root = page.locator('[data-test-id="admin-event-detail-root"]');
    await expect(root).toBeVisible();

    // Check heading contains event title
    const heading = page.locator("h1");
    await expect(heading).toContainText(SEED_EVENTS.WELCOME_COFFEE.title);
  });

  test("shows at least one registration row", async ({ page, request }) => {
    // Welcome Coffee has Carol registered
    const eventId = await lookupEventIdByTitle(request, "Welcome Coffee");
    await page.goto(`${BASE}/admin/events/${eventId}`);

    const rows = page.locator('[data-test-id="admin-event-detail-registration-row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("returns 404 for invalid event id", async ({ page }) => {
    // Use a valid UUID format that doesn't exist
    const response = await page.goto(`${BASE}/admin/events/00000000-0000-0000-0000-000000000000`);
    expect(response?.status()).toBe(404);
  });
});
