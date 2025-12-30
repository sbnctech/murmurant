#!/usr/bin/env npx tsx
/**
 * Wild Apricot Resource Discovery Script
 *
 * Scans imported content (events, pages) for WA-hosted resources and
 * tracks them for download.
 *
 * Run with: npx tsx scripts/importing/wa_discover_resources.ts
 *
 * Options:
 *   --source <type>     Source to scan: events, pages, all (default: all)
 *   --dry-run           Preview mode (show what would be discovered)
 *   --help              Show this help message
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { prisma } from "@/lib/prisma";
import {
  discoverResources,
  extractWaUrls,
  getResourceStats,
} from "@/lib/importing/wildapricot/resources";

// ============================================================================
// CLI Setup
// ============================================================================

type SourceType = "events" | "pages" | "all";

interface Options {
  source: SourceType;
  dryRun: boolean;
  help: boolean;
}

function showHelp(): void {
  console.log(`
Wild Apricot Resource Discovery Script

Scans imported content for WA-hosted resources (images, PDFs, files) and
tracks them for download migration.

USAGE:
  npx tsx scripts/importing/wa_discover_resources.ts [OPTIONS]

OPTIONS:
  --source <type>   Source to scan: events, pages, all (default: all)
  --dry-run         Preview mode (show what would be discovered, no DB writes)
  --help            Show this help message

EXAMPLES:
  # Discover resources in all content
  npx tsx scripts/importing/wa_discover_resources.ts

  # Preview what would be found in events only
  npx tsx scripts/importing/wa_discover_resources.ts --source events --dry-run

  # Scan only pages
  npx tsx scripts/importing/wa_discover_resources.ts --source pages
`);
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    source: "all",
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--source" && i + 1 < args.length) {
      const source = args[i + 1] as SourceType;
      if (!["events", "pages", "all"].includes(source)) {
        console.error(`ERROR: Invalid source type: ${source}`);
        console.error("Valid options: events, pages, all");
        process.exit(1);
      }
      options.source = source;
      i++;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
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
// Discovery Logic
// ============================================================================

interface DiscoveryResult {
  source: string;
  resourcesFound: number;
  newResources: number;
  urls: string[];
}

async function scanEvents(dryRun: boolean): Promise<DiscoveryResult[]> {
  console.log("Scanning events...");

  const events = await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      description: true,
    },
    where: {
      description: { not: null },
    },
  });

  console.log(`  Found ${events.length} events with descriptions`);

  const results: DiscoveryResult[] = [];

  for (const event of events) {
    if (!event.description) continue;

    const urls = extractWaUrls(event.description);
    if (urls.length === 0) continue;

    const sourceId = `event:${event.id}:description`;

    if (dryRun) {
      results.push({
        source: sourceId,
        resourcesFound: urls.length,
        newResources: urls.length, // In dry run, assume all are new
        urls,
      });
    } else {
      const newUrls = await discoverResources(event.description, sourceId);
      results.push({
        source: sourceId,
        resourcesFound: urls.length,
        newResources: newUrls.length,
        urls: newUrls,
      });
    }
  }

  return results;
}

async function scanPages(dryRun: boolean): Promise<DiscoveryResult[]> {
  console.log("Scanning pages...");

  const pages = await prisma.page.findMany({
    select: {
      id: true,
      slug: true,
      content: true,
    },
  });

  console.log(`  Found ${pages.length} pages`);

  const results: DiscoveryResult[] = [];

  for (const page of pages) {
    // Content is stored as JSON - need to extract text content
    const contentJson = JSON.stringify(page.content);
    const urls = extractWaUrls(contentJson);

    if (urls.length === 0) continue;

    const sourceId = `page:${page.slug}`;

    if (dryRun) {
      results.push({
        source: sourceId,
        resourcesFound: urls.length,
        newResources: urls.length,
        urls,
      });
    } else {
      const newUrls = await discoverResources(contentJson, sourceId);
      results.push({
        source: sourceId,
        resourcesFound: urls.length,
        newResources: newUrls.length,
        urls: newUrls,
      });
    }
  }

  return results;
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
  console.log("  Wild Apricot Resource Discovery");
  console.log("=".repeat(60));
  console.log("");

  if (options.dryRun) {
    console.log("Mode: DRY RUN (no database writes)");
    console.log("");
  }

  console.log(`Scanning: ${options.source}`);
  console.log("");

  // Get initial stats
  const initialStats = await getResourceStats();
  console.log("Current resource tracking:");
  console.log(`  Total tracked:  ${initialStats.totalDiscovered}`);
  console.log(`  Pending:        ${initialStats.pending}`);
  console.log(`  Downloaded:     ${initialStats.downloaded}`);
  console.log(`  Failed:         ${initialStats.failed}`);
  console.log(`  Skipped:        ${initialStats.skipped}`);
  console.log("");

  // Run discovery
  let allResults: DiscoveryResult[] = [];

  if (options.source === "all" || options.source === "events") {
    const eventResults = await scanEvents(options.dryRun);
    allResults = allResults.concat(eventResults);
  }

  if (options.source === "all" || options.source === "pages") {
    const pageResults = await scanPages(options.dryRun);
    allResults = allResults.concat(pageResults);
  }

  // Summarize results
  console.log("");
  console.log("=".repeat(60));
  console.log("  Discovery Results");
  console.log("=".repeat(60));
  console.log("");

  const totalFound = allResults.reduce((sum, r) => sum + r.resourcesFound, 0);
  const totalNew = allResults.reduce((sum, r) => sum + r.newResources, 0);
  const sourcesWithResources = allResults.filter((r) => r.resourcesFound > 0).length;

  console.log(`Sources with WA resources: ${sourcesWithResources}`);
  console.log(`Total resources found:     ${totalFound}`);
  console.log(`New resources discovered:  ${totalNew}`);
  console.log("");

  if (allResults.length > 0) {
    console.log("Details by source:");
    for (const result of allResults) {
      if (result.resourcesFound > 0) {
        const marker = options.dryRun ? "[DRY RUN]" : `[${result.newResources} new]`;
        console.log(`  ${result.source}: ${result.resourcesFound} resources ${marker}`);
      }
    }
    console.log("");
  }

  // Show sample URLs
  const allUrls = allResults.flatMap((r) => r.urls);
  if (allUrls.length > 0) {
    console.log("Sample URLs (first 10):");
    for (const url of allUrls.slice(0, 10)) {
      console.log(`  ${url.slice(0, 80)}${url.length > 80 ? "..." : ""}`);
    }
    if (allUrls.length > 10) {
      console.log(`  ... and ${allUrls.length - 10} more`);
    }
    console.log("");
  }

  // Final stats (only meaningful if not dry run)
  if (!options.dryRun) {
    const finalStats = await getResourceStats();
    console.log("Updated resource tracking:");
    console.log(`  Total tracked:  ${finalStats.totalDiscovered}`);
    console.log(`  Pending:        ${finalStats.pending}`);
    console.log("");
  }

  console.log("=".repeat(60));

  if (options.dryRun) {
    console.log("");
    console.log("This was a dry run. Run without --dry-run to track resources.");
  } else if (totalNew > 0) {
    console.log("");
    console.log("Resources are now tracked. To download them, run:");
    console.log("  npx tsx scripts/importing/wa_download_resources.ts");
  }

  console.log("");
  process.exit(0);
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(2);
});
