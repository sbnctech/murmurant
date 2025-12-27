#!/usr/bin/env npx tsx
/**
 * ClubOS Migration CLI Entry Point
 *
 * Invokes the migration engine to import data from Wild Apricot to ClubOS.
 *
 * Usage:
 *   npx tsx scripts/migration/migrate.ts [options]
 *
 * Options:
 *   --source-org <name>     Source organization identifier (default: "wild-apricot")
 *   --target-org <name>     Target organization identifier (default: "clubos")
 *   --dry-run               Run without making changes (default: true)
 *   --live                  Run with actual database writes (sets dry-run=false)
 *   --output-report <path>  Output directory for reports (default: scripts/migration/reports)
 *   --verbose               Enable verbose logging
 *   --config <path>         Path to migration config YAML
 *   --data-dir <path>       Directory containing CSV export files
 *   --members <file>        Members CSV filename (relative to data-dir)
 *   --events <file>         Events CSV filename (relative to data-dir)
 *   --registrations <file>  Registrations CSV filename (relative to data-dir)
 *   --yes                   Skip confirmation prompt for live runs
 *   --help                  Show this help message
 *
 * Examples:
 *   # Dry run with sample data
 *   npx tsx scripts/migration/migrate.ts
 *
 *   # Dry run with custom data directory
 *   npx tsx scripts/migration/migrate.ts --data-dir ./wa-export
 *
 *   # Live run (requires --yes for confirmation)
 *   npx tsx scripts/migration/migrate.ts --live --yes --data-dir ./wa-export
 *
 * Related: Issue #272 (A7: Migration CLI Entry Point)
 */

import * as path from "path";
import * as fs from "fs";
import * as readline from "readline";
import { MigrationEngine } from "./lib/migration-engine";
import { getDefaultConfigPath } from "./lib/config";
import type { MigrationRunOptions } from "./lib/types";

// =============================================================================
// Constants
// =============================================================================

const VALID_SOURCES = ["wild-apricot", "wa", "wildapricot"];
const VALID_TARGETS = ["clubos"];
const DEFAULT_SOURCE = "wild-apricot";
const DEFAULT_TARGET = "clubos";
const DEFAULT_REPORTS_DIR = path.join(__dirname, "reports");
const DEFAULT_DATA_DIR = path.join(__dirname, "sample-pack");
const DEFAULT_MEMBERS_FILE = "members/wa-members-export.csv";
const DEFAULT_EVENTS_FILE = "events/wa-events-export.csv";
const DEFAULT_REGISTRATIONS_FILE = "events/wa-registrations-export.csv";

// =============================================================================
// CLI Argument Parsing
// =============================================================================

export interface CLIArgs {
  sourceOrg: string;
  targetOrg: string;
  dryRun: boolean;
  outputReport: string;
  verbose: boolean;
  configPath: string;
  dataDir: string;
  membersFile?: string;
  eventsFile?: string;
  registrationsFile?: string;
  yes: boolean;
  help: boolean;
}

export function parseArgs(argv: string[]): CLIArgs {
  const args: CLIArgs = {
    sourceOrg: DEFAULT_SOURCE,
    targetOrg: DEFAULT_TARGET,
    dryRun: true,
    outputReport: DEFAULT_REPORTS_DIR,
    verbose: false,
    configPath: getDefaultConfigPath(),
    dataDir: DEFAULT_DATA_DIR,
    membersFile: undefined,
    eventsFile: undefined,
    registrationsFile: undefined,
    yes: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const nextArg = argv[i + 1];

    switch (arg) {
      case "--source-org":
        if (!nextArg || nextArg.startsWith("-")) {
          throw new Error("--source-org requires a value");
        }
        args.sourceOrg = nextArg;
        i++;
        break;

      case "--target-org":
        if (!nextArg || nextArg.startsWith("-")) {
          throw new Error("--target-org requires a value");
        }
        args.targetOrg = nextArg;
        i++;
        break;

      case "--dry-run":
        args.dryRun = true;
        break;

      case "--live":
        args.dryRun = false;
        break;

      case "--output-report":
        if (!nextArg || nextArg.startsWith("-")) {
          throw new Error("--output-report requires a path");
        }
        args.outputReport = nextArg;
        i++;
        break;

      case "--verbose":
      case "-v":
        args.verbose = true;
        break;

      case "--config":
        if (!nextArg || nextArg.startsWith("-")) {
          throw new Error("--config requires a path");
        }
        args.configPath = nextArg;
        i++;
        break;

      case "--data-dir":
        if (!nextArg || nextArg.startsWith("-")) {
          throw new Error("--data-dir requires a path");
        }
        args.dataDir = nextArg;
        i++;
        break;

      case "--members":
        if (!nextArg || nextArg.startsWith("-")) {
          throw new Error("--members requires a filename");
        }
        args.membersFile = nextArg;
        i++;
        break;

      case "--events":
        if (!nextArg || nextArg.startsWith("-")) {
          throw new Error("--events requires a filename");
        }
        args.eventsFile = nextArg;
        i++;
        break;

      case "--registrations":
        if (!nextArg || nextArg.startsWith("-")) {
          throw new Error("--registrations requires a filename");
        }
        args.registrationsFile = nextArg;
        i++;
        break;

      case "--yes":
      case "-y":
        args.yes = true;
        break;

      case "--help":
      case "-h":
        args.help = true;
        break;

      default:
        if (arg.startsWith("-")) {
          throw new Error(`Unknown option: ${arg}`);
        }
    }
  }

  return args;
}

// =============================================================================
// Validation
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateArgs(args: CLIArgs): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate source org
  const normalizedSource = args.sourceOrg.toLowerCase().replace(/[^a-z]/g, "");
  if (!VALID_SOURCES.some((s) => s.replace(/[^a-z]/g, "") === normalizedSource)) {
    errors.push(
      `Invalid --source-org: "${args.sourceOrg}". Valid options: ${VALID_SOURCES.join(", ")}`
    );
  }

  // Validate target org
  if (!VALID_TARGETS.includes(args.targetOrg.toLowerCase())) {
    errors.push(
      `Invalid --target-org: "${args.targetOrg}". Valid options: ${VALID_TARGETS.join(", ")}`
    );
  }

  // Validate config file exists
  const configPath = path.resolve(args.configPath);
  if (!fs.existsSync(configPath)) {
    errors.push(`Config file not found: ${configPath}`);
  }

  // Validate data directory exists
  const dataDir = path.resolve(args.dataDir);
  if (!fs.existsSync(dataDir)) {
    errors.push(`Data directory not found: ${dataDir}`);
  }

  // Validate output directory is writable (or can be created)
  const outputDir = path.resolve(args.outputReport);
  const outputParent = path.dirname(outputDir);
  if (!fs.existsSync(outputParent)) {
    warnings.push(`Output parent directory does not exist: ${outputParent} (will be created)`);
  }

  // Validate CSV files if specified
  if (args.membersFile) {
    const membersPath = path.resolve(args.dataDir, args.membersFile);
    if (!fs.existsSync(membersPath)) {
      errors.push(`Members file not found: ${membersPath}`);
    }
  }

  if (args.eventsFile) {
    const eventsPath = path.resolve(args.dataDir, args.eventsFile);
    if (!fs.existsSync(eventsPath)) {
      errors.push(`Events file not found: ${eventsPath}`);
    }
  }

  if (args.registrationsFile) {
    const registrationsPath = path.resolve(args.dataDir, args.registrationsFile);
    if (!fs.existsSync(registrationsPath)) {
      errors.push(`Registrations file not found: ${registrationsPath}`);
    }
  }

  // Check for default sample files if no files specified
  if (!args.membersFile && !args.eventsFile && !args.registrationsFile) {
    const defaultMembers = path.resolve(args.dataDir, DEFAULT_MEMBERS_FILE);
    const defaultEvents = path.resolve(args.dataDir, DEFAULT_EVENTS_FILE);
    const _defaultRegistrations = path.resolve(args.dataDir, DEFAULT_REGISTRATIONS_FILE);

    if (!fs.existsSync(defaultMembers) && !fs.existsSync(defaultEvents)) {
      warnings.push(
        `No CSV files specified and default sample files not found. ` +
          `Use --members, --events, or --registrations to specify files.`
      );
    }
  }

  // Live run without --yes requires confirmation
  if (!args.dryRun && !args.yes) {
    warnings.push("Live run requires --yes flag or interactive confirmation");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// Execution Plan Display
// =============================================================================

export function printExecutionPlan(args: CLIArgs): void {
  const divider = "=".repeat(60);

  console.log(`\n${divider}`);
  console.log("ClubOS Migration - Execution Plan");
  console.log(divider);

  console.log(`\nMode:        ${args.dryRun ? "DRY RUN (no database changes)" : "LIVE (will modify database)"}`);
  console.log(`Source:      ${args.sourceOrg}`);
  console.log(`Target:      ${args.targetOrg}`);
  console.log(`Config:      ${path.resolve(args.configPath)}`);
  console.log(`Data Dir:    ${path.resolve(args.dataDir)}`);
  console.log(`Reports Dir: ${path.resolve(args.outputReport)}`);
  console.log(`Verbose:     ${args.verbose ? "yes" : "no"}`);

  console.log("\nFiles to process:");
  const membersFile = args.membersFile || DEFAULT_MEMBERS_FILE;
  const eventsFile = args.eventsFile || DEFAULT_EVENTS_FILE;
  const registrationsFile = args.registrationsFile || DEFAULT_REGISTRATIONS_FILE;

  const membersPath = path.resolve(args.dataDir, membersFile);
  const eventsPath = path.resolve(args.dataDir, eventsFile);
  const registrationsPath = path.resolve(args.dataDir, registrationsFile);

  console.log(`  Members:       ${fs.existsSync(membersPath) ? membersFile : "(not found)"}`);
  console.log(`  Events:        ${fs.existsSync(eventsPath) ? eventsFile : "(not found)"}`);
  console.log(`  Registrations: ${fs.existsSync(registrationsPath) ? registrationsFile : "(not found)"}`);

  console.log(`\n${divider}\n`);
}

// =============================================================================
// Help Output
// =============================================================================

export function printHelp(): void {
  console.log(`
ClubOS Migration CLI

Imports data from Wild Apricot to ClubOS.

USAGE
  npx tsx scripts/migration/migrate.ts [options]

OPTIONS
  --source-org <name>     Source organization (default: "wild-apricot")
  --target-org <name>     Target organization (default: "clubos")
  --dry-run               Run without making changes (default)
  --live                  Run with actual database writes
  --output-report <path>  Output directory for reports
  --verbose, -v           Enable verbose logging
  --config <path>         Path to migration config YAML
  --data-dir <path>       Directory containing CSV export files
  --members <file>        Members CSV filename
  --events <file>         Events CSV filename
  --registrations <file>  Registrations CSV filename
  --yes, -y               Skip confirmation prompt for live runs
  --help, -h              Show this help message

EXAMPLES
  # Dry run with sample data
  npx tsx scripts/migration/migrate.ts

  # Dry run with custom data directory
  npx tsx scripts/migration/migrate.ts --data-dir ./wa-export

  # Live run (requires --yes)
  npx tsx scripts/migration/migrate.ts --live --yes --data-dir ./wa-export

  # Verbose dry run
  npx tsx scripts/migration/migrate.ts --verbose --data-dir ./wa-export

NOTES
  - Default mode is dry-run (safe to test without changes)
  - Live runs require --yes flag or interactive confirmation
  - Reports are written to scripts/migration/reports/ by default
  - See scripts/migration/README.md for more details
`);
}

// =============================================================================
// Confirmation Prompt
// =============================================================================

async function confirmLiveRun(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      "\n⚠️  You are about to run a LIVE migration that will modify the database.\n" +
        '   Type "yes" to continue, or anything else to abort: ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === "yes");
      }
    );
  });
}

// =============================================================================
// Main Entry Point
// =============================================================================

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  try {
    // Parse arguments
    const args = parseArgs(argv);

    // Show help if requested
    if (args.help) {
      printHelp();
      return 0;
    }

    // Validate arguments
    const validation = validateArgs(args);

    // Print warnings
    for (const warning of validation.warnings) {
      console.warn(`⚠️  Warning: ${warning}`);
    }

    // Exit on validation errors
    if (!validation.valid) {
      console.error("\n❌ Validation errors:");
      for (const error of validation.errors) {
        console.error(`   - ${error}`);
      }
      console.error("\nRun with --help for usage information.\n");
      return 1;
    }

    // Print execution plan
    printExecutionPlan(args);

    // Confirm live runs
    if (!args.dryRun && !args.yes) {
      const confirmed = await confirmLiveRun();
      if (!confirmed) {
        console.log("\nMigration aborted.\n");
        return 1;
      }
    }

    // Determine which files to process
    const membersFile = args.membersFile || DEFAULT_MEMBERS_FILE;
    const eventsFile = args.eventsFile || DEFAULT_EVENTS_FILE;
    const registrationsFile = args.registrationsFile || DEFAULT_REGISTRATIONS_FILE;

    const membersPath = path.resolve(args.dataDir, membersFile);
    const eventsPath = path.resolve(args.dataDir, eventsFile);
    const registrationsPath = path.resolve(args.dataDir, registrationsFile);

    // Build engine options
    const engineOptions: MigrationRunOptions = {
      dryRun: args.dryRun,
      configPath: args.configPath,
      dataDir: args.dataDir,
      membersFile: fs.existsSync(membersPath) ? membersFile : undefined,
      eventsFile: fs.existsSync(eventsPath) ? eventsFile : undefined,
      registrationsFile: fs.existsSync(registrationsPath) ? registrationsFile : undefined,
      outputDir: args.outputReport,
      verbose: args.verbose,
    };

    // Check if any files to process
    if (!engineOptions.membersFile && !engineOptions.eventsFile && !engineOptions.registrationsFile) {
      console.error("\n❌ No CSV files found to process.");
      console.error(`   Data directory: ${args.dataDir}`);
      console.error("   Use --members, --events, or --registrations to specify files.\n");
      return 1;
    }

    // Run migration engine exactly once
    const engine = new MigrationEngine(engineOptions);
    const report = await engine.run();

    // Exit with error code if there were errors
    if (report.summary.errors > 0) {
      console.log(`\n⚠️  Migration completed with ${report.summary.errors} error(s).\n`);
      return report.summary.errors > 10 ? 2 : 0; // Exit 2 for many errors
    }

    console.log("\n✅ Migration completed successfully.\n");
    return 0;
  } catch (error) {
    console.error(`\n❌ Fatal error: ${(error as Error).message}\n`);
    if (process.env.DEBUG) {
      console.error((error as Error).stack);
    }
    return 1;
  }
}

// Run if executed directly
if (require.main === module) {
  main().then((code) => process.exit(code));
}
