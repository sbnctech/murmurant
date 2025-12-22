/**
 * Tenant Isolation Assertion Helper
 *
 * Provides reusable test helpers for verifying member-scoped data isolation.
 * In ClubOS, "tenant" isolation means members can only access their own data
 * unless they have admin privileges.
 *
 * Charter Principles:
 * - P1: Identity provable (session required)
 * - P2: Default deny, least privilege (non-admin cannot access other members)
 * - P9: Fail closed (missing session = denied)
 *
 * Issue #160
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { expect, it } from "vitest";
import { canAccessMember, type AuthContext, type GlobalRole } from "@/lib/auth";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result from a member-scoped data fetch.
 * Depending on the access pattern, can be:
 * - 401/403 response (forbidden)
 * - empty result (filtered out)
 * - data (allowed)
 */
export type TenantAccessResult =
  | { type: "forbidden"; status: 401 | 403 }
  | { type: "empty" }
  | { type: "data"; data: unknown };

/**
 * Test scenario for tenant isolation.
 */
export interface TenantIsolationScenario {
  /** Description of the test */
  description: string;
  /** The role of the requesting user */
  role: GlobalRole;
  /** The requesting user's member ID */
  requestingMemberId: string;
  /** The target member ID being accessed */
  targetMemberId: string;
  /** Expected access result */
  shouldAccess: boolean;
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Assert that a tenant mismatch results in forbidden access or empty result.
 *
 * Use this when testing that member A cannot access member B's data.
 *
 * @param context - The authenticated user context
 * @param targetMemberId - The member ID being accessed
 * @param expectation - "forbidden" (403), "empty" (empty array/null), or "allowed"
 *
 * @example
 * ```typescript
 * // In a test:
 * assertTenantAccess(
 *   { memberId: "member-a", email: "a@test.com", globalRole: "member" },
 *   "member-b",
 *   "forbidden"
 * );
 * ```
 */
export function assertTenantAccess(
  context: AuthContext,
  targetMemberId: string,
  expectation: "forbidden" | "empty" | "allowed"
): void {
  const hasAccess = canAccessMember(context, targetMemberId);

  switch (expectation) {
    case "forbidden":
    case "empty":
      expect(hasAccess).toBe(false);
      break;
    case "allowed":
      expect(hasAccess).toBe(true);
      break;
  }
}

/**
 * Assert that tenant ID (memberId) is always required for tenant-scoped fetches.
 *
 * Use this to verify that queries properly filter by memberId.
 *
 * @param queryFilter - The filter object passed to a Prisma query
 * @param expectedMemberId - The memberId that should be in the filter
 *
 * @example
 * ```typescript
 * // Verify that a payment methods query filters by memberId
 * assertTenantIdRequired(
 *   { memberId: session.memberId, status: "ACTIVE" },
 *   "expected-member-id"
 * );
 * ```
 */
export function assertTenantIdRequired(
  queryFilter: Record<string, unknown>,
  expectedMemberId: string
): void {
  expect(queryFilter).toHaveProperty("memberId");
  expect(queryFilter.memberId).toBe(expectedMemberId);
}

/**
 * Assert that unauthenticated access is rejected with 401.
 *
 * @param response - The response from an API call
 */
export function assertUnauthenticatedDenied(response: { status: number }): void {
  expect(response.status).toBe(401);
}

/**
 * Assert that unauthorized access (authenticated but wrong member) is rejected with 403.
 *
 * @param response - The response from an API call
 */
export function assertUnauthorizedDenied(response: { status: number }): void {
  expect(response.status).toBe(403);
}

// ============================================================================
// TEST SCENARIO GENERATORS
// ============================================================================

/**
 * Generate standard tenant isolation test scenarios.
 *
 * Returns a matrix of test cases covering:
 * - Self-access (should always succeed)
 * - Cross-member access for regular member (should fail)
 * - Cross-member access for admin (should succeed)
 *
 * @example
 * ```typescript
 * const scenarios = generateTenantIsolationScenarios("member-123", "member-456");
 * for (const scenario of scenarios) {
 *   it(scenario.description, () => {
 *     // ... test logic
 *   });
 * }
 * ```
 */
export function generateTenantIsolationScenarios(
  selfMemberId: string,
  otherMemberId: string
): TenantIsolationScenario[] {
  return [
    // Self-access scenarios - always allowed for any role
    {
      description: "member can access own data",
      role: "member",
      requestingMemberId: selfMemberId,
      targetMemberId: selfMemberId,
      shouldAccess: true,
    },
    {
      description: "webmaster can access own data",
      role: "webmaster",
      requestingMemberId: selfMemberId,
      targetMemberId: selfMemberId,
      shouldAccess: true,
    },
    {
      description: "event-chair can access own data",
      role: "event-chair",
      requestingMemberId: selfMemberId,
      targetMemberId: selfMemberId,
      shouldAccess: true,
    },

    // Cross-member access - denied for non-admin roles
    {
      description: "member CANNOT access other member data",
      role: "member",
      requestingMemberId: selfMemberId,
      targetMemberId: otherMemberId,
      shouldAccess: false,
    },
    {
      description: "webmaster CANNOT access other member data",
      role: "webmaster",
      requestingMemberId: selfMemberId,
      targetMemberId: otherMemberId,
      shouldAccess: false,
    },
    {
      description: "event-chair CANNOT access other member data",
      role: "event-chair",
      requestingMemberId: selfMemberId,
      targetMemberId: otherMemberId,
      shouldAccess: false,
    },
    {
      description: "vp-activities CANNOT access other member data (without members:view)",
      role: "vp-activities",
      requestingMemberId: selfMemberId,
      targetMemberId: otherMemberId,
      shouldAccess: false,
    },

    // Admin access - always allowed
    {
      description: "admin CAN access any member data",
      role: "admin",
      requestingMemberId: selfMemberId,
      targetMemberId: otherMemberId,
      shouldAccess: true,
    },
  ];
}

/**
 * Run standard tenant isolation tests for a given access function.
 *
 * This is a higher-order helper that runs all standard isolation scenarios
 * against a provided access check function.
 *
 * @param accessCheckFn - Function that returns true if access is allowed
 *
 * @example
 * ```typescript
 * describe("Payment Methods Isolation", () => {
 *   runTenantIsolationTests((scenario) => {
 *     const context = {
 *       memberId: scenario.requestingMemberId,
 *       email: "test@test.com",
 *       globalRole: scenario.role,
 *     };
 *     return canAccessMember(context, scenario.targetMemberId);
 *   });
 * });
 * ```
 */
export function runTenantIsolationTests(
  accessCheckFn: (scenario: TenantIsolationScenario) => boolean
): void {
  const scenarios = generateTenantIsolationScenarios("member-self", "member-other");

  for (const scenario of scenarios) {
    it(scenario.description, () => {
      const hasAccess = accessCheckFn(scenario);
      expect(hasAccess).toBe(scenario.shouldAccess);
    });
  }
}

// ============================================================================
// MOCK HELPERS
// ============================================================================

/**
 * Create a mock authenticated session for testing.
 *
 * @param memberId - The member ID for the session
 * @param role - The global role (default: "member")
 * @returns Mock session object
 */
export function createMockSession(
  memberId: string,
  role: GlobalRole = "member"
): { memberId: string; email: string; globalRole: GlobalRole } {
  return {
    memberId,
    email: `${memberId}@test.com`,
    globalRole: role,
  };
}

/**
 * Create a mock AuthContext for use with auth functions.
 *
 * @param memberId - The member ID
 * @param role - The global role (default: "member")
 * @returns AuthContext object
 */
export function createMockAuthContext(
  memberId: string,
  role: GlobalRole = "member"
): AuthContext {
  return {
    memberId,
    email: `${memberId}@test.com`,
    globalRole: role,
  };
}

/**
 * Standard test member IDs for isolation tests.
 */
export const TEST_MEMBER_IDS = {
  MEMBER_A: "test-member-a-id",
  MEMBER_B: "test-member-b-id",
  ADMIN: "test-admin-id",
} as const;
