#!/usr/bin/env npx tsx
/**
 * Wild Apricot Full Sync Script
 *
 * Imports all data from Wild Apricot into ClubOS.
 * Run with: npx tsx scripts/importing/wa_full_sync.ts
 *
 * Options:
 *   --probe-event-id <ID>  Probe a specific event's registrations (diagnostic mode)
 *   --help                 Show this help message
 *
 * Environment variables:
 *   WA_API_KEY      - Required: Wild Apricot API key
 *   WA_ACCOUNT_ID   - Required: Wild Apricot account ID
 *   ALLOW_PROD_IMPORT - Required in production: Set to "1" to allow
 *   DRY_RUN         - Optional: Set to "1" for preview mode (no writes)
 */

import {
  fullSync,
  validateProductionSafety,
  isDryRun,
  runPreflightChecks,
  probeEventRegistrations,
} from "@/lib/importing/wildapricot";

function showHelp(): void {
  console.log(`
Wild Apricot Full Sync Script

USAGE:
  npx tsx scripts/importing/wa_full_sync.ts [OPTIONS]

OPTIONS:
  --probe-event-id <ID>   Probe a specific event's registrations (diagnostic mode)
                          This does NOT run a full sync - it only analyzes one event
  --help                  Show this help message

ENVIRONMENT VARIABLES:
  WA_API_KEY              Required: Wild Apricot API key
  WA_ACCOUNT_ID           Required: Wild Apricot account ID
  ALLOW_PROD_IMPORT       Required in production: Set to "1" to allow writes
  DRY_RUN                 Optional: Set to "1" for preview mode (no writes)

EXAMPLES:
  # Standard full sync (dry run)
  DRY_RUN=1 npx tsx scripts/importing/wa_full_sync.ts

  # Production full sync
  ALLOW_PROD_IMPORT=1 npx tsx scripts/importing/wa_full_sync.ts

  # Probe a specific event to debug registration import
  npx tsx scripts/importing/wa_full_sync.ts --probe-event-id 12345
`);
}

function parseArgs(): { probeEventId: number | null; help: boolean } {
  const args = process.argv.slice(2);
  let probeEventId: number | null = null;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--probe-event-id" && i + 1 < args.length) {
      probeEventId = parseInt(args[i + 1], 10);
      if (isNaN(probeEventId)) {
        console.error(`ERROR: Invalid event ID: ${args[i + 1]}`);
        process.exit(1);
      }
      i++;
    } else if (args[i] === "--help" || args[i] === "-h") {
      help = true;
    }
  }

  return { probeEventId, help };
}

async function runProbe(waEventId: number): Promise<void> {
  console.log("");
  console.log("=".repeat(60));
  console.log(`  Probing Event ${waEventId}`);
  console.log("=".repeat(60));
  console.log("");

  // Check for required environment variables
  if (!process.env.WA_API_KEY) {
    console.error("ERROR: WA_API_KEY environment variable is required");
    process.exit(1);
  }

  if (!process.env.WA_ACCOUNT_ID) {
    console.error("ERROR: WA_ACCOUNT_ID environment variable is required");
    process.exit(1);
  }

  try {
    const result = await probeEventRegistrations(waEventId);

    console.log("");
    console.log("=".repeat(60));
    console.log("  Probe Results");
    console.log("=".repeat(60));
    console.log("");
    console.log(`Event ID:              ${result.eventId}`);
    console.log(`Event found in WA:     ${result.eventFound ? "YES" : "NO"}`);
    console.log(`Event mapped to ClubOS: ${result.eventMapped ? "YES" : "NO"}`);
    if (result.clubosEventId) {
      console.log(`ClubOS Event ID:       ${result.clubosEventId}`);
    }
    console.log(`Registrations from WA: ${result.registrationsFromWA}`);
    console.log("");

    console.log("Import Analysis:");
    console.log(`  Would import:               ${result.summary.wouldImport}`);
    console.log(`  Would skip (missing member): ${result.summary.wouldSkipMissingMember}`);
    console.log(`  Would skip (transform error): ${result.summary.wouldSkipTransformError}`);
    console.log("");

    if (result.registrations.length > 0) {
      console.log("Sample registrations (first 5):");
      for (const reg of result.registrations.slice(0, 5)) {
        const status = reg.wouldSkip ? `SKIP: ${reg.skipReason}` : "IMPORT";
        console.log(`  - WA#${reg.waRegistrationId} ${reg.contactName} (${reg.contactEmail ?? "no email"})`);
        console.log(`    WA Contact: ${reg.waContactId}, Status: ${reg.status}`);
        console.log(`    Member mapped: ${reg.memberMapped ? `YES (${reg.clubosMemberId})` : "NO"}`);
        console.log(`    Result: ${status}`);
        console.log("");
      }
    }

    console.log("=".repeat(60));
    console.log("");

    // Exit with code based on whether we'd import any
    if (result.summary.wouldImport === 0 && result.registrationsFromWA > 0) {
      console.log("⚠️  All registrations would be skipped!");
      console.log("   This likely means the members haven't been imported yet.");
      console.log("   Run a full sync with all contacts first.");
      console.log("");
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error("");
    console.error("PROBE ERROR:", error instanceof Error ? error.message : error);
    console.error("");
    process.exit(2);
  }
}


async function main(): Promise<void> {
  const { probeEventId, help } = parseArgs();

  if (help) {
    showHelp();
    process.exit(0);
  }

  // Handle probe mode
  if (probeEventId !== null) {
    await runProbe(probeEventId);
    return;
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("  Wild Apricot Full Sync");
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
    console.error("  ALLOW_PROD_IMPORT=1 npx tsx scripts/importing/wa_full_sync.ts");
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

  const startTime = Date.now();

  try {
    const result = await fullSync();

    // fullSync() now handles all logging and report writing internally
    // Just print final status and exit

    console.log("");
    console.log(`Final Status: ${result.success ? "SUCCESS" : "COMPLETED WITH ERRORS"}`);
    console.log("");

    if (result.errors.length > 0) {
      console.log("First 10 errors:");
      for (const error of result.errors.slice(0, 10)) {
        console.log(`  - ${error.entityType} WA#${error.waId}: ${error.message}`);
      }
      if (result.errors.length > 10) {
        console.log(`  ... and ${result.errors.length - 10} more errors`);
      }
      console.log("");
    }

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
