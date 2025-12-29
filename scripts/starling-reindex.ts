#!/usr/bin/env npx tsx
// Copyright (c) Murmurant, Inc.
// Starling knowledge base re-indexing script
// Run with: npx tsx scripts/starling-reindex.ts
// Or: npm run starling:reindex

import { PrismaClient } from "@prisma/client";

// Initialize Prisma
const prisma = new PrismaClient();

// Dynamic import for ESM modules
async function main() {
  console.log("🐦 Starling Knowledge Base Re-indexer\n");
  console.log("=".repeat(50));

  const args = process.argv.slice(2);
  const command = args[0] || "status";

  switch (command) {
    case "status":
      await showStatus();
      break;

    case "reindex-cms":
      await reindexFromCMS();
      break;

    case "sync":
      await syncWithCMS();
      break;

    case "clear":
      await clearKnowledge(args[1]);
      break;

    case "help":
    default:
      showHelp();
      break;
  }

  await prisma.$disconnect();
}

/**
 * Show current knowledge base status
 */
async function showStatus() {
  console.log("\n📊 Knowledge Base Status\n");

  const stats = await prisma.$queryRaw<
    Array<{ source_type: string; org_id: string | null; count: bigint }>
  >`
    SELECT
      source_type,
      organization_id as org_id,
      COUNT(*) as count
    FROM "StarlingKnowledge"
    GROUP BY source_type, organization_id
    ORDER BY organization_id NULLS FIRST, source_type
  `;

  if (stats.length === 0) {
    console.log("  No knowledge entries found.\n");
    console.log("  Run 'npm run starling:reindex reindex-cms' to index CMS content.\n");
    return;
  }

  // Platform content
  console.log("Platform Content (shared):");
  const platformStats = stats.filter((s) => s.org_id === null);
  if (platformStats.length === 0) {
    console.log("  (none)\n");
  } else {
    for (const row of platformStats) {
      console.log(`  ${row.source_type}: ${row.count}`);
    }
    console.log();
  }

  // Operator content
  const operatorStats = stats.filter((s) => s.org_id !== null);
  if (operatorStats.length > 0) {
    console.log("Operator Content (by organization):");
    const byOrg = new Map<string, Map<string, number>>();
    for (const row of operatorStats) {
      if (!byOrg.has(row.org_id!)) {
        byOrg.set(row.org_id!, new Map());
      }
      byOrg.get(row.org_id!)!.set(row.source_type, Number(row.count));
    }

    for (const [orgId, types] of byOrg) {
      console.log(`  Org ${orgId.substring(0, 8)}...:`);
      for (const [type, count] of types) {
        console.log(`    ${type}: ${count}`);
      }
    }
    console.log();
  }

  // Total
  const total = stats.reduce((sum, s) => sum + Number(s.count), 0);
  console.log(`Total entries: ${total}\n`);
}

/**
 * Re-index all CMS content
 */
async function reindexFromCMS() {
  console.log("\n🔄 Re-indexing from CMS...\n");

  // Import the indexer functions
  const { indexAllCMSPages, formatIndexReport } = await import("../src/lib/starling/indexer");

  const { results, stats } = await indexAllCMSPages();

  // Print results
  for (const result of results) {
    if (result.errors.length > 0) {
      console.log(`  ✗ ${result.source}: ${result.errors.join(", ")}`);
    } else if (result.chunksIndexed > 0) {
      console.log(`  ✓ ${result.source} (${result.chunksIndexed} chunks)`);
    }
  }

  console.log(formatIndexReport(results));
  console.log(`\n📊 Knowledge Base Stats:`);
  console.log(`  Total documents: ${stats.totalDocuments}`);
  console.log(`  By type: ${JSON.stringify(stats.bySourceType)}`);
  if (stats.lastUpdated) {
    console.log(`  Last updated: ${stats.lastUpdated.toISOString()}`);
  }
}

/**
 * Incremental sync with CMS (only changed content)
 */
async function syncWithCMS() {
  console.log("\n🔄 Syncing with CMS...\n");

  const { syncKnowledgeWithCMS } = await import("../src/lib/starling/indexer");

  const { added, removed, updated } = await syncKnowledgeWithCMS();

  console.log("Sync complete:");
  console.log(`  ➕ Added: ${added}`);
  console.log(`  🔄 Updated: ${updated}`);
  console.log(`  ➖ Removed: ${removed}`);

  if (added === 0 && removed === 0 && updated === 0) {
    console.log("\n✅ Knowledge base is already in sync with CMS");
  } else {
    console.log(`\n✅ Synced ${added + updated} entries, removed ${removed} orphans`);
  }
}

/**
 * Clear knowledge base
 */
async function clearKnowledge(scope?: string) {
  if (scope === "platform") {
    console.log("\n🗑️  Clearing platform knowledge...");
    const result = await prisma.$executeRaw`
      DELETE FROM "StarlingKnowledge" WHERE organization_id IS NULL
    `;
    console.log(`  Deleted ${result} entries\n`);
  } else if (scope === "operators") {
    console.log("\n🗑️  Clearing operator knowledge...");
    const result = await prisma.$executeRaw`
      DELETE FROM "StarlingKnowledge" WHERE organization_id IS NOT NULL
    `;
    console.log(`  Deleted ${result} entries\n`);
  } else if (scope === "all") {
    console.log("\n🗑️  Clearing ALL knowledge...");
    const result = await prisma.$executeRaw`
      DELETE FROM "StarlingKnowledge"
    `;
    console.log(`  Deleted ${result} entries\n`);
  } else {
    console.log("\nUsage: npm run starling:reindex clear <scope>");
    console.log("  Scopes: platform, operators, all\n");
  }
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
Usage: npm run starling:reindex <command>

Commands:
  status        Show knowledge base statistics (default)
  reindex-cms   Re-index all published CMS content (full rebuild)
  sync          Incremental sync - only update changed content
  clear <scope> Clear knowledge (platform, operators, or all)
  help          Show this help message

Examples:
  npm run starling:reindex                  # Show status
  npm run starling:reindex reindex-cms      # Full re-index from CMS
  npm run starling:reindex sync             # Sync changed content only
  npm run starling:reindex clear platform   # Clear platform docs

CI/CD Usage:
  For deployments, use 'sync' for fast incremental updates.
  Use 'reindex-cms' for full rebuilds (e.g., after schema changes).
`);
}

// Run
main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
