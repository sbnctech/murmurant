import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Transitions", () => {
  test.describe("API Authorization", () => {
    test("GET /api/v1/admin/transitions returns 200 for admin", async ({
      request,
    }) => {
      const response = await request.get(`${BASE}/api/v1/admin/transitions`, {
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

    test("GET /api/v1/admin/transitions returns 200 for VP Activities", async ({
      request,
    }) => {
      const response = await request.get(`${BASE}/api/v1/admin/transitions`, {
        headers: {
          Authorization: "Bearer test-vp-activities",
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.items).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
    });

    test("GET /api/v1/admin/transitions returns 403 for event-chair", async ({
      request,
    }) => {
      const response = await request.get(`${BASE}/api/v1/admin/transitions`, {
        headers: {
          Authorization: "Bearer test-chair-token",
          "x-admin-test-token": "",
        },
      });

      expect(response.status()).toBe(403);
    });

    test("GET /api/v1/admin/transitions returns 403 for webmaster", async ({
      request,
    }) => {
      const response = await request.get(`${BASE}/api/v1/admin/transitions`, {
        headers: {
          Authorization: "Bearer test-webmaster-token",
          "x-admin-test-token": "",
        },
      });

      expect(response.status()).toBe(403);
    });

    test("GET /api/v1/admin/transitions supports status filter", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/transitions?status=DRAFT`,
        {
          headers: {
            Authorization: "Bearer test-admin-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.items).toBeDefined();
      // If items exist, they should all be DRAFT status
      for (const item of data.items) {
        expect(item.status).toBe("DRAFT");
      }
    });

    test("GET /api/v1/admin/transitions supports pagination", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/transitions?page=1&limit=5`,
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
    test("admin can load transitions list page", async ({ page }) => {
      await page.goto(`${BASE}/admin/transitions`, {
        waitUntil: "networkidle",
      });

      // Should see the page container
      await expect(
        page.locator('[data-test-id="admin-transitions-root"]')
      ).toBeVisible();

      // Should see the heading
      await expect(page.locator("h1")).toContainText("Transition Plans");
    });

    test("admin can see transitions table", async ({ page }) => {
      await page.goto(`${BASE}/admin/transitions`, {
        waitUntil: "networkidle",
      });

      // Should see the table
      await expect(
        page.locator('[data-test-id="transitions-table"]')
      ).toBeVisible();
    });

    test("admin can see filter controls", async ({ page }) => {
      await page.goto(`${BASE}/admin/transitions`, {
        waitUntil: "networkidle",
      });

      // Should see filters
      await expect(
        page.locator('[data-test-id="transitions-filters"]')
      ).toBeVisible();

      // Should see status filter
      await expect(
        page.locator('[data-test-id="transitions-filter-status"]')
      ).toBeVisible();
    });

    test("admin can see pagination controls", async ({ page }) => {
      await page.goto(`${BASE}/admin/transitions`, {
        waitUntil: "networkidle",
      });

      // Should see pagination
      await expect(
        page.locator('[data-test-id="transitions-pagination"]')
      ).toBeVisible();

      // Should see pagination label
      await expect(
        page.locator('[data-test-id="transitions-pagination-label"]')
      ).toBeVisible();
    });

    test("filter by status updates results", async ({ page }) => {
      await page.goto(`${BASE}/admin/transitions`, {
        waitUntil: "networkidle",
      });

      // Select DRAFT from dropdown
      await page.locator('[data-test-id="transitions-filter-status"]').selectOption("DRAFT");

      // Wait for network request to complete
      await page.waitForLoadState("networkidle");

      // The table should still be visible
      await expect(
        page.locator('[data-test-id="transitions-table"]')
      ).toBeVisible();
    });
  });
});
