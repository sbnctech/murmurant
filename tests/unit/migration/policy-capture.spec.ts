/**
 * Policy Capture Unit Tests
 *
 * Tests for the WA policy capture module including:
 * - Mapping file parsing and validation
 * - Template generation
 * - Report generation
 */

import { describe, it, expect } from "vitest";
import {
  generateMappingTemplate,
  parseMappingFile,
  validateMappingFile,
  generatePolicyCaptureReport,
  renderReportAsMarkdown,
} from "../../../scripts/migration/lib/policy-capture";
import {
  CapturedMembershipLevel,
  MembershipLevelMappingFile,
} from "../../../scripts/migration/lib/policy-capture-types";

// ============================================================================
// Test Data
// ============================================================================

const sampleCapturedLevels: CapturedMembershipLevel[] = [
  {
    waId: 100,
    name: "Active Member",
    fee: 150,
    description: "Full membership",
    renewalEnabled: true,
    renewalPeriod: "OneYear",
    newMembersEnabled: true,
  },
  {
    waId: 101,
    name: "Honorary Member",
    fee: 0,
    description: "Lifetime honorary",
    renewalEnabled: false,
    renewalPeriod: null,
    newMembersEnabled: false,
  },
  {
    waId: 102,
    name: "Legacy Inactive",
    fee: 0,
    description: null,
    renewalEnabled: false,
    renewalPeriod: null,
    newMembersEnabled: false,
  },
];

const validMappingFile: MembershipLevelMappingFile = {
  version: "1.0",
  createdAt: "2024-12-24T12:00:00Z",
  source: "api",
  levels: [
    {
      waId: 100,
      waName: "Active Member",
      clubosTier: "active",
    },
    {
      waId: 101,
      waName: "Honorary Member",
      clubosTier: "active",
      notes: "No fee, same permissions",
    },
    {
      waId: 102,
      waName: "Legacy Inactive",
      ignore: true,
      reason: "No current members in this level",
    },
  ],
};

// ============================================================================
// Template Generation Tests
// ============================================================================

describe("generateMappingTemplate", () => {
  it("generates template from captured levels", () => {
    const template = generateMappingTemplate(sampleCapturedLevels);

    expect(template.version).toBe("1.0");
    expect(template.source).toBe("template");
    expect(template.levels).toHaveLength(3);

    // Check first level
    expect(template.levels[0].waId).toBe(100);
    expect(template.levels[0].waName).toBe("Active Member");
    expect(template.levels[0].clubosTier).toBeUndefined(); // Not pre-filled
    expect(template.levels[0].notes).toContain("$150");
  });

  it("generates example template when no levels provided", () => {
    const template = generateMappingTemplate([]);

    expect(template.levels).toHaveLength(2);
    expect(template.levels[0].waName).toBe("Example Active Member");
    expect(template.levels[0].clubosTier).toBe("active");
  });
});

// ============================================================================
// Mapping File Parsing Tests
// ============================================================================

describe("parseMappingFile", () => {
  it("parses valid JSON mapping file", () => {
    const json = JSON.stringify(validMappingFile);
    const result = parseMappingFile(json);

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.version).toBe("1.0");
      expect(result.levels).toHaveLength(3);
    }
  });

  it("returns error for invalid JSON", () => {
    const result = parseMappingFile("not valid json");

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("Failed to parse");
    }
  });

  it("returns error for missing version", () => {
    const json = JSON.stringify({ levels: [] });
    const result = parseMappingFile(json);

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("missing version");
    }
  });

  it("returns error for missing levels array", () => {
    const json = JSON.stringify({ version: "1.0" });
    const result = parseMappingFile(json);

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("levels array");
    }
  });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe("validateMappingFile", () => {
  it("validates correctly mapped file", () => {
    const result = validateMappingFile(validMappingFile);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.summary.mappedLevels).toBe(2);
    expect(result.summary.ignoredLevels).toBe(1);
    expect(result.summary.unmappedLevels).toBe(0);
  });

  it("rejects unmapped levels without clubosTier or ignore", () => {
    const invalidMapping: MembershipLevelMappingFile = {
      version: "1.0",
      createdAt: "2024-12-24T12:00:00Z",
      source: "template",
      levels: [
        {
          waId: 100,
          waName: "Unmapped Level",
          // No clubosTier or ignore
        },
      ],
    };

    const result = validateMappingFile(invalidMapping);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("must have either clubosTier or ignore");
  });

  it("rejects invalid tier codes", () => {
    const invalidMapping: MembershipLevelMappingFile = {
      version: "1.0",
      createdAt: "2024-12-24T12:00:00Z",
      source: "template",
      levels: [
        {
          waId: 100,
          waName: "Bad Tier",
          clubosTier: "invalid_tier" as never,
        },
      ],
    };

    const result = validateMappingFile(invalidMapping);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("Invalid clubosTier");
  });

  it("rejects ignored levels without reason", () => {
    const invalidMapping: MembershipLevelMappingFile = {
      version: "1.0",
      createdAt: "2024-12-24T12:00:00Z",
      source: "template",
      levels: [
        {
          waId: 100,
          waName: "Ignored No Reason",
          ignore: true,
          // No reason
        },
      ],
    };

    const result = validateMappingFile(invalidMapping);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("must have a reason");
  });

  it("rejects duplicate waId entries", () => {
    const invalidMapping: MembershipLevelMappingFile = {
      version: "1.0",
      createdAt: "2024-12-24T12:00:00Z",
      source: "template",
      levels: [
        { waId: 100, waName: "First", clubosTier: "active" },
        { waId: 100, waName: "Duplicate", clubosTier: "active" },
      ],
    };

    const result = validateMappingFile(invalidMapping);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("Duplicate waId"))).toBe(true);
  });

  it("warns about captured levels not in mapping", () => {
    const incompleteMapping: MembershipLevelMappingFile = {
      version: "1.0",
      createdAt: "2024-12-24T12:00:00Z",
      source: "api",
      levels: [
        { waId: 100, waName: "Active Member", clubosTier: "active" },
        // Missing 101 and 102
      ],
    };

    const result = validateMappingFile(incompleteMapping, sampleCapturedLevels);

    // Still valid (warnings don't block)
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0].message).toContain("not in mapping file");
  });
});

// ============================================================================
// Report Generation Tests
// ============================================================================

describe("generatePolicyCaptureReport", () => {
  it("generates report from captured levels and mapping", () => {
    const validation = validateMappingFile(validMappingFile, sampleCapturedLevels);
    const report = generatePolicyCaptureReport(
      "12345",
      sampleCapturedLevels,
      validMappingFile,
      validation
    );

    expect(report.sourceAccountId).toBe("12345");
    expect(report.membershipLevels).toHaveLength(3);
    expect(report.validationStatus).toBe("passed");
    expect(report.summary.totalWaLevels).toBe(3);
    expect(report.summary.mappedToClubos).toBe(2);
    expect(report.summary.ignoredWithReason).toBe(1);
  });

  it("marks unmapped levels correctly", () => {
    const partialMapping: MembershipLevelMappingFile = {
      version: "1.0",
      createdAt: "2024-12-24T12:00:00Z",
      source: "api",
      levels: [
        { waId: 100, waName: "Active Member", clubosTier: "active" },
      ],
    };

    const validation = validateMappingFile(partialMapping);
    const report = generatePolicyCaptureReport(
      "12345",
      sampleCapturedLevels,
      partialMapping,
      validation
    );

    const unmapped = report.membershipLevels.filter((l) => l.status === "unmapped");
    expect(unmapped).toHaveLength(2);
  });
});

describe("renderReportAsMarkdown", () => {
  it("renders report as valid markdown", () => {
    const validation = validateMappingFile(validMappingFile, sampleCapturedLevels);
    const report = generatePolicyCaptureReport(
      "12345",
      sampleCapturedLevels,
      validMappingFile,
      validation
    );

    const markdown = renderReportAsMarkdown(report);

    expect(markdown).toContain("# Policy Capture Report");
    expect(markdown).toContain("Wild Apricot Account 12345");
    expect(markdown).toContain("| WA ID | WA Name | ClubOS Tier | Status |");
    expect(markdown).toContain("Active Member");
    expect(markdown).toContain("## Summary");
    expect(markdown).toContain("Total WA levels: 3");
    expect(markdown).toContain("All levels accounted for");
  });

  it("includes validation errors in markdown when failed", () => {
    const invalidMapping: MembershipLevelMappingFile = {
      version: "1.0",
      createdAt: "2024-12-24T12:00:00Z",
      source: "template",
      levels: [
        { waId: 100, waName: "Unmapped", clubosTier: "bad" as never },
      ],
    };

    const validation = validateMappingFile(invalidMapping);
    const report = generatePolicyCaptureReport(
      "12345",
      sampleCapturedLevels,
      invalidMapping,
      validation
    );

    const markdown = renderReportAsMarkdown(report);

    expect(markdown).toContain("**Validation failed:**");
    expect(markdown).toContain("Invalid clubosTier");
  });
});
