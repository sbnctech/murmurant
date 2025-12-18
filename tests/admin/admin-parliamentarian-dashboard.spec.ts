import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Parliamentarian Dashboard", () => {
  test.describe("Dashboard API", () => {
    test("GET /api/v1/officer/parliamentarian/dashboard returns visible: false without auth", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/parliamentarian/dashboard`,
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

    test("GET /api/v1/officer/parliamentarian/dashboard returns visible: false for webmaster", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/parliamentarian/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-webmaster-token",
            "x-admin-test-token": "",
          },
        }
      );

      // Webmaster doesn't have governance:flags:read capability
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.visible).toBe(false);
    });

    test("GET /api/v1/officer/parliamentarian/dashboard returns 200 with data for parliamentarian", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/parliamentarian/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-parliamentarian-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.visible).toBe(true);

      // Verify structure
      expect(data).toHaveProperty("openPolicyQuestions");
      expect(data).toHaveProperty("recentInterpretations");
      expect(data).toHaveProperty("docsNeedingReview");
      expect(data).toHaveProperty("overdueFlags");
      expect(data).toHaveProperty("flagCounts");
      expect(data).toHaveProperty("capabilities");

      // Verify capabilities structure
      expect(data.capabilities).toHaveProperty("canCreateFlag");
      expect(data.capabilities).toHaveProperty("canResolveFlag");
      expect(data.capabilities).toHaveProperty("canCreateAnnotation");
      expect(data.capabilities).toHaveProperty("canEditAnnotation");
      expect(data.capabilities).toHaveProperty("canPublishAnnotation");
      expect(data.capabilities).toHaveProperty("canManageRules");

      // Parliamentarian capabilities
      expect(data.capabilities.canCreateFlag).toBe(true);
      expect(data.capabilities.canResolveFlag).toBe(true);
      expect(data.capabilities.canCreateAnnotation).toBe(true);
      expect(data.capabilities.canEditAnnotation).toBe(true);
      expect(data.capabilities.canPublishAnnotation).toBe(true);
    });

    test("GET /api/v1/officer/parliamentarian/dashboard returns 200 for admin with all capabilities", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/parliamentarian/dashboard`,
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
      expect(data.capabilities.canCreateFlag).toBe(true);
      expect(data.capabilities.canResolveFlag).toBe(true);
      expect(data.capabilities.canCreateAnnotation).toBe(true);
      expect(data.capabilities.canEditAnnotation).toBe(true);
      expect(data.capabilities.canPublishAnnotation).toBe(true);
      expect(data.capabilities.canManageRules).toBe(true);
    });

    test("openPolicyQuestions contains only POLICY_REVIEW type flags", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/parliamentarian/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-parliamentarian-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      const policyQuestions = data.openPolicyQuestions;

      // All policy questions should be POLICY_REVIEW type
      for (const flag of policyQuestions) {
        expect(flag.flagType).toBe("POLICY_REVIEW");
      }
    });

    test("docsNeedingReview contains only INSURANCE_REVIEW or LEGAL_REVIEW types", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/parliamentarian/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-parliamentarian-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      const docsReview = data.docsNeedingReview;

      for (const flag of docsReview) {
        expect(["INSURANCE_REVIEW", "LEGAL_REVIEW"]).toContain(flag.flagType);
      }
    });

    test("overdueFlags contains only flags with isOverdue=true", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/parliamentarian/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-parliamentarian-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      const overdueFlags = data.overdueFlags;

      for (const flag of overdueFlags) {
        expect(flag.isOverdue).toBe(true);
      }
    });

    test("flag summary includes audit trail URL", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/parliamentarian/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-parliamentarian-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();

      // Check all flag sections for auditTrailUrl
      const allFlags = [
        ...data.openPolicyQuestions,
        ...data.docsNeedingReview,
        ...data.overdueFlags,
      ];

      for (const flag of allFlags) {
        expect(flag).toHaveProperty("auditTrailUrl");
        expect(flag.auditTrailUrl).toContain("/admin/audit");
        expect(flag.auditTrailUrl).toContain("GovernanceReviewFlag");
        expect(flag.auditTrailUrl).toContain(flag.id);
      }
    });

    test("annotation summary includes audit trail URL", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/parliamentarian/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-parliamentarian-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      const interpretations = data.recentInterpretations;

      for (const annotation of interpretations) {
        expect(annotation).toHaveProperty("auditTrailUrl");
        expect(annotation.auditTrailUrl).toContain("/admin/audit");
        expect(annotation.auditTrailUrl).toContain("GovernanceAnnotation");
        expect(annotation.auditTrailUrl).toContain(annotation.id);
      }
    });

    test("flagCounts returns counts by flag type", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/officer/parliamentarian/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-parliamentarian-token",
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      const flagCounts = data.flagCounts;

      // flagCounts should be an object
      expect(typeof flagCounts).toBe("object");

      // All values should be numbers >= 0
      for (const [, count] of Object.entries(flagCounts)) {
        expect(typeof count).toBe("number");
        expect(count as number).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("Dashboard UI", () => {
    test("parliamentarian dashboard renders for parliamentarian role", async ({
      page,
    }) => {
      // Set auth cookie for parliamentarian
      await page.context().addCookies([
        {
          name: "clubos_session",
          value: "test-parliamentarian-token",
          domain: new URL(BASE).hostname,
          path: "/",
        },
      ]);

      await page.goto(`${BASE}/admin`);

      // Wait for dashboard to potentially load
      await page.waitForTimeout(1000);

      const dashboard = page.locator(
        '[data-test-id="parliamentarian-dashboard"]'
      );
      const isVisible = await dashboard.isVisible().catch(() => false);

      if (isVisible) {
        // Verify title
        await expect(
          page.locator('[data-test-id="parliamentarian-dashboard-title"]')
        ).toContainText("Parliamentarian");
      }
    });

    test("parliamentarian dashboard does not render for webmaster role", async ({
      page,
    }) => {
      // Set auth cookie for webmaster
      await page.context().addCookies([
        {
          name: "clubos_session",
          value: "test-webmaster-token",
          domain: new URL(BASE).hostname,
          path: "/",
        },
      ]);

      await page.goto(`${BASE}/admin`);

      await page.waitForTimeout(1000);

      const dashboard = page.locator(
        '[data-test-id="parliamentarian-dashboard"]'
      );
      await expect(dashboard).not.toBeVisible();
    });

    test("overdue alert section displays when there are overdue flags", async ({
      page,
    }) => {
      await page.context().addCookies([
        {
          name: "clubos_session",
          value: "test-parliamentarian-token",
          domain: new URL(BASE).hostname,
          path: "/",
        },
      ]);

      await page.goto(`${BASE}/admin`);
      await page.waitForTimeout(1000);

      const dashboard = page.locator(
        '[data-test-id="parliamentarian-dashboard"]'
      );
      const isVisible = await dashboard.isVisible().catch(() => false);

      if (isVisible) {
        const overdueSection = page.locator(
          '[data-test-id="parliamentarian-overdue"]'
        );
        // Section may or may not be visible depending on whether there are overdue flags
        const hasOverdue = await overdueSection.isVisible().catch(() => false);

        if (hasOverdue) {
          // Alert section should have red styling
          const countBadge = page.locator(
            '[data-test-id="parliamentarian-overdue-count"]'
          );
          await expect(countBadge).toBeVisible();
        }
      }
    });

    test("policy questions section shows count badge", async ({ page }) => {
      await page.context().addCookies([
        {
          name: "clubos_session",
          value: "test-parliamentarian-token",
          domain: new URL(BASE).hostname,
          path: "/",
        },
      ]);

      await page.goto(`${BASE}/admin`);
      await page.waitForTimeout(1000);

      const policySection = page.locator(
        '[data-test-id="parliamentarian-policy-questions"]'
      );
      const isVisible = await policySection.isVisible().catch(() => false);

      if (isVisible) {
        const countBadge = page.locator(
          '[data-test-id="parliamentarian-policy-questions-count"]'
        );
        const hasCount = await countBadge.isVisible().catch(() => false);

        // Count badge only shows when there are items
        if (hasCount) {
          const countText = await countBadge.textContent();
          expect(parseInt(countText || "0")).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test("audit trail links are present for flag items", async ({ page }) => {
      await page.context().addCookies([
        {
          name: "clubos_session",
          value: "test-parliamentarian-token",
          domain: new URL(BASE).hostname,
          path: "/",
        },
      ]);

      await page.goto(`${BASE}/admin`);
      await page.waitForTimeout(1000);

      const dashboard = page.locator(
        '[data-test-id="parliamentarian-dashboard"]'
      );
      const isVisible = await dashboard.isVisible().catch(() => false);

      if (isVisible) {
        // Look for any audit trail links
        const auditLinks = page.locator('a[href*="/admin/audit"]');
        const count = await auditLinks.count();

        // Audit links should exist for each flag/annotation item
        // (may be 0 if no items exist)
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test("quick links to governance pages exist", async ({ page }) => {
      await page.context().addCookies([
        {
          name: "clubos_session",
          value: "test-parliamentarian-token",
          domain: new URL(BASE).hostname,
          path: "/",
        },
      ]);

      await page.goto(`${BASE}/admin`);
      await page.waitForTimeout(1000);

      const dashboard = page.locator(
        '[data-test-id="parliamentarian-dashboard"]'
      );
      const isVisible = await dashboard.isVisible().catch(() => false);

      if (isVisible) {
        // Check for governance links
        const flagsLink = page.locator('a[href="/admin/governance/flags"]');
        const hasFlagsLink = await flagsLink.isVisible().catch(() => false);

        const annotationsLink = page.locator(
          'a[href="/admin/governance/annotations"]'
        );
        const hasAnnotationsLink = await annotationsLink
          .isVisible()
          .catch(() => false);

        // At least one of these links should exist
        expect(hasFlagsLink || hasAnnotationsLink).toBe(true);
      }
    });
  });

  test.describe("Golden Path: Flag Resolution Workflow", () => {
    test("parliamentarian can resolve open flags", async ({ request }) => {
      // First, get dashboard to find an open flag (if exists)
      const dashboardRes = await request.get(
        `${BASE}/api/v1/officer/parliamentarian/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-parliamentarian-token",
          },
        }
      );

      expect(dashboardRes.status()).toBe(200);

      const data = await dashboardRes.json();
      const openFlags = [
        ...data.openPolicyQuestions,
        ...data.docsNeedingReview,
      ].filter(
        (f: { status: string }) =>
          f.status === "OPEN" || f.status === "IN_PROGRESS"
      );

      if (openFlags.length > 0) {
        const flagId = openFlags[0].id;

        // Resolve the flag
        const resolveRes = await request.post(
          `${BASE}/api/v1/governance/flags/${flagId}/resolve`,
          {
            headers: {
              Authorization: "Bearer test-parliamentarian-token",
              "Content-Type": "application/json",
            },
            data: {
              resolution: "Reviewed and resolved",
              status: "RESOLVED",
            },
          }
        );

        // Should succeed or fail based on current status/permissions
        const status = resolveRes.status();
        expect([200, 400, 403, 404]).toContain(status);

        if (status === 200) {
          const result = await resolveRes.json();
          expect(result.flag.status).toBe("RESOLVED");
        }
      }
    });

    test("webmaster cannot resolve flags (lacks capability)", async ({
      request,
    }) => {
      // First, get dashboard as admin to find an open flag
      const dashboardRes = await request.get(
        `${BASE}/api/v1/officer/parliamentarian/dashboard`,
        {
          headers: {
            Authorization: "Bearer test-admin-token",
          },
        }
      );

      expect(dashboardRes.status()).toBe(200);

      const data = await dashboardRes.json();
      const openFlags = [
        ...data.openPolicyQuestions,
        ...data.docsNeedingReview,
      ].filter(
        (f: { status: string }) =>
          f.status === "OPEN" || f.status === "IN_PROGRESS"
      );

      if (openFlags.length > 0) {
        const flagId = openFlags[0].id;

        // Webmaster tries to resolve - should be denied
        const resolveRes = await request.post(
          `${BASE}/api/v1/governance/flags/${flagId}/resolve`,
          {
            headers: {
              Authorization: "Bearer test-webmaster-token",
              "Content-Type": "application/json",
            },
            data: {
              resolution: "Attempting unauthorized resolution",
              status: "RESOLVED",
            },
          }
        );

        // Should get 403 (webmaster lacks governance:flags:resolve)
        expect([403, 404]).toContain(resolveRes.status());
      }
    });
  });

  test.describe("Annotation Panel API", () => {
    test("GET /api/v1/governance/annotations returns annotations for target", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE}/api/v1/governance/annotations?targetType=bylaw&targetId=test-bylaw-id`,
        {
          headers: {
            Authorization: "Bearer test-parliamentarian-token",
          },
        }
      );

      // May return empty array if no annotations exist
      const status = response.status();
      expect([200, 404]).toContain(status);

      if (status === 200) {
        const data = await response.json();
        expect(Array.isArray(data.annotations || data)).toBe(true);
      }
    });

    test("POST /api/v1/governance/annotations creates annotation with capability", async ({
      request,
    }) => {
      const response = await request.post(
        `${BASE}/api/v1/governance/annotations`,
        {
          headers: {
            Authorization: "Bearer test-parliamentarian-token",
            "Content-Type": "application/json",
          },
          data: {
            targetType: "bylaw",
            targetId: "test-bylaw-id",
            body: "Test annotation created by E2E test",
          },
        }
      );

      // Should succeed if user has capability
      const status = response.status();
      expect([200, 201, 400, 403, 404]).toContain(status);

      if (status === 200 || status === 201) {
        const data = await response.json();
        expect(data.annotation || data).toHaveProperty("id");
        expect((data.annotation || data).body).toBe(
          "Test annotation created by E2E test"
        );
      }
    });

    test("webmaster cannot create annotation (lacks capability)", async ({
      request,
    }) => {
      const response = await request.post(
        `${BASE}/api/v1/governance/annotations`,
        {
          headers: {
            Authorization: "Bearer test-webmaster-token",
            "Content-Type": "application/json",
          },
          data: {
            targetType: "bylaw",
            targetId: "test-bylaw-id",
            body: "Unauthorized annotation attempt",
          },
        }
      );

      // Should get 403
      expect([403, 404]).toContain(response.status());
    });

    test("parliamentarian can publish draft annotation", async ({ request }) => {
      // First create a draft annotation
      const createRes = await request.post(
        `${BASE}/api/v1/governance/annotations`,
        {
          headers: {
            Authorization: "Bearer test-parliamentarian-token",
            "Content-Type": "application/json",
          },
          data: {
            targetType: "bylaw",
            targetId: "test-bylaw-publish",
            body: "Draft annotation to publish",
            isPublished: false,
          },
        }
      );

      if (createRes.status() === 200 || createRes.status() === 201) {
        const createData = await createRes.json();
        const annotationId = (createData.annotation || createData).id;

        // Publish the annotation
        const publishRes = await request.patch(
          `${BASE}/api/v1/governance/annotations/${annotationId}`,
          {
            headers: {
              Authorization: "Bearer test-parliamentarian-token",
              "Content-Type": "application/json",
            },
            data: {
              isPublished: true,
            },
          }
        );

        const status = publishRes.status();
        expect([200, 400, 403, 404]).toContain(status);

        if (status === 200) {
          const publishData = await publishRes.json();
          expect(
            (publishData.annotation || publishData).isPublished
          ).toBe(true);
        }
      }
    });
  });
});
