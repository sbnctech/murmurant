/**
 * Tenant Isolation Tests
 *
 * Tests that verify member-scoped data isolation guarantees.
 *
 * Charter Principles:
 * - P1: Identity provable (session required)
 * - P2: Default deny, least privilege (non-admin cannot access other members)
 * - P9: Fail closed (missing session = denied)
 *
 * Issue #160
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { describe, it, expect } from "vitest";
import { canAccessMember, hasCapability, type GlobalRole } from "@/lib/auth";
import {
  assertTenantAccess,
  assertTenantIdRequired,
  generateTenantIsolationScenarios,
  runTenantIsolationTests,
  createMockAuthContext,
  TEST_MEMBER_IDS,
} from "../helpers/tenantAssertions";

// ============================================================================
// CORE ISOLATION GUARANTEE: canAccessMember
// ============================================================================

describe("Tenant Isolation: canAccessMember", () => {
  describe("self-access (always allowed)", () => {
    const testRoles: GlobalRole[] = [
      "member",
      "webmaster",
      "event-chair",
      "vp-activities",
      "vp-communications",
      "secretary",
      "parliamentarian",
      "president",
      "past-president",
    ];

    for (const role of testRoles) {
      it(`${role} can access own data`, () => {
        const context = createMockAuthContext("member-123", role);
        expect(canAccessMember(context, "member-123")).toBe(true);
      });
    }
  });

  describe("cross-member access (denied for non-admin)", () => {
    const nonAdminRoles: GlobalRole[] = [
      "member",
      "webmaster",
      "event-chair",
      "vp-activities",
      "vp-communications",
      "secretary",
      "parliamentarian",
      "president",
      "past-president",
    ];

    for (const role of nonAdminRoles) {
      it(`${role} CANNOT access other member data`, () => {
        const context = createMockAuthContext("member-a", role);
        expect(canAccessMember(context, "member-b")).toBe(false);
      });
    }
  });

  describe("admin access (always allowed)", () => {
    it("admin can access any member data", () => {
      const context = createMockAuthContext("admin-123", "admin");
      expect(canAccessMember(context, "any-member-id")).toBe(true);
    });

    it("admin can access own data", () => {
      const context = createMockAuthContext("admin-123", "admin");
      expect(canAccessMember(context, "admin-123")).toBe(true);
    });
  });
});

// ============================================================================
// TENANT ASSERTION HELPER TESTS
// ============================================================================

describe("Tenant Assertion Helpers", () => {
  describe("assertTenantAccess", () => {
    it("correctly identifies allowed self-access", () => {
      const context = createMockAuthContext("member-123");
      // Should not throw
      assertTenantAccess(context, "member-123", "allowed");
    });

    it("correctly identifies forbidden cross-member access", () => {
      const context = createMockAuthContext("member-a");
      // Should not throw
      assertTenantAccess(context, "member-b", "forbidden");
    });

    it("correctly identifies allowed admin access", () => {
      const context = createMockAuthContext("admin-123", "admin");
      // Should not throw
      assertTenantAccess(context, "any-member", "allowed");
    });
  });

  describe("assertTenantIdRequired", () => {
    it("passes when memberId is present in filter", () => {
      const filter = { memberId: "test-id", status: "ACTIVE" };
      // Should not throw
      assertTenantIdRequired(filter, "test-id");
    });

    it("fails when memberId is missing from filter", () => {
      const filter = { status: "ACTIVE" };
      expect(() => assertTenantIdRequired(filter, "test-id")).toThrow();
    });

    it("fails when memberId has wrong value", () => {
      const filter = { memberId: "wrong-id", status: "ACTIVE" };
      expect(() => assertTenantIdRequired(filter, "expected-id")).toThrow();
    });
  });

  describe("generateTenantIsolationScenarios", () => {
    it("generates correct number of scenarios", () => {
      const scenarios = generateTenantIsolationScenarios("self", "other");
      // 3 self-access + 4 cross-member denied + 1 admin allowed = 8
      expect(scenarios.length).toBe(8);
    });

    it("all self-access scenarios are allowed", () => {
      const scenarios = generateTenantIsolationScenarios("self", "other");
      const selfAccessScenarios = scenarios.filter(
        (s) => s.requestingMemberId === s.targetMemberId
      );
      expect(selfAccessScenarios.length).toBeGreaterThan(0);
      for (const s of selfAccessScenarios) {
        expect(s.shouldAccess).toBe(true);
      }
    });

    it("non-admin cross-member scenarios are denied", () => {
      const scenarios = generateTenantIsolationScenarios("self", "other");
      const crossMemberNonAdmin = scenarios.filter(
        (s) =>
          s.requestingMemberId !== s.targetMemberId && s.role !== "admin"
      );
      expect(crossMemberNonAdmin.length).toBeGreaterThan(0);
      for (const s of crossMemberNonAdmin) {
        expect(s.shouldAccess).toBe(false);
      }
    });

    it("admin cross-member scenario is allowed", () => {
      const scenarios = generateTenantIsolationScenarios("self", "other");
      const adminCrossMember = scenarios.find(
        (s) => s.role === "admin" && s.targetMemberId === "other"
      );
      expect(adminCrossMember).toBeDefined();
      expect(adminCrossMember!.shouldAccess).toBe(true);
    });
  });
});

// ============================================================================
// INTEGRATION: runTenantIsolationTests
// ============================================================================

describe("Tenant Isolation: Standard Scenarios", () => {
  runTenantIsolationTests((scenario) => {
    const context = createMockAuthContext(scenario.requestingMemberId, scenario.role);
    return canAccessMember(context, scenario.targetMemberId);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe("Tenant Isolation: Edge Cases", () => {
  it("empty memberId is treated as unique (no accidental cross-access)", () => {
    // Even with empty strings, self vs other should be distinct
    const context = createMockAuthContext("");
    expect(canAccessMember(context, "")).toBe(true); // self
    expect(canAccessMember(context, "any-other")).toBe(false); // other
  });

  it("UUID memberId isolation", () => {
    const context = createMockAuthContext(TEST_MEMBER_IDS.MEMBER_A);
    expect(canAccessMember(context, TEST_MEMBER_IDS.MEMBER_A)).toBe(true);
    expect(canAccessMember(context, TEST_MEMBER_IDS.MEMBER_B)).toBe(false);
  });

  it("admin:full capability is the only bypass", () => {
    // Verify that only admin has admin:full
    expect(hasCapability("admin", "admin:full")).toBe(true);
    expect(hasCapability("president", "admin:full")).toBe(false);
    expect(hasCapability("vp-activities", "admin:full")).toBe(false);
    expect(hasCapability("webmaster", "admin:full")).toBe(false);
    expect(hasCapability("member", "admin:full")).toBe(false);
  });
});
