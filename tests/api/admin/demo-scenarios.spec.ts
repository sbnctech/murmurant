import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

/**
 * Demo Scenarios API Tests
 *
 * Tests for GET /api/admin/demo/scenarios
 * This endpoint returns deep links to demo entities for lifecycle, roles, and events.
 */

test.describe("GET /api/admin/demo/scenarios", () => {
  test("admin can access scenarios API", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/demo/scenarios`, {
      headers: { Authorization: "Bearer test-admin-token" },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.scenarios).toBeDefined();
    expect(Array.isArray(data.scenarios)).toBe(true);
    expect(data.summary).toBeDefined();
    expect(data.summary.total).toBeGreaterThan(0);
    expect(data.summary.byCategory).toBeDefined();
  });

  test("scenarios include all three categories", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/demo/scenarios`, {
      headers: { Authorization: "Bearer test-admin-token" },
    });

    const data = await response.json();

    // Check that all three categories are present
    expect(data.summary.byCategory.lifecycle).toBeDefined();
    expect(data.summary.byCategory.role).toBeDefined();
    expect(data.summary.byCategory.event).toBeDefined();

    // Check that category totals match scenario counts
    const lifecycleCount = data.scenarios.filter(
      (s: { category: string }) => s.category === "lifecycle"
    ).length;
    const roleCount = data.scenarios.filter(
      (s: { category: string }) => s.category === "role"
    ).length;
    const eventCount = data.scenarios.filter(
      (s: { category: string }) => s.category === "event"
    ).length;

    expect(lifecycleCount).toBe(data.summary.byCategory.lifecycle.total);
    expect(roleCount).toBe(data.summary.byCategory.role.total);
    expect(eventCount).toBe(data.summary.byCategory.event.total);
  });

  test("scenarios have required fields", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/demo/scenarios`, {
      headers: { Authorization: "Bearer test-admin-token" },
    });

    const data = await response.json();

    for (const scenario of data.scenarios) {
      expect(scenario.category).toBeDefined();
      expect(scenario.id).toBeDefined();
      expect(scenario.label).toBeDefined();
      expect(scenario.description).toBeDefined();
      expect(scenario.demoNotes).toBeDefined();
      // deepLink can be null if entity not found
    }
  });

  test("non-admin roles are denied access", async ({ request }) => {
    // Member role should be denied
    const response = await request.get(`${BASE}/api/admin/demo/scenarios`, {
      headers: { Authorization: "Bearer test-member-token" },
    });

    expect(response.status()).toBe(403);
  });

  test("unauthenticated request is denied", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/demo/scenarios`);
    expect(response.status()).toBe(401);
  });
});
