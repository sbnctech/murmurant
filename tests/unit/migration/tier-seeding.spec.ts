/**
 * Membership Tier Seeding Unit Tests
 *
 * Tests for tier seeding script and tier mapper functionality.
 *
 * Related: Issue #276 (Membership Tier Seeding)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  SBNC_TIER_DEFINITIONS,
  getTierDefinitions,
  isTierSeedingEnabled,
} from "../../../scripts/migration/seed-membership-tiers";
import {
  isTierMappingEnabled,
  resolveTierId,
  validateTierMapper,
  type TierMapperResult,
} from "../../../scripts/migration/lib/tier-mapper";

// Mock the flags module
vi.mock("../../../src/lib/flags", () => ({
  isEnabled: vi.fn(),
}));

// Mock the policy module
vi.mock("../../../src/lib/policy/getPolicy", () => ({
  getPolicy: vi.fn(),
}));

import { isEnabled } from "../../../src/lib/flags";
import { getPolicy } from "../../../src/lib/policy/getPolicy";

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockTierMapper(overrides: Partial<TierMapperResult> = {}): TierMapperResult {
  return {
    enabled: true,
    mappings: new Map([
      ["Newcomer", "tier-newcomer-id"],
      ["1st Year", "tier-first-year-id"],
      ["2nd Year", "tier-second-year-id"],
      ["Alumni", "tier-alumni-id"],
    ]),
    tierCodes: new Map([
      ["NEWCOMER", "tier-newcomer-id"],
      ["FIRST_YEAR", "tier-first-year-id"],
      ["SECOND_YEAR", "tier-second-year-id"],
      ["ALUMNI", "tier-alumni-id"],
      ["GENERAL", "tier-general-id"],
    ]),
    defaultTierId: "tier-general-id",
    missing: [],
    errors: [],
    ...overrides,
  };
}

// =============================================================================
// Feature Flag Tests
// =============================================================================

describe("Feature Flag Gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isTierSeedingEnabled", () => {
    it("returns true when flag is enabled", () => {
      vi.mocked(isEnabled).mockReturnValue(true);
      expect(isTierSeedingEnabled()).toBe(true);
      expect(isEnabled).toHaveBeenCalledWith("membership_tiers_enabled");
    });

    it("returns false when flag is disabled", () => {
      vi.mocked(isEnabled).mockReturnValue(false);
      expect(isTierSeedingEnabled()).toBe(false);
    });
  });

  describe("isTierMappingEnabled", () => {
    it("returns true when flag is enabled", () => {
      vi.mocked(isEnabled).mockReturnValue(true);
      expect(isTierMappingEnabled()).toBe(true);
    });

    it("returns false when flag is disabled", () => {
      vi.mocked(isEnabled).mockReturnValue(false);
      expect(isTierMappingEnabled()).toBe(false);
    });
  });
});

// =============================================================================
// Tier Definitions Tests
// =============================================================================

describe("Tier Definitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getPolicy).mockImplementation((key: string): any => {
      if (key === "membership.tiers.waMapping") {
        return {
          Newcomer: "NEWCOMER",
          "1st Year": "FIRST_YEAR",
          "2nd Year": "SECOND_YEAR",
          Alumni: "ALUMNI",
        };
      }
      if (key === "membership.tiers.defaultCode") {
        return "GENERAL";
      }
      return "GENERAL";
    });
  });

  describe("SBNC_TIER_DEFINITIONS", () => {
    it("contains expected SBNC tiers", () => {
      const codes = SBNC_TIER_DEFINITIONS.map((t) => t.code);
      expect(codes).toContain("NEWCOMER");
      expect(codes).toContain("FIRST_YEAR");
      expect(codes).toContain("SECOND_YEAR");
      expect(codes).toContain("THIRD_YEAR");
      expect(codes).toContain("ALUMNI");
      expect(codes).toContain("GENERAL");
    });

    it("has unique codes", () => {
      const codes = SBNC_TIER_DEFINITIONS.map((t) => t.code);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });

    it("is sorted by sortOrder", () => {
      const orders = SBNC_TIER_DEFINITIONS.map((t) => t.sortOrder);
      const sorted = [...orders].sort((a, b) => a - b);
      expect(orders).toEqual(sorted);
    });
  });

  describe("getTierDefinitions", () => {
    it("returns definitions for all mapped tier codes", () => {
      const definitions = getTierDefinitions();
      const codes = definitions.map((d) => d.code);

      // Should include all codes from waMapping
      expect(codes).toContain("NEWCOMER");
      expect(codes).toContain("FIRST_YEAR");
      expect(codes).toContain("SECOND_YEAR");
      expect(codes).toContain("ALUMNI");
      // Should include default code
      expect(codes).toContain("GENERAL");
    });

    it("includes default tier code", () => {
      const definitions = getTierDefinitions();
      const codes = definitions.map((d) => d.code);
      expect(codes).toContain("GENERAL");
    });
  });
});

// =============================================================================
// Tier Resolution Tests
// =============================================================================

describe("Tier Resolution", () => {
  describe("resolveTierId", () => {
    it("resolves known WA level to tier ID", () => {
      const mapper = createMockTierMapper();
      const result = resolveTierId("Newcomer", mapper);

      expect(result.tierId).toBe("tier-newcomer-id");
      expect(result.error).toBeUndefined();
    });

    it("falls back to default tier for unknown level", () => {
      const mapper = createMockTierMapper();
      const result = resolveTierId("Unknown Level", mapper);

      expect(result.tierId).toBe("tier-general-id");
      expect(result.error).toBeUndefined();
    });

    it("returns error when no default tier and level unknown", () => {
      const mapper = createMockTierMapper({ defaultTierId: null });
      const result = resolveTierId("Unknown Level", mapper);

      expect(result.tierId).toBeNull();
      expect(result.error).toContain("No tier mapping");
    });

    it("returns null when tiers are disabled", () => {
      const mapper = createMockTierMapper({ enabled: false });
      const result = resolveTierId("Newcomer", mapper);

      expect(result.tierId).toBeNull();
      expect(result.error).toBeUndefined();
    });
  });
});

// =============================================================================
// Tier Mapper Validation Tests
// =============================================================================

describe("Tier Mapper Validation", () => {
  describe("validateTierMapper", () => {
    it("returns valid for complete mapper", () => {
      const mapper = createMockTierMapper();
      const result = validateTierMapper(mapper);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns invalid when missing tiers", () => {
      const mapper = createMockTierMapper({
        missing: ['Tier code "UNKNOWN" not found in database'],
      });
      const result = validateTierMapper(mapper);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("returns invalid when default tier is missing", () => {
      const mapper = createMockTierMapper({ defaultTierId: null });
      const result = validateTierMapper(mapper);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Default tier is not configured or not found in database"
      );
    });

    it("collects all errors from mapper", () => {
      const mapper = createMockTierMapper({
        errors: ["DB connection failed"],
        missing: ["Missing tier A", "Missing tier B"],
      });
      const result = validateTierMapper(mapper);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("DB connection failed");
      expect(result.errors).toContain("Missing tier A");
      expect(result.errors).toContain("Missing tier B");
    });
  });
});

// =============================================================================
// Idempotency Tests
// =============================================================================

describe("Seed Idempotency", () => {
  it("tier definitions are deterministic", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getPolicy).mockImplementation((key: string): any => {
      if (key === "membership.tiers.waMapping") {
        return { Newcomer: "NEWCOMER", Alumni: "ALUMNI" };
      }
      if (key === "membership.tiers.defaultCode") {
        return "GENERAL";
      }
      return "GENERAL";
    });

    const defs1 = getTierDefinitions();
    const defs2 = getTierDefinitions();

    expect(defs1).toEqual(defs2);
  });

  it("tier resolution is deterministic", () => {
    const mapper = createMockTierMapper();

    const result1 = resolveTierId("Newcomer", mapper);
    const result2 = resolveTierId("Newcomer", mapper);

    expect(result1).toEqual(result2);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe("Edge Cases", () => {
  describe("partial tier existence", () => {
    it("handles mapper with some missing tiers", () => {
      const mapper = createMockTierMapper({
        mappings: new Map([
          ["Newcomer", "tier-newcomer-id"],
          // Alumni mapping exists but points to missing tier
        ]),
        missing: ['Tier code "ALUMNI" not found'],
      });

      // Newcomer should still resolve
      expect(resolveTierId("Newcomer", mapper).tierId).toBe("tier-newcomer-id");

      // Validation should fail
      const validation = validateTierMapper(mapper);
      expect(validation.valid).toBe(false);
    });
  });

  describe("empty mappings", () => {
    it("handles empty mapping set", () => {
      const mapper = createMockTierMapper({
        mappings: new Map(),
        tierCodes: new Map(),
        defaultTierId: null,
      });

      const result = resolveTierId("Newcomer", mapper);
      expect(result.tierId).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe("case sensitivity", () => {
    it("WA level matching is case-sensitive", () => {
      const mapper = createMockTierMapper();

      // Exact match works
      expect(resolveTierId("Newcomer", mapper).tierId).toBe("tier-newcomer-id");

      // Wrong case falls back to default
      expect(resolveTierId("newcomer", mapper).tierId).toBe("tier-general-id");
      expect(resolveTierId("NEWCOMER", mapper).tierId).toBe("tier-general-id");
    });
  });
});
