#!/usr/bin/env npx tsx
/**
 * SBNC Migration Dry-Run
 *
 * Executes a read-only dry-run of SBNC (Santa Barbara Newcomers Club) migration.
 * This script NEVER writes to the database - it only validates and previews.
 *
 * Features:
 * - Always runs in dry-run mode (enforced, cannot be overridden)
 * - Outputs counts (members, events, registrations)
 * - Reports errors and warnings
 * - Generates preview artifacts for inspection
 * - Deterministic: same input always produces same validation results
 * - Aborts on validation ambiguity
 *
 * Usage:
 *   npm run migration:dry-run:sbnc
 *   npx tsx scripts/migration/run-sbnc-dry-run.ts
 *
 * Data files should be placed in:
 *   scripts/migration/sbnc-data/members/wa-members-export.csv
 *   scripts/migration/sbnc-data/events/wa-events-export.csv
 *   scripts/migration/sbnc-data/events/wa-registrations-export.csv
 *
 * Related: Issue #202 (WA Migration)
 */

import * as path from "path";
import * as fs from "fs";
import { MigrationEngine } from "./lib/migration-engine";
import { getDefaultConfigPath } from "./lib/config";
import type { MigrationRunOptions, MigrationReport } from "./lib/types";

// =============================================================================
// Constants - SBNC-specific configuration
// =============================================================================

const SBNC_DATA_DIR = path.join(__dirname, "sbnc-data");
const SBNC_REPORTS_DIR = path.join(__dirname, "reports", "sbnc");
const MEMBERS_FILE = "members/wa-members-export.csv";
const EVENTS_FILE = "events/wa-events-export.csv";
const REGISTRATIONS_FILE = "events/wa-registrations-export.csv";

// =============================================================================
// Types
// =============================================================================

interface DryRunSummary {
  timestamp: string;
  mode: "DRY_RUN";
  dataDirectory: string;
  filesFound: {
    members: boolean;
    events: boolean;
    registrations: boolean;
  };
  counts: {
    members: { total: number; wouldCreate: number; wouldUpdate: number; wouldSkip: number; errors: number };
    events: { total: number; wouldCreate: number; wouldUpdate: number; wouldSkip: number; errors: number };
    registrations: { total: number; wouldCreate: number; wouldUpdate: number; wouldSkip: number; errors: number };
  };
  errors: Array<{ entity: string; row: number; message: string; waId?: string }>;
  warnings: string[];
  previewArtifacts: string[];
}

// =============================================================================
// Validation
// =============================================================================

function validateDataDirectory(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check data directory exists
  if (!fs.existsSync(SBNC_DATA_DIR)) {
    errors.push(`SBNC data directory not found: ${SBNC_DATA_DIR}`);
    errors.push(`Create directory and add WA export CSV files.`);
    return { valid: false, errors, warnings };
  }

  // Check for at least one data file
  const membersPath = path.join(SBNC_DATA_DIR, MEMBERS_FILE);
  const eventsPath = path.join(SBNC_DATA_DIR, EVENTS_FILE);
  const registrationsPath = path.join(SBNC_DATA_DIR, REGISTRATIONS_FILE);

  const hasMembers = fs.existsSync(membersPath);
  const hasEvents = fs.existsSync(eventsPath);
  const hasRegistrations = fs.existsSync(registrationsPath);

  if (!hasMembers && !hasEvents && !hasRegistrations) {
    errors.push("No CSV data files found in SBNC data directory.");
    errors.push(`Expected files:`);
    errors.push(`  - ${MEMBERS_FILE}`);
    errors.push(`  - ${EVENTS_FILE}`);
    errors.push(`  - ${REGISTRATIONS_FILE}`);
    return { valid: false, errors, warnings };
  }

  // Warn about missing files
  if (!hasMembers) warnings.push(`Members file not found: ${MEMBERS_FILE}`);
  if (!hasEvents) warnings.push(`Events file not found: ${EVENTS_FILE}`);
  if (!hasRegistrations) warnings.push(`Registrations file not found: ${REGISTRATIONS_FILE}`);

  // Validate config exists
  const configPath = getDefaultConfigPath();
  if (!fs.existsSync(configPath)) {
    errors.push(`Migration config not found: ${configPath}`);
    return { valid: false, errors, warnings };
  }

  return { valid: true, errors, warnings };
}

// =============================================================================
// Output Formatting
// =============================================================================

function printHeader(): void {
  const divider = "=".repeat(70);
  console.log(`\n${divider}`);
  console.log("  SBNC Migration Dry-Run");
  console.log("  Santa Barbara Newcomers Club → Murmurant");
  console.log(`${divider}`);
  console.log(`\n  Mode:       DRY RUN (read-only, no database changes)`);
  console.log(`  Data Dir:   ${SBNC_DATA_DIR}`);
  console.log(`  Reports:    ${SBNC_REPORTS_DIR}`);
  console.log(`  Timestamp:  ${new Date().toISOString()}`);
  console.log();
}

function printFilesStatus(): void {
  const membersPath = path.join(SBNC_DATA_DIR, MEMBERS_FILE);
  const eventsPath = path.join(SBNC_DATA_DIR, EVENTS_FILE);
  const registrationsPath = path.join(SBNC_DATA_DIR, REGISTRATIONS_FILE);

  console.log("  Data Files:");
  console.log(`    Members:       ${fs.existsSync(membersPath) ? "✓ Found" : "✗ Not found"}`);
  console.log(`    Events:        ${fs.existsSync(eventsPath) ? "✓ Found" : "✗ Not found"}`);
  console.log(`    Registrations: ${fs.existsSync(registrationsPath) ? "✓ Found" : "✗ Not found"}`);
  console.log();
}

function printCounts(report: MigrationReport): void {
  const divider = "-".repeat(70);
  console.log(`\n${divider}`);
  console.log("  COUNTS (What Would Happen)");
  console.log(divider);

  const formatRow = (label: string, total: number, create: number, update: number, skip: number, errors: number) => {
    console.log(`  ${label.padEnd(15)} ${String(total).padStart(6)} total | ${String(create).padStart(5)} create | ${String(update).padStart(5)} update | ${String(skip).padStart(5)} skip | ${String(errors).padStart(5)} errors`);
  };

  formatRow("Members", report.members.totalRows, report.members.created, report.members.updated, report.members.skipped, report.members.errors);
  formatRow("Events", report.events.totalRows, report.events.created, report.events.updated, report.events.skipped, report.events.errors);
  formatRow("Registrations", report.registrations.totalRows, report.registrations.created, report.registrations.updated, report.registrations.skipped, report.registrations.errors);

  console.log(divider);
  formatRow("TOTAL", report.summary.totalRecords, report.summary.created, report.summary.updated, report.summary.skipped, report.summary.errors);
  console.log();
}

function printErrors(report: MigrationReport): void {
  if (report.errors.length === 0) {
    console.log("  ✓ No errors detected\n");
    return;
  }

  const divider = "-".repeat(70);
  console.log(`\n${divider}`);
  console.log(`  ERRORS (${report.errors.length} total)`);
  console.log(divider);

  // Group errors by entity
  const byEntity: Record<string, typeof report.errors> = {};
  for (const err of report.errors) {
    const key = err.entity || "unknown";
    if (!byEntity[key]) byEntity[key] = [];
    byEntity[key].push(err);
  }

  for (const [entity, errors] of Object.entries(byEntity)) {
    console.log(`\n  ${entity.toUpperCase()} (${errors.length}):`);
    // Show first 10 errors per entity
    for (const err of errors.slice(0, 10)) {
      const waIdStr = err.waId ? ` [WA:${err.waId}]` : "";
      console.log(`    Row ${err.sourceRow}${waIdStr}: ${err.message}`);
    }
    if (errors.length > 10) {
      console.log(`    ... and ${errors.length - 10} more`);
    }
  }
  console.log();
}

function printArtifacts(artifactPaths: string[]): void {
  const divider = "-".repeat(70);
  console.log(`${divider}`);
  console.log("  PREVIEW ARTIFACTS");
  console.log(divider);
  for (const p of artifactPaths) {
    console.log(`    ${p}`);
  }
  console.log();
}

function printVerdict(report: MigrationReport): void {
  const divider = "=".repeat(70);
  console.log(divider);

  if (report.summary.errors > 0) {
    console.log(`  ⚠️  DRY RUN COMPLETE - ${report.summary.errors} ERROR(S) DETECTED`);
    console.log(`     Review errors above before proceeding to live migration.`);
  } else {
    console.log(`  ✓  DRY RUN COMPLETE - NO ERRORS`);
    console.log(`     Safe to proceed with live migration when ready.`);
  }

  console.log(`\n  Duration: ${report.summary.duration_ms}ms`);
  console.log(`  Run ID:   ${report.runId}`);
  console.log(divider);
  console.log();
}

// =============================================================================
// Summary Generation
// =============================================================================

function generateSummary(report: MigrationReport, warnings: string[], artifactPaths: string[]): DryRunSummary {
  const membersPath = path.join(SBNC_DATA_DIR, MEMBERS_FILE);
  const eventsPath = path.join(SBNC_DATA_DIR, EVENTS_FILE);
  const registrationsPath = path.join(SBNC_DATA_DIR, REGISTRATIONS_FILE);

  return {
    timestamp: new Date().toISOString(),
    mode: "DRY_RUN",
    dataDirectory: SBNC_DATA_DIR,
    filesFound: {
      members: fs.existsSync(membersPath),
      events: fs.existsSync(eventsPath),
      registrations: fs.existsSync(registrationsPath),
    },
    counts: {
      members: {
        total: report.members.totalRows,
        wouldCreate: report.members.created,
        wouldUpdate: report.members.updated,
        wouldSkip: report.members.skipped,
        errors: report.members.errors,
      },
      events: {
        total: report.events.totalRows,
        wouldCreate: report.events.created,
        wouldUpdate: report.events.updated,
        wouldSkip: report.events.skipped,
        errors: report.events.errors,
      },
      registrations: {
        total: report.registrations.totalRows,
        wouldCreate: report.registrations.created,
        wouldUpdate: report.registrations.updated,
        wouldSkip: report.registrations.skipped,
        errors: report.registrations.errors,
      },
    },
    errors: report.errors.map((e) => ({
      entity: e.entity,
      row: e.sourceRow,
      message: e.message,
      waId: e.waId,
    })),
    warnings,
    previewArtifacts: artifactPaths,
  };
}

// =============================================================================
// Main Entry Point
// =============================================================================

async function main(): Promise<number> {
  printHeader();

  // Validate data directory
  const validation = validateDataDirectory();

  // Print warnings
  for (const warning of validation.warnings) {
    console.log(`  ⚠️  ${warning}`);
  }

  // Abort on validation errors (ambiguity)
  if (!validation.valid) {
    console.log("\n  ❌ ABORTED - Cannot proceed with dry-run:\n");
    for (const error of validation.errors) {
      console.log(`     ${error}`);
    }
    console.log("\n  Fix the issues above and re-run.\n");
    return 1;
  }

  printFilesStatus();

  // Ensure reports directory exists
  if (!fs.existsSync(SBNC_REPORTS_DIR)) {
    fs.mkdirSync(SBNC_REPORTS_DIR, { recursive: true });
  }

  // Build engine options - ALWAYS dry-run
  const membersPath = path.join(SBNC_DATA_DIR, MEMBERS_FILE);
  const eventsPath = path.join(SBNC_DATA_DIR, EVENTS_FILE);
  const registrationsPath = path.join(SBNC_DATA_DIR, REGISTRATIONS_FILE);

  const engineOptions: MigrationRunOptions = {
    dryRun: true, // ENFORCED - never false
    configPath: getDefaultConfigPath(),
    dataDir: SBNC_DATA_DIR,
    membersFile: fs.existsSync(membersPath) ? MEMBERS_FILE : undefined,
    eventsFile: fs.existsSync(eventsPath) ? EVENTS_FILE : undefined,
    registrationsFile: fs.existsSync(registrationsPath) ? REGISTRATIONS_FILE : undefined,
    outputDir: SBNC_REPORTS_DIR,
    verbose: true,
  };

  // Run migration engine in dry-run mode
  console.log("  Starting dry-run analysis...\n");
  const engine = new MigrationEngine(engineOptions);
  const report = await engine.run();

  // Collect artifact paths
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const artifactPaths = [
    path.join(SBNC_REPORTS_DIR, `migration-dry-run-${timestamp}.json`),
    path.join(SBNC_REPORTS_DIR, `sbnc-dry-run-summary-${timestamp}.json`),
  ];

  // Print results
  printCounts(report);
  printErrors(report);
  printArtifacts(artifactPaths);
  printVerdict(report);

  // Write summary artifact
  const summary = generateSummary(report, validation.warnings, artifactPaths);
  const summaryPath = path.join(SBNC_REPORTS_DIR, `sbnc-dry-run-summary-${timestamp}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`  Summary written to: ${summaryPath}\n`);

  // Exit code: 0 if no errors, 1 if errors
  return report.summary.errors > 0 ? 1 : 0;
}

// Run
main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`\n  ❌ FATAL ERROR: ${err.message}\n`);
    process.exit(1);
  });
