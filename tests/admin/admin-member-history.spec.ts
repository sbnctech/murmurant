import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Member History", () => {
  test.describe("Allowed roles (admin)", () => {
    test("History panel loads on member detail page", async ({ page }) => {
      // Navigate to members list first
      await page.goto(`${BASE}/admin/members`);

      // Wait for rows to appear
      const rows = page.locator('[data-test-id="admin-members-row"]');
      await expect(rows.first()).toBeVisible();

      // Click on first member link to go to detail
      const link = page.locator('[data-test-id="admin-members-link"]').first();
      await link.click();

      // Should be on detail page
      await expect(page).toHaveURL(/\/admin\/members\/[0-9a-f-]{36}/);

      // Wait for history panel or forbidden message
      const historyPanel = page.locator('[data-test-id="member-history-panel"]');
      const loadingIndicator = page.locator('[data-test-id="member-history-loading"]');
      const forbiddenMessage = page.locator('[data-test-id="member-history-forbidden"]');

      // Wait for loading to finish
      await expect(loadingIndicator).toBeHidden({ timeout: 10000 });

      // Should show history panel (not forbidden)
      await expect(historyPanel).toBeVisible();
      await expect(forbiddenMessage).toBeHidden();
    });

    test("History panel shows summary text", async ({ page }) => {
      await page.goto(`${BASE}/admin/members`);

      const link = page.locator('[data-test-id="admin-members-link"]').first();
      await expect(link).toBeVisible();
      await link.click();

      await expect(page).toHaveURL(/\/admin\/members\/[0-9a-f-]{36}/);

      // Wait for panel to load
      const historyPanel = page.locator('[data-test-id="member-history-panel"]');
      await expect(historyPanel).toBeVisible({ timeout: 10000 });

      // Summary text should be visible
      const summary = page.locator('[data-test-id="member-history-summary"]');
      await expect(summary).toBeVisible();
      await expect(summary).not.toBeEmpty();
    });

    test("History panel shows stats row", async ({ page }) => {
      await page.goto(`${BASE}/admin/members`);

      const link = page.locator('[data-test-id="admin-members-link"]').first();
      await expect(link).toBeVisible();
      await link.click();

      const historyPanel = page.locator('[data-test-id="member-history-panel"]');
      await expect(historyPanel).toBeVisible({ timeout: 10000 });

      // Stats should be visible
      const stats = page.locator('[data-test-id="member-history-stats"]');
      await expect(stats).toBeVisible();

      // Each stat should be present
      await expect(page.locator('[data-test-id="stat-events-attended"]')).toBeVisible();
      await expect(page.locator('[data-test-id="stat-volunteer-roles"]')).toBeVisible();
      await expect(page.locator('[data-test-id="stat-leadership-roles"]')).toBeVisible();
      await expect(page.locator('[data-test-id="stat-years-active"]')).toBeVisible();
    });

    test("Copy button is present", async ({ page }) => {
      await page.goto(`${BASE}/admin/members`);

      const link = page.locator('[data-test-id="admin-members-link"]').first();
      await expect(link).toBeVisible();
      await link.click();

      const historyPanel = page.locator('[data-test-id="member-history-panel"]');
      await expect(historyPanel).toBeVisible({ timeout: 10000 });

      // Copy button should be visible
      const copyButton = page.locator('[data-test-id="member-history-copy-button"]');
      await expect(copyButton).toBeVisible();
      await expect(copyButton).toHaveText("Copy to Clipboard");
    });

    test("Export controls are visible for admin", async ({ page }) => {
      await page.goto(`${BASE}/admin/members`);

      const link = page.locator('[data-test-id="admin-members-link"]').first();
      await expect(link).toBeVisible();
      await link.click();

      const historyPanel = page.locator('[data-test-id="member-history-panel"]');
      await expect(historyPanel).toBeVisible({ timeout: 10000 });

      // Export controls container should be visible
      const exportControls = page.locator('[data-test-id="member-history-export-controls"]');
      await expect(exportControls).toBeVisible();

      // Copy button should be present
      const copyButton = page.locator('[data-test-id="member-history-copy-button"]');
      await expect(copyButton).toBeVisible();

      // Download Markdown button should be present
      const downloadMdButton = page.locator('[data-test-id="member-history-download-md"]');
      await expect(downloadMdButton).toBeVisible();
      await expect(downloadMdButton).toHaveText("Download Markdown");
    });

    test("Summary text contains prose narrative", async ({ page }) => {
      await page.goto(`${BASE}/admin/members`);

      const link = page.locator('[data-test-id="admin-members-link"]').first();
      await expect(link).toBeVisible();
      await link.click();

      const historyPanel = page.locator('[data-test-id="member-history-panel"]');
      await expect(historyPanel).toBeVisible({ timeout: 10000 });

      // Summary should contain club name (from prose generator)
      const summary = page.locator('[data-test-id="member-history-summary"]');
      await expect(summary).toContainText("Santa Barbara Newcomers Club");
    });
  });

  test.describe("API permission checks", () => {
    test("Admin token can access member history API", async ({ request }) => {
      // First get a member ID from the list
      const listResponse = await request.get(`${BASE}/api/admin/members`, {
        headers: {
          Authorization: "Bearer test-admin-token",
        },
      });
      expect(listResponse.status()).toBe(200);

      const listData = await listResponse.json();
      const memberId = listData.items?.[0]?.id || listData.members?.[0]?.id;

      if (!memberId) {
        test.skip();
        return;
      }

      // Now test history endpoint with admin token
      const historyResponse = await request.get(
        `${BASE}/api/admin/members/${memberId}/history`,
        {
          headers: {
            Authorization: "Bearer test-admin-token",
          },
        }
      );

      expect(historyResponse.status()).toBe(200);
      const historyData = await historyResponse.json();
      expect(historyData.summaryText).toBeDefined();
      expect(historyData.stats).toBeDefined();
    });

    test("Webmaster token is forbidden from member history API", async ({ request }) => {
      // First get a member ID from the list (webmaster can view members)
      const listResponse = await request.get(`${BASE}/api/admin/members`, {
        headers: {
          Authorization: "Bearer test-webmaster-token",
        },
      });

      // webmaster may or may not have access to member list - check
      if (listResponse.status() !== 200) {
        // If webmaster cannot list members, use admin to get a member ID
        const adminListResponse = await request.get(`${BASE}/api/admin/members`, {
          headers: {
            Authorization: "Bearer test-admin-token",
          },
        });
        const adminData = await adminListResponse.json();
        const memberId = adminData.items?.[0]?.id || adminData.members?.[0]?.id;

        if (!memberId) {
          test.skip();
          return;
        }

        // Now test history endpoint with webmaster token - should be 403
        // Clear x-admin-test-token to prevent e2e bypass
        const historyResponse = await request.get(
          `${BASE}/api/admin/members/${memberId}/history`,
          {
            headers: {
              Authorization: "Bearer test-webmaster-token",
              "x-admin-test-token": "",
            },
          }
        );

        expect(historyResponse.status()).toBe(403);
        return;
      }

      const listData = await listResponse.json();
      const memberId = listData.items?.[0]?.id || listData.members?.[0]?.id;

      if (!memberId) {
        test.skip();
        return;
      }

      // Webmaster should get 403 Forbidden for history
      // Clear x-admin-test-token to prevent e2e bypass
      const historyResponse = await request.get(
        `${BASE}/api/admin/members/${memberId}/history`,
        {
          headers: {
            Authorization: "Bearer test-webmaster-token",
            "x-admin-test-token": "",
          },
        }
      );

      expect(historyResponse.status()).toBe(403);
    });

    test("VP Activities token can access member history API", async ({ request }) => {
      // Get a member ID
      const listResponse = await request.get(`${BASE}/api/admin/members`, {
        headers: {
          Authorization: "Bearer test-admin-token",
        },
      });
      expect(listResponse.status()).toBe(200);

      const listData = await listResponse.json();
      const memberId = listData.items?.[0]?.id || listData.members?.[0]?.id;

      if (!memberId) {
        test.skip();
        return;
      }

      // VP Activities should have access
      const historyResponse = await request.get(
        `${BASE}/api/admin/members/${memberId}/history`,
        {
          headers: {
            Authorization: "Bearer test-vp-token",
          },
        }
      );

      expect(historyResponse.status()).toBe(200);
    });

    test("Event chair token is forbidden from member history API", async ({ request }) => {
      // Get a member ID
      const listResponse = await request.get(`${BASE}/api/admin/members`, {
        headers: {
          Authorization: "Bearer test-admin-token",
        },
      });
      expect(listResponse.status()).toBe(200);

      const listData = await listResponse.json();
      const memberId = listData.items?.[0]?.id || listData.members?.[0]?.id;

      if (!memberId) {
        test.skip();
        return;
      }

      // Event chair should get 403
      // Clear x-admin-test-token to prevent e2e bypass
      const historyResponse = await request.get(
        `${BASE}/api/admin/members/${memberId}/history`,
        {
          headers: {
            Authorization: "Bearer test-chair-token",
            "x-admin-test-token": "",
          },
        }
      );

      expect(historyResponse.status()).toBe(403);
    });

    test("Unauthenticated request returns 401 (production auth enforcement)", async ({ request }) => {
      // Production auth enforcement: unauthenticated requests get 401
      // Charter P1/P2: Identity must be provable, default deny
      // Get a real member ID first
      const listResponse = await request.get(`${BASE}/api/admin/members`, {
        headers: { Authorization: "Bearer test-admin-token" },
      });
      const listData = await listResponse.json();
      const memberId = listData.items?.[0]?.id || listData.members?.[0]?.id;

      if (!memberId) {
        test.skip();
        return;
      }

      const historyResponse = await request.get(
        `${BASE}/api/admin/members/${memberId}/history`
      );

      // Production auth enforcement: unauthenticated requests get 401
      expect(historyResponse.status()).toBe(401);
    });
  });
});
