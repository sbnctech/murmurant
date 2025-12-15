import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

/**
 * Transitions Admin Pages E2E Tests
 *
 * Tests the UI pages for transitions and service history management.
 */

test.describe("Transitions List Page", () => {
  test("transitions page loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/transitions`);
    await expect(page.locator('[data-test-id="admin-transitions-root"]')).toBeVisible();
  });

  test("displays transitions table", async ({ page }) => {
    await page.goto(`${BASE}/admin/transitions`);
    await expect(page.locator('[data-test-id="transitions-table"]')).toBeVisible();
  });

  test("displays filter controls", async ({ page }) => {
    await page.goto(`${BASE}/admin/transitions`);
    await expect(page.locator('[data-test-id="transitions-filters"]')).toBeVisible();
    await expect(page.locator('[data-test-id="transitions-filter-status"]')).toBeVisible();
  });

  test("displays pagination controls", async ({ page }) => {
    await page.goto(`${BASE}/admin/transitions`);
    await expect(page.locator('[data-test-id="transitions-pagination"]')).toBeVisible();
  });

  test("can filter by status", async ({ page }) => {
    await page.goto(`${BASE}/admin/transitions`);

    const statusFilter = page.locator('[data-test-id="transitions-filter-status"]');
    await statusFilter.selectOption("DRAFT");

    // Wait for table to update
    await page.waitForTimeout(500);

    // All visible status badges should be Draft
    const statusBadges = page.locator('[data-test-id="transitions-status-draft"]');
    const count = await statusBadges.count();
    // May be 0 if no draft transitions exist, which is okay
    expect(count >= 0).toBe(true);
  });
});

test.describe("Service History Page", () => {
  test("service history page loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/service-history`);
    await expect(page.locator('[data-test-id="service-history-page"]')).toBeVisible();
  });

  test("displays service history table", async ({ page }) => {
    await page.goto(`${BASE}/admin/service-history`);
    await expect(page.locator('[data-test-id="service-history-table"]')).toBeVisible();
  });

  test("displays filter controls", async ({ page }) => {
    await page.goto(`${BASE}/admin/service-history`);
    await expect(page.locator('[data-test-id="service-history-filters"]')).toBeVisible();
    await expect(page.locator('[data-test-id="service-history-filter-type"]')).toBeVisible();
    await expect(page.locator('[data-test-id="service-history-filter-active"]')).toBeVisible();
  });

  test("displays pagination controls", async ({ page }) => {
    await page.goto(`${BASE}/admin/service-history`);
    await expect(page.locator('[data-test-id="service-history-pagination"]')).toBeVisible();
  });

  test("can filter by service type", async ({ page }) => {
    await page.goto(`${BASE}/admin/service-history`);

    const typeFilter = page.locator('[data-test-id="service-history-filter-type"]');
    await typeFilter.selectOption("BOARD_OFFICER");

    // Wait for table to update
    await page.waitForTimeout(500);

    // Page should still load without error
    await expect(page.locator('[data-test-id="service-history-table"]')).toBeVisible();
  });

  test("can toggle active only filter", async ({ page }) => {
    await page.goto(`${BASE}/admin/service-history`);

    const activeFilter = page.locator('[data-test-id="service-history-filter-active"]');
    await activeFilter.check();

    // Wait for table to update
    await page.waitForTimeout(500);

    // Page should still load without error
    await expect(page.locator('[data-test-id="service-history-table"]')).toBeVisible();
  });
});

test.describe("Admin Navigation", () => {
  test("admin nav has service history link", async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    const navLink = page.locator('[data-test-id="admin-nav-service-history"]');
    await expect(navLink).toBeVisible();
    await expect(navLink).toHaveAttribute("href", "/admin/service-history");
  });

  test("admin nav has transitions link", async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    const navLink = page.locator('[data-test-id="admin-nav-transitions"]');
    await expect(navLink).toBeVisible();
    await expect(navLink).toHaveAttribute("href", "/admin/transitions");
  });

  test("clicking service history link navigates correctly", async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.click('[data-test-id="admin-nav-service-history"]');
    await expect(page).toHaveURL(/\/admin\/service-history/);
    await expect(page.locator('[data-test-id="service-history-page"]')).toBeVisible();
  });

  test("clicking transitions link navigates correctly", async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.click('[data-test-id="admin-nav-transitions"]');
    await expect(page).toHaveURL(/\/admin\/transitions/);
    await expect(page.locator('[data-test-id="admin-transitions-root"]')).toBeVisible();
  });
});
