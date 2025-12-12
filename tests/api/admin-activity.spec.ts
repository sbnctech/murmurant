import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const ADMIN_HEADERS = { Authorization: "Bearer test-admin-token" };

test.describe("GET /api/admin/activity", () => {
  test("returns all registrations as activity, sorted by registeredAt desc", async ({
    request,
  }) => {
    const response = await request.get(`${BASE}/api/admin/activity`, {
      headers: ADMIN_HEADERS,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.items).toBeDefined();
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThanOrEqual(1);

    // Verify sorted by registeredAt descending
    if (data.items.length >= 2) {
      const first = data.items[0];
      const second = data.items[1];
      expect(first.registeredAt >= second.registeredAt).toBe(true);
    }

    // Verify each item has expected fields
    for (const item of data.items) {
      expect(item.type).toBe("REGISTRATION");
      expect(typeof item.memberName).toBe("string");
      expect(item.memberName.length).toBeGreaterThan(0);
      expect(typeof item.eventTitle).toBe("string");
      expect(item.eventTitle.length).toBeGreaterThan(0);
      expect(typeof item.registeredAt).toBe("string");
      expect(item.registeredAt.length).toBeGreaterThan(0);
    }
  });

  test("respects the limit query parameter (legacy)", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/activity?limit=1`, {
      headers: ADMIN_HEADERS,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.activity.length).toBe(1);
  });

  test("ignores invalid limit values (falls back to pagination)", async ({
    request,
  }) => {
    // First get the total count
    const baseResponse = await request.get(`${BASE}/api/admin/activity`, {
      headers: ADMIN_HEADERS,
    });
    const baseData = await baseResponse.json();
    const totalItems = baseData.totalItems;

    // Test with non-numeric string - falls back to paginated response
    const response1 = await request.get(
      `${BASE}/api/admin/activity?limit=abc`,
      { headers: ADMIN_HEADERS }
    );
    expect(response1.status()).toBe(200);
    const data1 = await response1.json();
    expect(data1.items.length).toBe(totalItems);

    // Test with zero - falls back to paginated response
    const response2 = await request.get(`${BASE}/api/admin/activity?limit=0`, {
      headers: ADMIN_HEADERS,
    });
    expect(response2.status()).toBe(200);
    const data2 = await response2.json();
    expect(data2.items.length).toBe(totalItems);

    // Test with negative number - falls back to paginated response
    const response3 = await request.get(`${BASE}/api/admin/activity?limit=-5`, {
      headers: ADMIN_HEADERS,
    });
    expect(response3.status()).toBe(200);
    const data3 = await response3.json();
    expect(data3.items.length).toBe(totalItems);
  });

  test("all items have fallback-safe memberName and eventTitle fields", async ({
    request,
  }) => {
    const response = await request.get(`${BASE}/api/admin/activity`, {
      headers: ADMIN_HEADERS,
    });
    const data = await response.json();

    for (const item of data.items) {
      expect(typeof item.memberName).toBe("string");
      expect(item.memberName.length).toBeGreaterThan(0);
      expect(item.memberName).not.toBe("Unknown member");

      expect(typeof item.eventTitle).toBe("string");
      expect(item.eventTitle.length).toBeGreaterThan(0);
      expect(item.eventTitle).not.toBe("Unknown event");
    }
  });
});
