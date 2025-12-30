import { test, expect } from "@playwright/test";

// Theme management API tests
test.describe("API - Content Themes", () => {
  test("GET /api/admin/content/themes returns list", async ({ request }) => {
    const response = await request.get("/api/admin/content/themes");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("themes");
    expect(Array.isArray(data.themes)).toBe(true);
  });
});

// Public theme CSS route - not yet implemented
test.describe("@quarantine API - Public Theme CSS", () => {
  test("GET /api/theme returns CSS variables", async ({ request }) => {
    const response = await request.get("/api/theme");

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/css");

    const css = await response.text();
    expect(css).toContain(":root {");
    expect(css).toContain("--color-primary:");
  });
});
