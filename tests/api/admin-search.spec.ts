import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("GET /api/admin/search", () => {
  test("returns response with correct structure", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/search?q=test`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.results).toBeDefined();
    expect(Array.isArray(data.results.members)).toBe(true);
    expect(Array.isArray(data.results.events)).toBe(true);
    expect(Array.isArray(data.results.registrations)).toBe(true);
  });

  test("returns members when query matches email", async ({ request }) => {
    // Use alice which exists in seed data
    const response = await request.get(`${BASE}/api/admin/search?q=alice`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.results.members.length).toBeGreaterThan(0);
    // Verify member shape
    const member = data.results.members[0];
    expect(member.id).toBeDefined();
    expect(member.email).toContain("alice");
  });

  test("returns events when query matches a title", async ({ request }) => {
    // Use "hike" which exists in seed data ("Morning Hike at Rattlesnake Canyon")
    const response = await request.get(`${BASE}/api/admin/search?q=hike`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.results).toBeDefined();
    expect(data.results.events.length).toBeGreaterThan(0);
    expect(data.results.events[0].title.toLowerCase()).toContain("hike");
  });

  test("returns registrations with correct shape when found", async ({
    request,
  }) => {
    // Search for something likely to have registrations
    const response = await request.get(`${BASE}/api/admin/search?q=hike`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    // Registrations may or may not match, just verify shape if present
    if (data.results.registrations.length > 0) {
      const reg = data.results.registrations[0];
      expect(reg.id).toBeDefined();
      expect(reg.memberId).toBeDefined();
      expect(reg.eventId).toBeDefined();
      expect(reg.status).toBeDefined();
      expect(reg.registeredAt).toBeDefined();
      expect(reg.memberName).toBeDefined();
      expect(reg.eventTitle).toBeDefined();
    }
  });

  test("returns empty arrays when no match", async ({ request }) => {
    const response = await request.get(
      `${BASE}/api/admin/search?q=zzzznotfound`
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.results.members).toEqual([]);
    expect(data.results.events).toEqual([]);
    expect(data.results.registrations).toEqual([]);
  });

  test("returns empty arrays when query is empty", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/search?q=`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.results.members).toEqual([]);
    expect(data.results.events).toEqual([]);
    expect(data.results.registrations).toEqual([]);
  });

  test("search is case-insensitive", async ({ request }) => {
    const lowerResponse = await request.get(
      `${BASE}/api/admin/search?q=alice`
    );
    const upperResponse = await request.get(
      `${BASE}/api/admin/search?q=ALICE`
    );

    expect(lowerResponse.status()).toBe(200);
    expect(upperResponse.status()).toBe(200);

    const lowerData = await lowerResponse.json();
    const upperData = await upperResponse.json();

    // Both should return the same number of results
    expect(lowerData.results.members.length).toBe(
      upperData.results.members.length
    );
  });
});
