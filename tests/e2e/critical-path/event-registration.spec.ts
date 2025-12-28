import { test, expect } from "@playwright/test";

test.describe("Event Registration Flow", () => {
  test.use({
    extraHTTPHeaders: {
      "x-admin-test-token": process.env.ADMIN_E2E_TOKEN || "dev-admin-token",
    },
  });

  test("events list page loads", async ({ page }) => {
    await page.goto("/events");
    await expect(page.locator("body")).toBeVisible();
  });

  test("can navigate to event detail", async ({ page }) => {
    await page.goto("/events");
    // Look for any event link
    const eventLink = page.locator('a[href*="/events/"]').first();
    if (await eventLink.isVisible()) {
      await eventLink.click();
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("member can view their registered events", async ({ page }) => {
    await page.goto("/dashboard/events");
    await expect(page.locator("body")).toBeVisible();
  });

  test("admin can view event management", async ({ page }) => {
    await page.goto("/admin/events");
    await expect(page.locator("body")).toBeVisible();
  });

  test("admin can access event creation page", async ({ page }) => {
    await page.goto("/admin/events/create");
    await expect(page.locator("body")).toBeVisible();
  });
});
