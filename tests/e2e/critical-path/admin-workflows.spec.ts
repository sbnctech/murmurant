import { test, expect } from "@playwright/test";

test.describe("Admin Workflows", () => {
  test.use({
    extraHTTPHeaders: {
      "x-admin-test-token": process.env.ADMIN_E2E_TOKEN || "dev-admin-token",
    },
  });

  test("admin dashboard loads", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("body")).toBeVisible();
  });

  test("admin reports page loads", async ({ page }) => {
    await page.goto("/admin/reports");
    await expect(page.locator("body")).toBeVisible();
  });

  test("audit log page loads", async ({ page }) => {
    await page.goto("/admin/audit");
    await expect(page.locator("body")).toBeVisible();
  });

  test("committees admin page loads", async ({ page }) => {
    await page.goto("/admin/committees");
    await expect(page.locator("body")).toBeVisible();
  });

  test("theme editor loads", async ({ page }) => {
    await page.goto("/admin/themes/editor");
    await expect(page.locator("body")).toBeVisible();
  });

  test("brand comparison page loads", async ({ page }) => {
    await page.goto("/admin/brands/compare");
    await expect(page.locator("body")).toBeVisible();
  });

  test("demo parity dashboard loads", async ({ page }) => {
    await page.goto("/admin/demo/parity");
    await expect(page.locator("body")).toBeVisible();
  });
});
