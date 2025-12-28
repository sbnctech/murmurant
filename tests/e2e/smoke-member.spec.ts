import { test, expect } from "@playwright/test";

const memberRoutes = [
  "/dashboard",
  "/dashboard/events",
  "/dashboard/profile",
  "/dashboard/settings",
  "/dashboard/notifications",
  "/dashboard/announcements",
  "/dashboard/documents",
  "/dashboard/directory",
  "/dashboard/committees",
  "/dashboard/volunteer",
  "/dashboard/governance",
  "/dashboard/payments",
  "/dashboard/renewal",
  "/dashboard/groups",
  "/dashboard/newsletters",
];

test.describe("Member Routes Smoke Tests", () => {
  test.use({
    extraHTTPHeaders: {
      "x-admin-test-token": process.env.ADMIN_E2E_TOKEN || "dev-admin-token",
    },
  });

  for (const route of memberRoutes) {
    test(`${route} loads without error`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
    });
  }
});
