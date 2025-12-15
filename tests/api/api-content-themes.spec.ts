import { test, expect } from "@playwright/test";

test.describe("API - Content Themes", () => {
  test("GET /api/admin/content/themes returns list", async ({ request }) => {
    const response = await request.get("/api/admin/content/themes");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);
  });

  test("GET /api/admin/content/themes supports status filter", async ({ request }) => {
    const response = await request.get("/api/admin/content/themes?status=ACTIVE");

    expect(response.status()).toBe(200);

    const data = await response.json();
    // All items should be active
    for (const item of data.items) {
      expect(item.status).toBe("ACTIVE");
    }
  });

  test("GET /api/theme returns CSS variables", async ({ request }) => {
    const response = await request.get("/api/theme");

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/css");

    const css = await response.text();
    expect(css).toContain(":root {");
    expect(css).toContain("--color-primary:");
  });
});
