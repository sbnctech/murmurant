#!/usr/bin/env npx tsx
/**
 * Wild Apricot Resource Download Script
 *
 * Downloads tracked WA resources and stores them in Murmurant file storage.
 *
 * Run with: npx tsx scripts/importing/wa_download_resources.ts
 *
 * Options:
 *   --limit <N>         Maximum resources to download (default: 100)
 *   --batch-size <N>    Concurrent downloads (default: 5)
 *   --retry             Retry previously failed downloads
 *   --status            Show resource status only (no downloads)
 *   --help              Show this help message
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import {
  downloadPendingResources,
  retryFailedDownloads,
  getResourceStats,
  getFailedResources,
  type DownloadResult,
} from "@/lib/importing/wildapricot/resources";

// ============================================================================
// CLI Setup
// ============================================================================

interface Options {
  limit: number;
  batchSize: number;
  retry: boolean;
  statusOnly: boolean;
  help: boolean;
}

function showHelp(): void {
  console.log(`
Wild Apricot Resource Download Script

Downloads tracked WA resources to Murmurant file storage.
Run wa_discover_resources.ts first to track resources.

USAGE:
  npx tsx scripts/importing/wa_download_resources.ts [OPTIONS]

OPTIONS:
  --limit <N>       Maximum resources to download (default: 100)
  --batch-size <N>  Concurrent downloads (default: 5)
  --retry           Retry previously failed downloads
  --status          Show resource status only (no downloads)
  --help            Show this help message

EXAMPLES:
  # Download up to 100 pending resources
  npx tsx scripts/importing/wa_download_resources.ts

  # Download in larger batches
  npx tsx scripts/importing/wa_download_resources.ts --limit 500 --batch-size 10

  # Retry failed downloads
  npx tsx scripts/importing/wa_download_resources.ts --retry

  # Check status without downloading
  npx tsx scripts/importing/wa_download_resources.ts --status
`);
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    limit: 100,
    batchSize: 5,
    retry: false,
    statusOnly: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--limit" && i + 1 < args.length) {
      options.limit = parseInt(args[i + 1], 10);
      if (isNaN(options.limit) || options.limit < 1) {
        console.error("ERROR: --limit must be a positive number");
        process.exit(1);
      }
      i++;
    } else if (arg === "--batch-size" && i + 1 < args.length) {
      options.batchSize = parseInt(args[i + 1], 10);
      if (isNaN(options.batchSize) || options.batchSize < 1) {
        console.error("ERROR: --batch-size must be a positive number");
        process.exit(1);
      }
      i++;
    } else if (arg === "--retry") {
      options.retry = true;
    } else if (arg === "--status") {
      options.statusOnly = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg.startsWith("-")) {
      console.error(`ERROR: Unknown option: ${arg}`);
      process.exit(1);
    }
  }

  return options;
}

// ============================================================================
// Progress Display
// ============================================================================

function createProgressCallback() {
  let lastLine = "";

  return (completed: number, total: number, result: DownloadResult): void => {
    // Clear previous line
    if (lastLine) {
      process.stdout.write("\r" + " ".repeat(lastLine.length) + "\r");
    }

    const percent = Math.round((completed / total) * 100);
    const status = result.success ? "OK" : "FAIL";
    const urlShort = result.url.slice(0, 50) + (result.url.length > 50 ? "..." : "");

    lastLine = `[${completed}/${total}] ${percent}% ${status}: ${urlShort}`;
    process.stdout.write(lastLine);

    // Print newline on completion or failure
    if (completed === total || !result.success) {
      console.log("");
      if (!result.success && result.error) {
        console.log(`  Error: ${result.error.slice(0, 100)}`);
      }
    }
  };
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("  Wild Apricot Resource Download");
  console.log("=".repeat(60));
  console.log("");

  // Show current stats
  const stats = await getResourceStats();

  console.log("Resource Status:");
  console.log(`  Total tracked:  ${stats.totalDiscovered}`);
  console.log(`  Pending:        ${stats.pending}`);
  console.log(`  Downloaded:     ${stats.downloaded}`);
  console.log(`  Failed:         ${stats.failed}`);
  console.log(`  Skipped:        ${stats.skipped}`);
  console.log("");

  // Status only mode
  if (options.statusOnly) {
    if (stats.failed > 0) {
      console.log("Failed resources (sample):");
      const failed = await getFailedResources(5);
      for (const resource of failed) {
        console.log(`  ${resource.waResourceUrl.slice(0, 60)}...`);
        console.log(`    Error: ${resource.failureReason?.slice(0, 60) || "Unknown"}`);
      }
      console.log("");
    }
    process.exit(0);
  }

  // Retry mode
  if (options.retry) {
    if (stats.failed === 0) {
      console.log("No failed resources to retry.");
      process.exit(0);
    }

    console.log(`Retrying up to ${Math.min(options.limit, stats.failed)} failed resources...`);
    console.log("");

    const result = await retryFailedDownloads(options.limit);

    console.log("");
    console.log("=".repeat(60));
    console.log("  Retry Results");
    console.log("=".repeat(60));
    console.log("");
    console.log(`Retried:   ${result.retried}`);
    console.log(`Succeeded: ${result.succeeded}`);
    console.log(`Failed:    ${result.failed}`);
    console.log("");

    process.exit(result.failed > 0 ? 1 : 0);
  }

  // Normal download mode
  if (stats.pending === 0) {
    console.log("No pending resources to download.");
    console.log("");
    if (stats.failed > 0) {
      console.log("To retry failed downloads, run with --retry");
    }
    process.exit(0);
  }

  const toDownload = Math.min(options.limit, stats.pending);
  console.log(`Downloading ${toDownload} resources (batch size: ${options.batchSize})...`);
  console.log("");

  const startTime = Date.now();
  const progressCallback = createProgressCallback();

  const result = await downloadPendingResources(
    options.batchSize,
    options.limit,
    progressCallback
  );

  const elapsed = Math.round((Date.now() - startTime) / 1000);

  console.log("");
  console.log("=".repeat(60));
  console.log("  Download Results");
  console.log("=".repeat(60));
  console.log("");
  console.log(`Downloaded: ${result.downloaded}`);
  console.log(`Failed:     ${result.failed}`);
  console.log(`Time:       ${elapsed}s`);
  console.log("");

  // Show updated stats
  const finalStats = await getResourceStats();
  console.log("Updated Status:");
  console.log(`  Pending:    ${finalStats.pending}`);
  console.log(`  Downloaded: ${finalStats.downloaded}`);
  console.log(`  Failed:     ${finalStats.failed}`);
  console.log("");

  if (finalStats.pending > 0) {
    console.log(`${finalStats.pending} resources still pending. Run again to continue.`);
  }
  if (finalStats.failed > 0) {
    console.log(`${finalStats.failed} failed resources. Run with --retry to retry them.`);
  }

  console.log("");
  process.exit(result.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(2);
});
