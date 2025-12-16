/**
 * Health Endpoint Tests
 *
 * Synthetic tests for ClubOS health endpoints.
 *
 * Charter Principles:
 * - P7: Observability is a product feature
 * - P9: Security must fail closed
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Health Endpoints", () => {
  test.describe("GET /api/health/db", () => {
    test("returns 200 with ok status when database is available", async ({ request }) => {
      const response = await request.get(`${BASE}/api/health/db`);

      expect(response.status()).toBe(200);

      const data = await response.json();

      // Check required fields
      expect(data.status).toBe("ok");
      expect(data.timestamp).toBeDefined();
      expect(data.requestId).toMatch(/^req-[\w-]+$/);
      expect(data.checks).toBeDefined();
      expect(data.checks.database).toBeDefined();
      expect(data.checks.database.status).toBe("ok");
      expect(typeof data.checks.database.latencyMs).toBe("number");
    });

    test("includes X-Request-ID header", async ({ request }) => {
      const response = await request.get(`${BASE}/api/health/db`);

      const requestId = response.headers()["x-request-id"];
      expect(requestId).toMatch(/^req-[\w-]+$/);

      const data = await response.json();
      expect(data.requestId).toBe(requestId);
    });

    test("has no-cache headers", async ({ request }) => {
      const response = await request.get(`${BASE}/api/health/db`);

      const cacheControl = response.headers()["cache-control"];
      expect(cacheControl).toContain("no-store");
    });
  });

  test.describe("GET /api/health/auth", () => {
    test("returns 200 with minimal info for unauthenticated requests", async ({ request }) => {
      const response = await request.get(`${BASE}/api/health/auth`);

      expect(response.status()).toBe(200);

      const data = await response.json();

      // Check required fields
      expect(data.status).toBeDefined();
      expect(data.timestamp).toBeDefined();
      expect(data.requestId).toMatch(/^req-[\w-]+$/);
      expect(data.checks).toBeDefined();
      expect(data.checks.auth).toBeDefined();
    });

    test("returns detailed info for admin", async ({ request }) => {
      const response = await request.get(`${BASE}/api/health/auth`, {
        headers: {
          Authorization: "Bearer test-admin-token",
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();

      // Admin should see detailed checks
      expect(data.checks.authSecretConfigured).toBeDefined();
      expect(data.checks.authBackend).toBeDefined();
      expect(data.checks.userStore).toBeDefined();
      expect(data.config).toBeDefined();
    });

    test("does not expose secrets to unauthenticated users", async ({ request }) => {
      const response = await request.get(`${BASE}/api/health/auth`);

      const data = await response.json();

      // Should NOT have detailed config info
      expect(data.config).toBeUndefined();
      expect(data.checks.authSecretConfigured).toBeUndefined();
    });
  });

  test.describe("GET /api/health/cron", () => {
    test("returns 200 with minimal info for unauthenticated requests", async ({ request }) => {
      const response = await request.get(`${BASE}/api/health/cron`);

      expect(response.status()).toBe(200);

      const data = await response.json();

      // Check required fields
      expect(data.status).toBeDefined();
      expect(data.timestamp).toBeDefined();
      expect(data.requestId).toMatch(/^req-[\w-]+$/);
      expect(data.checks).toBeDefined();
      expect(data.checks.cron).toBeDefined();
    });

    test("returns detailed info for admin", async ({ request }) => {
      const response = await request.get(`${BASE}/api/health/cron`, {
        headers: {
          Authorization: "Bearer test-admin-token",
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();

      // Admin should see detailed info
      expect(data.checks.cronSecretConfigured).toBeDefined();
      expect(data.checks.transitionService).toBeDefined();
      expect(data.cronStatus).toBeDefined();
      expect(typeof data.cronStatus.dueTransitionsCount).toBe("number");
      expect(Array.isArray(data.cronStatus.upcomingTransitionDates)).toBe(true);
    });

    test("does not expose cron details to unauthenticated users", async ({ request }) => {
      const response = await request.get(`${BASE}/api/health/cron`);

      const data = await response.json();

      // Should NOT have detailed cron status
      expect(data.cronStatus).toBeUndefined();
      expect(data.checks.cronSecretConfigured).toBeUndefined();
    });
  });

  test.describe("Request ID consistency", () => {
    test("each request gets a unique requestId", async ({ request }) => {
      const response1 = await request.get(`${BASE}/api/health/db`);
      const response2 = await request.get(`${BASE}/api/health/db`);

      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(data1.requestId).not.toBe(data2.requestId);
    });

    test("requestId format is consistent across endpoints", async ({ request }) => {
      const dbResponse = await request.get(`${BASE}/api/health/db`);
      const authResponse = await request.get(`${BASE}/api/health/auth`);
      const cronResponse = await request.get(`${BASE}/api/health/cron`);

      const dbData = await dbResponse.json();
      const authData = await authResponse.json();
      const cronData = await cronResponse.json();

      // All should match the same pattern
      const pattern = /^req-[\w]+-[\w]+$/;
      expect(dbData.requestId).toMatch(pattern);
      expect(authData.requestId).toMatch(pattern);
      expect(cronData.requestId).toMatch(pattern);
    });
  });

  test.describe("P9: Fail Closed", () => {
    test("non-admin cannot access sensitive auth details", async ({ request }) => {
      // Use member token (has auth but not admin)
      const response = await request.get(`${BASE}/api/health/auth`, {
        headers: {
          Authorization: "Bearer test-member-token",
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();

      // Should NOT have detailed config
      expect(data.config).toBeUndefined();
    });

    test("non-admin cannot access sensitive cron details", async ({ request }) => {
      // Use member token (has auth but not admin)
      const response = await request.get(`${BASE}/api/health/cron`, {
        headers: {
          Authorization: "Bearer test-member-token",
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();

      // Should NOT have detailed cron status
      expect(data.cronStatus).toBeUndefined();
    });
  });
});
