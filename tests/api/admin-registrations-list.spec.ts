import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("GET /api/admin/registrations", () => {
  test("returns all registrations with joined names", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/registrations`);

    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.items).toBeDefined();
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThanOrEqual(1);

    // Check for Carol's registration (from seed data)
    const carolReg = data.items.find(
      (r: { memberName: string }) => r.memberName === "Carol Johnson"
    );
    expect(carolReg).toBeDefined();
    expect(carolReg.eventTitle).toBeDefined();

    // Check for Alice's registration (from seed data)
    const aliceReg = data.items.find(
      (r: { memberName: string }) => r.memberName === "Alice Chen"
    );
    expect(aliceReg).toBeDefined();
    expect(aliceReg.eventTitle).toBeDefined();
  });

  test("includes status and registeredAt fields", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/registrations`);
    const data = await response.json();

    for (const reg of data.items) {
      expect(typeof reg.status).toBe("string");
      expect(reg.status.length).toBeGreaterThan(0);
      expect(typeof reg.registeredAt).toBe("string");
      expect(reg.registeredAt.length).toBeGreaterThan(0);
    }
  });

  test("all items have non-empty memberName and eventTitle", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/registrations`);
    const data = await response.json();

    for (const reg of data.items) {
      expect(typeof reg.memberName).toBe("string");
      expect(reg.memberName.length).toBeGreaterThan(0);
      expect(typeof reg.eventTitle).toBe("string");
      expect(reg.eventTitle.length).toBeGreaterThan(0);
    }
  });
});
