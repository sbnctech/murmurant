import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

/**
 * Demo Dashboard Smoke Tests
 *
 * Basic smoke tests for the demo dashboard page.
 * Verifies page loads and key elements are visible.
 */

test.describe("Demo Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to demo page with admin auth via cookie
    await page.context().addCookies([
      {
        name: "murmurant_dev_session",
        value: "test-admin-token",
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test("page loads with demo-root element", async ({ page }) => {
    await page.goto(`${BASE}/admin/demo`);

    // Wait for the main demo root element
    const root = page.locator('[data-test-id="demo-root"]');
    await expect(root).toBeVisible();
  });

  test("scenario cards section loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/demo`);

    // Wait for scenario cards component to load
    const scenarioCards = page.locator('[data-test-id="demo-scenario-cards"]');
    await expect(scenarioCards).toBeVisible({ timeout: 10000 });
  });

  test("system status section loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/demo`);

    // Wait for system status section
    const statusSection = page.locator('[data-test-id="demo-status-section"]');
    await expect(statusSection).toBeVisible();
  });

  test("quick links are visible", async ({ page }) => {
    await page.goto(`${BASE}/admin/demo`);

    // Verify quick links section
    const quickLinks = page.locator('[data-test-id="demo-quick-links"]');
    await expect(quickLinks).toBeVisible();
  });

  test("can click through to member admin", async ({ page }) => {
    await page.goto(`${BASE}/admin/demo`);

    // Find and click the Full Member Admin link
    const memberLink = page.getByRole("link", { name: /Full Member Admin/i });
    await expect(memberLink).toBeVisible();

    await memberLink.click();

    // Should navigate to members page
    await expect(page).toHaveURL(/\/admin\/members/);
  });

  test("can click through to events admin", async ({ page }) => {
    await page.goto(`${BASE}/admin/demo`);

    // Find and click the Events Admin link
    const eventsLink = page.getByRole("link", { name: /Events Admin/i });
    await expect(eventsLink).toBeVisible();

    await eventsLink.click();

    // Should navigate to events page
    await expect(page).toHaveURL(/\/admin\/events/);
  });
});
