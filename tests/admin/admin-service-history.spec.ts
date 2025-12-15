import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Service History Explorer", () => {
  test.describe("API Authorization", () => {
    test("GET /api/v1/admin/service-history returns 200 for admin", async ({
      request,
    }) => {
      const response = await request.get(`${BASE}/api/v1/admin/service-history`, {
        headers: {
          Authorization: "Bearer test-admin-token",
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.items).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
      expect(typeof data.page).toBe("number");
      expect(typeof data.totalItems).toBe("number");
      expect(typeof data.totalPages).toBe("number");
    });

    test("GET /api/v1/admin/service-history returns 200 for VP Activities", async ({
      request,
    }) => {
      const response = await request.get(`${BASE}/api/v1/admin/service-history`, {
        headers: {
          Authorization: "Bearer test-vp-activities",
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.items).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
    });

    test("GET /api/v1/admin/service-history returns 403 for webmaster", async ({
      request,
    }) => {
      const response = await request.get(`${BASE}/api/v1/admin/service-history`, {
        headers: {
          Authorization: "Bearer test-webmaster-token",
          "x-admin-test-token": "",
        },
      });

      expect(response.status()).toBe(403);
    });

    test("GET /api/v1/admin/service-history returns 403 for event-chair", async ({
      request,
    }) => {
      const response = await request.get(`${BASE}/api/v1/admin/service-history`, {
        headers: {
          Authorization: "Bearer test-chair-token",
          "x-admin-test-token": "",
        },
      });

      expect(response.status()).toBe(403);
    });

    test("GET /api/v1/admin/service-history supports serviceType filter", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/service-history?serviceType=BOARD_OFFICER`,
        {
          headers: {
            Authorization: "Bearer test-admin-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.items).toBeDefined();
      // If items exist, they should all be BOARD_OFFICER type
      for (const item of data.items) {
        expect(item.serviceType).toBe("BOARD_OFFICER");
      }
    });

    test("GET /api/v1/admin/service-history supports activeOnly filter", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/service-history?activeOnly=true`,
        {
          headers: {
            Authorization: "Bearer test-admin-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.items).toBeDefined();
      // If items exist, they should all be active
      for (const item of data.items) {
        expect(item.isActive).toBe(true);
      }
    });

    test("GET /api/v1/admin/service-history supports pagination", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/service-history?page=1&limit=5`,
        {
          headers: {
            Authorization: "Bearer test-admin-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.page).toBe(1);
      expect(data.limit).toBe(5);
      expect(data.items.length).toBeLessThanOrEqual(5);
    });
  });

  test.describe("UI Page", () => {
    test("admin can load service history page and sees heading", async ({
      page,
    }) => {
      await page.goto(`${BASE}/admin/service-history`, {
        waitUntil: "networkidle",
      });

      // Should see the page container
      await expect(
        page.locator('[data-test-id="service-history-page"]')
      ).toBeVisible();

      // Should see the heading
      await expect(page.locator("h1")).toContainText("Service History");
    });

    test("admin can see service history table", async ({ page }) => {
      await page.goto(`${BASE}/admin/service-history`, {
        waitUntil: "networkidle",
      });

      // Should see the table
      await expect(
        page.locator('[data-test-id="service-history-table"]')
      ).toBeVisible();
    });

    test("admin can see filter controls", async ({ page }) => {
      await page.goto(`${BASE}/admin/service-history`, {
        waitUntil: "networkidle",
      });

      // Should see filters
      await expect(
        page.locator('[data-test-id="service-history-filters"]')
      ).toBeVisible();

      // Should see service type filter
      await expect(
        page.locator('[data-test-id="service-history-filter-type"]')
      ).toBeVisible();

      // Should see active only checkbox
      await expect(
        page.locator('[data-test-id="service-history-filter-active"]')
      ).toBeVisible();
    });

    test("admin can see pagination controls", async ({ page }) => {
      await page.goto(`${BASE}/admin/service-history`, {
        waitUntil: "networkidle",
      });

      // Should see pagination
      await expect(
        page.locator('[data-test-id="service-history-pagination"]')
      ).toBeVisible();

      // Should see pagination label
      await expect(
        page.locator('[data-test-id="service-history-pagination-label"]')
      ).toBeVisible();
    });

    test("filter by service type updates results", async ({ page }) => {
      await page.goto(`${BASE}/admin/service-history`, {
        waitUntil: "networkidle",
      });

      // Select Board Officer from dropdown
      await page.locator('[data-test-id="service-history-filter-type"]').selectOption("BOARD_OFFICER");

      // Wait for network request to complete
      await page.waitForLoadState("networkidle");

      // The table should still be visible
      await expect(
        page.locator('[data-test-id="service-history-table"]')
      ).toBeVisible();
    });

    test("active only checkbox filters results", async ({ page }) => {
      await page.goto(`${BASE}/admin/service-history`, {
        waitUntil: "networkidle",
      });

      // Check the active only checkbox
      await page.locator('[data-test-id="service-history-filter-active"]').check();

      // Wait for network request to complete
      await page.waitForLoadState("networkidle");

      // The table should still be visible
      await expect(
        page.locator('[data-test-id="service-history-table"]')
      ).toBeVisible();
    });

    test("nav link to service history exists", async ({ page }) => {
      await page.goto(`${BASE}/admin`, {
        waitUntil: "networkidle",
      });

      // Should see the nav link
      await expect(
        page.locator('[data-test-id="admin-nav-service-history"]')
      ).toBeVisible();

      // Click and verify navigation
      await page.locator('[data-test-id="admin-nav-service-history"]').click();
      await page.waitForURL(/\/admin\/service-history/);

      // Should be on the service history page
      await expect(
        page.locator('[data-test-id="service-history-page"]')
      ).toBeVisible();
    });
  });
});
