import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const ADMIN_HEADERS = { Authorization: "Bearer test-admin-token" };

test.describe("GET /api/admin/export/events", () => {
  test("returns CSV with correct headers", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/export/events`, {
      headers: ADMIN_HEADERS,
    });

    expect(response.status()).toBe(200);

    const contentType = response.headers()["content-type"];
    expect(contentType).toMatch(/^text\/csv/);

    const contentDisposition = response.headers()["content-disposition"];
    expect(contentDisposition).toContain('filename="events.csv"');

    const body = await response.text();
    const firstLine = body.split("\n")[0];
    expect(firstLine).toBe(
      "id,title,category,startTime,registrationCount,waitlistedCount"
    );
  });

  test("includes seeded events with correct categories", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/export/events`, {
      headers: ADMIN_HEADERS,
    });
    const body = await response.text();

    // Seed data includes these events
    expect(body).toContain("Morning Hike at Rattlesnake Canyon");
    expect(body).toContain("Welcome Coffee");
    expect(body).toContain("Summer Beach Picnic");
    expect(body).toContain("Outdoors");
    expect(body).toContain("Social");
  });

  test("events include registration and waitlist counts", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/export/events`, {
      headers: ADMIN_HEADERS,
    });
    const body = await response.text();
    const lines = body.split("\n").filter((line) => line.length > 0);

    // Skip header row
    const dataLines = lines.slice(1);

    // Morning Hike has 2 registrations (1 CONFIRMED, 1 WAITLISTED)
    const hikeLine = dataLines.find((line) => line.includes("Morning Hike"));
    expect(hikeLine).toBeDefined();
    // Format: id,title,category,startTime,registrationCount,waitlistedCount
    // Should have 2 registrations total, 1 waitlisted
    expect(hikeLine).toMatch(/,2,1$/);
  });

  test("events are ordered by startTime", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/export/events`, {
      headers: ADMIN_HEADERS,
    });
    const body = await response.text();
    const lines = body.split("\n").filter((line) => line.length > 0);

    // Skip header row
    const dataLines = lines.slice(1);

    // Morning Hike (June 10) should come before Welcome Coffee (July 15)
    const hikeIndex = dataLines.findIndex((line) =>
      line.includes("Morning Hike")
    );
    const coffeeIndex = dataLines.findIndex((line) =>
      line.includes("Welcome Coffee")
    );

    expect(hikeIndex).toBeLessThan(coffeeIndex);
  });
});
