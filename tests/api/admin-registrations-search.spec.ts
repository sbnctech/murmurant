import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const ADMIN_HEADERS = { Authorization: "Bearer test-admin-token" };

test.describe("GET /api/admin/registrations/search", () => {
  test("returns all registrations when no filters are provided", async ({
    request,
  }) => {
    const response = await request.get(
      `${BASE}/api/admin/registrations/search`,
      { headers: ADMIN_HEADERS }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.registrations).toBeDefined();
    expect(Array.isArray(data.registrations)).toBe(true);
    expect(data.registrations.length).toBeGreaterThanOrEqual(1);

    // Verify each registration has expected fields
    for (const reg of data.registrations) {
      expect(typeof reg.id).toBe("string");
      expect(typeof reg.memberId).toBe("string");
      expect(typeof reg.eventId).toBe("string");
      expect(typeof reg.status).toBe("string");
    }
  });

  test("filters by status", async ({ request }) => {
    const response = await request.get(
      `${BASE}/api/admin/registrations/search?status=WAITLISTED`,
      { headers: ADMIN_HEADERS }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.registrations.length).toBeGreaterThanOrEqual(1);
    // All returned registrations should have WAITLISTED status
    for (const reg of data.registrations) {
      expect(reg.status).toBe("WAITLISTED");
    }
  });

  test("filters by eventId", async ({ request }) => {
    // First get an event ID from the events list
    const eventsResponse = await request.get(`${BASE}/api/admin/events`, {
      headers: ADMIN_HEADERS,
    });
    const eventsData = await eventsResponse.json();
    const eventWithRegistrations = eventsData.items.find(
      (e: { registrationCount: number }) => e.registrationCount > 0
    );

    if (!eventWithRegistrations) {
      // Skip if no events have registrations
      return;
    }

    const response = await request.get(
      `${BASE}/api/admin/registrations/search?eventId=${eventWithRegistrations.id}`,
      { headers: ADMIN_HEADERS }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.registrations.length).toBeGreaterThanOrEqual(1);
    // All returned registrations should have the requested eventId
    for (const reg of data.registrations) {
      expect(reg.eventId).toBe(eventWithRegistrations.id);
    }
  });

  test("filters by memberId AND status together", async ({ request }) => {
    // First get a waitlisted registration to use its memberId
    const waitlistedResponse = await request.get(
      `${BASE}/api/admin/registrations/search?status=WAITLISTED`,
      { headers: ADMIN_HEADERS }
    );
    const waitlistedData = await waitlistedResponse.json();

    if (waitlistedData.registrations.length === 0) {
      // Skip if no waitlisted registrations
      return;
    }

    const targetMemberId = waitlistedData.registrations[0].memberId;

    const response = await request.get(
      `${BASE}/api/admin/registrations/search?memberId=${targetMemberId}&status=WAITLISTED`,
      { headers: ADMIN_HEADERS }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.registrations.length).toBeGreaterThanOrEqual(1);
    // All returned registrations should match both filters
    for (const reg of data.registrations) {
      expect(reg.memberId).toBe(targetMemberId);
      expect(reg.status).toBe("WAITLISTED");
    }
  });

  test("returns empty array when no registrations match", async ({
    request,
  }) => {
    const response = await request.get(
      `${BASE}/api/admin/registrations/search?memberId=00000000-0000-0000-0000-000000000000`,
      { headers: ADMIN_HEADERS }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.registrations).toEqual([]);
  });
});
