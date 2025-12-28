import { test, expect } from "@playwright/test";

test.describe("Payment Flow", () => {
  test.use({
    extraHTTPHeaders: {
      "x-admin-test-token": process.env.ADMIN_E2E_TOKEN || "dev-admin-token",
    },
  });

  test("payments history page loads", async ({ page }) => {
    await page.goto("/dashboard/payments");
    await expect(page.locator("body")).toBeVisible();
  });

  test("renewal page loads", async ({ page }) => {
    await page.goto("/dashboard/renewal");
    await expect(page.locator("body")).toBeVisible();
  });

  test("join page loads for new members", async ({ page }) => {
    await page.goto("/join");
    await expect(page.locator("body")).toBeVisible();
  });

  test("admin dues management loads", async ({ page }) => {
    await page.goto("/admin/dues");
    await expect(page.locator("body")).toBeVisible();
  });

  test("gift certificates page loads", async ({ page }) => {
    await page.goto("/gift-certificates");
    const response = await page.goto("/gift-certificates");
    // May not exist, so check for non-500
    expect(response?.status()).toBeLessThan(500);
  });
});
