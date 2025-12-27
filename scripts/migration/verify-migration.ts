#!/usr/bin/env npx tsx
/**
 * Post-Migration Verification CLI
 *
 * Verifies that a migration completed successfully by comparing
 * the migration bundle against the target database.
 *
 * Usage:
 *   npx tsx scripts/migration/verify-migration.ts --bundle <path> [--output <path>]
 *
 * Options:
 *   --bundle, -b   Path to migration bundle directory (required)
 *   --output, -o   Path for verification report output (default: ./verification-report.md)
 *   --format, -f   Output format: markdown | json (default: markdown)
 *   --verbose, -v  Verbose output
 *
 * Exit codes:
 *   0 - All checks passed
 *   1 - One or more checks failed
 *   2 - Error loading bundle or connecting to database
 *
 * Related: Issue #202 (WA Migration), Epic #277 (Rollback & Recovery)
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import {
  loadMigrationBundle,
  extractBundleCounts,
  verifyMemberCount,
  verifyEventCount,
  verifyRegistrationCount,
  verifyTierDistribution,
  verifyTierCoverage,
  verifyNoOrphanedRegistrations,
  verifyNoDuplicateMappings,
  verifyRunId,
  aggregateResults,
  generateMarkdownReport,
  generateJsonReport,
  type VerificationCheck,
  type DatabaseCounts,
  type TierDistribution,
  type PolicyVerification,
} from "./lib/verification";

// =============================================================================
// CLI Argument Parsing
// =============================================================================

interface CliArgs {
  bundlePath: string;
  outputPath: string;
  format: "markdown" | "json";
  verbose: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let bundlePath = "";
  let outputPath = "./verification-report.md";
  let format: "markdown" | "json" = "markdown";
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    if (arg === "--bundle" || arg === "-b") {
      bundlePath = next || "";
      i++;
    } else if (arg === "--output" || arg === "-o") {
      outputPath = next || outputPath;
      i++;
    } else if (arg === "--format" || arg === "-f") {
      format = next === "json" ? "json" : "markdown";
      i++;
    } else if (arg === "--verbose" || arg === "-v") {
      verbose = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!bundlePath) {
    console.error("Error: --bundle is required");
    printHelp();
    process.exit(2);
  }

  return { bundlePath, outputPath, format, verbose };
}

function printHelp(): void {
  console.log(`
Post-Migration Verification Tool

Usage:
  npx tsx scripts/migration/verify-migration.ts --bundle <path> [options]

Options:
  --bundle, -b   Path to migration bundle directory (required)
  --output, -o   Path for verification report (default: ./verification-report.md)
  --format, -f   Output format: markdown | json (default: markdown)
  --verbose, -v  Verbose output
  --help, -h     Show this help

Examples:
  # Verify a migration bundle
  npx tsx scripts/migration/verify-migration.ts -b ./migration-bundle-2024-01-15

  # Output JSON format
  npx tsx scripts/migration/verify-migration.ts -b ./bundle -f json -o report.json

Exit Codes:
  0 - All checks passed
  1 - One or more checks failed
  2 - Error (bundle not found, database error, etc.)
`);
}

// =============================================================================
// Database Queries (Read-Only)
// =============================================================================

async function getDatabaseCounts(prisma: PrismaClient): Promise<DatabaseCounts> {
  const [members, events, registrations, membershipTiers, membershipStatuses] =
    await Promise.all([
      prisma.member.count(),
      prisma.event.count(),
      prisma.eventRegistration.count(),
      prisma.membershipTier.count(),
      prisma.membershipStatus.count(),
    ]);

  return {
    members,
    events,
    registrations,
    membershipTiers,
    membershipStatuses,
  };
}

async function getTierDistribution(
  prisma: PrismaClient
): Promise<TierDistribution[]> {
  const result = await prisma.member.groupBy({
    by: ["membershipTierId"],
    _count: { id: true },
  });

  const tiers = await prisma.membershipTier.findMany();
  const tierMap = new Map(tiers.map((t) => [t.id, t]));
  const totalMembers = result.reduce((sum, r) => sum + r._count.id, 0);

  const distribution: TierDistribution[] = [];

  for (const row of result) {
    const tier = row.membershipTierId ? tierMap.get(row.membershipTierId) : null;
    distribution.push({
      tierCode: tier?.code || "(null)",
      tierName: tier?.name || "No Tier",
      count: row._count.id,
      percentage: totalMembers > 0 ? (row._count.id / totalMembers) * 100 : 0,
    });
  }

  // Sort by count descending
  distribution.sort((a, b) => b.count - a.count);

  return distribution;
}

async function getOrphanedRegistrationCount(
  prisma: PrismaClient
): Promise<number> {
  // Find registrations where member or event doesn't exist
  const orphanedMembers = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count
    FROM "EventRegistration" r
    LEFT JOIN "Member" m ON r."memberId" = m.id
    WHERE m.id IS NULL
  `;

  const orphanedEvents = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count
    FROM "EventRegistration" r
    LEFT JOIN "Event" e ON r."eventId" = e.id
    WHERE e.id IS NULL
  `;

  return (
    Number(orphanedMembers[0]?.count || 0) +
    Number(orphanedEvents[0]?.count || 0)
  );
}

async function getDuplicateMappingCount(prisma: PrismaClient): Promise<number> {
  // Check WaIdMapping for duplicates (if table exists)
  try {
    const duplicates = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM (
        SELECT "waId", "entityType", COUNT(*) as cnt
        FROM "WaIdMapping"
        GROUP BY "waId", "entityType"
        HAVING COUNT(*) > 1
      ) dups
    `;
    return Number(duplicates[0]?.count || 0);
  } catch {
    // Table might not exist
    return 0;
  }
}

async function getLatestRunId(prisma: PrismaClient): Promise<string | null> {
  try {
    const result = await prisma.$queryRaw<{ syncRunId: string }[]>`
      SELECT "syncRunId"
      FROM "WaIdMapping"
      ORDER BY "syncedAt" DESC
      LIMIT 1
    `;
    return result[0]?.syncRunId || null;
  } catch {
    return null;
  }
}

async function getMembersWithTierCount(prisma: PrismaClient): Promise<number> {
  return prisma.member.count({
    where: {
      membershipTierId: { not: null },
    },
  });
}

// =============================================================================
// Main Verification Flow
// =============================================================================

async function main(): Promise<void> {
  const startTime = new Date();
  const args = parseArgs();

  console.log("=".repeat(60));
  console.log("  Post-Migration Verification");
  console.log(`  Started: ${startTime.toISOString()}`);
  console.log(`  Bundle: ${args.bundlePath}`);
  console.log("=".repeat(60));
  console.log();

  // Load bundle
  console.log("[1/4] Loading migration bundle...");
  let bundle;
  try {
    bundle = loadMigrationBundle(args.bundlePath);
    console.log(`  - Run ID: ${bundle.report.runId}`);
    console.log(`  - Dry run: ${bundle.report.dryRun}`);
    console.log(`  - Completed: ${bundle.report.completedAt}`);
  } catch (error) {
    console.error(`Error loading bundle: ${error}`);
    process.exit(2);
  }

  // Connect to database
  console.log("\n[2/4] Connecting to database...");
  const prisma = new PrismaClient();
  let dbCounts: DatabaseCounts;
  let tierDistribution: TierDistribution[];
  let orphanedCount: number;
  let duplicateCount: number;
  let latestRunId: string | null;
  let membersWithTier: number;

  try {
    [
      dbCounts,
      tierDistribution,
      orphanedCount,
      duplicateCount,
      latestRunId,
      membersWithTier,
    ] = await Promise.all([
      getDatabaseCounts(prisma),
      getTierDistribution(prisma),
      getOrphanedRegistrationCount(prisma),
      getDuplicateMappingCount(prisma),
      getLatestRunId(prisma),
      getMembersWithTierCount(prisma),
    ]);

    console.log(`  - Members: ${dbCounts.members}`);
    console.log(`  - Events: ${dbCounts.events}`);
    console.log(`  - Registrations: ${dbCounts.registrations}`);
  } catch (error) {
    console.error(`Database error: ${error}`);
    await prisma.$disconnect();
    process.exit(2);
  }

  // Run verification checks
  console.log("\n[3/4] Running verification checks...");
  const bundleCounts = extractBundleCounts(bundle.report);
  const checks: VerificationCheck[] = [];

  // Count verification
  checks.push(
    verifyMemberCount(bundleCounts.members || 0, dbCounts.members)
  );
  checks.push(verifyEventCount(bundleCounts.events || 0, dbCounts.events));
  checks.push(
    verifyRegistrationCount(
      bundleCounts.registrations || 0,
      dbCounts.registrations
    )
  );

  // Tier verification
  checks.push(verifyTierDistribution(tierDistribution));
  checks.push(verifyTierCoverage(dbCounts.members, membersWithTier));

  // Integrity verification
  checks.push(verifyNoOrphanedRegistrations(orphanedCount));
  checks.push(verifyNoDuplicateMappings(duplicateCount));
  checks.push(verifyRunId(bundle.report.runId, latestRunId));

  // Print check results
  for (const check of checks) {
    const icon = check.passed
      ? "[PASS]"
      : check.severity === "warning"
        ? "[WARN]"
        : "[FAIL]";
    console.log(`  ${icon} ${check.name}: ${check.message}`);
  }

  // Aggregate results
  const policyVerification: PolicyVerification[] = []; // TODO: Add policy verification when policies are queryable

  const result = aggregateResults(
    bundle.report.runId,
    args.bundlePath,
    startTime,
    checks,
    { bundle: bundleCounts, database: dbCounts },
    tierDistribution,
    policyVerification
  );

  // Generate report
  console.log("\n[4/4] Generating verification report...");
  const report =
    args.format === "json"
      ? generateJsonReport(result)
      : generateMarkdownReport(result);

  // Ensure output directory exists
  const outputDir = path.dirname(args.outputPath);
  if (outputDir && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(args.outputPath, report);
  console.log(`  - Report written to: ${args.outputPath}`);

  // Cleanup
  await prisma.$disconnect();

  // Final summary
  console.log();
  console.log("=".repeat(60));
  console.log(`  Verification ${result.passed ? "PASSED" : "FAILED"}`);
  console.log(
    `  Checks: ${result.summary.passed} passed, ${result.summary.failed} failed, ${result.summary.warnings} warnings`
  );
  console.log(`  Duration: ${result.durationMs}ms`);
  console.log("=".repeat(60));

  // Exit with appropriate code
  process.exit(result.passed ? 0 : 1);
}

// Run
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(2);
});
