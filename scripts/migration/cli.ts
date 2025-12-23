#!/usr/bin/env npx tsx
/**
 * ClubOS Migration CLI
 *
 * Orchestrates the staged migration pipeline from Wild Apricot (or ClubExpress)
 * to ClubOS with parallel simulation and steward sign-off gates.
 *
 * Usage:
 *   npx tsx scripts/migration/cli.ts --help
 *   npx tsx scripts/migration/cli.ts stages
 *   npx tsx scripts/migration/cli.ts run --stage extract --dry-run
 */

import { getStageOrder, isStageRegistered, type StageName } from './engine/migration-engine';

// ============================================================================
// CLI Commands
// ============================================================================

const COMMANDS = {
  stages: 'List all migration stages and their status',
  run: 'Run migration (use --stage to run specific stage)',
  status: 'Show status of current/last migration run',
  report: 'Generate migration report',
  help: 'Show this help message',
} as const;

type Command = keyof typeof COMMANDS;

// ============================================================================
// Stage Descriptions
// ============================================================================

const STAGE_DESCRIPTIONS: Record<StageName, string> = {
  extract: 'Ingest and validate source platform exports (CSV, JSON)',
  normalize: 'Convert source records to canonical ClubOS models',
  simulate: 'Replay events against ClubOS logic, compare with ground truth',
  load: 'Write records to sandbox database (never production)',
  verify: 'Run invariant checks, produce verification report',
  sync: 'Incremental sync of deltas from source platform',
  cutover: 'Final readiness check before source platform shutdown',
};

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0] as Command | undefined;

  if (!command || command === 'help' || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  switch (command) {
    case 'stages':
      printStages();
      break;
    case 'run':
      printRunPlaceholder(args.slice(1));
      break;
    case 'status':
      printStatusPlaceholder();
      break;
    case 'report':
      printReportPlaceholder();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run with --help for usage information');
      process.exit(1);
  }
}

// ============================================================================
// Command Handlers
// ============================================================================

function printHelp(): void {
  console.log(`
ClubOS Migration CLI
====================

Orchestrates staged migration from Wild Apricot to ClubOS.

Usage:
  npx tsx scripts/migration/cli.ts <command> [options]

Commands:
${Object.entries(COMMANDS)
  .map(([cmd, desc]) => `  ${cmd.padEnd(12)} ${desc}`)
  .join('\n')}

Options:
  --dry-run          Preview changes without writing to database
  --stage <name>     Run specific stage (extract, normalize, simulate, etc.)
  --data-dir <path>  Directory containing source platform exports
  --config <path>    Path to migration config YAML
  --verbose          Enable verbose output
  --help, -h         Show this help message

Examples:
  # List all stages
  npx tsx scripts/migration/cli.ts stages

  # Dry run extract stage
  npx tsx scripts/migration/cli.ts run --stage extract --dry-run

  # Run full pipeline with sample data
  npx tsx scripts/migration/cli.ts run --dry-run --data-dir ./sample-pack

  # Run with real WA exports
  npx tsx scripts/migration/cli.ts run --data-dir ./wa-exports --dry-run

Philosophy:
  This migration follows the "wing-walk" approach:
  - Parallel simulation first (prove parity before cutover)
  - Backend-first validation (CLI + reports, not UI)
  - Reversible at every step (dry-run, diff, rollback)
  - Steward sign-off gates (human approval required)

See docs/migration/README.md for full documentation.
`);
}

function printStages(): void {
  console.log(`
Migration Stages
================

The migration proceeds through these stages in order:
`);

  const stageOrder = getStageOrder();

  stageOrder.forEach((stage, index) => {
    const registered = isStageRegistered(stage);
    const status = registered ? '[READY]' : '[NOT IMPLEMENTED]';
    const statusColor = registered ? '\x1b[32m' : '\x1b[33m'; // green or yellow
    const reset = '\x1b[0m';

    console.log(`  ${index + 1}. ${stage.padEnd(12)} ${statusColor}${status}${reset}`);
    console.log(`     ${STAGE_DESCRIPTIONS[stage]}`);
    console.log();
  });

  console.log(`
Stage Flow:
  extract → normalize → simulate → load → verify → sync → cutover
                                    ↓
                              [sandbox DB]

Notes:
  - Each stage can be run independently
  - Failures halt the pipeline (fail-fast)
  - All stages support --dry-run mode
  - Cutover requires explicit steward sign-off
`);
}

function printRunPlaceholder(args: string[]): void {
  const hasStage = args.includes('--stage');
  const isDryRun = args.includes('--dry-run');

  console.log(`
Migration Run (Placeholder)
===========================

Stage executors are not yet implemented. This is a scaffold.

Requested options:
  --stage:   ${hasStage ? args[args.indexOf('--stage') + 1] || '(missing value)' : '(all stages)'}
  --dry-run: ${isDryRun}

To implement:
  1. Register stage executors in engine/migration-engine.ts
  2. Implement stage logic in stages/*.ts
  3. Wire up CLI args to MigrationEngineOptions

See docs/migration/README.md for stage specifications.
`);
}

function printStatusPlaceholder(): void {
  console.log(`
Migration Status (Placeholder)
==============================

No migration runs recorded yet.

Status tracking will show:
  - Current/last run ID
  - Stages completed
  - Pass/fail status per stage
  - Cutover readiness verdict
`);
}

function printReportPlaceholder(): void {
  console.log(`
Migration Report (Placeholder)
==============================

No reports available.

Reports will include:
  - Machine-readable JSON with stage results
  - Human-readable summary
  - Invariant check results
  - ID mappings (WA → ClubOS)
  - Cutover readiness verdict

Reports are written to: scripts/migration/reports/
`);
}

// ============================================================================
// Entry Point
// ============================================================================

main();
