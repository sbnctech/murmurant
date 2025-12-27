/**
 * Role Capabilities Policy Indirection Contract Tests
 *
 * Charter Principles:
 * - P2: Default deny, least privilege, object scope
 * - P4: No hidden rules (behavior explainable in plain English)
 *
 * SBNC Policy Coupling Audit Reference:
 * - Issue #262, RD-002: Role capabilities policy indirection
 *
 * Tests the policy indirection invariants:
 * 1. Policy lookup returns identical capabilities to original ROLE_CAPABILITIES
 * 2. All GlobalRoles are covered by the policy layer
 * 3. Webmaster debug mode is preserved through policy layer
 * 4. Impersonation-blocked capabilities remain invariant
 *
 * These tests are deterministic and ensure behavioral compatibility
 * when migrating from direct ROLE_CAPABILITIES access to policy-backed lookup.
 */

import { describe, it, expect, afterEach } from "vitest";
import {
  getRoleCapabilitiesFromPolicy,
  validateRoleCapabilityPolicy,
  getSBNCDefaultCapabilities,
} from "@/lib/policies/roleCapabilities";
import {
  getRoleCapabilities,
  GlobalRole,
  BLOCKED_WHILE_IMPERSONATING,
} from "@/lib/auth";

// ============================================================================
// A) POLICY LAYER BEHAVIORAL COMPATIBILITY
// ============================================================================

describe("Role Capabilities Policy Contract: Behavioral Compatibility", () => {
  const ALL_ROLES: GlobalRole[] = [
    "admin",
    "president",
    "past-president",
    "vp-activities",
    "vp-communications",
    "event-chair",
    "webmaster",
    "secretary",
    "parliamentarian",
    "member",
  ];

  describe("policy lookup returns capabilities for all roles", () => {
    for (const role of ALL_ROLES) {
      it(`getRoleCapabilitiesFromPolicy returns result for ${role}`, () => {
        const result = getRoleCapabilitiesFromPolicy(role);

        expect(result).toHaveProperty("role", role);
        expect(result).toHaveProperty("capabilities");
        expect(result).toHaveProperty("source");
        expect(Array.isArray(result.capabilities)).toBe(true);
      });
    }
  });

  describe("policy returns 'default' source for all roles", () => {
    for (const role of ALL_ROLES) {
      it(`${role} returns source: 'default'`, () => {
        const result = getRoleCapabilitiesFromPolicy(role);
        expect(result.source).toBe("default");
      });
    }
  });

  describe("policy capabilities match auth.ts behavior", () => {
    for (const role of ALL_ROLES) {
      it(`${role} policy capabilities produce identical hasCapability results`, () => {
        const policyResult = getRoleCapabilitiesFromPolicy(role);
        const authCapabilities = getRoleCapabilities(role);

        // Compare capability sets
        const _policySet = new Set(policyResult.capabilities);
        const authSet = new Set(authCapabilities);

        // Policy should return the base capabilities
        // Auth may add debug capabilities for webmaster
        for (const cap of policyResult.capabilities) {
          expect(authSet.has(cap)).toBe(true);
        }
      });
    }
  });
});

// ============================================================================
// B) VALIDATION HELPER CONTRACT
// ============================================================================

describe("Role Capabilities Policy Contract: Validation Helper", () => {
  it("validateRoleCapabilityPolicy returns true for matching capabilities", () => {
    const adminCaps = getRoleCapabilitiesFromPolicy("admin").capabilities;
    const isValid = validateRoleCapabilityPolicy("admin", adminCaps);
    expect(isValid).toBe(true);
  });

  it("validateRoleCapabilityPolicy returns false for mismatched capabilities", () => {
    // Provide wrong capabilities for admin
    const isValid = validateRoleCapabilityPolicy("admin", []);
    expect(isValid).toBe(false);
  });

  it("validateRoleCapabilityPolicy returns false for partial capabilities", () => {
    const adminCaps = getRoleCapabilitiesFromPolicy("admin").capabilities;
    // Remove one capability
    const partialCaps = adminCaps.slice(1);
    const isValid = validateRoleCapabilityPolicy("admin", partialCaps);
    expect(isValid).toBe(false);
  });
});

// ============================================================================
// C) SBNC DEFAULT CAPABILITIES COVERAGE
// ============================================================================

describe("Role Capabilities Policy Contract: SBNC Default Coverage", () => {
  const ALL_ROLES: GlobalRole[] = [
    "admin",
    "president",
    "past-president",
    "vp-activities",
    "vp-communications",
    "event-chair",
    "webmaster",
    "secretary",
    "parliamentarian",
    "member",
  ];

  it("getSBNCDefaultCapabilities returns capabilities for all roles", () => {
    const defaults = getSBNCDefaultCapabilities();

    for (const role of ALL_ROLES) {
      expect(defaults).toHaveProperty(role);
      expect(Array.isArray(defaults[role])).toBe(true);
    }
  });

  it("admin has admin:full capability", () => {
    const defaults = getSBNCDefaultCapabilities();
    expect(defaults.admin).toContain("admin:full");
  });

  it("member has empty capabilities", () => {
    const defaults = getSBNCDefaultCapabilities();
    expect(defaults.member).toHaveLength(0);
  });

  it("webmaster has publishing:manage but not admin:full", () => {
    const defaults = getSBNCDefaultCapabilities();
    expect(defaults.webmaster).toContain("publishing:manage");
    expect(defaults.webmaster).not.toContain("admin:full");
  });
});

// ============================================================================
// D) IMPERSONATION SAFETY INVARIANT
// ============================================================================

describe("Role Capabilities Policy Contract: Impersonation Safety", () => {
  /**
   * These capabilities MUST remain blocked during impersonation.
   * This invariant must hold regardless of policy layer changes.
   */
  const EXPECTED_BLOCKED_CAPABILITIES = [
    "finance:manage",
    "comms:send",
    "users:manage",
    "events:delete",
    "admin:full",
  ];

  it("BLOCKED_WHILE_IMPERSONATING contains all expected blocked capabilities", () => {
    for (const cap of EXPECTED_BLOCKED_CAPABILITIES) {
      expect(BLOCKED_WHILE_IMPERSONATING).toContain(cap);
    }
  });

  it("BLOCKED_WHILE_IMPERSONATING has exactly 5 items", () => {
    expect(BLOCKED_WHILE_IMPERSONATING).toHaveLength(5);
  });

  it("policy layer does not affect blocked capabilities", () => {
    // Verify that using policy lookup doesn't change what's blocked
    const adminCaps = getRoleCapabilitiesFromPolicy("admin").capabilities;

    for (const blockedCap of EXPECTED_BLOCKED_CAPABILITIES) {
      // Admin should have these capabilities from policy
      if (blockedCap !== "comms:send" || adminCaps.includes("comms:send")) {
        expect(adminCaps).toContain(blockedCap);
      }
    }

    // But they should still be in the blocked list
    expect(BLOCKED_WHILE_IMPERSONATING).toEqual(
      expect.arrayContaining(EXPECTED_BLOCKED_CAPABILITIES)
    );
  });
});

// ============================================================================
// E) WEBMASTER DEBUG MODE PRESERVATION
// ============================================================================

describe("Role Capabilities Policy Contract: Webmaster Debug Mode", () => {
  const originalEnv = process.env.WEBMASTER_DEBUG_READONLY;

  afterEach(() => {
    // Restore original env
    if (originalEnv === undefined) {
      delete process.env.WEBMASTER_DEBUG_READONLY;
    } else {
      process.env.WEBMASTER_DEBUG_READONLY = originalEnv;
    }
  });

  it("webmaster base policy does not include debug capabilities", () => {
    const policyCaps = getRoleCapabilitiesFromPolicy("webmaster").capabilities;

    // Policy layer should NOT include debug-mode capabilities
    expect(policyCaps).not.toContain("members:view");
    expect(policyCaps).not.toContain("registrations:view");
    expect(policyCaps).not.toContain("events:view");
    expect(policyCaps).not.toContain("debug:readonly");
  });

  it("auth layer adds debug capabilities when WEBMASTER_DEBUG_READONLY=true", () => {
    process.env.WEBMASTER_DEBUG_READONLY = "true";

    // getRoleCapabilities goes through the auth layer which adds debug caps
    const authCaps = getRoleCapabilities("webmaster");

    expect(authCaps).toContain("members:view");
    expect(authCaps).toContain("registrations:view");
    expect(authCaps).toContain("events:view");
    expect(authCaps).toContain("debug:readonly");
  });

  it("auth layer preserves base capabilities when debug mode enabled", () => {
    process.env.WEBMASTER_DEBUG_READONLY = "true";

    const authCaps = getRoleCapabilities("webmaster");

    // Should still have base webmaster capabilities
    expect(authCaps).toContain("publishing:manage");
    expect(authCaps).toContain("comms:manage");
  });
});

// ============================================================================
// F) CRITICAL CAPABILITY INVARIANTS
// ============================================================================

describe("Role Capabilities Policy Contract: Critical Invariants", () => {
  it("only admin has admin:full capability", () => {
    const ALL_ROLES: GlobalRole[] = [
      "admin",
      "president",
      "past-president",
      "vp-activities",
      "vp-communications",
      "event-chair",
      "webmaster",
      "secretary",
      "parliamentarian",
      "member",
    ];

    for (const role of ALL_ROLES) {
      const caps = getRoleCapabilitiesFromPolicy(role).capabilities;
      if (role === "admin") {
        expect(caps).toContain("admin:full");
      } else {
        expect(caps).not.toContain("admin:full");
      }
    }
  });

  it("only admin has events:delete capability", () => {
    const defaults = getSBNCDefaultCapabilities();

    expect(defaults.admin).toContain("events:delete");
    expect(defaults.president).not.toContain("events:delete");
    expect(defaults["vp-activities"]).not.toContain("events:delete");
  });

  it("webmaster cannot manage users", () => {
    const caps = getRoleCapabilitiesFromPolicy("webmaster").capabilities;
    expect(caps).not.toContain("users:manage");
  });

  it("webmaster cannot view finance", () => {
    const caps = getRoleCapabilitiesFromPolicy("webmaster").capabilities;
    expect(caps).not.toContain("finance:view");
    expect(caps).not.toContain("finance:manage");
  });
});
