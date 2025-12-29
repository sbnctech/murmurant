/**
 * Member Public Profile API Tests
 *
 * Tests for GET /api/v1/members/:id/public
 * Verifies authentication, access control, and field redaction.
 *
 * Charter Compliance:
 * - P1: Identity via session required
 * - P2: Member-to-member access (authenticated members only)
 * - P9: Fail closed on invalid auth
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("GET /api/v1/members/:id/public", () => {
  // ============================================================================
  // AUTHENTICATION TESTS
  // ============================================================================

  test.describe("Authentication Required", () => {
    test("returns 401 for unauthenticated request", async ({ request }) => {
      // Using a fake member ID - the auth check should happen before ID validation
      const response = await request.get(`${BASE}/api/v1/members/mem_fake123/public`);

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    test("returns 401 with invalid session cookie", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/members/mem_fake123/public`, {
        headers: {
          Cookie: "murmurant_session=invalid-token-xyz",
        },
      });

      expect(response.status()).toBe(401);
    });

    test("returns 401 with expired session cookie", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/members/mem_fake123/public`, {
        headers: {
          Cookie: "murmurant_session=expired.session.token",
        },
      });

      expect(response.status()).toBe(401);
    });

    test("returns 401 with malformed authorization header", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/members/mem_fake123/public`, {
        headers: {
          Authorization: "Bearer malformed-jwt-token",
        },
      });

      expect(response.status()).toBe(401);
    });
  });

  // ============================================================================
  // MEMBER NOT FOUND TESTS
  // ============================================================================

  test.describe("Member Not Found", () => {
    test.skip("returns 404 for non-existent member ID", async ({ request }) => {
      // TODO: This test requires an authenticated session
      // Use test fixture with valid session once available
      const response = await request.get(`${BASE}/api/v1/members/mem_does_not_exist/public`);

      // Would be 404 with valid auth, but 401 without
      expect(response.status()).toBe(404);
    });
  });

  // ============================================================================
  // SECURITY TESTS
  // ============================================================================

  test.describe("Security Headers", () => {
    test("does not expose sensitive headers", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/members/mem_any/public`);

      const headers = response.headers();
      expect(headers["x-powered-by"]).toBeUndefined();
    });

    test("returns proper content-type for JSON response", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/members/mem_any/public`);

      // Even error responses should be JSON
      const contentType = response.headers()["content-type"];
      expect(contentType).toContain("application/json");
    });
  });

  // ============================================================================
  // FAIL-CLOSED BEHAVIOR
  // ============================================================================

  test.describe("Fail Closed (P9)", () => {
    test("authentication fails closed - no data leak on invalid auth", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/members/mem_any/public`);

      expect(response.status()).toBe(401);
      const body = await response.json();

      // Should NOT reveal whether the member exists
      expect(body.member).toBeUndefined();
      expect(body.firstName).toBeUndefined();
      expect(body.lastName).toBeUndefined();
    });

    test("error response does not leak database details", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/members/mem_any/public`);

      const body = await response.json();

      // Should not expose internal errors
      expect(JSON.stringify(body)).not.toContain("prisma");
      expect(JSON.stringify(body)).not.toContain("database");
      expect(JSON.stringify(body)).not.toContain("postgres");
    });
  });
});

test.describe("GET /api/v1/members/directory", () => {
  // ============================================================================
  // AUTHENTICATION TESTS
  // ============================================================================

  test.describe("Authentication Required", () => {
    test("returns 401 for unauthenticated request", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/members/directory`);

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    test("returns 401 with invalid session cookie", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/members/directory`, {
        headers: {
          Cookie: "murmurant_session=invalid-token",
        },
      });

      expect(response.status()).toBe(401);
    });
  });

  // ============================================================================
  // SECURITY TESTS
  // ============================================================================

  test.describe("Security", () => {
    test("does not leak member data without auth", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/members/directory`);

      expect(response.status()).toBe(401);
      const body = await response.json();

      // Should not contain any member data
      expect(body.members).toBeUndefined();
      expect(body.pagination).toBeUndefined();
    });

    test("returns JSON content type for error response", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/members/directory`);

      const contentType = response.headers()["content-type"];
      expect(contentType).toContain("application/json");
    });
  });

  // ============================================================================
  // PAGINATION VALIDATION
  // ============================================================================

  test.describe("Request Validation", () => {
    test("rejects negative page number without auth", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/members/directory?page=-1`);

      // Auth check happens first
      expect(response.status()).toBe(401);
    });

    test("handles large page numbers gracefully", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/members/directory?page=999999`);

      // Auth check happens first
      expect(response.status()).toBe(401);
    });
  });
});

// ============================================================================
// FIELD REDACTION DOCUMENTATION
// ============================================================================

/**
 * NOTE: The following tests require authenticated sessions and are documented
 * here as integration test specifications. They should be run with proper
 * test fixtures that provide valid member sessions.
 *
 * When authenticated, the public profile API should:
 *
 * 1. Return ONLY these fields:
 *    - id: Member's unique ID
 *    - firstName: First name
 *    - lastName: Last name
 *    - memberSince: Year only (e.g., "2023")
 *    - membershipStatus: { label: string }
 *    - membershipTier: { name: string } | null
 *    - committees: Array<{ name: string, role: string }>
 *
 * 2. REDACT these fields (must NOT appear in response):
 *    - email: Private contact info
 *    - phone: Private contact info
 *    - joinedAt: Exact date (only year exposed via memberSince)
 *    - waMembershipLevelRaw: Internal migration data
 *    - createdAt/updatedAt: Internal timestamps
 *    - auditLogs: Admin only
 *    - payments: Admin only
 *    - internalNotes: Admin only
 *    - any internal IDs (membershipStatusId, membershipTierId, etc.)
 *
 * 3. Only show active members:
 *    - Return 404 for inactive/lapsed members
 *    - Do not reveal member existence in error messages
 *
 * 4. Only show current committee assignments:
 *    - Filter by endDate = null (active assignments only)
 *    - Do not show historical committee roles
 */
