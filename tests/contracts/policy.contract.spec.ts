/**
 * Policy Access Layer Contract Tests
 *
 * Charter Principles:
 * - P3: State machines over ad-hoc booleans (policies are typed, not magic strings)
 * - P4: No hidden rules (defaults are explicit and documented)
 * - P8: Schema and APIs are stable contracts (policy keys are typed)
 *
 * Tests the policy access layer contracts:
 * 1. Unknown keys throw InvalidPolicyKeyError
 * 2. Defaults resolve to documented SBNC values
 * 3. orgId is required (throws MissingOrgIdError when missing)
 * 4. Type safety for policy values
 *
 * These tests are deterministic and test pure functions.
 *
 * Related: Issue #263 (Policy Configuration Layer)
 * See: docs/ARCH/PLATFORM_VS_POLICY.md
 */

import { describe, it, expect } from "vitest";
import {
  getPolicy,
  getPolicies,
  getAllPolicies,
  getPolicyDefault,
  isValidPolicyKey,
  InvalidPolicyKeyError,
  MissingOrgIdError,
  POLICY_DEFAULTS,
} from "../../src/lib/policy";

// ============================================================================
// A) UNKNOWN KEYS THROW
// ============================================================================

describe("Policy Contract: Invalid Keys", () => {
  /**
   * Contract: Unknown policy keys MUST throw InvalidPolicyKeyError
   *
   * This ensures callers can't pass arbitrary strings as policy keys.
   * TypeScript catches this at compile time, but runtime validation
   * protects against dynamic key construction.
   */
  describe("getPolicy throws for unknown keys", () => {
    it("throws InvalidPolicyKeyError for completely unknown key", () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        getPolicy("unknown.key", { orgId: "org_123" });
      }).toThrow(InvalidPolicyKeyError);
    });

    it("throws InvalidPolicyKeyError for typo in valid key", () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        getPolicy("membership.newbieDays_typo", { orgId: "org_123" });
      }).toThrow(InvalidPolicyKeyError);
    });

    it("throws InvalidPolicyKeyError for empty string", () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        getPolicy("", { orgId: "org_123" });
      }).toThrow(InvalidPolicyKeyError);
    });

    it("error message includes the invalid key", () => {
      try {
        // @ts-expect-error - Testing runtime validation
        getPolicy("bad.key", { orgId: "org_123" });
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidPolicyKeyError);
        expect((e as Error).message).toContain("bad.key");
      }
    });

    it("error message lists valid keys", () => {
      try {
        // @ts-expect-error - Testing runtime validation
        getPolicy("bad.key", { orgId: "org_123" });
        expect.fail("Should have thrown");
      } catch (e) {
        expect((e as Error).message).toContain("membership.newbieDays");
      }
    });
  });

  describe("getPolicyDefault throws for unknown keys", () => {
    it("throws InvalidPolicyKeyError for unknown key", () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        getPolicyDefault("unknown.key");
      }).toThrow(InvalidPolicyKeyError);
    });
  });

  describe("isValidPolicyKey validates keys", () => {
    it("returns true for valid keys", () => {
      expect(isValidPolicyKey("membership.newbieDays")).toBe(true);
      expect(isValidPolicyKey("scheduling.timezone")).toBe(true);
      expect(isValidPolicyKey("governance.quorumPercentage")).toBe(true);
    });

    it("returns false for invalid keys", () => {
      expect(isValidPolicyKey("unknown.key")).toBe(false);
      expect(isValidPolicyKey("")).toBe(false);
      expect(isValidPolicyKey("membership")).toBe(false);
    });
  });
});

// ============================================================================
// B) DEFAULTS RESOLVE CORRECTLY
// ============================================================================

describe("Policy Contract: Default Values", () => {
  /**
   * Contract: Defaults MUST match SBNC configuration values
   *
   * These are the documented defaults from PLATFORM_VS_POLICY.md.
   * Changing these values requires updating both code and docs.
   */
  const TEST_ORG = { orgId: "org_test" };

  describe("Membership defaults (SBNC values)", () => {
    it("membership.newbieDays defaults to 90", () => {
      expect(getPolicy("membership.newbieDays", TEST_ORG)).toBe(90);
    });

    it("membership.extendedDays defaults to 730 (2 years)", () => {
      expect(getPolicy("membership.extendedDays", TEST_ORG)).toBe(730);
    });

    it("membership.gracePeriodDays defaults to 30", () => {
      expect(getPolicy("membership.gracePeriodDays", TEST_ORG)).toBe(30);
    });

    it("membership.renewalReminderDays defaults to 30", () => {
      expect(getPolicy("membership.renewalReminderDays", TEST_ORG)).toBe(30);
    });
  });

  describe("Scheduling defaults (SBNC values)", () => {
    it("scheduling.timezone defaults to America/Los_Angeles", () => {
      expect(getPolicy("scheduling.timezone", TEST_ORG)).toBe("America/Los_Angeles");
    });

    it("scheduling.registrationOpenDay defaults to 2 (Tuesday)", () => {
      expect(getPolicy("scheduling.registrationOpenDay", TEST_ORG)).toBe(2);
    });

    it("scheduling.registrationOpenHour defaults to 8 (8 AM)", () => {
      expect(getPolicy("scheduling.registrationOpenHour", TEST_ORG)).toBe(8);
    });

    it("scheduling.announcementDay defaults to 0 (Sunday)", () => {
      expect(getPolicy("scheduling.announcementDay", TEST_ORG)).toBe(0);
    });
  });

  describe("Governance defaults", () => {
    it("governance.boardEligibilityDays defaults to 730 (2 years)", () => {
      expect(getPolicy("governance.boardEligibilityDays", TEST_ORG)).toBe(730);
    });

    it("governance.quorumPercentage defaults to 50", () => {
      expect(getPolicy("governance.quorumPercentage", TEST_ORG)).toBe(50);
    });
  });

  describe("Display defaults (neutral)", () => {
    it("display.organizationName defaults to Organization", () => {
      expect(getPolicy("display.organizationName", TEST_ORG)).toBe("Organization");
    });

    it("display.memberTermSingular defaults to member", () => {
      expect(getPolicy("display.memberTermSingular", TEST_ORG)).toBe("member");
    });

    it("display.memberTermPlural defaults to members", () => {
      expect(getPolicy("display.memberTermPlural", TEST_ORG)).toBe("members");
    });
  });

  describe("getPolicyDefault returns defaults without orgId", () => {
    it("returns default value for valid key", () => {
      expect(getPolicyDefault("membership.newbieDays")).toBe(90);
      expect(getPolicyDefault("scheduling.timezone")).toBe("America/Los_Angeles");
    });
  });

  describe("POLICY_DEFAULTS export contains all keys", () => {
    const expectedKeys = [
      "membership.newbieDays",
      "membership.extendedDays",
      "membership.gracePeriodDays",
      "membership.renewalReminderDays",
      "scheduling.timezone",
      "scheduling.registrationOpenDay",
      "scheduling.registrationOpenHour",
      "scheduling.eventArchiveDays",
      "scheduling.announcementDay",
      "scheduling.announcementHour",
      "governance.minutesReviewDays",
      "governance.boardEligibilityDays",
      "governance.quorumPercentage",
      "kpi.membershipWarningThreshold",
      "kpi.membershipDangerThreshold",
      "kpi.eventAttendanceWarningPercent",
      "kpi.eventAttendanceDangerPercent",
      "display.organizationName",
      "display.memberTermSingular",
      "display.memberTermPlural",
    ];

    it("has all expected policy keys", () => {
      for (const key of expectedKeys) {
        expect(POLICY_DEFAULTS).toHaveProperty(key);
      }
    });

    it("has exactly the expected number of keys", () => {
      expect(Object.keys(POLICY_DEFAULTS)).toHaveLength(expectedKeys.length);
    });
  });
});

// ============================================================================
// C) ORGID IS REQUIRED
// ============================================================================

describe("Policy Contract: orgId Required", () => {
  /**
   * Contract: orgId MUST be provided to getPolicy/getPolicies/getAllPolicies
   *
   * Even though we currently ignore orgId (returning defaults), the API
   * requires it for forward compatibility with multi-tenant lookup.
   */
  describe("getPolicy requires orgId", () => {
    it("throws MissingOrgIdError when orgId is undefined", () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        getPolicy("membership.newbieDays", {});
      }).toThrow(MissingOrgIdError);
    });

    it("throws MissingOrgIdError when options is undefined", () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        getPolicy("membership.newbieDays", undefined);
      }).toThrow(MissingOrgIdError);
    });

    it("throws MissingOrgIdError when orgId is empty string", () => {
      expect(() => {
        getPolicy("membership.newbieDays", { orgId: "" });
      }).toThrow(MissingOrgIdError);
    });

    it("succeeds when orgId is provided", () => {
      expect(() => {
        getPolicy("membership.newbieDays", { orgId: "org_123" });
      }).not.toThrow();
    });
  });

  describe("getPolicies requires orgId", () => {
    it("throws MissingOrgIdError when orgId is missing", () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        getPolicies(["membership.newbieDays"], {});
      }).toThrow(MissingOrgIdError);
    });
  });

  describe("getAllPolicies requires orgId", () => {
    it("throws MissingOrgIdError when orgId is missing", () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        getAllPolicies({});
      }).toThrow(MissingOrgIdError);
    });

    it("returns all policies when orgId is provided", () => {
      const policies = getAllPolicies({ orgId: "org_123" });
      expect(policies["membership.newbieDays"]).toBe(90);
      expect(policies["scheduling.timezone"]).toBe("America/Los_Angeles");
    });
  });
});

// ============================================================================
// D) BATCH OPERATIONS
// ============================================================================

describe("Policy Contract: Batch Operations", () => {
  const TEST_ORG = { orgId: "org_test" };

  describe("getPolicies returns multiple values", () => {
    it("returns correct values for multiple keys", () => {
      const result = getPolicies(
        ["membership.newbieDays", "membership.extendedDays"],
        TEST_ORG
      );

      expect(result["membership.newbieDays"]).toBe(90);
      expect(result["membership.extendedDays"]).toBe(730);
    });

    it("returns empty object for empty keys array", () => {
      const result = getPolicies([], TEST_ORG);
      expect(result).toEqual({});
    });

    it("throws for invalid key in batch", () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        getPolicies(["membership.newbieDays", "invalid.key"], TEST_ORG);
      }).toThrow(InvalidPolicyKeyError);
    });
  });

  describe("getAllPolicies returns complete map", () => {
    it("returns all policy values", () => {
      const result = getAllPolicies(TEST_ORG);

      // Spot check various categories
      expect(result["membership.newbieDays"]).toBe(90);
      expect(result["scheduling.timezone"]).toBe("America/Los_Angeles");
      expect(result["governance.quorumPercentage"]).toBe(50);
      expect(result["display.organizationName"]).toBe("Organization");
    });
  });
});

// ============================================================================
// E) TYPE SAFETY (COMPILE-TIME CONTRACTS)
// ============================================================================

describe("Policy Contract: Type Safety", () => {
  /**
   * These tests verify that the type system correctly constrains values.
   * The actual type checking happens at compile time, but we can verify
   * the runtime behavior matches expectations.
   */
  const TEST_ORG = { orgId: "org_test" };

  describe("Number policies return numbers", () => {
    it("membership.newbieDays is a number", () => {
      const value = getPolicy("membership.newbieDays", TEST_ORG);
      expect(typeof value).toBe("number");
    });

    it("governance.quorumPercentage is a number", () => {
      const value = getPolicy("governance.quorumPercentage", TEST_ORG);
      expect(typeof value).toBe("number");
    });
  });

  describe("String policies return strings", () => {
    it("scheduling.timezone is a string", () => {
      const value = getPolicy("scheduling.timezone", TEST_ORG);
      expect(typeof value).toBe("string");
    });

    it("display.organizationName is a string", () => {
      const value = getPolicy("display.organizationName", TEST_ORG);
      expect(typeof value).toBe("string");
    });
  });
});
