/**
 * Migration Bundle Invariants Tests
 *
 * Tests that verify the migration bundle output is deterministic,
 * properly structured, and contains all expected artifacts.
 *
 * Related: Issue #274 (A9: Migration Unit Tests)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  generateIdMappingReport,
  writeIdMappingReport,
  formatTimestamp,
  type IdMappingReport,
} from "../../../scripts/migration/lib/id-mapping";
import type { MigrationReport, EntityReport } from "../../../scripts/migration/lib/types";

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockEntityReport(overrides: Partial<EntityReport> = {}): EntityReport {
  return {
    totalRows: 5,
    parsed: 5,
    created: 3,
    updated: 1,
    skipped: 1,
    errors: 0,
    records: [],
    ...overrides,
  };
}

function createMockMigrationReport(overrides: Partial<MigrationReport> = {}): MigrationReport {
  return {
    runId: "test-run-12345678-1234-1234-1234-123456789012",
    startedAt: new Date("2024-03-15T10:00:00.000Z"),
    completedAt: new Date("2024-03-15T10:00:05.000Z"),
    dryRun: true,
    config: {
      source: "wild-apricot",
      target: "clubos",
      version: "1.0",
    },
    summary: {
      totalRecords: 10,
      created: 6,
      updated: 2,
      skipped: 2,
      errors: 0,
      duration_ms: 5000,
    },
    members: createMockEntityReport({
      records: [
        { _sourceRow: 2, _waId: "WA001", _clubosId: "member-1", _action: "create" },
        { _sourceRow: 3, _waId: "WA002", _clubosId: "member-2", _action: "create" },
        { _sourceRow: 4, _waId: "WA003", _clubosId: "member-3", _action: "update" },
      ],
    }),
    events: createMockEntityReport({
      totalRows: 3,
      parsed: 3,
      created: 2,
      updated: 0,
      skipped: 1,
      records: [
        { _sourceRow: 2, _waId: "EVT001", _clubosId: "event-1", _action: "create" },
        { _sourceRow: 3, _waId: "EVT002", _clubosId: "event-2", _action: "create" },
        { _sourceRow: 4, _waId: "EVT003", _clubosId: "event-3", _action: "skip" },
      ],
    }),
    registrations: createMockEntityReport({
      totalRows: 2,
      parsed: 2,
      created: 1,
      updated: 1,
      skipped: 0,
      records: [],
    }),
    errors: [],
    idMapping: {
      members: [
        { waId: "WA001", clubosId: "member-1", email: "alice@example.com" },
        { waId: "WA002", clubosId: "member-2", email: "bob@example.com" },
        { waId: "WA003", clubosId: "member-3", email: "carol@example.com" },
      ],
      events: [
        { waId: "EVT001", clubosId: "event-1", title: "Welcome Coffee" },
        { waId: "EVT002", clubosId: "event-2", title: "Wine Tasting" },
      ],
    },
    ...overrides,
  };
}

// =============================================================================
// Bundle Structure Tests
// =============================================================================

describe("Migration Bundle Structure", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bundle-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("ID mapping file structure", () => {
    it("produces valid JSON structure", () => {
      const report = createMockMigrationReport();
      const idMapReport = generateIdMappingReport(report);

      expect(idMapReport.runId).toBe(report.runId);
      expect(idMapReport.dryRun).toBe(report.dryRun);
      expect(idMapReport.generatedAt).toBeDefined();
      expect(idMapReport.members).toBeDefined();
      expect(idMapReport.events).toBeDefined();
    });

    it("includes all required fields in member mappings", () => {
      const report = createMockMigrationReport();
      const idMapReport = generateIdMappingReport(report);

      idMapReport.members.mappings.forEach((m) => {
        expect(m).toHaveProperty("waId");
        expect(m).toHaveProperty("clubosId");
        expect(m).toHaveProperty("identifier");
      });
    });

    it("includes all required fields in event mappings", () => {
      const report = createMockMigrationReport();
      const idMapReport = generateIdMappingReport(report);

      idMapReport.events.mappings.forEach((e) => {
        expect(e).toHaveProperty("waId");
        expect(e).toHaveProperty("clubosId");
        expect(e).toHaveProperty("identifier");
      });
    });

    it("includes counts for each entity type", () => {
      const report = createMockMigrationReport();
      const idMapReport = generateIdMappingReport(report);

      expect(idMapReport.members.counts).toEqual({
        total: 5,
        mapped: 3,
        missing: 0,
        duplicates: 0,
      });

      expect(idMapReport.events.counts).toEqual({
        total: 3,
        mapped: 2,
        missing: 1, // EVT003 is skipped but has _waId, no clubosId in mapping
        duplicates: 0,
      });
    });
  });

  describe("file naming conventions", () => {
    it("uses 'dry-run' in filename for dry-run mode", () => {
      const report: IdMappingReport = {
        runId: "test",
        generatedAt: new Date().toISOString(),
        dryRun: true,
        members: { mappings: [], counts: { total: 0, mapped: 0, missing: 0, duplicates: 0 }, duplicateWaIds: [], missingWaIds: [] },
        events: { mappings: [], counts: { total: 0, mapped: 0, missing: 0, duplicates: 0 }, duplicateWaIds: [], missingWaIds: [] },
      };

      const filepath = writeIdMappingReport(report, tempDir, "2024-03-15T10-00-00-000Z");
      expect(path.basename(filepath)).toBe("id-map-dry-run-2024-03-15T10-00-00-000Z.json");
    });

    it("uses 'live' in filename for live mode", () => {
      const report: IdMappingReport = {
        runId: "test",
        generatedAt: new Date().toISOString(),
        dryRun: false,
        members: { mappings: [], counts: { total: 0, mapped: 0, missing: 0, duplicates: 0 }, duplicateWaIds: [], missingWaIds: [] },
        events: { mappings: [], counts: { total: 0, mapped: 0, missing: 0, duplicates: 0 }, duplicateWaIds: [], missingWaIds: [] },
      };

      const filepath = writeIdMappingReport(report, tempDir, "2024-03-15T10-00-00-000Z");
      expect(path.basename(filepath)).toBe("id-map-live-2024-03-15T10-00-00-000Z.json");
    });

    it("timestamp format contains no colons or periods", () => {
      const ts = formatTimestamp(new Date("2024-03-15T10:30:45.123Z"));

      expect(ts).not.toContain(":");
      expect(ts).not.toContain(".");
      expect(ts).toBe("2024-03-15T10-30-45-123Z");
    });
  });
});

// =============================================================================
// Determinism Tests
// =============================================================================

describe("Bundle Determinism", () => {
  describe("ID mapping ordering", () => {
    it("member mappings preserve input order", () => {
      const report = createMockMigrationReport();
      const idMapReport = generateIdMappingReport(report);

      const waIds = idMapReport.members.mappings.map((m) => m.waId);
      expect(waIds).toEqual(["WA001", "WA002", "WA003"]);
    });

    it("event mappings preserve input order", () => {
      const report = createMockMigrationReport();
      const idMapReport = generateIdMappingReport(report);

      const waIds = idMapReport.events.mappings.map((e) => e.waId);
      expect(waIds).toEqual(["EVT001", "EVT002"]);
    });

    it("same input produces same output", () => {
      const report = createMockMigrationReport();

      const result1 = generateIdMappingReport(report);
      const result2 = generateIdMappingReport(report);

      expect(result1.members.mappings).toEqual(result2.members.mappings);
      expect(result1.events.mappings).toEqual(result2.events.mappings);
      expect(result1.members.counts).toEqual(result2.members.counts);
      expect(result1.events.counts).toEqual(result2.events.counts);
    });
  });

  describe("timestamp handling", () => {
    it("formatTimestamp produces consistent format", () => {
      const date = new Date("2024-03-15T10:30:45.123Z");

      const ts1 = formatTimestamp(date);
      const ts2 = formatTimestamp(date);

      expect(ts1).toBe(ts2);
      expect(ts1).toBe("2024-03-15T10-30-45-123Z");
    });

    it("generatedAt is ISO format string", () => {
      const report = createMockMigrationReport();
      const idMapReport = generateIdMappingReport(report);

      // Should be parseable as ISO date
      const parsed = new Date(idMapReport.generatedAt);
      expect(parsed.toISOString()).toBe(idMapReport.generatedAt);
    });
  });
});

// =============================================================================
// Content Validation Tests
// =============================================================================

describe("Bundle Content Validation", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "content-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("JSON validity", () => {
    it("written file is valid JSON", () => {
      const report = createMockMigrationReport();
      const idMapReport = generateIdMappingReport(report);
      const filepath = writeIdMappingReport(idMapReport, tempDir, "test-ts");

      const content = fs.readFileSync(filepath, "utf-8");
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it("written file preserves all data", () => {
      const report = createMockMigrationReport();
      const idMapReport = generateIdMappingReport(report);
      const filepath = writeIdMappingReport(idMapReport, tempDir, "test-ts");

      const content = JSON.parse(fs.readFileSync(filepath, "utf-8"));
      expect(content.runId).toBe(idMapReport.runId);
      expect(content.dryRun).toBe(idMapReport.dryRun);
      expect(content.members.mappings).toEqual(idMapReport.members.mappings);
      expect(content.events.mappings).toEqual(idMapReport.events.mappings);
    });

    it("JSON is formatted with 2-space indentation", () => {
      const report = createMockMigrationReport();
      const idMapReport = generateIdMappingReport(report);
      const filepath = writeIdMappingReport(idMapReport, tempDir, "test-ts");

      const content = fs.readFileSync(filepath, "utf-8");
      // Check for 2-space indentation
      expect(content).toContain("\n  ");
    });
  });

  describe("counts accuracy", () => {
    it("mapped count equals mappings array length", () => {
      const report = createMockMigrationReport();
      const idMapReport = generateIdMappingReport(report);

      expect(idMapReport.members.counts.mapped).toBe(idMapReport.members.mappings.length);
      expect(idMapReport.events.counts.mapped).toBe(idMapReport.events.mappings.length);
    });

    it("duplicates array length matches count", () => {
      const reportWithDupes = createMockMigrationReport({
        idMapping: {
          members: [
            { waId: "WA001", clubosId: "m-1", email: "a@test.com" },
            { waId: "WA001", clubosId: "m-2", email: "b@test.com" }, // duplicate
            { waId: "WA002", clubosId: "m-3", email: "c@test.com" },
          ],
          events: [],
        },
      });

      const idMapReport = generateIdMappingReport(reportWithDupes);

      expect(idMapReport.members.counts.duplicates).toBe(idMapReport.members.duplicateWaIds.length);
      expect(idMapReport.members.duplicateWaIds).toContain("WA001");
    });

    it("missing array length matches count", () => {
      const reportWithMissing = createMockMigrationReport({
        members: createMockEntityReport({
          records: [
            { _sourceRow: 2, _waId: "WA001", _clubosId: "m-1", _action: "create" },
            { _sourceRow: 3, _waId: "WA002", _action: "skip" }, // missing clubosId
          ],
        }),
        idMapping: {
          members: [{ waId: "WA001", clubosId: "m-1", email: "a@test.com" }],
          events: [],
        },
      });

      const idMapReport = generateIdMappingReport(reportWithMissing);

      expect(idMapReport.members.counts.missing).toBe(idMapReport.members.missingWaIds.length);
      expect(idMapReport.members.missingWaIds).toContain("WA002");
    });
  });
});

// =============================================================================
// Error Scenarios Tests
// =============================================================================

describe("Bundle Error Scenarios", () => {
  describe("empty data handling", () => {
    it("handles empty members list", () => {
      const report = createMockMigrationReport({
        members: createMockEntityReport({ totalRows: 0, parsed: 0, records: [] }),
        idMapping: { members: [], events: [] },
      });

      const idMapReport = generateIdMappingReport(report);

      expect(idMapReport.members.mappings).toEqual([]);
      expect(idMapReport.members.counts.total).toBe(0);
      expect(idMapReport.members.counts.mapped).toBe(0);
    });

    it("handles empty events list", () => {
      const report = createMockMigrationReport({
        events: createMockEntityReport({ totalRows: 0, parsed: 0, records: [] }),
        idMapping: { members: [], events: [] },
      });

      const idMapReport = generateIdMappingReport(report);

      expect(idMapReport.events.mappings).toEqual([]);
      expect(idMapReport.events.counts.total).toBe(0);
    });

    it("handles completely empty report", () => {
      const report = createMockMigrationReport({
        members: createMockEntityReport({ totalRows: 0, parsed: 0, records: [] }),
        events: createMockEntityReport({ totalRows: 0, parsed: 0, records: [] }),
        registrations: createMockEntityReport({ totalRows: 0, parsed: 0, records: [] }),
        idMapping: { members: [], events: [] },
      });

      const idMapReport = generateIdMappingReport(report);

      expect(idMapReport.members.mappings).toEqual([]);
      expect(idMapReport.events.mappings).toEqual([]);
      expect(idMapReport.members.counts.total).toBe(0);
      expect(idMapReport.events.counts.total).toBe(0);
    });
  });

  describe("missing identifiers", () => {
    it("handles mappings without email identifier", () => {
      const report = createMockMigrationReport({
        idMapping: {
          members: [{ waId: "WA001", clubosId: "m-1" }], // no email
          events: [],
        },
      });

      const idMapReport = generateIdMappingReport(report);

      expect(idMapReport.members.mappings[0].identifier).toBeUndefined();
    });

    it("handles mappings without title identifier", () => {
      const report = createMockMigrationReport({
        idMapping: {
          members: [],
          events: [{ waId: "EVT001", clubosId: "e-1" }], // no title
        },
      });

      const idMapReport = generateIdMappingReport(report);

      expect(idMapReport.events.mappings[0].identifier).toBeUndefined();
    });
  });
});
