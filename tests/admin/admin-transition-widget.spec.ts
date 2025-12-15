import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Transition Widget", () => {
  test.describe("Widget API", () => {
    test("GET /api/v1/admin/transitions/widget returns 401 without auth", async ({
      request,
    }) => {
      const response = await request.get(`${BASE}/api/v1/admin/transitions/widget`, {
        headers: {
          "x-admin-test-token": "",
        },
      });

      expect(response.status()).toBe(401);
    });

    test("GET /api/v1/admin/transitions/widget returns 403 for webmaster", async ({
      request,
    }) => {
      const response = await request.get(`${BASE}/api/v1/admin/transitions/widget`, {
        headers: {
          Authorization: "Bearer test-webmaster-token",
          "x-admin-test-token": "",
        },
      });

      expect(response.status()).toBe(403);
    });

    test("GET /api/v1/admin/transitions/widget returns 200 for admin", async ({
      request,
    }) => {
      const response = await request.get(`${BASE}/api/v1/admin/transitions/widget`, {
        headers: {
          Authorization: "Bearer test-admin-token",
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.widget).toBeDefined();
      expect(typeof data.widget.visible).toBe("boolean");
      expect(typeof data.widget.nextTransitionDate).toBe("string");
      expect(typeof data.widget.daysRemaining).toBe("number");
      expect(typeof data.widget.termName).toBe("string");
      expect(data.config).toBeDefined();
      expect(data.config.leadDays).toBe(60);
    });

    test("nextTransitionDate is Feb 1 or Aug 1", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/transitions/widget`, {
        headers: {
          Authorization: "Bearer test-admin-token",
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      const nextDate = new Date(data.widget.nextTransitionDate);
      const month = nextDate.getUTCMonth();
      const day = nextDate.getUTCDate();

      // Must be Feb 1 (month 1) or Aug 1 (month 7)
      const isFeb1 = month === 1 && day === 1;
      const isAug1 = month === 7 && day === 1;
      expect(isFeb1 || isAug1).toBe(true);
    });
  });

  test.describe("Transitions Summary API", () => {
    test("GET /api/admin/transitions/summary returns 200 for admin", async ({
      request,
    }) => {
      const response = await request.get(`${BASE}/api/admin/transitions/summary?term=next`, {
        headers: {
          Authorization: "Bearer test-admin-token",
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.term).toBe("next");
      expect(typeof data.termStart).toBe("string");
      expect(typeof data.termEnd).toBe("string");
      expect(data.counts).toBeDefined();
      expect(typeof data.counts.draft).toBe("number");
      expect(typeof data.counts.pendingApproval).toBe("number");
      expect(typeof data.counts.approved).toBe("number");
      expect(typeof data.counts.applied).toBe("number");
      expect(typeof data.counts.cancelled).toBe("number");
      expect(typeof data.counts.total).toBe("number");
    });

    test("GET /api/admin/transitions/summary returns 403 for webmaster", async ({
      request,
    }) => {
      const response = await request.get(`${BASE}/api/admin/transitions/summary?term=next`, {
        headers: {
          Authorization: "Bearer test-webmaster-token",
          "x-admin-test-token": "",
        },
      });

      expect(response.status()).toBe(403);
    });

    test("supports term=current parameter", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/admin/transitions/summary?term=current`,
        {
          headers: {
            Authorization: "Bearer test-admin-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.term).toBe("current");
    });
  });

  // @quarantine - Widget visibility depends on whether current date is within lead window
  test.describe("@quarantine Widget UI Visibility", () => {
    test("admin dashboard loads without error", async ({ page }) => {
      await page.goto(`${BASE}/admin`);

      // Should load the admin page
      await expect(page.locator('[data-test-id="admin-root"]')).toBeVisible();
    });

    test("transition widget has expected structure when visible", async ({ page }) => {
      await page.goto(`${BASE}/admin`);

      // Wait for potential widget to load (it may or may not be visible depending on date)
      await page.waitForTimeout(1000);

      const widget = page.locator('[data-test-id="transition-widget"]');
      const isVisible = await widget.isVisible().catch(() => false);

      if (isVisible) {
        // Widget is visible - verify structure
        await expect(
          page.locator('[data-test-id="transition-widget-title"]')
        ).toContainText("Leadership Transition");
        await expect(
          page.locator('[data-test-id="transition-widget-countdown"]')
        ).toBeVisible();
        await expect(
          page.locator('[data-test-id="transition-widget-link"]')
        ).toBeVisible();
      }
      // If widget not visible, that's expected when outside lead window
    });
  });
});
