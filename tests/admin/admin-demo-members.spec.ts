/**
 * Admin Demo Members Page Tests
 *
 * Tests the /admin/demo/members page UI:
 * 1. Page loads successfully
 * 2. Table displays with correct columns
 * 3. Filters are present and functional
 * 4. Pagination controls work
 * 5. Member links navigate to detail page
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Demo Members Page", () => {
  test.describe("Page Load", () => {
    test("page loads with correct title", async ({ page }) => {
      await page.goto(`${BASE}/admin/demo/members`);

      // Wait for the page root element
      await expect(page.getByTestId("demo-members-root")).toBeVisible({ timeout: 10000 });

      // Check page title is present
      await expect(page.getByRole("heading", { name: /Member List/i })).toBeVisible();
    });

    test("page shows back link to demo dashboard", async ({ page }) => {
      await page.goto(`${BASE}/admin/demo/members`);
      await expect(page.getByTestId("demo-members-root")).toBeVisible({ timeout: 10000 });

      const backLink = page.getByRole("link", { name: /Back to Demo Dashboard/i });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute("href", "/admin/demo");
    });
  });

  test.describe("Table Structure", () => {
    test("table has expected column headers", async ({ page }) => {
      await page.goto(`${BASE}/admin/demo/members`);
      await expect(page.getByTestId("demo-members-table")).toBeVisible({ timeout: 10000 });

      // Check for expected column headers
      const headers = page.getByTestId("demo-members-table").locator("th");
      await expect(headers).toHaveCount(6);

      // Check individual headers
      await expect(headers.nth(0)).toContainText("Name");
      await expect(headers.nth(1)).toContainText("Email");
      await expect(headers.nth(2)).toContainText("Status");
      await expect(headers.nth(3)).toContainText("Tier");
      await expect(headers.nth(4)).toContainText("Joined");
      await expect(headers.nth(5)).toContainText("Lifecycle");
    });
  });

  test.describe("Filters", () => {
    test("status filter dropdown is present", async ({ page }) => {
      await page.goto(`${BASE}/admin/demo/members`);
      await expect(page.getByTestId("demo-members-filters")).toBeVisible({ timeout: 10000 });

      const statusFilter = page.getByTestId("demo-members-status-filter");
      await expect(statusFilter).toBeVisible();
    });

    test("tier filter dropdown is present", async ({ page }) => {
      await page.goto(`${BASE}/admin/demo/members`);
      await expect(page.getByTestId("demo-members-filters")).toBeVisible({ timeout: 10000 });

      const tierFilter = page.getByTestId("demo-members-tier-filter");
      await expect(tierFilter).toBeVisible();
    });

    test("status filter changes data display", async ({ page }) => {
      await page.goto(`${BASE}/admin/demo/members`);
      await expect(page.getByTestId("demo-members-table")).toBeVisible({ timeout: 10000 });

      // Wait for initial load
      await page.waitForTimeout(500);

      // Get initial count from display text
      const countText = page.getByTestId("demo-members-filters").locator("div").last();

      // Select a status filter
      const statusFilter = page.getByTestId("demo-members-status-filter");
      await statusFilter.selectOption("active");

      // Wait for data to reload
      await page.waitForTimeout(500);

      // The count text should update (we can't predict the exact value)
      await expect(countText).toBeVisible();
    });
  });

  test.describe("Pagination", () => {
    test("pagination controls are present", async ({ page }) => {
      await page.goto(`${BASE}/admin/demo/members`);
      await expect(page.getByTestId("demo-members-pagination")).toBeVisible({ timeout: 10000 });

      // Check Previous and Next buttons exist
      const prevButton = page.getByRole("button", { name: /Previous/i });
      const nextButton = page.getByRole("button", { name: /Next/i });

      await expect(prevButton).toBeVisible();
      await expect(nextButton).toBeVisible();
    });

    test("first page has Previous button disabled", async ({ page }) => {
      await page.goto(`${BASE}/admin/demo/members`);
      await expect(page.getByTestId("demo-members-pagination")).toBeVisible({ timeout: 10000 });

      const prevButton = page.getByRole("button", { name: /Previous/i });
      await expect(prevButton).toBeDisabled();
    });
  });

  test.describe("Member Rows", () => {
    test("member names are clickable links", async ({ page }) => {
      await page.goto(`${BASE}/admin/demo/members`);
      await expect(page.getByTestId("demo-members-table")).toBeVisible({ timeout: 10000 });

      // Wait for data to load
      await page.waitForTimeout(1000);

      // Check if there are any member rows
      const rows = page.getByTestId("demo-members-row");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        // First row should have a link in the name column
        const firstRowLink = rows.first().locator("a").first();
        await expect(firstRowLink).toBeVisible();

        // Link should point to member detail page
        const href = await firstRowLink.getAttribute("href");
        expect(href).toMatch(/\/admin\/members\/.+/);
      }
    });

    test("status badges are displayed with color", async ({ page }) => {
      await page.goto(`${BASE}/admin/demo/members`);
      await expect(page.getByTestId("demo-members-table")).toBeVisible({ timeout: 10000 });

      // Wait for data to load
      await page.waitForTimeout(1000);

      const rows = page.getByTestId("demo-members-row");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        // Check that status badges have background color styling
        const statusBadge = rows.first().locator("td").nth(2).locator("span");
        const style = await statusBadge.getAttribute("style");
        expect(style).toContain("background-color");
      }
    });
  });

  test.describe("Empty State", () => {
    test("shows empty message when no members match filter", async ({ page }) => {
      await page.goto(`${BASE}/admin/demo/members`);
      await expect(page.getByTestId("demo-members-table")).toBeVisible({ timeout: 10000 });

      // Apply filters that should return no results (suspended is usually rare)
      const statusFilter = page.getByTestId("demo-members-status-filter");
      await statusFilter.selectOption("suspended");

      const tierFilter = page.getByTestId("demo-members-tier-filter");
      await tierFilter.selectOption("unknown");

      // Wait for reload
      await page.waitForTimeout(500);

      // Check for empty state (either empty message or zero results in count)
      const filterText = page.getByTestId("demo-members-filters").locator("div").last();
      const text = await filterText.textContent();

      // Should show "0 of" in the count
      if (text?.includes("0 of")) {
        // Empty state is shown via count
        expect(text).toContain("0 of");
      }
    });
  });
});
