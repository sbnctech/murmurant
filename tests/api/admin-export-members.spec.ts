import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const ADMIN_HEADERS = { Authorization: "Bearer test-admin-token" };

test.describe("GET /api/admin/export/members", () => {
  test("returns CSV with correct headers", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/export/members`, {
      headers: ADMIN_HEADERS,
    });

    expect(response.status()).toBe(200);

    const contentType = response.headers()["content-type"];
    expect(contentType).toMatch(/^text\/csv/);

    const contentDisposition = response.headers()["content-disposition"];
    expect(contentDisposition).toContain('filename="members.csv"');

    const body = await response.text();
    const firstLine = body.split("\n")[0];
    expect(firstLine).toBe("id,name,email,status,joinedAt,phone");
  });

  test("includes seeded members (Alice Chen, Carol Johnson)", async ({
    request,
  }) => {
    const response = await request.get(`${BASE}/api/admin/export/members`, {
      headers: ADMIN_HEADERS,
    });
    const body = await response.text();

    // Seed data contains Alice Chen and Carol Johnson
    expect(body).toContain("Alice Chen");
    expect(body).toContain("Carol Johnson");
  });

  test("members are ordered by lastName, firstName", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/export/members`, {
      headers: ADMIN_HEADERS,
    });
    const body = await response.text();
    const lines = body.split("\n").filter((line) => line.length > 0);

    // Skip header row
    const dataLines = lines.slice(1);

    // Chen comes before Johnson alphabetically
    expect(dataLines.length).toBeGreaterThanOrEqual(2);
    expect(dataLines[0]).toContain("Alice Chen");
    expect(dataLines[1]).toContain("Carol Johnson");
  });
});
