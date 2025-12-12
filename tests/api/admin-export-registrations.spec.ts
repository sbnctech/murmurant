import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("GET /api/admin/export/registrations", () => {
  test("returns CSV with correct headers", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/export/registrations`);

    expect(response.status()).toBe(200);

    const contentType = response.headers()["content-type"];
    expect(contentType).toMatch(/^text\/csv/);

    const contentDisposition = response.headers()["content-disposition"];
    expect(contentDisposition).toContain('filename="registrations.csv"');

    const body = await response.text();
    const firstLine = body.split("\n")[0];
    expect(firstLine).toBe("id,memberId,memberName,eventId,eventTitle,status,registeredAt");
  });

  test("includes registrations with enriched names and titles from seed data", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/export/registrations`);
    const body = await response.text();

    // Seed data includes Alice Chen and Carol Johnson
    expect(body).toContain("Alice Chen");
    expect(body).toContain("Carol Johnson");
    // Seed events include Welcome Coffee, Morning Hike, Summer Beach Picnic
    expect(body).toContain("Welcome Coffee");
  });

  test("CSV has multiple data rows for seed registrations", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/export/registrations`);
    const body = await response.text();
    const lines = body.trim().split("\n");

    // Header + at least 1 data row
    expect(lines.length).toBeGreaterThanOrEqual(2);

    // Each data line should have the correct number of columns
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(",");
      // Should have 7 columns: id, memberId, memberName, eventId, eventTitle, status, registeredAt
      // Note: some fields might be quoted if they contain commas
      expect(columns.length).toBeGreaterThanOrEqual(7);
    }
  });
});
