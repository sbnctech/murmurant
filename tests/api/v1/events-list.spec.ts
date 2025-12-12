import { test, expect } from "@playwright/test";

/**
 * Events List Endpoint Tests
 *
 * Tests for GET /api/v1/events (member-facing)
 * See: docs/api/dtos/event.md
 *
 * Note: This endpoint returns published events and does not require auth for v1.
 * Auth will be added in a future iteration when JWT middleware is implemented.
 */

const BASE_URL = process.env.PW_BASE_URL || "http://localhost:3000";

test.describe("GET /api/v1/events", () => {
  test("returns 200 with event list response shape", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/events`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.events).toBeDefined();
    expect(Array.isArray(body.events)).toBe(true);
    expect(body.pagination).toBeDefined();
  });

  test("returns correct pagination metadata structure", async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/v1/events?page=1&limit=5`
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(5);
    expect(typeof body.pagination.totalItems).toBe("number");
    expect(typeof body.pagination.totalPages).toBe("number");
    expect(typeof body.pagination.hasNext).toBe("boolean");
    expect(typeof body.pagination.hasPrev).toBe("boolean");
  });

  test("returns EventSummary shape for each event", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/events`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    // If there are events in the database, verify shape
    if (body.events.length > 0) {
      const event = body.events[0];
      expect(event.id).toBeDefined();
      expect(event.title).toBeDefined();
      expect(event.startTime).toBeDefined();
      expect(typeof event.isWaitlistOpen).toBe("boolean");
      expect(typeof event.registeredCount).toBe("number");
      // Optional fields can be null
      expect(event.category === null || typeof event.category === "string").toBe(true);
      expect(event.description === null || typeof event.description === "string").toBe(true);
      expect(event.location === null || typeof event.location === "string").toBe(true);
      expect(event.capacity === null || typeof event.capacity === "number").toBe(true);
    }
  });

  test("respects limit parameter", async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/v1/events?limit=2`
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.events.length).toBeLessThanOrEqual(2);
    expect(body.pagination.limit).toBe(2);
  });

  test("clamps limit to max 100", async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/v1/events?limit=500`
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.pagination.limit).toBe(100);
  });

  test("clamps page to minimum 1", async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/v1/events?page=0`
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.pagination.page).toBe(1);
  });

  // Filter tests - require seeded data

  test("filters by category", async ({ request }) => {
    // Seed includes: 1 Outdoors event (Morning Hike), 2 Social events
    const response = await request.get(
      `${BASE_URL}/api/v1/events?category=Outdoors`
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.events.length).toBeGreaterThan(0);
    for (const event of body.events) {
      expect(event.category).toBe("Outdoors");
    }
  });

  test("filters by date range", async ({ request }) => {
    // Seed includes: Morning Hike on 2025-06-10, which falls in June 2025
    const from = "2025-06-01T00:00:00Z";
    const to = "2025-06-30T23:59:59Z";

    const response = await request.get(
      `${BASE_URL}/api/v1/events?from=${from}&to=${to}`
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.events.length).toBeGreaterThan(0);
    for (const event of body.events) {
      const startTime = new Date(event.startTime);
      expect(startTime >= new Date(from)).toBe(true);
      expect(startTime <= new Date(to)).toBe(true);
    }
  });

  test("returns only published events", async ({ request }) => {
    // Seed includes 1 unpublished event (Draft Event) which should not appear
    const response = await request.get(`${BASE_URL}/api/v1/events`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    // Should have 3 published events, not 4
    expect(body.pagination.totalItems).toBe(3);

    // None should have "Draft" in the title
    for (const event of body.events) {
      expect(event.title).not.toContain("Draft");
    }
  });
});
