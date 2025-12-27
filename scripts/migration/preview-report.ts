#!/usr/bin/env npx tsx
/**
 * Migration Preview Report CLI
 *
 * Generates a preview report from a migration bundle without modifying
 * any database state.
 *
 * Usage:
 *   npx tsx scripts/migration/preview-report.ts --bundle <path> [options]
 *
 * Options:
 *   --bundle, -b    Path to migration bundle directory (required)
 *   --format, -f    Output format: json | markdown (default: markdown)
 *   --output, -o    Output file path (default: stdout)
 *   --help, -h      Show this help message
 *
 * Examples:
 *   npx tsx scripts/migration/preview-report.ts -b ./scripts/migration/sample-pack
 *   npx tsx scripts/migration/preview-report.ts -b ./bundle -f json -o report.json
 *
 * @module scripts/migration/preview-report
 */

import * as fs from 'fs';
import { generatePreviewReport, formatPreviewAsMarkdown } from './lib/preview';

// ---------------------------------------------------------------------------
// Argument Parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  bundlePath: string | null;
  format: 'json' | 'markdown';
  outputPath: string | null;
  help: boolean;
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    bundlePath: null,
    format: 'markdown',
    outputPath: null,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--bundle':
      case '-b':
        result.bundlePath = next;
        i++;
        break;
      case '--format':
      case '-f':
        if (next === 'json' || next === 'markdown') {
          result.format = next;
        } else {
          console.error('Invalid format: ' + next + '. Use "json" or "markdown".');
          process.exit(1);
        }
        i++;
        break;
      case '--output':
      case '-o':
        result.outputPath = next;
        i++;
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
    }
  }

  return result;
}

function showHelp(): void {
  console.log(`
Migration Preview Report Generator

Usage:
  npx tsx scripts/migration/preview-report.ts --bundle <path> [options]

Options:
  --bundle, -b    Path to migration bundle directory (required)
  --format, -f    Output format: json | markdown (default: markdown)
  --output, -o    Output file path (default: stdout)
  --help, -h      Show this help message

Examples:
  npx tsx scripts/migration/preview-report.ts -b ./scripts/migration/sample-pack
  npx tsx scripts/migration/preview-report.ts -b ./bundle -f json -o report.json

The preview report includes:
  - Entity counts (members, events, registrations)
  - Validation results and invariant checks
  - Sample data for visual verification
  - Content hash for determinism verification

No database writes are performed. This is a read-only operation.
`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  if (!args.bundlePath) {
    console.error('Error: --bundle is required');
    console.error('Run with --help for usage information');
    process.exit(1);
  }

  try {
    const report = generatePreviewReport({
      bundlePath: args.bundlePath,
    });

    let output: string;
    if (args.format === 'json') {
      output = JSON.stringify(report, null, 2);
    } else {
      output = formatPreviewAsMarkdown(report);
    }

    if (args.outputPath) {
      fs.writeFileSync(args.outputPath, output, 'utf-8');
      console.log('Report written to: ' + args.outputPath);
    } else {
      console.log(output);
    }

    // Exit with error code if any invariants failed
    const hasFailures = report.invariants.some((inv) => inv.status === 'fail');
    if (hasFailures) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error generating preview:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
