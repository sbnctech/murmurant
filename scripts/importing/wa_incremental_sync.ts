#!/usr/bin/env npx tsx
/**
 * Wild Apricot Incremental Sync Script
 *
 * Imports only changed data from Wild Apricot since last sync.
 * Run with: npx tsx scripts/importing/wa_incremental_sync.ts
 *
 * Environment variables:
 *   WA_API_KEY      - Required: Wild Apricot API key
 *   WA_ACCOUNT_ID   - Required: Wild Apricot account ID
 *   ALLOW_PROD_IMPORT - Required in production: Set to "1" to allow
 *   DRY_RUN         - Optional: Set to "1" for preview mode (no writes)
 */

import { incrementalSync, validateProductionSafety, isDryRun, runPreflightChecks } from "@/lib/importing/wildapricot";

async function main(): Promise<void> {
  console.log("");
  console.log("=".repeat(60));
  console.log("  Wild Apricot Incremental Sync");
  console.log("=".repeat(60));
  console.log("");

  // Safety check for production
  try {
    validateProductionSafety();
  } catch (error) {
    console.error("");
    console.error("ERROR:", error instanceof Error ? error.message : error);
    console.error("");
    console.error("To run against production, set:");
    console.error("  ALLOW_PROD_IMPORT=1 npx tsx scripts/importing/wa_incremental_sync.ts");
    console.error("");
    process.exit(1);
  }

  // Check for required environment variables
  if (!process.env.WA_API_KEY) {
    console.error("ERROR: WA_API_KEY environment variable is required");
    process.exit(1);
  }

  if (!process.env.WA_ACCOUNT_ID) {
    console.error("ERROR: WA_ACCOUNT_ID environment variable is required");
    process.exit(1);
  }

  // Show mode
  if (isDryRun()) {
    console.log("Mode: DRY RUN (no database writes)");
    console.log("");
  }

  // Run preflight checks
  console.log("Running preflight checks...");
  const preflight = await runPreflightChecks();

  if (!preflight.ok) {
    console.error("");
    console.error("PREFLIGHT FAILED:", preflight.error);
    console.error("");
    console.error("Checks:");
    console.error(`  Database:           ${preflight.checks.database ? "OK" : "FAIL"}`);
    console.error(`  WaIdMapping table:  ${preflight.checks.waIdMappingTable ? "OK" : "FAIL"}`);
    console.error(`  WaSyncState table:  ${preflight.checks.waSyncStateTable ? "OK" : "FAIL"}`);
    console.error(`  MembershipStatuses: ${preflight.checks.membershipStatuses ? "OK" : "FAIL"}`);
    if (preflight.missingStatuses.length > 0) {
      console.error(`  Missing statuses:   ${preflight.missingStatuses.join(", ")}`);
    }
    console.error("");
    process.exit(1);
  }

  console.log("[OK] All preflight checks passed");
  console.log("");

  const _startTime = Date.now();

  try {
    const result = await incrementalSync();

    console.log("");
    console.log("=".repeat(60));
    console.log("  Summary");
    console.log("=".repeat(60));
    console.log("");
    console.log(`Status:        ${result.success ? "SUCCESS" : "COMPLETED WITH ERRORS"}`);
    console.log(`Duration:      ${Math.round(result.durationMs / 1000)}s`);
    console.log("");
    console.log("Entities processed:");
    console.log(`  Members:       ${result.stats.members.created} created, ${result.stats.members.updated} updated, ${result.stats.members.skipped} skipped, ${result.stats.members.errors} errors`);
    console.log(`  Events:        ${result.stats.events.created} created, ${result.stats.events.updated} updated, ${result.stats.events.skipped} skipped, ${result.stats.events.errors} errors`);
    console.log(`  Registrations: ${result.stats.registrations.created} created, ${result.stats.registrations.updated} updated, ${result.stats.registrations.skipped} skipped, ${result.stats.registrations.errors} errors`);
    console.log("");

    if (result.errors.length > 0) {
      console.log("Errors:");
      for (const error of result.errors.slice(0, 10)) {
        console.log(`  - ${error.entityType} WA#${error.waId}: ${error.message}`);
      }
      if (result.errors.length > 10) {
        console.log(`  ... and ${result.errors.length - 10} more errors`);
      }
      console.log("");
    }

    console.log("=".repeat(60));
    console.log("");

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error("");
    console.error("FATAL ERROR:", error instanceof Error ? error.message : error);
    console.error("");

    if (error instanceof Error && error.stack) {
      console.error("Stack trace:");
      console.error(error.stack);
    }

    process.exit(2);
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(2);
});
