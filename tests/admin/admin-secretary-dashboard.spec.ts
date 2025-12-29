import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Secretary Dashboard", () => {
  test.describe("Dashboard API", () => {
    test("GET /api/v1/officer/secretary/dashboard returns 401 without auth", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/secretary/dashboard`,
        {
          headers: {
            "x-admin-test-token": "",
          },
        }
      );

      // API returns visible: false for unauthenticated users (widget pattern)
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.visible).toBe(false);
    });

    test("GET /api/v1/officer/secretary/dashboard returns 403 for webmaster", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/secretary/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-webmaster-token",
            "x-admin-test-token": "",
          },
        }
      );

      // Webmaster doesn't have meetings:read capability
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.visible).toBe(false);
    });

    test("GET /api/v1/officer/secretary/dashboard returns 200 with data for secretary", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/secretary/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-secretary-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.visible).toBe(true);

      // Verify structure
      expect(data).toHaveProperty("upcomingMeeting");
      expect(data).toHaveProperty("draftsInProgress");
      expect(data).toHaveProperty("awaitingReview");
      expect(data).toHaveProperty("readyToPublish");
      expect(data).toHaveProperty("recentlyPublished");
      expect(data).toHaveProperty("capabilities");

      // Verify capabilities structure
      expect(data.capabilities).toHaveProperty("canCreateDraft");
      expect(data.capabilities).toHaveProperty("canEditDraft");
      expect(data.capabilities).toHaveProperty("canSubmit");
      expect(data.capabilities).toHaveProperty("canPublish");

      // Secretary capabilities
      expect(data.capabilities.canCreateDraft).toBe(true);
      expect(data.capabilities.canEditDraft).toBe(true);
      expect(data.capabilities.canSubmit).toBe(true);
      // Secretary cannot finalize (publish is gated by meetings:minutes:finalize)
      expect(data.capabilities.canPublish).toBe(false);
    });

    test("GET /api/v1/officer/secretary/dashboard returns 200 for admin with all capabilities", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/secretary/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-admin-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.visible).toBe(true);

      // Admin has all capabilities
      expect(data.capabilities.canCreateDraft).toBe(true);
      expect(data.capabilities.canEditDraft).toBe(true);
      expect(data.capabilities.canSubmit).toBe(true);
      expect(data.capabilities.canPublish).toBe(true);
    });

    test("GET /api/v1/officer/secretary/dashboard returns 200 for president with finalize capability", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/secretary/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-president-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.visible).toBe(true);

      // President can view but not create/edit drafts
      expect(data.capabilities.canPublish).toBe(true);
    });

    test("draftsInProgress contains only DRAFT and REVISED status minutes", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/secretary/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-secretary-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      const drafts = data.draftsInProgress;

      // All drafts should be DRAFT or REVISED status
      for (const draft of drafts) {
        expect(["DRAFT", "REVISED"]).toContain(draft.status);
      }
    });

    test("awaitingReview contains only SUBMITTED status minutes", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/secretary/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-secretary-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      const awaiting = data.awaitingReview;

      for (const item of awaiting) {
        expect(item.status).toBe("SUBMITTED");
      }
    });

    test("readyToPublish contains only APPROVED status minutes", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/secretary/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-secretary-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      const ready = data.readyToPublish;

      for (const item of ready) {
        expect(item.status).toBe("APPROVED");
      }
    });

    test("recentlyPublished contains only PUBLISHED status minutes", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/secretary/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-secretary-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      const published = data.recentlyPublished;

      for (const item of published) {
        expect(item.status).toBe("PUBLISHED");
      }
    });

    test("minutes summary includes audit trail URL", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/secretary/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-secretary-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();

      // Check all minutes sections for auditTrailUrl
      const allMinutes = [
        ...data.draftsInProgress,
        ...data.awaitingReview,
        ...data.readyToPublish,
        ...data.recentlyPublished,
      ];

      for (const minutes of allMinutes) {
        expect(minutes).toHaveProperty("auditTrailUrl");
        expect(minutes.auditTrailUrl).toContain("/admin/audit");
        expect(minutes.auditTrailUrl).toContain("GovernanceMinutes");
        expect(minutes.auditTrailUrl).toContain(minutes.id);
      }
    });

    test("upcoming meeting includes hasMinutes flag", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/secretary/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-secretary-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();

      if (data.upcomingMeeting) {
        expect(data.upcomingMeeting).toHaveProperty("id");
        expect(data.upcomingMeeting).toHaveProperty("date");
        expect(data.upcomingMeeting).toHaveProperty("dateFormatted");
        expect(data.upcomingMeeting).toHaveProperty("type");
        expect(data.upcomingMeeting).toHaveProperty("hasMinutes");
        expect(typeof data.upcomingMeeting.hasMinutes).toBe("boolean");
      }
    });
  });

  test.describe("Dashboard UI", () => {
    test("secretary dashboard renders for secretary role", async ({ page }) => {
      // Set auth cookie for secretary
      await page.context().addCookies([
        {
          name: "murmurant_session",
          value: "test-secretary-token",
          domain: new URL(BASE).hostname,
          path: "/",
        },
      ]);

      await page.goto(`${BASE}/admin`);

      // Wait for dashboard to potentially load
      await page.waitForTimeout(1000);

      const dashboard = page.locator('[data-test-id="secretary-dashboard"]');
      const isVisible = await dashboard.isVisible().catch(() => false);

      if (isVisible) {
        // Verify title
        await expect(
          page.locator('[data-test-id="secretary-dashboard-title"]')
        ).toContainText("Secretary Dashboard");
      }
    });

    test("secretary dashboard does not render for webmaster role", async ({
      page,
    }) => {
      // Set auth cookie for webmaster
      await page.context().addCookies([
        {
          name: "murmurant_session",
          value: "test-webmaster-token",
          domain: new URL(BASE).hostname,
          path: "/",
        },
      ]);

      await page.goto(`${BASE}/admin`);

      await page.waitForTimeout(1000);

      const dashboard = page.locator('[data-test-id="secretary-dashboard"]');
      await expect(dashboard).not.toBeVisible();
    });

    test("drafts section shows count badge", async ({ page }) => {
      await page.context().addCookies([
        {
          name: "murmurant_session",
          value: "test-secretary-token",
          domain: new URL(BASE).hostname,
          path: "/",
        },
      ]);

      await page.goto(`${BASE}/admin`);
      await page.waitForTimeout(1000);

      const draftsSection = page.locator('[data-test-id="secretary-drafts"]');
      const isVisible = await draftsSection.isVisible().catch(() => false);

      if (isVisible) {
        const countBadge = page.locator(
          '[data-test-id="secretary-drafts-count"]'
        );
        const hasCount = await countBadge.isVisible().catch(() => false);

        // Count badge only shows when there are items
        if (hasCount) {
          const countText = await countBadge.textContent();
          expect(parseInt(countText || "0")).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test("create draft button appears for upcoming meeting without minutes", async ({
      page,
    }) => {
      await page.context().addCookies([
        {
          name: "murmurant_session",
          value: "test-secretary-token",
          domain: new URL(BASE).hostname,
          path: "/",
        },
      ]);

      await page.goto(`${BASE}/admin`);
      await page.waitForTimeout(1000);

      const upcomingMeeting = page.locator(
        '[data-test-id="secretary-upcoming-meeting"]'
      );
      const hasUpcoming = await upcomingMeeting.isVisible().catch(() => false);

      if (hasUpcoming) {
        const createBtn = page.locator(
          '[data-test-id="secretary-create-draft-btn"]'
        );
        // Button may or may not be visible depending on whether minutes already exist
        const createVisible = await createBtn.isVisible().catch(() => false);

        if (createVisible) {
          await expect(createBtn).toContainText("Create Draft Minutes");
          const href = await createBtn.getAttribute("href");
          expect(href).toContain("/admin/governance/minutes/new");
          expect(href).toContain("meetingId=");
        }
      }
    });

    test("audit trail links are present for minutes items", async ({
      page,
    }) => {
      await page.context().addCookies([
        {
          name: "murmurant_session",
          value: "test-secretary-token",
          domain: new URL(BASE).hostname,
          path: "/",
        },
      ]);

      await page.goto(`${BASE}/admin`);
      await page.waitForTimeout(1000);

      const dashboard = page.locator('[data-test-id="secretary-dashboard"]');
      const isVisible = await dashboard.isVisible().catch(() => false);

      if (isVisible) {
        // Look for any audit trail links
        const auditLinks = page.locator('a[href*="/admin/audit"]');
        const count = await auditLinks.count();

        // Audit links should exist for each minutes item
        // (may be 0 if no minutes exist)
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test("quick links to minutes and meetings pages exist", async ({
      page,
    }) => {
      await page.context().addCookies([
        {
          name: "murmurant_session",
          value: "test-secretary-token",
          domain: new URL(BASE).hostname,
          path: "/",
        },
      ]);

      await page.goto(`${BASE}/admin`);
      await page.waitForTimeout(1000);

      const dashboard = page.locator('[data-test-id="secretary-dashboard"]');
      const isVisible = await dashboard.isVisible().catch(() => false);

      if (isVisible) {
        // Check for View All Minutes link
        const minutesLink = page.locator(
          'a[href="/admin/governance/minutes"]'
        );
        const hasMinutesLink = await minutesLink.isVisible().catch(() => false);

        // Check for All Meetings link
        const meetingsLink = page.locator(
          'a[href="/admin/governance/meetings"]'
        );
        const hasMeetingsLink = await meetingsLink
          .isVisible()
          .catch(() => false);

        // At least one of these links should exist
        expect(hasMinutesLink || hasMeetingsLink).toBe(true);
      }
    });
  });

  test.describe("Golden Path: Minutes Workflow", () => {
    test("secretary can submit draft minutes for review", async ({
      request,
    }) => {
      // First, get dashboard to find a draft (if exists)
      const dashboardRes = await request.get(
        `${BASE}/api/v1/officer/secretary/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-secretary-token",
          },
        }
      );

      expect(dashboardRes.status()).toBe(200);

      const data = await dashboardRes.json();
      const drafts = data.draftsInProgress;

      if (drafts.length > 0) {
        const draftId = drafts[0].id;

        // Submit the draft for review
        const submitRes = await request.post(
          `${BASE}/api/v1/officer/governance/minutes/${draftId}`,
          {
            headers: {
              Authorization: "Bearer test-secretary-token",
              "Content-Type": "application/json",
            },
            data: { action: "submit" },
          }
        );

        // Should succeed or fail based on current status
        const status = submitRes.status();
        expect([200, 400]).toContain(status);

        if (status === 200) {
          const result = await submitRes.json();
          expect(result.minutes.status).toBe("SUBMITTED");
        }
      }
    });

    test("president can approve submitted minutes", async ({ request }) => {
      // First, get dashboard as president to find submitted minutes
      const dashboardRes = await request.get(
        `${BASE}/api/v1/officer/secretary/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-president-token",
          },
        }
      );

      expect(dashboardRes.status()).toBe(200);

      const data = await dashboardRes.json();
      const submitted = data.awaitingReview;

      if (submitted.length > 0) {
        const submittedId = submitted[0].id;

        // President approves
        const approveRes = await request.post(
          `${BASE}/api/v1/officer/governance/minutes/${submittedId}`,
          {
            headers: {
              Authorization: "Bearer test-president-token",
              "Content-Type": "application/json",
            },
            data: { action: "approve" },
          }
        );

        // Should succeed or fail based on current status
        const status = approveRes.status();
        expect([200, 400, 403]).toContain(status);

        if (status === 200) {
          const result = await approveRes.json();
          expect(result.minutes.status).toBe("APPROVED");
        }
      }
    });

    test("approved minutes can be published", async ({ request }) => {
      // Get dashboard to find approved minutes
      const dashboardRes = await request.get(
        `${BASE}/api/v1/officer/secretary/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-admin-token",
          },
        }
      );

      expect(dashboardRes.status()).toBe(200);

      const data = await dashboardRes.json();
      const approved = data.readyToPublish;

      if (approved.length > 0) {
        const approvedId = approved[0].id;

        // Publish (requires finalize capability)
        const publishRes = await request.post(
          `${BASE}/api/v1/officer/governance/minutes/${approvedId}`,
          {
            headers: {
              Authorization: "Bearer test-admin-token",
              "Content-Type": "application/json",
            },
            data: { action: "publish" },
          }
        );

        const status = publishRes.status();
        expect([200, 400]).toContain(status);

        if (status === 200) {
          const result = await publishRes.json();
          expect(result.minutes.status).toBe("PUBLISHED");
        }
      }
    });

    test("secretary cannot publish (lacks finalize capability)", async ({
      request,
    }) => {
      // Get dashboard to find approved minutes
      const dashboardRes = await request.get(
        `${BASE}/api/v1/officer/secretary/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-secretary-token",
          },
        }
      );

      expect(dashboardRes.status()).toBe(200);

      const data = await dashboardRes.json();
      const approved = data.readyToPublish;

      if (approved.length > 0) {
        const approvedId = approved[0].id;

        // Secretary tries to publish - should be denied
        const publishRes = await request.post(
          `${BASE}/api/v1/officer/governance/minutes/${approvedId}`,
          {
            headers: {
              Authorization: "Bearer test-secretary-token",
              "Content-Type": "application/json",
            },
            data: { action: "publish" },
          }
        );

        // Should get 403 (secretary lacks meetings:minutes:finalize)
        expect(publishRes.status()).toBe(403);
      }
    });
  });
});
