/**
 * Policy Capture Unit Tests
 *
 * Tests for policy capture, validation, and bundle generation.
 *
 * Related: Issue #275 (Policy Capture), #202 (WA Migration)
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  generatePolicyTemplate,
  capturePolicies,
  validatePolicies,
  validatePolicyBundle,
  extractPolicyValues,
  mergeWithDefaults,
  generatePolicyMarkdown,
  POLICY_DEFINITIONS,
  type CapturedPolicy,
  type PolicyBundle,
} from "../../../scripts/migration/lib/policy-capture";
import type { PolicyKey } from "../../../src/lib/policy/types";

// =============================================================================
// Test Fixtures
// =============================================================================

function createValidBundle(): PolicyBundle {
  return {
    version: "1.0",
    generatedAt: "2025-12-24T12:00:00.000Z",
    organizationName: "Test Organization",
    policies: [
      {
        key: "scheduling.timezone",
        value: "America/Los_Angeles",
        source: "manual",
        description: "Organization timezone",
        required: true,
      },
      {
        key: "display.organizationName",
        value: "Test Organization",
        source: "manual",
        description: "Organization display name",
        required: true,
      },
    ],
    validation: { valid: true, errors: [], warnings: [] },
    metadata: { captureMode: "auto", templateSections: [] },
  };
}

function createPolicyWithValue<K extends PolicyKey>(
  key: K,
  value: unknown,
  source: "manual" | "template" | "default" | "wa_api" = "manual"
): CapturedPolicy<K> {
  return {
    key,
    value: value as CapturedPolicy<K>["value"],
    source,
    description: POLICY_DEFINITIONS[key].description,
    required: POLICY_DEFINITIONS[key].required,
  };
}

// =============================================================================
// Template Generation Tests
// =============================================================================

describe("Policy Template Generation", () => {
  it("generates template with all policy keys", () => {
    const template = generatePolicyTemplate();
    const keys = template.policies.map((p) => p.key);

    // Should include all defined policies
    for (const key of Object.keys(POLICY_DEFINITIONS)) {
      expect(keys).toContain(key);
    }
  });

  it("generates template with null values and template source", () => {
    const template = generatePolicyTemplate();

    for (const policy of template.policies) {
      expect(policy.value).toBeNull();
      expect(policy.source).toBe("template");
    }
  });

  it("marks required fields correctly", () => {
    const template = generatePolicyTemplate();

    const timezone = template.policies.find(
      (p) => p.key === "scheduling.timezone"
    );
    const orgName = template.policies.find(
      (p) => p.key === "display.organizationName"
    );
    const newbieDays = template.policies.find(
      (p) => p.key === "membership.newbieDays"
    );

    expect(timezone?.required).toBe(true);
    expect(orgName?.required).toBe(true);
    expect(newbieDays?.required).toBe(false);
  });

  it("uses provided organization name", () => {
    const template = generatePolicyTemplate("My Club");
    expect(template.organizationName).toBe("My Club");
  });

  it("template is invalid by default", () => {
    const template = generatePolicyTemplate();
    expect(template.validation.valid).toBe(false);
    expect(template.validation.errors).toContain(
      "Template requires manual completion"
    );
  });

  it("identifies template sections needing attention", () => {
    const template = generatePolicyTemplate();
    expect(template.metadata.templateSections.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Determinism Tests
// =============================================================================

describe("Policy Bundle Determinism", () => {
  it("generates identical bundles for same input", () => {
    const bundle1 = generatePolicyTemplate("Test Org");
    const bundle2 = generatePolicyTemplate("Test Org");

    // Remove generatedAt for comparison (timestamps differ)
    const normalize = (b: PolicyBundle) => ({
      ...b,
      generatedAt: "NORMALIZED",
    });

    expect(normalize(bundle1)).toEqual(normalize(bundle2));
  });

  it("policies are sorted by category then key", () => {
    const template = generatePolicyTemplate();
    const keys = template.policies.map((p) => p.key);

    // Verify sorting: display < governance < kpi < membership < scheduling < tiers
    const displayIdx = keys.indexOf("display.organizationName");
    const governanceIdx = keys.indexOf("governance.quorumPercentage");
    const schedulingIdx = keys.indexOf("scheduling.timezone");

    expect(displayIdx).toBeLessThan(governanceIdx);
    expect(governanceIdx).toBeLessThan(schedulingIdx);
  });

  it("capture produces deterministic output", () => {
    const bundle1 = capturePolicies({
      waAccountInfo: { name: "Test Org", id: "123" },
      useDefaults: true,
    });
    const bundle2 = capturePolicies({
      waAccountInfo: { name: "Test Org", id: "123" },
      useDefaults: true,
    });

    const normalize = (b: PolicyBundle) => ({
      ...b,
      generatedAt: "NORMALIZED",
    });

    expect(normalize(bundle1)).toEqual(normalize(bundle2));
  });
});

// =============================================================================
// Policy Capture Tests
// =============================================================================

describe("Policy Capture", () => {
  it("captures organization name from WA account info", () => {
    const bundle = capturePolicies({
      waAccountInfo: { name: "WA Org Name", id: "123" },
    });

    expect(bundle.organizationName).toBe("WA Org Name");
  });

  it("uses existing mapping values when provided", () => {
    const bundle = capturePolicies({
      existingMapping: {
        "scheduling.timezone": "America/New_York",
        "display.organizationName": "My Club",
      },
    });

    const timezone = bundle.policies.find(
      (p) => p.key === "scheduling.timezone"
    );
    expect(timezone?.value).toBe("America/New_York");
    expect(timezone?.source).toBe("manual");
  });

  it("uses defaults when --use-defaults is true", () => {
    const bundle = capturePolicies({
      useDefaults: true,
    });

    const newbieDays = bundle.policies.find(
      (p) => p.key === "membership.newbieDays"
    );
    expect(newbieDays?.value).toBe(90);
    expect(newbieDays?.source).toBe("default");
  });

  it("warns about missing required fields", () => {
    const bundle = capturePolicies({});

    expect(bundle.validation.warnings.some((w) => w.includes("timezone"))).toBe(
      true
    );
  });

  it("sets captureMode in metadata", () => {
    const bundle = capturePolicies({});
    expect(bundle.metadata.captureMode).toBe("auto");
  });

  it("includes waAccountId in metadata when provided", () => {
    const bundle = capturePolicies({
      waAccountInfo: { name: "Test", id: "12345" },
    });
    expect(bundle.metadata.waAccountId).toBe("12345");
  });
});

// =============================================================================
// Validation Tests
// =============================================================================

describe("Policy Validation", () => {
  describe("required field validation", () => {
    it("fails when required fields are missing", () => {
      const policies: CapturedPolicy[] = [
        createPolicyWithValue("scheduling.timezone", null, "template"),
        createPolicyWithValue("display.organizationName", null, "template"),
      ];

      const result = validatePolicies(policies);

      expect(result.valid).toBe(false);
      expect(result.missingRequired).toContain("scheduling.timezone");
      expect(result.missingRequired).toContain("display.organizationName");
    });

    it("passes when all required fields are present", () => {
      const policies: CapturedPolicy[] = [
        createPolicyWithValue("scheduling.timezone", "America/Los_Angeles"),
        createPolicyWithValue("display.organizationName", "Test Org"),
      ];

      const result = validatePolicies(policies);

      expect(result.missingRequired).toHaveLength(0);
    });
  });

  describe("timezone validation", () => {
    it("accepts valid IANA timezone", () => {
      const policies = [
        createPolicyWithValue("scheduling.timezone", "America/Los_Angeles"),
      ];
      const result = validatePolicies(policies);
      expect(result.invalidValues).toHaveLength(0);
    });

    it("rejects invalid timezone format", () => {
      const policies = [createPolicyWithValue("scheduling.timezone", "EST")];
      const result = validatePolicies(policies);
      expect(
        result.invalidValues.some((v) => v.key === "scheduling.timezone")
      ).toBe(true);
    });
  });

  describe("day of week validation", () => {
    it("accepts valid day values (0-6)", () => {
      const policies = [
        createPolicyWithValue("scheduling.registrationOpenDay", 2),
        createPolicyWithValue("scheduling.announcementDay", 0),
      ];
      const result = validatePolicies(policies);
      expect(result.invalidValues).toHaveLength(0);
    });

    it("rejects invalid day values", () => {
      const policies = [
        createPolicyWithValue("scheduling.registrationOpenDay", 7),
      ];
      const result = validatePolicies(policies);
      expect(
        result.invalidValues.some(
          (v) => v.key === "scheduling.registrationOpenDay"
        )
      ).toBe(true);
    });
  });

  describe("hour validation", () => {
    it("accepts valid hour values (0-23)", () => {
      const policies = [
        createPolicyWithValue("scheduling.registrationOpenHour", 8),
        createPolicyWithValue("scheduling.announcementHour", 23),
      ];
      const result = validatePolicies(policies);
      expect(result.invalidValues).toHaveLength(0);
    });

    it("rejects invalid hour values", () => {
      const policies = [
        createPolicyWithValue("scheduling.registrationOpenHour", 24),
      ];
      const result = validatePolicies(policies);
      expect(
        result.invalidValues.some(
          (v) => v.key === "scheduling.registrationOpenHour"
        )
      ).toBe(true);
    });
  });

  describe("percentage validation", () => {
    it("accepts valid percentages (0-100)", () => {
      const policies = [
        createPolicyWithValue("governance.quorumPercentage", 50),
      ];
      const result = validatePolicies(policies);
      expect(result.invalidValues).toHaveLength(0);
    });

    it("rejects invalid percentages", () => {
      const policies = [
        createPolicyWithValue("governance.quorumPercentage", 150),
      ];
      const result = validatePolicies(policies);
      expect(
        result.invalidValues.some((v) => v.key === "governance.quorumPercentage")
      ).toBe(true);
    });
  });

  describe("tier mapping validation", () => {
    it("accepts valid tier mapping object", () => {
      const policies = [
        createPolicyWithValue("membership.tiers.waMapping", {
          Newcomer: "NEWCOMER",
          Alumni: "ALUMNI",
        }),
      ];
      const result = validatePolicies(policies);
      expect(result.invalidValues).toHaveLength(0);
    });

    it("rejects non-object tier mapping", () => {
      const policies = [
        createPolicyWithValue("membership.tiers.waMapping", "not an object"),
      ];
      const result = validatePolicies(policies);
      expect(
        result.invalidValues.some((v) => v.key === "membership.tiers.waMapping")
      ).toBe(true);
    });
  });

  describe("bundle validation", () => {
    it("validates complete bundle", () => {
      const bundle = createValidBundle();
      const result = validatePolicyBundle(bundle);
      expect(result.valid).toBe(true);
    });
  });
});

// =============================================================================
// Value Extraction Tests
// =============================================================================

describe("Policy Value Extraction", () => {
  it("extracts non-null values from bundle", () => {
    const bundle = createValidBundle();
    const values = extractPolicyValues(bundle);

    expect(values["scheduling.timezone"]).toBe("America/Los_Angeles");
    expect(values["display.organizationName"]).toBe("Test Organization");
  });

  it("skips null values", () => {
    const bundle: PolicyBundle = {
      ...createValidBundle(),
      policies: [
        createPolicyWithValue("scheduling.timezone", "America/Los_Angeles"),
        createPolicyWithValue("membership.newbieDays", null, "template"),
      ],
    };

    const values = extractPolicyValues(bundle);
    expect("membership.newbieDays" in values).toBe(false);
  });
});

// =============================================================================
// Merge with Defaults Tests
// =============================================================================

describe("Merge with Defaults", () => {
  it("merges partial values with defaults", () => {
    const partial = {
      "scheduling.timezone": "America/New_York" as const,
      "display.organizationName": "My Club",
    };

    const merged = mergeWithDefaults(partial);

    // Overridden values
    expect(merged["scheduling.timezone"]).toBe("America/New_York");
    expect(merged["display.organizationName"]).toBe("My Club");

    // Default values
    expect(merged["membership.newbieDays"]).toBe(90);
    expect(merged["governance.quorumPercentage"]).toBe(50);
  });

  it("returns complete PolicyValueMap", () => {
    const partial = {};
    const merged = mergeWithDefaults(partial);

    // Should have all keys from POLICY_DEFINITIONS
    for (const key of Object.keys(POLICY_DEFINITIONS)) {
      expect(key in merged).toBe(true);
    }
  });
});

// =============================================================================
// Markdown Generation Tests
// =============================================================================

describe("Markdown Generation", () => {
  it("generates markdown with organization name", () => {
    const bundle = createValidBundle();
    const md = generatePolicyMarkdown(bundle);

    expect(md).toContain("Test Organization");
  });

  it("includes validation status", () => {
    const bundle = createValidBundle();
    const md = generatePolicyMarkdown(bundle);

    expect(md).toContain("Validation Status");
    expect(md).toContain("VALID");
  });

  it("shows errors for invalid bundle", () => {
    const bundle: PolicyBundle = {
      ...createValidBundle(),
      validation: {
        valid: false,
        errors: ["Missing required policy: scheduling.timezone"],
        warnings: [],
      },
    };

    const md = generatePolicyMarkdown(bundle);

    expect(md).toContain("INVALID");
    expect(md).toContain("Missing required policy");
  });

  it("includes tier mapping note", () => {
    const bundle = createValidBundle();
    const md = generatePolicyMarkdown(bundle);

    expect(md).toContain("WA Membership Level Mapping");
    expect(md).toContain("API may not be available");
  });

  it("generates table for policies by category", () => {
    const bundle = createValidBundle();
    const md = generatePolicyMarkdown(bundle);

    expect(md).toContain("Policies by Category");
    expect(md).toContain("| Policy |");
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe("Edge Cases", () => {
  it("handles empty existing mapping", () => {
    const bundle = capturePolicies({ existingMapping: {} });
    expect(bundle.policies.length).toBeGreaterThan(0);
  });

  it("handles undefined WA account info", () => {
    const bundle = capturePolicies({ waAccountInfo: undefined });
    expect(bundle.organizationName).toBe("UNKNOWN");
  });

  it("prefers existing mapping over WA capture", () => {
    const bundle = capturePolicies({
      waAccountInfo: { name: "WA Name" },
      existingMapping: { "display.organizationName": "Manual Name" },
    });

    const orgName = bundle.policies.find(
      (p) => p.key === "display.organizationName"
    );
    expect(orgName?.value).toBe("Manual Name");
    expect(orgName?.source).toBe("manual");
  });
});
