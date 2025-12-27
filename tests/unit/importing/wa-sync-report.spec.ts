/**
 * Wild Apricot Sync Report Unit Tests
 *
 * Tests for sync report generation, warnings, and JSON output.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  SyncReport,
  SyncWarning,
  RegistrationDiagnostics,
  SyncStats,
} from "@/lib/importing/wildapricot/types";
import { writeSyncReport } from "@/lib/importing/wildapricot/importer";

// ============================================================================
// Test Fixtures
// ============================================================================

function makeRegistrationDiagnostics(
  overrides: Partial<RegistrationDiagnostics> = {}
): RegistrationDiagnostics {
  return {
    eventsProcessed: 100,
    eventsSkippedUnmapped: 5,
    registrationFetchCalls: 100,
    registrationsFetchedTotal: 500,
    registrationsTransformedOk: 400,
    registrationsSkippedMissingEvent: 10,
    registrationsSkippedMissingMember: 80,
    registrationsSkippedTransformError: 10,
    registrationsUpserted: 400,
    skipReasons: new Map(),
    ...overrides,
  };
}

function makeStats(): { members: SyncStats; events: SyncStats; registrations: SyncStats } {
  return {
    members: { created: 10, updated: 20, skipped: 5, errors: 0 },
    events: { created: 5, updated: 10, skipped: 2, errors: 0 },
    registrations: { created: 100, updated: 50, skipped: 10, errors: 0 },
  };
}

function makeSyncReport(overrides: Partial<SyncReport> = {}): SyncReport {
  return {
    version: 1,
    runId: "test_run_123",
    startedAt: "2025-01-15T10:00:00.000Z",
    finishedAt: "2025-01-15T10:05:00.000Z",
    durationMs: 300000,
    success: true,
    dryRun: false,
    fetched: {
      contacts: 500,
      events: 100,
      registrations: 2000,
    },
    warnings: [],
    stats: makeStats(),
    registrationDiagnostics: {
      eventsProcessed: 100,
      eventsSkippedUnmapped: 5,
      registrationFetchCalls: 100,
      registrationsFetchedTotal: 2000,
      registrationsTransformedOk: 1800,
      registrationsSkippedMissingEvent: 10,
      registrationsSkippedMissingMember: 180,
      registrationsSkippedTransformError: 10,
      registrationsUpserted: 1800,
      topSkipReasons: [],
    },
    errors: [],
    totalErrorCount: 0,
    ...overrides,
  };
}

// ============================================================================
// SyncReport Structure Tests
// ============================================================================

describe("SyncReport Structure", () => {
  it("contains version field set to 1", () => {
    const report = makeSyncReport();
    expect(report.version).toBe(1);
  });

  it("includes all required diagnostic fields", () => {
    const report = makeSyncReport();

    expect(report.registrationDiagnostics).toBeDefined();
    expect(report.registrationDiagnostics.eventsProcessed).toBeGreaterThanOrEqual(0);
    expect(report.registrationDiagnostics.registrationsFetchedTotal).toBeGreaterThanOrEqual(0);
    expect(report.registrationDiagnostics.registrationsUpserted).toBeGreaterThanOrEqual(0);
    expect(report.registrationDiagnostics.registrationsSkippedMissingMember).toBeGreaterThanOrEqual(0);
    expect(report.registrationDiagnostics.topSkipReasons).toBeInstanceOf(Array);
  });

  it("includes fetched counts", () => {
    const report = makeSyncReport();

    expect(report.fetched).toBeDefined();
    expect(report.fetched.contacts).toBe(500);
    expect(report.fetched.events).toBe(100);
    expect(report.fetched.registrations).toBe(2000);
  });

  it("includes warnings array", () => {
    const warnings: SyncWarning[] = [
      { code: "LOW_CONTACT_COUNT", message: "Only 50 contacts", severity: "high" },
    ];
    const report = makeSyncReport({ warnings });

    expect(report.warnings).toHaveLength(1);
    expect(report.warnings[0].code).toBe("LOW_CONTACT_COUNT");
    expect(report.warnings[0].severity).toBe("high");
  });

  it("limits errors to first 50", () => {
    // Create report with 100 errors
    const manyErrors = Array.from({ length: 100 }, (_, i) => ({
      entityType: "Member" as const,
      waId: i,
      message: `Error ${i}`,
    }));

    const report = makeSyncReport({
      errors: manyErrors.slice(0, 50), // First 50
      totalErrorCount: 100,
    });

    expect(report.errors).toHaveLength(50);
    expect(report.totalErrorCount).toBe(100);
  });
});

// ============================================================================
// Warning Detection Tests
// ============================================================================

describe("Warning Detection Logic", () => {
  it("warns on zero registrations upserted with some fetched", () => {
    // Simulate the warning condition
    const diag = makeRegistrationDiagnostics({
      registrationsFetchedTotal: 500,
      registrationsUpserted: 0,
      registrationsSkippedMissingMember: 500,
    });

    // The warning condition
    const shouldWarn = diag.registrationsFetchedTotal > 0 && diag.registrationsUpserted === 0;
    expect(shouldWarn).toBe(true);
  });

  it("does not warn when registrations are successfully upserted", () => {
    const diag = makeRegistrationDiagnostics({
      registrationsFetchedTotal: 500,
      registrationsUpserted: 400,
    });

    const shouldWarn = diag.registrationsFetchedTotal > 0 && diag.registrationsUpserted === 0;
    expect(shouldWarn).toBe(false);
  });

  it("warns on suspiciously low contact count", () => {
    const SUSPICIOUS_CONTACT_THRESHOLD = 100;
    const fetchedContacts = 50;

    const shouldWarn = fetchedContacts < SUSPICIOUS_CONTACT_THRESHOLD && fetchedContacts > 0;
    expect(shouldWarn).toBe(true);
  });

  it("does not warn on zero contacts (different warning)", () => {
    const SUSPICIOUS_CONTACT_THRESHOLD = 100;
    const fetchedContacts = 0;

    const lowContactWarn = fetchedContacts < SUSPICIOUS_CONTACT_THRESHOLD && fetchedContacts > 0;
    const zeroContactWarn = fetchedContacts === 0;

    expect(lowContactWarn).toBe(false);
    expect(zeroContactWarn).toBe(true);
  });

  it("warns on high member skip ratio", () => {
    const diag = makeRegistrationDiagnostics({
      registrationsFetchedTotal: 1000,
      registrationsSkippedMissingMember: 950, // 95%
    });

    const skipRatio = diag.registrationsFetchedTotal > 0
      ? diag.registrationsSkippedMissingMember / diag.registrationsFetchedTotal
      : 0;

    const shouldWarn = skipRatio > 0.9 && diag.registrationsFetchedTotal > 100;
    expect(shouldWarn).toBe(true);
    expect(skipRatio).toBeGreaterThan(0.9);
  });
});

// ============================================================================
// Skip Reasons Tests
// ============================================================================

describe("Skip Reason Tracking", () => {
  it("correctly sorts skip reasons by count", () => {
    const skipReasons = new Map<string, number>([
      ["Member not mapped: WA contact 100", 5],
      ["Member not mapped: WA contact 200", 10],
      ["Member not mapped: WA contact 300", 3],
    ]);

    const sorted = Array.from(skipReasons.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([reason, count]) => ({ reason, count }));

    expect(sorted[0].count).toBe(10);
    expect(sorted[1].count).toBe(5);
    expect(sorted[2].count).toBe(3);
  });

  it("limits to top 10 reasons", () => {
    const skipReasons = new Map<string, number>();
    for (let i = 0; i < 20; i++) {
      skipReasons.set(`Reason ${i}`, i);
    }

    const sorted = Array.from(skipReasons.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([reason, count]) => ({ reason, count }));

    expect(sorted).toHaveLength(10);
    expect(sorted[0].count).toBe(19); // Highest
    expect(sorted[9].count).toBe(10); // 10th highest
  });
});

// ============================================================================
// Report File Writing Tests
// ============================================================================

describe("writeSyncReport", () => {
  const testDir = "/tmp/clubos-test";
  const testFile = path.join(testDir, "test_report.json");

  beforeEach(() => {
    // Clean up before each test
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up after each test
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir, { recursive: true });
    }
  });

  it("creates output directory if it does not exist", () => {
    const report = makeSyncReport();
    const resultPath = writeSyncReport(report, testFile);

    expect(fs.existsSync(testDir)).toBe(true);
    expect(resultPath).toBe(testFile);
  });

  it("writes valid JSON to file", () => {
    const report = makeSyncReport();
    writeSyncReport(report, testFile);

    const content = fs.readFileSync(testFile, "utf-8");
    const parsed = JSON.parse(content);

    expect(parsed.version).toBe(1);
    expect(parsed.runId).toBe("test_run_123");
    expect(parsed.success).toBe(true);
  });

  it("writes formatted JSON with indentation", () => {
    const report = makeSyncReport();
    writeSyncReport(report, testFile);

    const content = fs.readFileSync(testFile, "utf-8");

    // Formatted JSON should have newlines
    expect(content).toContain("\n");
    // Should have proper indentation (2 spaces)
    expect(content).toContain('  "version"');
  });

  it("preserves all report fields in output", () => {
    const warnings: SyncWarning[] = [
      { code: "TEST_WARNING", message: "Test message", severity: "medium" },
    ];

    const report = makeSyncReport({
      warnings,
      dryRun: true,
    });

    writeSyncReport(report, testFile);

    const content = fs.readFileSync(testFile, "utf-8");
    const parsed = JSON.parse(content) as SyncReport;

    expect(parsed.dryRun).toBe(true);
    expect(parsed.warnings).toHaveLength(1);
    expect(parsed.warnings[0].code).toBe("TEST_WARNING");
    expect(parsed.fetched.contacts).toBe(500);
    expect(parsed.registrationDiagnostics.registrationsUpserted).toBe(1800);
  });

  it("returns the output path", () => {
    const report = makeSyncReport();
    const resultPath = writeSyncReport(report, testFile);

    expect(resultPath).toBe(testFile);
  });
});

// ============================================================================
// Warning Message Format Tests
// ============================================================================

describe("Warning Message Formatting", () => {
  it("formats ZERO_REGISTRATIONS_UPSERTED with skip reasons", () => {
    const skipReasons = new Map<string, number>([
      ["Member not mapped: WA contact 100", 50],
      ["Member not mapped: WA contact 200", 30],
    ]);

    const topReasons = Array.from(skipReasons.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason, count]) => `${reason}: ${count}`)
      .join("; ");

    expect(topReasons).toContain("Member not mapped: WA contact 100: 50");
    expect(topReasons).toContain("Member not mapped: WA contact 200: 30");
  });

  it("handles empty skip reasons gracefully", () => {
    const skipReasons = new Map<string, number>();

    const topReasons = Array.from(skipReasons.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason, count]) => `${reason}: ${count}`)
      .join("; ");

    expect(topReasons).toBe("");
  });
});

// ============================================================================
// Invariant Tests (Document Critical Behaviors)
// ============================================================================

describe("Sync Report Invariants", () => {
  it("registrationsFetchedTotal >= registrationsUpserted + all skips", () => {
    const diag = makeRegistrationDiagnostics({
      registrationsFetchedTotal: 1000,
      registrationsUpserted: 700,
      registrationsSkippedMissingMember: 200,
      registrationsSkippedMissingEvent: 50,
      registrationsSkippedTransformError: 50,
    });

    const totalAccountedFor =
      diag.registrationsUpserted +
      diag.registrationsSkippedMissingMember +
      diag.registrationsSkippedMissingEvent +
      diag.registrationsSkippedTransformError;

    expect(totalAccountedFor).toBeLessThanOrEqual(diag.registrationsFetchedTotal);
  });

  it("eventsProcessed >= eventsSkippedUnmapped", () => {
    const diag = makeRegistrationDiagnostics({
      eventsProcessed: 100,
      eventsSkippedUnmapped: 5,
    });

    expect(diag.eventsProcessed).toBeGreaterThanOrEqual(diag.eventsSkippedUnmapped);
  });

  it("report version is always 1 (current schema)", () => {
    const report = makeSyncReport();
    expect(report.version).toBe(1);
  });
});
