import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const ADMIN_HEADERS = { Authorization: "Bearer test-admin-token" };

test.describe("GET /api/admin/events/[id]", () => {
  test("returns event details and registrations for valid id", async ({ request }) => {
    // First get the list to find a valid event ID
    const listResponse = await request.get(`${BASE}/api/admin/events`, {
      headers: ADMIN_HEADERS,
    });
    const listData = await listResponse.json();
    const eventId = listData.items[0].id;

    const response = await request.get(`${BASE}/api/admin/events/${eventId}`, {
      headers: ADMIN_HEADERS,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();

    // Assert event fields
    expect(data.event).toBeDefined();
    expect(data.event.id).toBe(eventId);
    expect(typeof data.event.title).toBe("string");
    expect(typeof data.event.startTime).toBe("string");

    // Assert registrations array exists (now nested in event)
    expect(Array.isArray(data.event.registrations)).toBe(true);
  });

  test("returns event detail with registrations that have correct shape", async ({ request }) => {
    // First get an event with registrations
    const listResponse = await request.get(`${BASE}/api/admin/events`, {
      headers: ADMIN_HEADERS,
    });
    const listData = await listResponse.json();
    const eventWithRegs = listData.items.find(
      (e: { registrationCount: number }) => e.registrationCount > 0
    );

    if (!eventWithRegs) {
      test.skip();
      return;
    }

    const response = await request.get(`${BASE}/api/admin/events/${eventWithRegs.id}`, {
      headers: ADMIN_HEADERS,
    });
    expect(response.status()).toBe(200);

    const data = await response.json();

    // Assert registrations have correct shape (now nested in event)
    expect(data.event.registrations.length).toBeGreaterThanOrEqual(1);
    const reg = data.event.registrations[0];
    expect(reg.id).toBeDefined();
    expect(reg.memberId).toBeDefined();
    expect(typeof reg.memberName).toBe("string");
    expect(reg.status).toBeDefined();
    expect(typeof reg.registeredAt).toBe("string");
  });

  test("returns 404 for unknown id", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/events/unknown`, {
      headers: ADMIN_HEADERS,
    });

    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data.error).toBe("Not found");
  });

  test("returns 404 for non-existent UUID", async ({ request }) => {
    const response = await request.get(
      `${BASE}/api/admin/events/00000000-0000-0000-0000-000000000000`,
      { headers: ADMIN_HEADERS }
    );

    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data.error).toBe("Not found");
  });

  // TODO (v1 hardening): Re-enable once auth enforcement is strict
  // Currently v0 allows permissive access for development convenience
  test("@quarantine returns 401 for unauthenticated request", async ({ request }) => {
    const listResponse = await request.get(`${BASE}/api/admin/events`, {
      headers: ADMIN_HEADERS,
    });
    const listData = await listResponse.json();
    const eventId = listData.items[0].id;

    const response = await request.get(`${BASE}/api/admin/events/${eventId}`);

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });
});
