/**
 * Migration Invariants Unit Tests
 *
 * Tests for the pure validation functions in the invariants module.
 * All tests use fixed fixtures and are deterministic.
 *
 * Related: Issue #202 (Migration Wave), Issue #277 (Rollback/Recovery)
 */

import { describe, it, expect } from "vitest";
import {
  assertNoViolations,
  validateIdMapping,
  validateBundleShape,
  validateDeterminismSummary,
  validateMigrationReport,
  VIOLATION_CODES,
  type InvariantViolation,
  type DeterminismSummary,
} from "../../../scripts/migration/lib/invariants";
import type { IdMappingReport } from "../../../scripts/migration/lib/id-mapping";
import type { MigrationReport, EntityReport } from "../../../scripts/migration/lib/types";

// =============================================================================
// Test Fixtures
// =============================================================================

function createValidIdMappingReport(): IdMappingReport {
  return {
    runId: "test-run-001",
    generatedAt: "2024-03-15T12:00:00.000Z",
    dryRun: true,
    members: {
      mappings: [
        { waId: "WA001", murmurantId: "CLB001", identifier: "alice@example.com" },
        { waId: "WA002", murmurantId: "CLB002", identifier: "bob@example.com" },
      ],
      counts: { total: 2, mapped: 2, missing: 0, duplicates: 0 },
      duplicateWaIds: [],
      missingWaIds: [],
    },
    events: {
      mappings: [
        { waId: "EVT001", murmurantId: "CEVT001", identifier: "Coffee Social" },
      ],
      counts: { total: 1, mapped: 1, missing: 0, duplicates: 0 },
      duplicateWaIds: [],
      missingWaIds: [],
    },
  };
}

function createValidEntityReport(parsed: number = 10): EntityReport {
  return {
    totalRows: parsed,
    parsed,
    created: parsed - 2,
    updated: 1,
    skipped: 1,
    errors: 0,
    records: Array(parsed).fill({ _sourceRow: 1 }),
  };
}

function createValidMigrationReport(): MigrationReport {
  return {
    runId: "test-run-001",
    startedAt: new Date("2024-03-15T12:00:00.000Z"),
    completedAt: new Date("2024-03-15T12:05:00.000Z"),
    dryRun: true,
    config: { source: "wild-apricot", target: "murmurant", version: "1.0" },
    summary: {
      totalRecords: 30,
      created: 24,
      updated: 3,
      skipped: 3,
      errors: 0,
      duration_ms: 300000,
    },
    members: createValidEntityReport(10),
    events: createValidEntityReport(10),
    registrations: createValidEntityReport(10),
    errors: [],
    idMapping: {
      members: [{ waId: "WA001", murmurantId: "CLB001", email: "test@example.com" }],
      events: [{ waId: "EVT001", murmurantId: "CEVT001", title: "Test Event" }],
    },
  };
}

function createValidDeterminismSummary(): DeterminismSummary {
  return {
    runId: "test-run-001",
    timestamp: "2024-03-15T12:00:00.000Z",
    members: { parsed: 10, created: 8, updated: 1, skipped: 1, errors: 0 },
    events: { parsed: 5, created: 4, updated: 0, skipped: 1, errors: 0 },
    registrations: { parsed: 15, created: 12, updated: 2, skipped: 1, errors: 0 },
  };
}

// =============================================================================
// assertNoViolations Tests
// =============================================================================

describe("assertNoViolations", () => {
  it("does not throw when violations array is empty", () => {
    expect(() => assertNoViolations([])).not.toThrow();
  });

  it("throws when violations array has entries", () => {
    const violations: InvariantViolation[] = [
      { code: "TEST_CODE", message: "Test message" },
    ];
    expect(() => assertNoViolations(violations)).toThrow(
      /Migration invariant violations detected/
    );
  });

  it("includes all violations in error message", () => {
    const violations: InvariantViolation[] = [
      { code: "CODE_A", message: "First violation" },
      { code: "CODE_B", message: "Second violation", path: "some.path" },
    ];
    try {
      assertNoViolations(violations);
      expect.fail("Should have thrown");
    } catch (e) {
      const error = e as Error;
      expect(error.message).toContain("CODE_A");
      expect(error.message).toContain("CODE_B");
      expect(error.message).toContain("First violation");
      expect(error.message).toContain("Second violation");
      expect(error.message).toContain("some.path");
    }
  });
});

// =============================================================================
// validateIdMapping Tests
// =============================================================================

describe("validateIdMapping", () => {
  describe("happy path", () => {
    it("returns empty violations for valid ID mapping", () => {
      const report = createValidIdMappingReport();
      const violations = validateIdMapping(report);
      expect(violations).toHaveLength(0);
    });

    it("accepts empty mappings arrays", () => {
      const report = createValidIdMappingReport();
      report.members.mappings = [];
      report.members.counts.mapped = 0;
      report.events.mappings = [];
      report.events.counts.mapped = 0;
      const violations = validateIdMapping(report);
      expect(violations).toHaveLength(0);
    });
  });

  describe("detects missing required fields", () => {
    it("detects missing runId", () => {
      const report = createValidIdMappingReport();
      (report as unknown as Record<string, unknown>).runId = "";
      const violations = validateIdMapping(report);
      expect(violations.some((v) => v.code === VIOLATION_CODES.MISSING_RUN_ID)).toBe(true);
    });

    it("detects missing waId in mapping entry", () => {
      const report = createValidIdMappingReport();
      report.members.mappings[0] = { waId: "", murmurantId: "CLB001" };
      const violations = validateIdMapping(report);
      expect(violations.some((v) => v.code === VIOLATION_CODES.MISSING_WA_ID)).toBe(true);
    });

    it("detects missing murmurantId in mapping entry", () => {
      const report = createValidIdMappingReport();
      report.members.mappings[0] = { waId: "WA001", murmurantId: "" };
      const violations = validateIdMapping(report);
      expect(violations.some((v) => v.code === VIOLATION_CODES.MISSING_MURMURANT_ID)).toBe(true);
    });
  });

  describe("detects duplicate keys", () => {
    it("detects duplicate WA IDs in members", () => {
      const report = createValidIdMappingReport();
      report.members.mappings = [
        { waId: "WA001", murmurantId: "CLB001" },
        { waId: "WA001", murmurantId: "CLB002" }, // Duplicate WA ID
      ];
      report.members.counts.mapped = 2;
      const violations = validateIdMapping(report);
      expect(violations.some((v) => v.code === VIOLATION_CODES.DUPLICATE_WA_ID)).toBe(true);
      const dupViolation = violations.find((v) => v.code === VIOLATION_CODES.DUPLICATE_WA_ID);
      expect(dupViolation?.details?.waId).toBe("WA001");
    });

    it("detects duplicate Murmurant IDs in members", () => {
      const report = createValidIdMappingReport();
      report.members.mappings = [
        { waId: "WA001", murmurantId: "CLB001" },
        { waId: "WA002", murmurantId: "CLB001" }, // Duplicate Murmurant ID
      ];
      report.members.counts.mapped = 2;
      const violations = validateIdMapping(report);
      expect(violations.some((v) => v.code === VIOLATION_CODES.DUPLICATE_MURMURANT_ID)).toBe(true);
      const dupViolation = violations.find((v) => v.code === VIOLATION_CODES.DUPLICATE_MURMURANT_ID);
      expect(dupViolation?.details?.murmurantId).toBe("CLB001");
    });

    it("detects duplicate WA IDs in events", () => {
      const report = createValidIdMappingReport();
      report.events.mappings = [
        { waId: "EVT001", murmurantId: "CEVT001" },
        { waId: "EVT001", murmurantId: "CEVT002" }, // Duplicate
      ];
      report.events.counts.mapped = 2;
      const violations = validateIdMapping(report);
      expect(violations.some((v) => v.code === VIOLATION_CODES.DUPLICATE_WA_ID)).toBe(true);
    });
  });

  describe("detects count mismatches", () => {
    it("detects members count mismatch", () => {
      const report = createValidIdMappingReport();
      report.members.counts.mapped = 5; // Does not match mappings.length of 2
      const violations = validateIdMapping(report);
      expect(violations.some((v) => v.code === VIOLATION_CODES.COUNT_MISMATCH)).toBe(true);
    });

    it("detects events count mismatch", () => {
      const report = createValidIdMappingReport();
      report.events.counts.mapped = 10; // Does not match mappings.length of 1
      const violations = validateIdMapping(report);
      expect(violations.some((v) => v.code === VIOLATION_CODES.COUNT_MISMATCH)).toBe(true);
    });
  });
});

// =============================================================================
// validateBundleShape Tests
// =============================================================================

describe("validateBundleShape", () => {
  describe("happy path", () => {
    it("returns empty violations for valid migration report", () => {
      const report = createValidMigrationReport();
      const violations = validateBundleShape(report);
      expect(violations).toHaveLength(0);
    });
  });

  describe("detects missing required fields", () => {
    it("detects missing runId", () => {
      const report = createValidMigrationReport();
      (report as unknown as Record<string, unknown>).runId = "";
      const violations = validateBundleShape(report);
      expect(violations.some((v) => v.code === VIOLATION_CODES.MISSING_RUN_ID)).toBe(true);
    });

    it("detects missing startedAt", () => {
      const report = createValidMigrationReport();
      (report as unknown as Record<string, unknown>).startedAt = null;
      const violations = validateBundleShape(report);
      expect(violations.some((v) => v.code === VIOLATION_CODES.MISSING_REQUIRED_FIELD)).toBe(true);
    });

    it("detects missing entity report", () => {
      const report = createValidMigrationReport();
      (report as unknown as Record<string, unknown>).members = null;
      const violations = validateBundleShape(report);
      expect(violations.some((v) => v.code === VIOLATION_CODES.INVALID_ENTITY_REPORT)).toBe(true);
    });
  });

  describe("detects negative counts", () => {
    it("detects negative created count", () => {
      const report = createValidMigrationReport();
      report.members.created = -1;
      const violations = validateBundleShape(report);
      expect(violations.some((v) => v.code === VIOLATION_CODES.NEGATIVE_COUNT)).toBe(true);
    });

    it("detects negative summary count", () => {
      const report = createValidMigrationReport();
      report.summary.errors = -5;
      const violations = validateBundleShape(report);
      expect(violations.some((v) => v.code === VIOLATION_CODES.NEGATIVE_COUNT)).toBe(true);
    });
  });

  describe("detects count inconsistencies", () => {
    it("detects when entity counts do not add up to parsed", () => {
      const report = createValidMigrationReport();
      // 10 parsed, but 5 + 1 + 1 + 0 = 7, not 10
      report.members.parsed = 10;
      report.members.created = 5;
      report.members.updated = 1;
      report.members.skipped = 1;
      report.members.errors = 0;
      const violations = validateBundleShape(report);
      expect(violations.some((v) => v.code === VIOLATION_CODES.COUNT_MISMATCH)).toBe(true);
    });
  });

  describe("detects records exceeding parsed", () => {
    it("detects when records array is larger than parsed count", () => {
      const report = createValidMigrationReport();
      report.members.parsed = 2;
      report.members.records = Array(10).fill({ _sourceRow: 1 });
      // Fix the counts so they add up, but records array is too large
      report.members.created = 1;
      report.members.updated = 1;
      report.members.skipped = 0;
      report.members.errors = 0;
      const violations = validateBundleShape(report);
      expect(violations.some((v) => v.code === VIOLATION_CODES.RECORDS_EXCEED_PARSED)).toBe(true);
    });
  });
});

// =============================================================================
// validateDeterminismSummary Tests
// =============================================================================

describe("validateDeterminismSummary", () => {
  describe("happy path", () => {
    it("returns empty violations for valid determinism summary", () => {
      const summary = createValidDeterminismSummary();
      const violations = validateDeterminismSummary(summary);
      expect(violations).toHaveLength(0);
    });
  });

  describe("detects missing required fields", () => {
    it("detects missing runId", () => {
      const summary = createValidDeterminismSummary();
      summary.runId = "";
      const violations = validateDeterminismSummary(summary);
      expect(violations.some((v) => v.code === VIOLATION_CODES.MISSING_RUN_ID)).toBe(true);
    });

    it("detects missing timestamp", () => {
      const summary = createValidDeterminismSummary();
      summary.timestamp = "";
      const violations = validateDeterminismSummary(summary);
      expect(violations.some((v) => v.code === VIOLATION_CODES.INVALID_TIMESTAMP)).toBe(true);
    });

    it("detects invalid timestamp format", () => {
      const summary = createValidDeterminismSummary();
      summary.timestamp = "not-a-valid-date";
      const violations = validateDeterminismSummary(summary);
      expect(violations.some((v) => v.code === VIOLATION_CODES.INVALID_TIMESTAMP)).toBe(true);
    });

    it("detects missing entity", () => {
      const summary = createValidDeterminismSummary();
      (summary as unknown as Record<string, unknown>).members = null;
      const violations = validateDeterminismSummary(summary);
      expect(violations.some((v) => v.code === VIOLATION_CODES.MISSING_REQUIRED_FIELD)).toBe(true);
    });
  });

  describe("detects negative counts", () => {
    it("detects negative parsed count", () => {
      const summary = createValidDeterminismSummary();
      summary.members.parsed = -1;
      const violations = validateDeterminismSummary(summary);
      expect(violations.some((v) => v.code === VIOLATION_CODES.NEGATIVE_COUNT)).toBe(true);
    });

    it("detects negative created count", () => {
      const summary = createValidDeterminismSummary();
      summary.events.created = -5;
      const violations = validateDeterminismSummary(summary);
      expect(violations.some((v) => v.code === VIOLATION_CODES.NEGATIVE_COUNT)).toBe(true);
    });
  });

  describe("detects non-deterministic counts", () => {
    it("detects when counts do not add up to parsed", () => {
      const summary = createValidDeterminismSummary();
      // 10 parsed, but 5 + 1 + 1 + 0 = 7, not 10
      summary.members.parsed = 10;
      summary.members.created = 5;
      summary.members.updated = 1;
      summary.members.skipped = 1;
      summary.members.errors = 0;
      const violations = validateDeterminismSummary(summary);
      expect(violations.some((v) => v.code === VIOLATION_CODES.NON_DETERMINISTIC_COUNTS)).toBe(true);
    });
  });
});

// =============================================================================
// validateMigrationReport (Combined) Tests
// =============================================================================

describe("validateMigrationReport", () => {
  it("returns valid:true for a correct report", () => {
    const report = createValidMigrationReport();
    const result = validateMigrationReport(report);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("returns valid:false when violations exist", () => {
    const report = createValidMigrationReport();
    report.members.created = -1; // Invalid
    const result = validateMigrationReport(report);
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it("collects violations from all validators", () => {
    const report = createValidMigrationReport();
    report.runId = ""; // Missing run ID
    report.members.created = -1; // Negative count
    report.events.parsed = 100; // Count mismatch
    const result = validateMigrationReport(report);
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(1);
  });
});
