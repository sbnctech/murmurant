import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const ADMIN_HEADERS = { Authorization: "Bearer test-admin-token" };

test.describe("GET /api/admin/export/activity", () => {
  test("returns CSV with correct headers", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/export/activity`, {
      headers: ADMIN_HEADERS,
    });

    expect(response.status()).toBe(200);

    const contentType = response.headers()["content-type"];
    expect(contentType).toMatch(/^text\/csv/);

    const contentDisposition = response.headers()["content-disposition"];
    expect(contentDisposition).toContain('filename="activity.csv"');

    const body = await response.text();
    const firstLine = body.split("\n")[0];
    expect(firstLine).toBe(
      "id,type,memberId,memberName,eventId,eventTitle,status,registeredAt"
    );
  });

  test("includes activity items with enriched names", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/export/activity`, {
      headers: ADMIN_HEADERS,
    });
    const body = await response.text();

    // Seed data contains Alice Chen and Carol Johnson
    expect(body).toContain("Alice Chen");
    expect(body).toContain("Carol Johnson");
    // Seed data events
    expect(body).toContain("Morning Hike at Rattlesnake Canyon");
    expect(body).toContain("Welcome Coffee");
    expect(body).toContain("REGISTRATION");
  });

  test("activity sorted by registeredAt descending (newest first)", async ({
    request,
  }) => {
    const response = await request.get(`${BASE}/api/admin/export/activity`, {
      headers: ADMIN_HEADERS,
    });
    const body = await response.text();
    const lines = body.split("\n").filter((line) => line.length > 0);

    // Skip header row
    const dataLines = lines.slice(1);

    // Seed registrations by registeredAt (desc):
    // 1. Alice to Summer Beach Picnic (2025-07-15T08:00:00Z)
    // 2. Carol to Welcome Coffee (2025-06-20T14:30:00Z)
    // 3. Alice to Morning Hike (2025-06-02T10:30:00Z) - WAITLISTED
    // 4. Carol to Morning Hike (2025-06-01T09:00:00Z)
    expect(dataLines.length).toBeGreaterThanOrEqual(4);

    // First line should be Alice Chen to Summer Beach Picnic (most recent)
    expect(dataLines[0]).toContain("Alice Chen");
    expect(dataLines[0]).toContain("Summer Beach Picnic");
    expect(dataLines[0]).toContain("2025-07-15");

    // Second line should be Carol Johnson to Welcome Coffee
    expect(dataLines[1]).toContain("Carol Johnson");
    expect(dataLines[1]).toContain("Welcome Coffee");
    expect(dataLines[1]).toContain("2025-06-20");
  });

  test("includes registration status", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/export/activity`, {
      headers: ADMIN_HEADERS,
    });
    const body = await response.text();

    // Should include both CONFIRMED and WAITLISTED statuses
    expect(body).toContain("CONFIRMED");
    expect(body).toContain("WAITLISTED");
  });
});
