import { test, expect } from "@playwright/test";

const publicRoutes = [
  "/",
  "/about",
  "/contact",
  "/events",
  "/faq",
  "/join",
  "/privacy",
  "/terms",
  "/calendar",
  "/committees",
  "/gallery",
];

test.describe("Public Routes Smoke Tests", () => {
  for (const route of publicRoutes) {
    test(`${route} loads without error`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
    });
  }
});
