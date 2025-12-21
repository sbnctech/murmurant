/**
 * Public Events API Tests
 *
 * Tests for the public events API endpoints:
 * - GET /api/v1/events (list)
 * - GET /api/v1/events/:id (detail)
 *
 * These endpoints are public - no authentication required.
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

// =============================================================================
// GET /api/v1/events - Events List
// =============================================================================

test.describe("GET /api/v1/events", () => {
  test("returns events list without auth", async ({ request }) => {
    const response = await request.get(`${BASE}/api/v1/events`);
    expect(response.status()).toBe(200);

    const data = await response.json();

    // Verify structure
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.pagination).toBeDefined();
    expect(data.categories).toBeDefined();
  });

  test("returns pagination metadata", async ({ request }) => {
    const response = await request.get(`${BASE}/api/v1/events?page=1&limit=5`);
    expect(response.status()).toBe(200);

    const data = await response.json();

    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(5);
    expect(typeof data.pagination.totalItems).toBe("number");
    expect(typeof data.pagination.totalPages).toBe("number");
  });

  test("returns event structure with required fields", async ({ request }) => {
    const response = await request.get(`${BASE}/api/v1/events`);
    expect(response.status()).toBe(200);

    const data = await response.json();

    // If there are events, verify their structure
    if (data.events.length > 0) {
      const event = data.events[0];
      expect(event.id).toBeDefined();
      expect(event.title).toBeDefined();
      expect(event.startTime).toBeDefined();
      expect(typeof event.registeredCount).toBe("number");
      // spotsRemaining can be null for unlimited capacity events
      expect("spotsRemaining" in event).toBe(true);
      expect(typeof event.isWaitlistOpen).toBe("boolean");
    }
  });

  test("filters by category", async ({ request }) => {
    // First get categories
    const listResponse = await request.get(`${BASE}/api/v1/events`);
    const listData = await listResponse.json();

    if (listData.categories.length > 0) {
      const category = listData.categories[0];
      const filteredResponse = await request.get(`${BASE}/api/v1/events?category=${encodeURIComponent(category)}`);
      expect(filteredResponse.status()).toBe(200);

      const filteredData = await filteredResponse.json();
      // All returned events should have the filtered category
      for (const event of filteredData.events) {
        expect(event.category).toBe(category);
      }
    }
  });

  test("filters past events", async ({ request }) => {
    const response = await request.get(`${BASE}/api/v1/events?past=true`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    // Should return past events (or empty if no past events)
    expect(Array.isArray(data.events)).toBe(true);
  });

  test("supports search", async ({ request }) => {
    const response = await request.get(`${BASE}/api/v1/events?search=test`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.events)).toBe(true);
  });
});

// =============================================================================
// GET /api/v1/events/:id - Event Detail
// =============================================================================

test.describe("GET /api/v1/events/:id", () => {
  test("returns 404 for non-existent event", async ({ request }) => {
    const response = await request.get(`${BASE}/api/v1/events/00000000-0000-0000-0000-000000000000`);
    expect(response.status()).toBe(404);
  });

  test("returns 404 for invalid UUID", async ({ request }) => {
    const response = await request.get(`${BASE}/api/v1/events/invalid-id`);
    expect(response.status()).toBe(404);
  });

  test("returns event detail for valid published event", async ({ request }) => {
    // First get an event ID from the list
    const listResponse = await request.get(`${BASE}/api/v1/events`);
    const listData = await listResponse.json();

    if (listData.events.length > 0) {
      const eventId = listData.events[0].id;
      const detailResponse = await request.get(`${BASE}/api/v1/events/${eventId}`);
      expect(detailResponse.status()).toBe(200);

      const detailData = await detailResponse.json();
      expect(detailData.event).toBeDefined();
      expect(detailData.event.id).toBe(eventId);
      expect(detailData.event.title).toBeDefined();
      expect(detailData.event.startTime).toBeDefined();
      expect(typeof detailData.event.registeredCount).toBe("number");
    }
  });

  test("event detail includes all expected fields", async ({ request }) => {
    const listResponse = await request.get(`${BASE}/api/v1/events`);
    const listData = await listResponse.json();

    if (listData.events.length > 0) {
      const eventId = listData.events[0].id;
      const detailResponse = await request.get(`${BASE}/api/v1/events/${eventId}`);
      const detailData = await detailResponse.json();

      const event = detailData.event;
      expect(event.id).toBeDefined();
      expect(event.title).toBeDefined();
      expect("description" in event).toBe(true);
      expect("category" in event).toBe(true);
      expect("location" in event).toBe(true);
      expect(event.startTime).toBeDefined();
      expect("endTime" in event).toBe(true);
      expect("capacity" in event).toBe(true);
      expect(typeof event.isPublished).toBe("boolean");
      expect(typeof event.registeredCount).toBe("number");
      expect("spotsRemaining" in event).toBe(true);
      expect(typeof event.isWaitlistOpen).toBe("boolean");
      expect("eventChair" in event).toBe(true);
    }
  });
});
