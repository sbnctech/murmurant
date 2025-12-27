/**
 * ID Mapping Report Generation
 *
 * Produces deterministic mapping files from source WA IDs to ClubOS IDs
 * with duplicate detection and missing ID reporting.
 *
 * Related: Issue #273 (A8: ID Mapping & Report Generation)
 */

import * as fs from "fs";
import * as path from "path";
import type { MigrationReport } from "./types";

// =============================================================================
// Types
// =============================================================================

export interface IdMappingEntry {
  waId: string;
  clubosId: string;
  identifier?: string; // email for members, title for events
}

export interface IdMappingReport {
  runId: string;
  generatedAt: string;
  dryRun: boolean;
  members: {
    mappings: IdMappingEntry[];
    counts: {
      total: number;
      mapped: number;
      missing: number;
      duplicates: number;
    };
    duplicateWaIds: string[];
    missingWaIds: string[];
  };
  events: {
    mappings: IdMappingEntry[];
    counts: {
      total: number;
      mapped: number;
      missing: number;
      duplicates: number;
    };
    duplicateWaIds: string[];
    missingWaIds: string[];
  };
}

// =============================================================================
// ID Mapping Generation
// =============================================================================

/**
 * Generates an ID mapping report from a migration report.
 * Detects duplicates and missing IDs.
 */
export function generateIdMappingReport(report: MigrationReport): IdMappingReport {
  const memberAnalysis = analyzeIdMappings(
    report.idMapping.members,
    report.members.records
  );
  const eventAnalysis = analyzeIdMappings(
    report.idMapping.events,
    report.events.records
  );

  return {
    runId: report.runId,
    generatedAt: new Date().toISOString(),
    dryRun: report.dryRun,
    members: {
      mappings: report.idMapping.members.map((m) => ({
        waId: m.waId,
        clubosId: m.clubosId,
        identifier: m.email,
      })),
      counts: {
        total: report.members.parsed,
        mapped: report.idMapping.members.length,
        missing: memberAnalysis.missing.length,
        duplicates: memberAnalysis.duplicates.length,
      },
      duplicateWaIds: memberAnalysis.duplicates,
      missingWaIds: memberAnalysis.missing,
    },
    events: {
      mappings: report.idMapping.events.map((e) => ({
        waId: e.waId,
        clubosId: e.clubosId,
        identifier: e.title,
      })),
      counts: {
        total: report.events.parsed,
        mapped: report.idMapping.events.length,
        missing: eventAnalysis.missing.length,
        duplicates: eventAnalysis.duplicates.length,
      },
      duplicateWaIds: eventAnalysis.duplicates,
      missingWaIds: eventAnalysis.missing,
    },
  };
}

/**
 * Analyzes ID mappings for duplicates and missing entries.
 */
export function analyzeIdMappings(
  mappings: { waId: string; clubosId: string }[],
  records: { _waId?: string; _clubosId?: string }[]
): { duplicates: string[]; missing: string[] } {
  // Find duplicate WA IDs in mappings
  const waIdCounts = new Map<string, number>();
  for (const m of mappings) {
    waIdCounts.set(m.waId, (waIdCounts.get(m.waId) || 0) + 1);
  }
  const duplicates = [...waIdCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([waId]) => waId)
    .sort();

  // Find records with WA ID but no ClubOS ID mapping
  const mappedWaIds = new Set(mappings.map((m) => m.waId));
  const missing = records
    .filter((r) => r._waId && !mappedWaIds.has(r._waId))
    .map((r) => r._waId!)
    .filter((id, i, arr) => arr.indexOf(id) === i) // unique
    .sort();

  return { duplicates, missing };
}

// =============================================================================
// File Output
// =============================================================================

/**
 * Writes the ID mapping report to a JSON file.
 * Returns the path to the written file.
 */
export function writeIdMappingReport(
  report: IdMappingReport,
  outputDir: string,
  timestamp: string
): string {
  const dir = path.resolve(outputDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const mode = report.dryRun ? "dry-run" : "live";
  const filename = `id-map-${mode}-${timestamp}.json`;
  const filepath = path.join(dir, filename);

  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

  return filepath;
}

/**
 * Formats timestamp for filenames (replaces : and . with -).
 */
export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, "-");
}
