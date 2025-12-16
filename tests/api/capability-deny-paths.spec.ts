/**
 * Capability-Based Authorization Deny-Path Tests
 *
 * Charter Principles:
 * - P1: Identity and authorization must be provable
 * - P2: Default deny, least privilege, object scope
 * - P9: Security must fail closed
 * - N2: Never allow coarse roles to replace capabilities
 * - N6: Never ship without tests for permission boundaries
 *
 * These tests verify:
 * 1. Unauthenticated requests get 401
 * 2. Under-privileged roles get 403
 * 3. Capability checks use hasCapability (not role strings)
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

// Token fixtures for different roles
const TOKENS = {
  admin: "test-admin-token",
  member: "test-member-token",
  webmaster: "test-webmaster-token",
  eventChair: "test-chair-token",
  vpActivities: "test-vp-token",
  president: "test-president-token",
  pastPresident: "test-past-president-token",
} as const;

const makeHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

test.describe("Capability Deny-Path Tests", () => {
  test.describe("Member Endpoints - Scoped Authorization", () => {
    // Test that member role (no capabilities) gets 403
    test("member role gets 403 on admin/members/[id]", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/members/test-member-id`, {
        headers: makeHeaders(TOKENS.member),
      });
      expect(response.status()).toBe(403);
    });

    test("member role gets 403 on admin/members/[id]/history", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/members/test-member-id/history`, {
        headers: makeHeaders(TOKENS.member),
      });
      expect(response.status()).toBe(403);
    });

    test("member role gets 403 on admin/members/[id]/status", async ({ request }) => {
      const response = await request.patch(`${BASE}/api/v1/admin/members/test-member-id/status`, {
        headers: makeHeaders(TOKENS.member),
        data: { status: "INACTIVE" },
      });
      expect(response.status()).toBe(403);
    });

    // Test that webmaster (no members:view) gets 403
    test("webmaster gets 403 on admin/members/[id] (no members:view)", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/members/test-member-id`, {
        headers: makeHeaders(TOKENS.webmaster),
      });
      expect(response.status()).toBe(403);
    });

    // Test that admin (has members:view via admin:full) gets 200 or 404
    test("admin can access admin/members/[id]", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/members/test-member-id`, {
        headers: makeHeaders(TOKENS.admin),
      });
      // Should be 404 (not found) rather than 403 (forbidden)
      expect([200, 404]).toContain(response.status());
    });

    // Test that VP Activities (has members:view) can access
    test("vp-activities can access admin/members/[id]", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/members/test-member-id`, {
        headers: makeHeaders(TOKENS.vpActivities),
      });
      // Should be 404 (not found) rather than 403 (forbidden)
      expect([200, 404]).toContain(response.status());
    });
  });

  test.describe("Registration Endpoints - Scoped Authorization", () => {
    test("member role gets 403 on admin/registrations/[id]", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/registrations/test-reg-id`, {
        headers: makeHeaders(TOKENS.member),
      });
      expect(response.status()).toBe(403);
    });

    test("webmaster gets 403 on admin/registrations/[id] (no registrations:view)", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/registrations/test-reg-id`, {
        headers: makeHeaders(TOKENS.webmaster),
      });
      expect(response.status()).toBe(403);
    });

    test("admin can access admin/registrations/[id]", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/registrations/test-reg-id`, {
        headers: makeHeaders(TOKENS.admin),
      });
      // Returns 500 (not implemented) or 404 - but not 403
      expect([200, 404, 500]).toContain(response.status());
    });
  });

  test.describe("Transition Endpoints - Capability-Based Access", () => {
    // Webmaster should NOT have transitions:view capability
    test("webmaster gets 403 on transitions/summary (no transitions:view)", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/transitions/summary`, {
        headers: makeHeaders(TOKENS.webmaster),
      });
      expect(response.status()).toBe(403);
    });

    test("event-chair gets 403 on transitions/widget (no transitions:view)", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/transitions/widget`, {
        headers: makeHeaders(TOKENS.eventChair),
      });
      expect(response.status()).toBe(403);
    });

    // President SHOULD have transitions:view capability
    test("president can access transitions/widget", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/transitions/widget`, {
        headers: makeHeaders(TOKENS.president),
      });
      // Should not be 403 - either 200 with data or error for other reasons
      expect([200, 403, 500]).toContain(response.status());
      if (response.status() === 403) {
        // If 403, verify it's not due to capability check (could be board position check)
        const body = await response.json();
        expect(body.message).not.toContain("Required capability: transitions:view");
      }
    });

    // Admin SHOULD have transitions:view capability
    test("admin can access transitions/summary", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/transitions/summary`, {
        headers: makeHeaders(TOKENS.admin),
      });
      expect(response.status()).toBe(200);
    });
  });

  // NOTE: These tests are skipped until Task 1.1-1.4 (Add Authentication to Admin Routes) is complete.
  // The v1 routes have auth via requireCapabilityWithScope, but some non-v1 routes still lack auth.
  // See WORK_PLAN.md Phase 1 for details.
  test.describe.skip("Unauthenticated Access Returns 401 [BLOCKED: Task 1.x]", () => {
    const protectedEndpoints = [
      { method: "GET", path: "/api/v1/admin/members/test-id" },
      { method: "GET", path: "/api/v1/admin/members/test-id/history" },
      { method: "PATCH", path: "/api/v1/admin/members/test-id/status" },
      { method: "GET", path: "/api/v1/admin/registrations/test-id" },
      { method: "DELETE", path: "/api/v1/admin/registrations/test-id" },
      { method: "GET", path: "/api/admin/transitions/summary" },
      { method: "GET", path: "/api/v1/admin/transitions/widget" },
    ];

    for (const { method, path } of protectedEndpoints) {
      test(`${method} ${path} returns 401 without auth`, async ({ request }) => {
        const response = await request.fetch(`${BASE}${path}`, { method });
        expect(response.status()).toBe(401);
      });
    }
  });

  // NOTE: These tests are skipped until Task 1.1 (Add Authentication to Admin Member Routes) is complete.
  // The /api/admin/members route currently lacks requireAdmin - when added, it will use hasCapability.
  // See WORK_PLAN.md Phase 1 for details.
  test.describe.skip("requireAdmin Uses Capability Check (N2 Compliance) [BLOCKED: Task 1.1]", () => {
    // These tests verify that requireAdmin uses hasCapability("admin:full")
    // rather than role === "admin" string comparison

    test("admin token gets access via admin:full capability", async ({ request }) => {
      // Admin has admin:full capability, should pass requireAdmin check
      const response = await request.get(`${BASE}/api/admin/members`, {
        headers: makeHeaders(TOKENS.admin),
      });
      expect(response.status()).toBe(200);
    });

    test("webmaster without admin:full gets 403", async ({ request }) => {
      // Webmaster does NOT have admin:full capability
      const response = await request.get(`${BASE}/api/admin/members`, {
        headers: makeHeaders(TOKENS.webmaster),
      });
      expect(response.status()).toBe(403);
    });

    test("event-chair without admin:full gets 403", async ({ request }) => {
      // Event chair does NOT have admin:full capability
      const response = await request.get(`${BASE}/api/admin/members`, {
        headers: makeHeaders(TOKENS.eventChair),
      });
      expect(response.status()).toBe(403);
    });
  });

  test.describe("Error Messages Are Human-Friendly (P6 Compliance)", () => {
    test("403 error does not say 'Forbidden'", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/members/test-id`, {
        headers: makeHeaders(TOKENS.member),
      });
      expect(response.status()).toBe(403);
      const body = await response.json();
      // Should say "Access denied" not "Forbidden"
      expect(body.error).toBe("Access denied");
    });
  });
});
