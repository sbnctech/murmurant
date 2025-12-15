import { test, expect } from "@playwright/test";

test.describe("API - Communications", () => {
  test("GET /api/admin/comms/lists returns paginated list", async ({ request }) => {
    const response = await request.get("/api/admin/comms/lists");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("items");
    expect(data).toHaveProperty("page");
    expect(data).toHaveProperty("pageSize");
    expect(data).toHaveProperty("totalItems");
    expect(data).toHaveProperty("totalPages");
  });

  test("GET /api/admin/comms/templates returns paginated list", async ({ request }) => {
    const response = await request.get("/api/admin/comms/templates");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);
  });

  test("GET /api/admin/comms/templates supports category filter", async ({ request }) => {
    const response = await request.get("/api/admin/comms/templates?category=EVENT");

    expect(response.status()).toBe(200);

    const data = await response.json();
    // All items should have EVENT category
    for (const item of data.items) {
      expect(item.category).toBe("EVENT");
    }
  });

  test("GET /api/admin/comms/campaigns returns paginated list", async ({ request }) => {
    const response = await request.get("/api/admin/comms/campaigns");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("items");
    expect(data).toHaveProperty("page");
    expect(data).toHaveProperty("pageSize");
    expect(data).toHaveProperty("totalItems");
    expect(data).toHaveProperty("totalPages");
  });

  test("GET /api/admin/comms/campaigns supports status filter", async ({ request }) => {
    const response = await request.get("/api/admin/comms/campaigns?status=DRAFT");

    expect(response.status()).toBe(200);

    const data = await response.json();
    // All items should be draft
    for (const item of data.items) {
      expect(item.status).toBe("DRAFT");
    }
  });
});
