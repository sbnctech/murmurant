import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const ADMIN_HEADERS = { Authorization: "Bearer test-admin-token" };

test.describe("GET /api/admin/dashboard", () => {
  test("returns HTTP 200", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/dashboard`, {
      headers: ADMIN_HEADERS,
    });
    expect(response.status()).toBe(200);
  });

  test("returns object with summary key", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/dashboard`, {
      headers: ADMIN_HEADERS,
    });
    const data = await response.json();

    expect(data.summary).toBeDefined();
    expect(typeof data.summary).toBe("object");
  });

  test("all numeric fields are present", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/dashboard`, {
      headers: ADMIN_HEADERS,
    });
    const data = await response.json();

    const { summary } = data;
    expect(typeof summary.totalMembers).toBe("number");
    expect(typeof summary.activeMembers).toBe("number");
    expect(typeof summary.totalEvents).toBe("number");
    expect(typeof summary.upcomingEvents).toBe("number");
    expect(typeof summary.totalRegistrations).toBe("number");
    expect(typeof summary.waitlistedRegistrations).toBe("number");
  });

  test("values are consistent with seeded data", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/dashboard`, {
      headers: ADMIN_HEADERS,
    });
    const data = await response.json();

    const { summary } = data;

    // Verify counts are reasonable (at least seed data minimum)
    expect(summary.totalMembers).toBeGreaterThanOrEqual(2);
    expect(summary.activeMembers).toBeGreaterThanOrEqual(1);
    expect(summary.totalEvents).toBeGreaterThanOrEqual(1);
    expect(summary.totalRegistrations).toBeGreaterThanOrEqual(1);
    expect(summary.waitlistedRegistrations).toBeGreaterThanOrEqual(1);

    // activeMembers should never exceed totalMembers
    expect(summary.activeMembers).toBeLessThanOrEqual(summary.totalMembers);

    // waitlistedRegistrations should never exceed totalRegistrations
    expect(summary.waitlistedRegistrations).toBeLessThanOrEqual(
      summary.totalRegistrations
    );
  });

  test("upcomingEvents uses fixed reference date (2025-05-01)", async ({
    request,
  }) => {
    const response = await request.get(`${BASE}/api/admin/dashboard`, {
      headers: ADMIN_HEADERS,
    });
    const data = await response.json();

    const { summary } = data;

    // Seed data includes events in June-September 2025
    // With reference date 2025-05-01, all seeded events are upcoming
    expect(summary.upcomingEvents).toBeGreaterThanOrEqual(1);

    // upcomingEvents should never exceed totalEvents
    expect(summary.upcomingEvents).toBeLessThanOrEqual(summary.totalEvents);
  });
});
