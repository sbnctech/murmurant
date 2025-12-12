import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const ADMIN_HEADERS = { Authorization: "Bearer test-admin-token" };

test.describe("GET /api/admin/events", () => {
  test("returns 200 and items array", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/events`, {
      headers: ADMIN_HEADERS,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.items).toBeDefined();
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThanOrEqual(1);
  });

  test("returns events with correct shape", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/events`, {
      headers: ADMIN_HEADERS,
    });
    const data = await response.json();

    const event = data.items[0];
    expect(event.id).toBeDefined();
    expect(typeof event.id).toBe("string");
    expect(event.title).toBeDefined();
    expect(typeof event.title).toBe("string");
    expect(event.startTime).toBeDefined();
    expect(typeof event.registrationCount).toBe("number");
    expect(typeof event.waitlistedCount).toBe("number");
  });

  test("returns events with registration counts", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/events`, {
      headers: ADMIN_HEADERS,
    });
    const data = await response.json();

    // Find an event with registrations (Morning Hike has 2 registered + 1 waitlisted)
    const eventWithRegs = data.items.find(
      (e: { registrationCount: number }) => e.registrationCount > 0
    );
    expect(eventWithRegs).toBeDefined();
    expect(eventWithRegs.registrationCount).toBeGreaterThanOrEqual(1);
  });
});
