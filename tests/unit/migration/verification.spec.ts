/**
 * Post-Migration Verification Unit Tests
 *
 * Tests for the pure verification functions.
 * All tests use fixed fixtures and are deterministic.
 *
 * Related: Issue #202 (Migration Wave), Epic #277 (Rollback & Recovery)
 */

import { describe, it, expect } from "vitest";
import {
  extractBundleCounts,
  verifyMemberCount,
  verifyEventCount,
  verifyRegistrationCount,
  verifyTierDistribution,
  verifyTierCoverage,
  verifyNoOrphanedRegistrations,
  verifyNoDuplicateMappings,
  verifyRunId,
  aggregateResults,
  generateMarkdownReport,
  type TierDistribution,
  type VerificationCheck,
} from "../../../scripts/migration/lib/verification";
import type { MigrationReport } from "../../../scripts/migration/lib/types";

// =============================================================================
// Test Fixtures
// =============================================================================

function createValidMigrationReport(): MigrationReport {
  return {
    runId: "test-run-001",
    startedAt: new Date("2024-03-15T12:00:00Z"),
    completedAt: new Date("2024-03-15T12:30:00Z"),
    dryRun: false,
    config: {
      source: "wild-apricot",
      target: "clubos",
      version: "1.0",
    },
    summary: {
      totalRecords: 150,
      created: 140,
      updated: 10,
      skipped: 0,
      errors: 0,
      duration_ms: 1800000,
    },
    members: {
      totalRows: 100,
      parsed: 100,
      created: 95,
      updated: 5,
      skipped: 0,
      errors: 0,
      records: [],
    },
    events: {
      totalRows: 30,
      parsed: 30,
      created: 28,
      updated: 2,
      skipped: 0,
      errors: 0,
      records: [],
    },
    registrations: {
      totalRows: 20,
      parsed: 20,
      created: 17,
      updated: 3,
      skipped: 0,
      errors: 0,
      records: [],
    },
    errors: [],
    idMapping: {
      members: [],
      events: [],
    },
  };
}

function createTierDistribution(): TierDistribution[] {
  return [
    { tierCode: "NEWCOMER", tierName: "New Member", count: 30, percentage: 30 },
    { tierCode: "FIRST_YEAR", tierName: "First Year", count: 25, percentage: 25 },
    { tierCode: "SECOND_YEAR", tierName: "Second Year", count: 20, percentage: 20 },
    { tierCode: "THIRD_YEAR", tierName: "Third Year", count: 15, percentage: 15 },
    { tierCode: "ALUMNI", tierName: "Alumni", count: 10, percentage: 10 },
  ];
}

// =============================================================================
// extractBundleCounts Tests
// =============================================================================

describe("extractBundleCounts", () => {
  it("should extract counts from migration report", () => {
    const report = createValidMigrationReport();
    const counts = extractBundleCounts(report);

    expect(counts.members).toBe(100); // 95 created + 5 updated
    expect(counts.events).toBe(30); // 28 created + 2 updated
    expect(counts.registrations).toBe(20); // 17 created + 3 updated
  });

  it("should handle report with zero counts", () => {
    const report = createValidMigrationReport();
    report.members.created = 0;
    report.members.updated = 0;
    report.events.created = 0;
    report.events.updated = 0;
    report.registrations.created = 0;
    report.registrations.updated = 0;

    const counts = extractBundleCounts(report);

    expect(counts.members).toBe(0);
    expect(counts.events).toBe(0);
    expect(counts.registrations).toBe(0);
  });
});

// =============================================================================
// verifyMemberCount Tests
// =============================================================================

describe("verifyMemberCount", () => {
  it("should pass when counts match", () => {
    const result = verifyMemberCount(100, 100);

    expect(result.passed).toBe(true);
    expect(result.category).toBe("counts");
    expect(result.severity).toBe("info");
    expect(result.message).toContain("matches");
  });

  it("should fail when counts differ", () => {
    const result = verifyMemberCount(100, 95);

    expect(result.passed).toBe(false);
    expect(result.severity).toBe("error");
    expect(result.message).toContain("mismatch");
    expect(result.expected).toBe(100);
    expect(result.actual).toBe(95);
  });

  it("should handle zero counts", () => {
    const result = verifyMemberCount(0, 0);

    expect(result.passed).toBe(true);
  });
});

// =============================================================================
// verifyEventCount Tests
// =============================================================================

describe("verifyEventCount", () => {
  it("should pass when counts match", () => {
    const result = verifyEventCount(50, 50);

    expect(result.passed).toBe(true);
    expect(result.name).toBe("Event Count");
  });

  it("should fail when counts differ", () => {
    const result = verifyEventCount(50, 48);

    expect(result.passed).toBe(false);
    expect(result.message).toContain("diff: 2");
  });
});

// =============================================================================
// verifyRegistrationCount Tests
// =============================================================================

describe("verifyRegistrationCount", () => {
  it("should pass when counts match", () => {
    const result = verifyRegistrationCount(200, 200);

    expect(result.passed).toBe(true);
    expect(result.name).toBe("Registration Count");
  });

  it("should fail when counts differ", () => {
    const result = verifyRegistrationCount(200, 180);

    expect(result.passed).toBe(false);
    expect(result.expected).toBe(200);
    expect(result.actual).toBe(180);
  });
});

// =============================================================================
// verifyTierDistribution Tests
// =============================================================================

describe("verifyTierDistribution", () => {
  it("should pass with healthy distribution", () => {
    const distribution = createTierDistribution();
    const result = verifyTierDistribution(distribution);

    expect(result.passed).toBe(true);
    expect(result.category).toBe("tiers");
  });

  it("should warn when all members in one tier", () => {
    const distribution: TierDistribution[] = [
      { tierCode: "GENERAL", tierName: "General", count: 100, percentage: 100 },
      { tierCode: "NEWCOMER", tierName: "Newcomer", count: 0, percentage: 0 },
    ];

    const result = verifyTierDistribution(distribution);

    expect(result.passed).toBe(true); // Still passes, but with warning
    expect(result.severity).toBe("warning");
    expect(result.message).toContain("GENERAL");
  });

  it("should fail when no members have tiers", () => {
    const distribution: TierDistribution[] = [
      { tierCode: "GENERAL", tierName: "General", count: 0, percentage: 0 },
      { tierCode: "NEWCOMER", tierName: "Newcomer", count: 0, percentage: 0 },
    ];

    const result = verifyTierDistribution(distribution);

    expect(result.passed).toBe(false);
    expect(result.message).toContain("No members");
  });

  it("should handle empty distribution", () => {
    const distribution: TierDistribution[] = [];
    const result = verifyTierDistribution(distribution);

    expect(result.passed).toBe(true);
    expect(result.actual).toBe("No tiers");
  });
});

// =============================================================================
// verifyTierCoverage Tests
// =============================================================================

describe("verifyTierCoverage", () => {
  it("should pass with high coverage", () => {
    const result = verifyTierCoverage(100, 98);

    expect(result.passed).toBe(true);
    expect(result.category).toBe("tiers");
    expect(result.actual).toBe("98.0%");
  });

  it("should fail with low coverage", () => {
    const result = verifyTierCoverage(100, 80);

    expect(result.passed).toBe(false);
    expect(result.severity).toBe("warning");
    expect(result.message).toContain("20 members without tier");
  });

  it("should handle edge case of 95% threshold", () => {
    const result = verifyTierCoverage(100, 95);

    expect(result.passed).toBe(true);
  });

  it("should handle zero members", () => {
    const result = verifyTierCoverage(0, 0);

    expect(result.passed).toBe(false);
    expect(result.actual).toBe("0.0%");
  });
});

// =============================================================================
// verifyNoOrphanedRegistrations Tests
// =============================================================================

describe("verifyNoOrphanedRegistrations", () => {
  it("should pass with zero orphans", () => {
    const result = verifyNoOrphanedRegistrations(0);

    expect(result.passed).toBe(true);
    expect(result.category).toBe("integrity");
    expect(result.message).toContain("No orphaned");
  });

  it("should fail with orphaned registrations", () => {
    const result = verifyNoOrphanedRegistrations(5);

    expect(result.passed).toBe(false);
    expect(result.severity).toBe("error");
    expect(result.message).toContain("5 registrations");
  });
});

// =============================================================================
// verifyNoDuplicateMappings Tests
// =============================================================================

describe("verifyNoDuplicateMappings", () => {
  it("should pass with zero duplicates", () => {
    const result = verifyNoDuplicateMappings(0);

    expect(result.passed).toBe(true);
    expect(result.category).toBe("integrity");
  });

  it("should fail with duplicate mappings", () => {
    const result = verifyNoDuplicateMappings(3);

    expect(result.passed).toBe(false);
    expect(result.message).toContain("3 duplicate");
  });
});

// =============================================================================
// verifyRunId Tests
// =============================================================================

describe("verifyRunId", () => {
  it("should pass when run IDs match", () => {
    const result = verifyRunId("run-123", "run-123");

    expect(result.passed).toBe(true);
    expect(result.category).toBe("integrity");
  });

  it("should warn when run IDs differ", () => {
    const result = verifyRunId("run-123", "run-456");

    expect(result.passed).toBe(false);
    expect(result.severity).toBe("warning");
  });

  it("should warn when database has no run ID", () => {
    const result = verifyRunId("run-123", null);

    expect(result.passed).toBe(false);
    expect(result.actual).toBe("(none)");
  });
});

// =============================================================================
// aggregateResults Tests
// =============================================================================

describe("aggregateResults", () => {
  it("should aggregate passing checks correctly", () => {
    const checks: VerificationCheck[] = [
      { name: "Test 1", category: "counts", passed: true, expected: 10, actual: 10, message: "ok", severity: "info" },
      { name: "Test 2", category: "counts", passed: true, expected: 20, actual: 20, message: "ok", severity: "info" },
    ];

    const result = aggregateResults(
      "run-001",
      "/path/to/bundle",
      new Date("2024-03-15T12:00:00Z"),
      checks,
      { bundle: { members: 10 }, database: { members: 10, events: 5, registrations: 20, membershipTiers: 3, membershipStatuses: 4 } },
      [],
      []
    );

    expect(result.passed).toBe(true);
    expect(result.summary.total).toBe(2);
    expect(result.summary.passed).toBe(2);
    expect(result.summary.failed).toBe(0);
  });

  it("should aggregate failing checks correctly", () => {
    const checks: VerificationCheck[] = [
      { name: "Test 1", category: "counts", passed: false, expected: 10, actual: 8, message: "mismatch", severity: "error" },
      { name: "Test 2", category: "counts", passed: true, expected: 20, actual: 20, message: "ok", severity: "info" },
    ];

    const result = aggregateResults(
      "run-001",
      "/path/to/bundle",
      new Date(),
      checks,
      { bundle: { members: 10 }, database: { members: 8, events: 5, registrations: 20, membershipTiers: 3, membershipStatuses: 4 } },
      [],
      []
    );

    expect(result.passed).toBe(false);
    expect(result.summary.failed).toBe(1);
  });

  it("should count warnings separately", () => {
    const checks: VerificationCheck[] = [
      { name: "Test 1", category: "tiers", passed: false, expected: "distributed", actual: "100% in GENERAL", message: "warning", severity: "warning" },
    ];

    const result = aggregateResults(
      "run-001",
      "/path/to/bundle",
      new Date(),
      checks,
      { bundle: {}, database: { members: 10, events: 5, registrations: 20, membershipTiers: 3, membershipStatuses: 4 } },
      [],
      []
    );

    expect(result.passed).toBe(true); // Warnings don't cause failure
    expect(result.summary.warnings).toBe(1);
    expect(result.summary.failed).toBe(0);
  });
});

// =============================================================================
// generateMarkdownReport Tests
// =============================================================================

describe("generateMarkdownReport", () => {
  it("should generate valid markdown for passing result", () => {
    const checks: VerificationCheck[] = [
      { name: "Member Count", category: "counts", passed: true, expected: 100, actual: 100, message: "ok", severity: "info" },
    ];

    const result = aggregateResults(
      "run-001",
      "/bundle",
      new Date("2024-03-15T12:00:00Z"),
      checks,
      { bundle: { members: 100 }, database: { members: 100, events: 50, registrations: 200, membershipTiers: 5, membershipStatuses: 7 } },
      [],
      []
    );

    const markdown = generateMarkdownReport(result);

    expect(markdown).toContain("# Migration Verification Report");
    expect(markdown).toContain("PASS");
    expect(markdown).toContain("run-001");
    expect(markdown).toContain("| Member Count |");
  });

  it("should generate valid markdown for failing result", () => {
    const checks: VerificationCheck[] = [
      { name: "Member Count", category: "counts", passed: false, expected: 100, actual: 90, message: "mismatch", severity: "error" },
    ];

    const result = aggregateResults(
      "run-002",
      "/bundle",
      new Date(),
      checks,
      { bundle: { members: 100 }, database: { members: 90, events: 50, registrations: 200, membershipTiers: 5, membershipStatuses: 7 } },
      [],
      []
    );

    const markdown = generateMarkdownReport(result);

    expect(markdown).toContain("FAIL");
    expect(markdown).toContain("**NO**");
  });

  it("should include tier distribution when present", () => {
    const distribution = createTierDistribution();

    const result = aggregateResults(
      "run-003",
      "/bundle",
      new Date(),
      [],
      { bundle: {}, database: { members: 100, events: 50, registrations: 200, membershipTiers: 5, membershipStatuses: 7 } },
      distribution,
      []
    );

    const markdown = generateMarkdownReport(result);

    expect(markdown).toContain("NEWCOMER");
    expect(markdown).toContain("FIRST_YEAR");
    expect(markdown).toContain("30.0%");
  });
});
