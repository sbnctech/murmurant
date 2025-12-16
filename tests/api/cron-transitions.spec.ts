/**
 * Cron Transitions API Tests
 *
 * Tests for the /api/cron/transitions endpoint:
 * - Authentication (CRON_SECRET Bearer token)
 * - Idempotency (calling twice runs once)
 * - Health check endpoint
 *
 * Charter Principles:
 * - P9: Security must fail closed (auth tests)
 * - P7: Observability is a product feature (JobRun tracking)
 */

import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/prisma";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const CRON_ENDPOINT = `${BASE}/api/cron/transitions`;

// Get cron secret from environment or use test value
const CRON_SECRET = process.env.CRON_SECRET ?? "test-cron-secret-minimum-16-chars";

test.describe("POST /api/cron/transitions", () => {
  test.describe("Authentication (P9: fail closed)", () => {
    test("returns 401 without authorization header", async ({ request }) => {
      const response = await request.post(CRON_ENDPOINT);

      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    test("returns 401 with invalid authorization header", async ({ request }) => {
      const response = await request.post(CRON_ENDPOINT, {
        headers: {
          Authorization: "Bearer invalid-secret",
        },
      });

      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    test("returns 401 with wrong authorization scheme", async ({ request }) => {
      const response = await request.post(CRON_ENDPOINT, {
        headers: {
          Authorization: `Basic ${CRON_SECRET}`,
        },
      });

      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    test("succeeds with valid Bearer token", async ({ request }) => {
      const response = await request.post(CRON_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      });

      // Should succeed (200) or skip (200 with skipped: true)
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.requestId).toMatch(/^req-[a-z0-9]+-[a-z0-9]+$/);
    });
  });

  test.describe("Idempotency", () => {
    test.beforeAll(async () => {
      // Clean up any existing job runs for today to ensure clean test
      const today = new Date();
      const todayNormalized = new Date(
        Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
      );

      await prisma.jobRun.deleteMany({
        where: {
          jobName: "transitions",
          scheduledFor: todayNormalized,
        },
      });
    });

    test("calling same cron twice runs only once", async ({ request }) => {
      // First call - should execute
      const response1 = await request.post(CRON_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      });

      expect(response1.status()).toBe(200);
      const data1 = await response1.json();
      expect(data1.success).toBe(true);

      // Capture runId from first execution
      const firstRunId = data1.runId;
      expect(firstRunId).toBeDefined();

      // If it wasn't skipped, it should not have skipped flag
      if (!data1.skipped) {
        expect(data1.skipped).toBeUndefined();
      }

      // Second call - should be skipped (already ran today)
      const response2 = await request.post(CRON_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      });

      expect(response2.status()).toBe(200);
      const data2 = await response2.json();
      expect(data2.success).toBe(true);
      expect(data2.skipped).toBe(true);
      expect(data2.reason).toBe("Job already executed for this date");
      expect(data2.runId).toBe(firstRunId); // Same run ID
    });

    test("returns runId in all responses", async ({ request }) => {
      const response = await request.post(CRON_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.runId).toBeDefined();
      expect(typeof data.runId).toBe("string");
      expect(data.runId).toHaveLength(36); // UUID format
    });
  });
});

test.describe("GET /api/cron/transitions (Health Check)", () => {
  test("returns 200 with ok status", async ({ request }) => {
    const response = await request.get(CRON_ENDPOINT);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe("ok");
  });

  test("includes upcoming transition dates", async ({ request }) => {
    const response = await request.get(CRON_ENDPOINT);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.upcomingTransitionDates)).toBe(true);
    expect(typeof data.dueTransitionsCount).toBe("number");
  });

  test("includes last run information when available", async ({ request }) => {
    // First, trigger a run to ensure there's a record
    await request.post(CRON_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
      },
    });

    // Now check the health endpoint
    const response = await request.get(CRON_ENDPOINT);

    expect(response.status()).toBe(200);

    const data = await response.json();
    // lastRun may be null if no runs exist, or an object if runs exist
    if (data.lastRun) {
      expect(data.lastRun.id).toBeDefined();
      expect(data.lastRun.scheduledFor).toBeDefined();
      expect(data.lastRun.status).toBeDefined();
    }
  });

  test("does not require authentication", async ({ request }) => {
    // GET endpoint should work without auth
    const response = await request.get(CRON_ENDPOINT);

    expect(response.status()).toBe(200);
  });
});
