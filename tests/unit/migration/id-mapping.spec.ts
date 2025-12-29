/**
 * ID Mapping Report Generation Unit Tests
 *
 * Tests for deterministic ID mapping output, duplicate detection,
 * and missing ID reporting.
 *
 * Related: Issue #273 (A8: ID Mapping & Report Generation)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  generateIdMappingReport,
  analyzeIdMappings,
  writeIdMappingReport,
  formatTimestamp,
  type IdMappingReport,
} from "../../../scripts/migration/lib/id-mapping";
import type { MigrationReport } from "../../../scripts/migration/lib/types";

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockReport(overrides: Partial<MigrationReport> = {}): MigrationReport {
  return {
    runId: "test-run-123",
    startedAt: new Date("2024-01-15T10:00:00Z"),
    completedAt: new Date("2024-01-15T10:01:00Z"),
    dryRun: true,
    config: { source: "wild-apricot", target: "murmurant", version: "1.0.0" },
    summary: {
      totalRecords: 10,
      created: 5,
      updated: 2,
      skipped: 2,
      errors: 1,
      duration_ms: 1000,
    },
    members: {
      totalRows: 5,
      parsed: 5,
      created: 3,
      updated: 1,
      skipped: 1,
      errors: 0,
      records: [
        { _sourceRow: 2, _waId: "wa-m1", _murmurantId: "co-m1", _action: "create" },
        { _sourceRow: 3, _waId: "wa-m2", _murmurantId: "co-m2", _action: "create" },
        { _sourceRow: 4, _waId: "wa-m3", _murmurantId: "co-m3", _action: "create" },
        { _sourceRow: 5, _waId: "wa-m4", _murmurantId: "co-m4", _action: "update" },
        { _sourceRow: 6, _waId: "wa-m5", _action: "skip" },
      ],
    },
    events: {
      totalRows: 3,
      parsed: 3,
      created: 2,
      updated: 0,
      skipped: 1,
      errors: 0,
      records: [
        { _sourceRow: 2, _waId: "wa-e1", _murmurantId: "co-e1", _action: "create" },
        { _sourceRow: 3, _waId: "wa-e2", _murmurantId: "co-e2", _action: "create" },
        { _sourceRow: 4, _waId: "wa-e3", _action: "skip" },
      ],
    },
    registrations: {
      totalRows: 2,
      parsed: 2,
      created: 0,
      updated: 1,
      skipped: 1,
      errors: 0,
      records: [],
    },
    errors: [],
    idMapping: {
      members: [
        { waId: "wa-m1", murmurantId: "co-m1", email: "m1@test.com" },
        { waId: "wa-m2", murmurantId: "co-m2", email: "m2@test.com" },
        { waId: "wa-m3", murmurantId: "co-m3", email: "m3@test.com" },
        { waId: "wa-m4", murmurantId: "co-m4", email: "m4@test.com" },
      ],
      events: [
        { waId: "wa-e1", murmurantId: "co-e1", title: "Event 1" },
        { waId: "wa-e2", murmurantId: "co-e2", title: "Event 2" },
      ],
    },
    ...overrides,
  };
}

// =============================================================================
// generateIdMappingReport Tests
// =============================================================================

describe("generateIdMappingReport", () => {
  it("generates report with correct structure", () => {
    const mockReport = createMockReport();
    const result = generateIdMappingReport(mockReport);

    expect(result.runId).toBe("test-run-123");
    expect(result.dryRun).toBe(true);
    expect(result.generatedAt).toBeDefined();
    expect(result.members).toBeDefined();
    expect(result.events).toBeDefined();
  });

  it("includes all member mappings with identifiers", () => {
    const mockReport = createMockReport();
    const result = generateIdMappingReport(mockReport);

    expect(result.members.mappings).toHaveLength(4);
    expect(result.members.mappings[0]).toEqual({
      waId: "wa-m1",
      murmurantId: "co-m1",
      identifier: "m1@test.com",
    });
  });

  it("includes all event mappings with identifiers", () => {
    const mockReport = createMockReport();
    const result = generateIdMappingReport(mockReport);

    expect(result.events.mappings).toHaveLength(2);
    expect(result.events.mappings[0]).toEqual({
      waId: "wa-e1",
      murmurantId: "co-e1",
      identifier: "Event 1",
    });
  });

  it("calculates correct counts for members", () => {
    const mockReport = createMockReport();
    const result = generateIdMappingReport(mockReport);

    expect(result.members.counts.total).toBe(5);
    expect(result.members.counts.mapped).toBe(4);
    expect(result.members.counts.missing).toBe(1); // wa-m5 has no mapping
    expect(result.members.counts.duplicates).toBe(0);
  });

  it("calculates correct counts for events", () => {
    const mockReport = createMockReport();
    const result = generateIdMappingReport(mockReport);

    expect(result.events.counts.total).toBe(3);
    expect(result.events.counts.mapped).toBe(2);
    expect(result.events.counts.missing).toBe(1); // wa-e3 has no mapping
    expect(result.events.counts.duplicates).toBe(0);
  });

  it("identifies missing WA IDs", () => {
    const mockReport = createMockReport();
    const result = generateIdMappingReport(mockReport);

    expect(result.members.missingWaIds).toContain("wa-m5");
    expect(result.events.missingWaIds).toContain("wa-e3");
  });

  it("handles empty input gracefully", () => {
    const mockReport = createMockReport({
      members: {
        totalRows: 0,
        parsed: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        records: [],
      },
      events: {
        totalRows: 0,
        parsed: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        records: [],
      },
      idMapping: { members: [], events: [] },
    });

    const result = generateIdMappingReport(mockReport);

    expect(result.members.mappings).toHaveLength(0);
    expect(result.events.mappings).toHaveLength(0);
    expect(result.members.counts.total).toBe(0);
    expect(result.members.counts.missing).toBe(0);
  });
});

// =============================================================================
// analyzeIdMappings Tests
// =============================================================================

describe("analyzeIdMappings", () => {
  it("detects duplicate WA IDs", () => {
    const mappings = [
      { waId: "wa-1", murmurantId: "co-1" },
      { waId: "wa-2", murmurantId: "co-2" },
      { waId: "wa-1", murmurantId: "co-3" }, // duplicate
      { waId: "wa-3", murmurantId: "co-4" },
      { waId: "wa-2", murmurantId: "co-5" }, // duplicate
    ];
    const records = mappings.map((m, i) => ({
      _sourceRow: i + 2,
      _waId: m.waId,
      _murmurantId: m.murmurantId,
    }));

    const result = analyzeIdMappings(mappings, records);

    expect(result.duplicates).toHaveLength(2);
    expect(result.duplicates).toContain("wa-1");
    expect(result.duplicates).toContain("wa-2");
  });

  it("returns sorted duplicate list", () => {
    const mappings = [
      { waId: "wa-z", murmurantId: "co-1" },
      { waId: "wa-a", murmurantId: "co-2" },
      { waId: "wa-z", murmurantId: "co-3" },
      { waId: "wa-a", murmurantId: "co-4" },
    ];
    const records: { _waId?: string; _murmurantId?: string }[] = [];

    const result = analyzeIdMappings(mappings, records);

    expect(result.duplicates).toEqual(["wa-a", "wa-z"]);
  });

  it("detects missing IDs (records with waId but no mapping)", () => {
    const mappings = [
      { waId: "wa-1", murmurantId: "co-1" },
      { waId: "wa-2", murmurantId: "co-2" },
    ];
    const records = [
      { _sourceRow: 2, _waId: "wa-1", _murmurantId: "co-1" },
      { _sourceRow: 3, _waId: "wa-2", _murmurantId: "co-2" },
      { _sourceRow: 4, _waId: "wa-3" }, // missing mapping
      { _sourceRow: 5, _waId: "wa-4" }, // missing mapping
    ];

    const result = analyzeIdMappings(mappings, records);

    expect(result.missing).toHaveLength(2);
    expect(result.missing).toContain("wa-3");
    expect(result.missing).toContain("wa-4");
  });

  it("returns unique missing IDs", () => {
    const mappings: { waId: string; murmurantId: string }[] = [];
    const records = [
      { _sourceRow: 2, _waId: "wa-1" },
      { _sourceRow: 3, _waId: "wa-1" }, // same WA ID appears twice
      { _sourceRow: 4, _waId: "wa-2" },
    ];

    const result = analyzeIdMappings(mappings, records);

    expect(result.missing).toHaveLength(2);
    expect(result.missing).toEqual(["wa-1", "wa-2"]);
  });

  it("handles records without waId", () => {
    const mappings = [{ waId: "wa-1", murmurantId: "co-1" }];
    const records = [
      { _sourceRow: 2, _waId: "wa-1", _murmurantId: "co-1" },
      { _sourceRow: 3, _murmurantId: "co-2" }, // no _waId
      { _sourceRow: 4 }, // no _waId or _murmurantId
    ];

    const result = analyzeIdMappings(mappings, records);

    expect(result.missing).toHaveLength(0);
    expect(result.duplicates).toHaveLength(0);
  });

  it("handles empty inputs", () => {
    const result = analyzeIdMappings([], []);

    expect(result.duplicates).toHaveLength(0);
    expect(result.missing).toHaveLength(0);
  });
});

// =============================================================================
// writeIdMappingReport Tests
// =============================================================================

describe("writeIdMappingReport", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "id-mapping-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("writes report to correct path", () => {
    const report: IdMappingReport = {
      runId: "test-123",
      generatedAt: "2024-01-15T10:00:00.000Z",
      dryRun: true,
      members: {
        mappings: [],
        counts: { total: 0, mapped: 0, missing: 0, duplicates: 0 },
        duplicateWaIds: [],
        missingWaIds: [],
      },
      events: {
        mappings: [],
        counts: { total: 0, mapped: 0, missing: 0, duplicates: 0 },
        duplicateWaIds: [],
        missingWaIds: [],
      },
    };

    const filepath = writeIdMappingReport(report, tempDir, "2024-01-15T10-00-00-000Z");

    expect(fs.existsSync(filepath)).toBe(true);
    expect(filepath).toContain("id-map-dry-run-2024-01-15T10-00-00-000Z.json");
  });

  it("uses live mode in filename when dryRun is false", () => {
    const report: IdMappingReport = {
      runId: "test-123",
      generatedAt: "2024-01-15T10:00:00.000Z",
      dryRun: false,
      members: {
        mappings: [],
        counts: { total: 0, mapped: 0, missing: 0, duplicates: 0 },
        duplicateWaIds: [],
        missingWaIds: [],
      },
      events: {
        mappings: [],
        counts: { total: 0, mapped: 0, missing: 0, duplicates: 0 },
        duplicateWaIds: [],
        missingWaIds: [],
      },
    };

    const filepath = writeIdMappingReport(report, tempDir, "2024-01-15T10-00-00-000Z");

    expect(filepath).toContain("id-map-live-2024-01-15T10-00-00-000Z.json");
  });

  it("creates output directory if missing", () => {
    const nestedDir = path.join(tempDir, "nested", "output");
    const report: IdMappingReport = {
      runId: "test-123",
      generatedAt: "2024-01-15T10:00:00.000Z",
      dryRun: true,
      members: {
        mappings: [],
        counts: { total: 0, mapped: 0, missing: 0, duplicates: 0 },
        duplicateWaIds: [],
        missingWaIds: [],
      },
      events: {
        mappings: [],
        counts: { total: 0, mapped: 0, missing: 0, duplicates: 0 },
        duplicateWaIds: [],
        missingWaIds: [],
      },
    };

    const filepath = writeIdMappingReport(report, nestedDir, "2024-01-15T10-00-00-000Z");

    expect(fs.existsSync(filepath)).toBe(true);
    expect(fs.existsSync(nestedDir)).toBe(true);
  });

  it("writes valid JSON content", () => {
    const report: IdMappingReport = {
      runId: "test-123",
      generatedAt: "2024-01-15T10:00:00.000Z",
      dryRun: true,
      members: {
        mappings: [{ waId: "wa-1", murmurantId: "co-1", identifier: "test@test.com" }],
        counts: { total: 1, mapped: 1, missing: 0, duplicates: 0 },
        duplicateWaIds: [],
        missingWaIds: [],
      },
      events: {
        mappings: [],
        counts: { total: 0, mapped: 0, missing: 0, duplicates: 0 },
        duplicateWaIds: [],
        missingWaIds: [],
      },
    };

    const filepath = writeIdMappingReport(report, tempDir, "2024-01-15T10-00-00-000Z");
    const content = JSON.parse(fs.readFileSync(filepath, "utf-8"));

    expect(content.runId).toBe("test-123");
    expect(content.members.mappings[0].waId).toBe("wa-1");
  });

  it("produces deterministic output for same input", () => {
    const report: IdMappingReport = {
      runId: "test-123",
      generatedAt: "2024-01-15T10:00:00.000Z",
      dryRun: true,
      members: {
        mappings: [
          { waId: "wa-1", murmurantId: "co-1", identifier: "a@test.com" },
          { waId: "wa-2", murmurantId: "co-2", identifier: "b@test.com" },
        ],
        counts: { total: 2, mapped: 2, missing: 0, duplicates: 0 },
        duplicateWaIds: [],
        missingWaIds: [],
      },
      events: {
        mappings: [{ waId: "wa-e1", murmurantId: "co-e1", identifier: "Event" }],
        counts: { total: 1, mapped: 1, missing: 0, duplicates: 0 },
        duplicateWaIds: [],
        missingWaIds: [],
      },
    };

    const filepath1 = writeIdMappingReport(report, tempDir, "run1");
    const filepath2 = writeIdMappingReport(report, tempDir, "run2");

    const content1 = fs.readFileSync(filepath1, "utf-8");
    const content2 = fs.readFileSync(filepath2, "utf-8");

    // Same content (JSON structure), different filenames
    expect(JSON.parse(content1)).toEqual(JSON.parse(content2));
  });
});

// =============================================================================
// formatTimestamp Tests
// =============================================================================

describe("formatTimestamp", () => {
  it("replaces colons and periods with dashes", () => {
    const date = new Date("2024-01-15T10:30:45.123Z");
    const result = formatTimestamp(date);

    expect(result).toBe("2024-01-15T10-30-45-123Z");
    expect(result).not.toContain(":");
    expect(result).not.toContain(".");
  });

  it("uses current time when no date provided", () => {
    const result = formatTimestamp();

    // Should be a valid ISO-like timestamp string with dashes instead of colons/periods
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/);
    expect(result).not.toContain(":");
    expect(result).not.toContain(".");
  });
});
