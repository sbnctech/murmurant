import { test, expect } from "@playwright/test";

// Communications API - lists, templates, and campaigns
test.describe("API - Communications", () => {
  test("GET /api/admin/comms/lists returns list data", async ({ request }) => {
    const response = await request.get("/api/admin/comms/lists");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("lists");
    expect(Array.isArray(data.lists)).toBe(true);
  });

  test("GET /api/admin/comms/templates returns templates list", async ({ request }) => {
    const response = await request.get("/api/admin/comms/templates");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("templates");
    expect(Array.isArray(data.templates)).toBe(true);
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
    expect(data).toHaveProperty("items");
    // All items should be draft (if any)
    for (const item of data.items) {
      expect(item.status).toBe("DRAFT");
    }
  });
});
