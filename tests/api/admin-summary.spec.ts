import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const ADMIN_HEADERS = { Authorization: "Bearer test-admin-token" };

test("GET /api/admin/summary returns expected counts", async ({ request }) => {
  const response = await request.get(`${BASE}/api/admin/summary`, {
    headers: ADMIN_HEADERS,
  });

  expect(response.status()).toBe(200);

  const data = await response.json();
  expect(data.summary).toBeDefined();

  const { summary } = data;

  // Verify all fields are present and are numbers
  expect(typeof summary.totalActiveMembers).toBe("number");
  expect(typeof summary.totalEvents).toBe("number");
  expect(typeof summary.totalRegistrations).toBe("number");
  expect(typeof summary.totalWaitlistedRegistrations).toBe("number");

  // Verify counts match expected mock data:
  // - 2 active members (Alice Johnson, Bob Smith)
  // - 2 events (Welcome Hike, Wine Mixer)
  // - 2 registrations (r1, r2)
  // - 1 waitlisted registration (r2)
  expect(summary.totalActiveMembers).toBe(2);
  expect(summary.totalEvents).toBe(2);
  expect(summary.totalRegistrations).toBe(2);
  expect(summary.totalWaitlistedRegistrations).toBe(1);
});
