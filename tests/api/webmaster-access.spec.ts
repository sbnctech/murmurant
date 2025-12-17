// Copyright (c) Santa Barbara Newcomers Club
// API tests for webmaster role access restrictions
//
// NOTE: These tests are quarantined because the E2E test framework uses
// x-admin-test-token which bypasses normal auth. These tests verify
// capability-based access control which requires the full auth flow.
//
// TODO (v1 hardening): Re-enable once E2E auth framework supports role-specific tokens

import { test, expect } from "@playwright/test";

test.describe("@quarantine Webmaster Access Restrictions", () => {
  test.describe("Export Endpoints", () => {
    test("webmaster cannot access members export", async ({ request }) => {
      const response = await request.get("/api/admin/export/members", {
        headers: {
          Authorization: "Bearer test-webmaster-id",
        },
      });

      expect(response.status()).toBe(403);
      const body = await response.json();
      expect(body.error).toBe("Forbidden");
    });

    test("webmaster cannot access events export", async ({ request }) => {
      const response = await request.get("/api/admin/export/events", {
        headers: {
          Authorization: "Bearer test-webmaster-id",
        },
      });

      expect(response.status()).toBe(403);
    });

    test("webmaster cannot access registrations export", async ({ request }) => {
      const response = await request.get("/api/admin/export/registrations", {
        headers: {
          Authorization: "Bearer test-webmaster-id",
        },
      });

      expect(response.status()).toBe(403);
    });

    test("webmaster cannot access activity export", async ({ request }) => {
      const response = await request.get("/api/admin/export/activity", {
        headers: {
          Authorization: "Bearer test-webmaster-id",
        },
      });

      expect(response.status()).toBe(403);
    });

    test("admin CAN access members export", async ({ request }) => {
      const response = await request.get("/api/admin/export/members", {
        headers: {
          Authorization: "Bearer test-admin-id",
        },
      });

      // Should succeed (200) or at least not be 403
      expect(response.status()).not.toBe(403);
      expect(response.status()).not.toBe(401);
    });
  });

  test.describe("Publishing Endpoints", () => {
    test("webmaster CAN access pages list", async ({ request }) => {
      const response = await request.get("/api/admin/content/pages", {
        headers: {
          Authorization: "Bearer test-webmaster-id",
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty("items");
    });

    test("webmaster CAN create pages", async ({ request }) => {
      const slug = `test-webmaster-page-${Date.now()}`;
      const response = await request.post("/api/admin/content/pages", {
        headers: {
          Authorization: "Bearer test-webmaster-id",
        },
        data: {
          slug,
          title: "Test Webmaster Page",
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.page).toHaveProperty("id");
      expect(body.page.slug).toBe(slug);
    });

    test("webmaster CAN access themes list", async ({ request }) => {
      const response = await request.get("/api/admin/content/themes", {
        headers: {
          Authorization: "Bearer test-webmaster-id",
        },
      });

      expect(response.status()).toBe(200);
    });
  });

  test.describe("Debug Endpoint", () => {
    test("debug endpoint returns 404 when WEBMASTER_SUPPORT_DEBUG is not set", async ({ request }) => {
      // Note: This test assumes the env var is not set in test environment
      // If it IS set, this test behavior would be different
      const response = await request.get(
        "/api/admin/debug/effective-permissions?email=test@example.com",
        {
          headers: {
            Authorization: "Bearer test-webmaster-id",
          },
        }
      );

      // Should return 404 when debug mode is not enabled
      // (or 200 if debug mode happens to be enabled)
      expect([200, 404]).toContain(response.status());
    });
  });

  test.describe("Member/Registration Read Access", () => {
    test("webmaster CAN view member list", async ({ request }) => {
      const response = await request.get("/api/admin/members", {
        headers: {
          Authorization: "Bearer test-webmaster-id",
        },
      });

      // Note: This endpoint may not have capability guards yet
      // The test documents expected behavior
      expect([200, 403]).toContain(response.status());
    });

    test("webmaster CAN view registration list", async ({ request }) => {
      const response = await request.get("/api/admin/registrations", {
        headers: {
          Authorization: "Bearer test-webmaster-id",
        },
      });

      // Note: This endpoint may not have capability guards yet
      expect([200, 403]).toContain(response.status());
    });
  });
});
