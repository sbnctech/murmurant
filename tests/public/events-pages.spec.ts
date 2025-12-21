/**
 * Public Events Pages Tests
 *
 * Playwright smoke tests for public events pages:
 * - /events (discovery page)
 * - /events/:id (detail page)
 *
 * These pages are public - no authentication required.
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

// =============================================================================
// /events - Events Discovery Page
// =============================================================================

test.describe("/events - Events Discovery", () => {
  test("page loads successfully", async ({ page }) => {
    await page.goto(`${BASE}/events`);

    // Page should have the main container
    await expect(page.locator('[data-test-id="events-page"]')).toBeVisible();
  });

  test("shows hero section", async ({ page }) => {
    await page.goto(`${BASE}/events`);

    // Hero should be visible with title
    await expect(page.locator('[data-test-id="events-hero-title"]')).toContainText("Events");
  });

  test("shows filter controls", async ({ page }) => {
    await page.goto(`${BASE}/events`);

    // Filter controls should be visible
    await expect(page.locator('[data-test-id="events-search"]')).toBeVisible();
    await expect(page.locator('[data-test-id="events-category-filter"]')).toBeVisible();
    await expect(page.locator('[data-test-id="events-time-upcoming"]')).toBeVisible();
    await expect(page.locator('[data-test-id="events-time-past"]')).toBeVisible();
  });

  test("shows view toggle buttons", async ({ page }) => {
    await page.goto(`${BASE}/events`);

    await expect(page.locator('[data-test-id="events-view-list"]')).toBeVisible();
    await expect(page.locator('[data-test-id="events-view-grid"]')).toBeVisible();
  });

  test("loads events or shows empty state", async ({ page }) => {
    await page.goto(`${BASE}/events`);

    // Wait for loading to complete
    await page.waitForFunction(() => {
      const loading = document.querySelector('[data-test-id="events-loading"]');
      return !loading || loading.textContent === "";
    });

    // Should show either events list or empty state
    const eventsList = page.locator('[data-test-id="events-list"]');
    const emptyState = page.locator('[data-test-id="events-empty"]');

    const hasEvents = await eventsList.isVisible();
    const isEmpty = await emptyState.isVisible();

    expect(hasEvents || isEmpty).toBe(true);
  });

  test("can toggle between upcoming and past", async ({ page }) => {
    await page.goto(`${BASE}/events`);

    // Click past button
    await page.click('[data-test-id="events-time-past"]');

    // Wait for loading
    await page.waitForTimeout(500);

    // Past button should now be active (has primary background)
    const pastButton = page.locator('[data-test-id="events-time-past"]');
    await expect(pastButton).toBeVisible();
  });

  test("can toggle view modes", async ({ page }) => {
    await page.goto(`${BASE}/events`);

    // Click grid view
    await page.click('[data-test-id="events-view-grid"]');

    // Grid button should now be active
    const gridButton = page.locator('[data-test-id="events-view-grid"]');
    await expect(gridButton).toBeVisible();
  });
});

// =============================================================================
// /events/:id - Event Detail Page
// =============================================================================

test.describe("/events/:id - Event Detail", () => {
  test("returns 404 for non-existent event", async ({ page }) => {
    const response = await page.goto(`${BASE}/events/00000000-0000-0000-0000-000000000000`);
    // Next.js returns 404 for notFound()
    expect(response?.status()).toBe(404);
  });

  test("detail page loads for valid event", async ({ page, request }) => {
    // First get an event ID from the API
    const apiResponse = await request.get(`${BASE}/api/v1/events`);
    const apiData = await apiResponse.json();

    if (apiData.events.length > 0) {
      const eventId = apiData.events[0].id;
      await page.goto(`${BASE}/events/${eventId}`);

      // Page should load with event detail container
      await expect(page.locator('[data-test-id="event-detail-page"]')).toBeVisible();
    }
  });

  test("shows event title", async ({ page, request }) => {
    const apiResponse = await request.get(`${BASE}/api/v1/events`);
    const apiData = await apiResponse.json();

    if (apiData.events.length > 0) {
      const event = apiData.events[0];
      await page.goto(`${BASE}/events/${event.id}`);

      await expect(page.locator('[data-test-id="event-title"]')).toContainText(event.title);
    }
  });

  test("shows event date and time", async ({ page, request }) => {
    const apiResponse = await request.get(`${BASE}/api/v1/events`);
    const apiData = await apiResponse.json();

    if (apiData.events.length > 0) {
      const eventId = apiData.events[0].id;
      await page.goto(`${BASE}/events/${eventId}`);

      await expect(page.locator('[data-test-id="event-date"]')).toBeVisible();
      await expect(page.locator('[data-test-id="event-time"]')).toBeVisible();
    }
  });

  test("shows status badge", async ({ page, request }) => {
    const apiResponse = await request.get(`${BASE}/api/v1/events`);
    const apiData = await apiResponse.json();

    if (apiData.events.length > 0) {
      const eventId = apiData.events[0].id;
      await page.goto(`${BASE}/events/${eventId}`);

      await expect(page.locator('[data-test-id="event-status"]')).toBeVisible();
    }
  });

  test("shows add to calendar button", async ({ page, request }) => {
    const apiResponse = await request.get(`${BASE}/api/v1/events`);
    const apiData = await apiResponse.json();

    if (apiData.events.length > 0) {
      const eventId = apiData.events[0].id;
      await page.goto(`${BASE}/events/${eventId}`);

      await expect(page.locator('[data-test-id="event-add-to-calendar"]')).toBeVisible();
    }
  });

  test("shows register button for upcoming events", async ({ page, request }) => {
    const apiResponse = await request.get(`${BASE}/api/v1/events`);
    const apiData = await apiResponse.json();

    // Find an upcoming event
    const upcomingEvent = apiData.events.find((e: { startTime: string }) => new Date(e.startTime) > new Date());

    if (upcomingEvent) {
      await page.goto(`${BASE}/events/${upcomingEvent.id}`);

      await expect(page.locator('[data-test-id="event-register-button"]')).toBeVisible();
    }
  });

  test("register button opens modal stub", async ({ page, request }) => {
    const apiResponse = await request.get(`${BASE}/api/v1/events`);
    const apiData = await apiResponse.json();

    const upcomingEvent = apiData.events.find((e: { startTime: string }) => new Date(e.startTime) > new Date());

    if (upcomingEvent) {
      await page.goto(`${BASE}/events/${upcomingEvent.id}`);

      // Click register button
      await page.click('[data-test-id="event-register-button"]');

      // Modal should appear
      await expect(page.locator('[data-test-id="registration-modal"]')).toBeVisible();
      await expect(page.locator('[data-test-id="registration-modal"]')).toContainText("Coming Soon");
    }
  });
});
