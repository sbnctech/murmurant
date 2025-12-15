import { test, expect } from "@playwright/test";

// TODO: Routes not implemented yet - quarantined until content management feature is built
test.describe("@quarantine API - Content Pages", () => {
  test("GET /api/admin/content/pages returns paginated list", async ({ request }) => {
    const response = await request.get("/api/admin/content/pages");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("items");
    expect(data).toHaveProperty("page");
    expect(data).toHaveProperty("pageSize");
    expect(data).toHaveProperty("totalItems");
    expect(data).toHaveProperty("totalPages");
    expect(Array.isArray(data.items)).toBe(true);
  });

  test("GET /api/admin/content/pages supports pagination", async ({ request }) => {
    const response = await request.get("/api/admin/content/pages?page=1&pageSize=5");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(5);
  });

  test("GET /api/admin/content/pages supports status filter", async ({ request }) => {
    const response = await request.get("/api/admin/content/pages?status=PUBLISHED");

    expect(response.status()).toBe(200);

    const data = await response.json();
    // All items should be published
    for (const item of data.items) {
      expect(item.status).toBe("PUBLISHED");
    }
  });
});
