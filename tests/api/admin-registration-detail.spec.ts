import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("GET /api/admin/registrations/[id]", () => {
  test("returns registration details for a valid registration", async ({ request }) => {
    // First get the list to find a valid ID
    const listResponse = await request.get(`${BASE}/api/admin/registrations`);
    expect(listResponse.ok()).toBe(true);

    const listData = await listResponse.json();
    expect(listData.items.length).toBeGreaterThan(0);

    const firstReg = listData.items[0];
    const regId = firstReg.id;

    // Now fetch that specific registration
    const response = await request.get(`${BASE}/api/admin/registrations/${regId}`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.registration).toBeDefined();
    expect(data.registration.id).toBe(regId);
    expect(data.registration.memberId).toBeDefined();
    expect(data.registration.memberName).toBeDefined();
    expect(data.registration.eventId).toBeDefined();
    expect(data.registration.eventTitle).toBeDefined();
    expect(typeof data.registration.status).toBe("string");
    expect(typeof data.registration.registeredAt).toBe("string");
    expect(data.registration.registeredAt.length).toBeGreaterThan(0);
  });

  test("returns correct member and event names", async ({ request }) => {
    // Get the list first
    const listResponse = await request.get(`${BASE}/api/admin/registrations`);
    const listData = await listResponse.json();

    // Find Carol's registration
    const carolReg = listData.items.find(
      (r: { memberName: string }) => r.memberName === "Carol Johnson"
    );
    expect(carolReg).toBeDefined();

    // Fetch that registration's detail
    const response = await request.get(`${BASE}/api/admin/registrations/${carolReg.id}`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.registration.memberName).toBe("Carol Johnson");
    expect(data.registration.eventTitle).toBeDefined();
  });

  test("returns 404 for unknown id", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/registrations/00000000-0000-0000-0000-000000000000`);

    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data.error).toBe("Not found");
  });
});
