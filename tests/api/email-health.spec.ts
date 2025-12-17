/**
 * Email Health Dashboard API Tests
 *
 * Tests for /api/v1/admin/email-health endpoints
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const ADMIN_TOKEN = "Bearer test-admin-token";
const WEBMASTER_TOKEN = "Bearer test-webmaster";
const MEMBER_TOKEN = "Bearer test-member";

test.describe("Email Health Dashboard API", () => {
  test.describe("GET /api/v1/admin/email-health", () => {
    test("admin can access email health dashboard", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/email-health`, {
        headers: { Authorization: ADMIN_TOKEN },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      // Check response structure
      expect(data).toHaveProperty("period");
      expect(data).toHaveProperty("summary");
      expect(data).toHaveProperty("topBounceDomains");
      expect(data).toHaveProperty("recentCampaigns");
      expect(data).toHaveProperty("alerts");
      expect(data).toHaveProperty("config");

      // Check summary structure
      expect(data.summary).toHaveProperty("total");
      expect(data.summary).toHaveProperty("delivered");
      expect(data.summary).toHaveProperty("bounced");
      expect(data.summary).toHaveProperty("complained");
      expect(data.summary).toHaveProperty("bounceRate");
      expect(data.summary).toHaveProperty("deliveryRate");
    });

    test("webmaster can access email health dashboard", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/email-health`, {
        headers: { Authorization: WEBMASTER_TOKEN },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("summary");
    });

    test("member cannot access email health dashboard", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/email-health`, {
        headers: { Authorization: MEMBER_TOKEN },
      });

      expect(response.status()).toBe(403);
    });

    test("unauthenticated request returns 401", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/email-health`);
      expect(response.status()).toBe(401);
    });

    test("accepts days query parameter", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/email-health?days=7`,
        {
          headers: { Authorization: ADMIN_TOKEN },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.period.days).toBe(7);
    });
  });

  test.describe("GET /api/v1/admin/email-health/config", () => {
    test("admin can view config", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/email-health/config`,
        {
          headers: { Authorization: ADMIN_TOKEN },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("config");
      expect(data.config).toHaveProperty("trackOpens");
      expect(data.config).toHaveProperty("trackClicks");
      expect(data.config).toHaveProperty("trackBounces");
      expect(data.config).toHaveProperty("retentionDays");
    });

    test("webmaster cannot view config", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/email-health/config`,
        {
          headers: { Authorization: WEBMASTER_TOKEN },
        }
      );

      expect(response.status()).toBe(403);
    });
  });

  test.describe("PATCH /api/v1/admin/email-health/config", () => {
    test("admin can update config", async ({ request }) => {
      const response = await request.patch(
        `${BASE}/api/v1/admin/email-health/config`,
        {
          headers: { Authorization: ADMIN_TOKEN },
          data: {
            trackOpens: true,
            retentionDays: 60,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.config.trackOpens).toBe(true);
      expect(data.config.retentionDays).toBe(60);

      // Reset to defaults
      await request.patch(`${BASE}/api/v1/admin/email-health/config`, {
        headers: { Authorization: ADMIN_TOKEN },
        data: {
          trackOpens: false,
          retentionDays: 90,
        },
      });
    });

    test("rejects invalid retention days", async ({ request }) => {
      const response = await request.patch(
        `${BASE}/api/v1/admin/email-health/config`,
        {
          headers: { Authorization: ADMIN_TOKEN },
          data: {
            retentionDays: 1000, // Too high
          },
        }
      );

      expect(response.status()).toBe(400);
    });

    test("webmaster cannot update config", async ({ request }) => {
      const response = await request.patch(
        `${BASE}/api/v1/admin/email-health/config`,
        {
          headers: { Authorization: WEBMASTER_TOKEN },
          data: { trackOpens: true },
        }
      );

      expect(response.status()).toBe(403);
    });
  });
});

test.describe("Email Webhook API", () => {
  test.describe("POST /api/webhooks/email", () => {
    test("accepts valid bounce event", async ({ request }) => {
      // This test simulates a bounce webhook
      // In a real scenario, we'd need a valid deliveryLogId
      const response = await request.post(`${BASE}/api/webhooks/email`, {
        data: {
          eventType: "bounced",
          providerMsgId: "test-message-id",
          bounceType: "hard",
          bounceReason: "User unknown",
        },
      });

      // Will be 404 since we don't have a real delivery log
      // But it should process the request format correctly
      expect([200, 404]).toContain(response.status());
    });

    test("rejects invalid payload", async ({ request }) => {
      const response = await request.post(`${BASE}/api/webhooks/email`, {
        data: {
          invalid: "payload",
        },
      });

      expect(response.status()).toBe(400);
    });
  });
});
