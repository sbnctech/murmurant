import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const ADMIN_HEADERS = { Authorization: "Bearer test-admin-token" };

test.describe("GET /api/admin/registrations pagination", () => {
  test("returns default pagination metadata", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/registrations`, {
      headers: ADMIN_HEADERS,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(20);
    expect(data.totalItems).toBeGreaterThanOrEqual(1);
    expect(data.totalPages).toBeGreaterThanOrEqual(1);
  });

  test("respects custom page and pageSize params", async ({ request }) => {
    const response = await request.get(
      `${BASE}/api/admin/registrations?page=1&pageSize=1`,
      { headers: ADMIN_HEADERS }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(1);
    expect(data.totalItems).toBeGreaterThanOrEqual(1);
    expect(data.totalPages).toBe(data.totalItems); // With pageSize=1, totalPages equals totalItems
    expect(data.items.length).toBe(1);
  });

  test("returns empty items for page beyond total", async ({ request }) => {
    const response = await request.get(
      `${BASE}/api/admin/registrations?page=1000&pageSize=20`,
      { headers: ADMIN_HEADERS }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.page).toBe(1000);
    expect(data.items.length).toBe(0);
    expect(data.totalItems).toBeGreaterThanOrEqual(1);
  });

  test("caps pageSize at 100", async ({ request }) => {
    const response = await request.get(
      `${BASE}/api/admin/registrations?pageSize=200`,
      { headers: ADMIN_HEADERS }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.pageSize).toBe(100);
  });

  test("ignores invalid page values", async ({ request }) => {
    const response = await request.get(
      `${BASE}/api/admin/registrations?page=abc`,
      { headers: ADMIN_HEADERS }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.page).toBe(1);
  });

  test("ignores zero or negative page values", async ({ request }) => {
    const response1 = await request.get(
      `${BASE}/api/admin/registrations?page=0`,
      { headers: ADMIN_HEADERS }
    );
    const data1 = await response1.json();
    expect(data1.page).toBe(1);

    const response2 = await request.get(
      `${BASE}/api/admin/registrations?page=-5`,
      { headers: ADMIN_HEADERS }
    );
    const data2 = await response2.json();
    expect(data2.page).toBe(1);
  });
});
