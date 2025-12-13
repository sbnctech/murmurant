/**
 * REGRESSION TRIPWIRE TEST
 *
 * This test guards against a specific bug where the admin event detail page
 * would fail with "Unauthorized" because it was fetching from /api/admin/*
 * instead of querying Prisma directly.
 *
 * Server components cannot propagate auth headers to internal API routes,
 * so any fetch to /api/admin/* from a server component will fail.
 *
 * This test navigates DIRECTLY to an event detail URL to verify:
 * 1. The page renders without auth errors
 * 2. The admin-event-detail-root test ID is visible
 * 3. No redirect to error pages occurs
 */

import { test, expect } from "@playwright/test";

test.describe("Admin Event Detail Direct Access (Regression Guard)", () => {
  test("direct navigation to event detail page renders without auth error", async ({
    page,
  }) => {
    // First, get a valid event ID from the events API
    const eventsResponse = await page.request.get("/api/events");
    const eventsData = await eventsResponse.json();
    const events = eventsData.events ?? [];

    // Skip if no events in database
    if (events.length === 0) {
      test.skip(true, "No events in database to test with");
      return;
    }

    const eventId = events[0].id;

    // Navigate DIRECTLY to the event detail page (not through the list)
    await page.goto(`/admin/events/${eventId}`);

    // Wait for the page to be ready
    await page.waitForLoadState("domcontentloaded");

    // Verify the page renders with the correct test ID
    // This will FAIL if the page shows an auth error or redirects
    const detailRoot = page.locator('[data-test-id="admin-event-detail-root"]');
    await expect(detailRoot).toBeVisible({ timeout: 10000 });

    // Verify we're still on the expected URL (no redirect to error page)
    await expect(page).toHaveURL(new RegExp(`/admin/events/${eventId}`));

    // Verify page does NOT contain auth error text
    // This catches the specific regression where server components fetch /api/admin/*
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("Unauthorized");
    expect(bodyText).not.toContain("Forbidden");

    // Verify no error indicators are visible
    const errorIndicator = page.locator(
      '[data-test-id="admin-event-detail-error"]'
    );
    await expect(errorIndicator).not.toBeVisible();
  });
});
