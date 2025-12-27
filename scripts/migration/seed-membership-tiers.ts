/**
 * Membership Tier Seeding Script
 *
 * Creates MembershipTier rows based on policy configuration.
 * Idempotent: safe to re-run, will not delete existing tiers.
 *
 * Usage:
 *   DRY_RUN=1 npx tsx scripts/migration/seed-membership-tiers.ts
 *   npx tsx scripts/migration/seed-membership-tiers.ts
 *
 * Environment:
 *   DATABASE_URL - Prisma database connection
 *   DRY_RUN=1    - Preview changes without writing
 *   CLUBOS_FLAG_MEMBERSHIP_TIERS_ENABLED=1 - Enable tier functionality
 *
 * Related: Issue #276, #275, #202
 */

import { PrismaClient } from "@prisma/client";
import { isEnabled } from "../../src/lib/flags";
import { getPolicy } from "../../src/lib/policy/getPolicy";

// =============================================================================
// Types
// =============================================================================

export interface TierDefinition {
  code: string;
  name: string;
  sortOrder: number;
}

export interface SeedResult {
  created: TierDefinition[];
  reused: TierDefinition[];
  skipped: string[];
  errors: string[];
}

// =============================================================================
// Default Tier Definitions (SBNC as Tenant Zero)
// =============================================================================

/**
 * Default tier definitions based on SBNC membership structure.
 * These match the WA membership level mapping in policy.
 */
export const SBNC_TIER_DEFINITIONS: TierDefinition[] = [
  { code: "PROSPECT", name: "Prospect", sortOrder: 0 },
  { code: "NEWCOMER", name: "Newcomer", sortOrder: 10 },
  { code: "FIRST_YEAR", name: "First Year", sortOrder: 20 },
  { code: "SECOND_YEAR", name: "Second Year", sortOrder: 30 },
  { code: "THIRD_YEAR", name: "Third Year", sortOrder: 40 },
  { code: "ALUMNI", name: "Alumni", sortOrder: 50 },
  { code: "LAPSED", name: "Lapsed", sortOrder: 60 },
  { code: "GENERAL", name: "General", sortOrder: 100 }, // Default tier
];

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Check if tier seeding is allowed based on feature flag.
 */
export function isTierSeedingEnabled(): boolean {
  return isEnabled("membership_tiers_enabled");
}

/**
 * Get tier definitions from policy.
 * Currently returns SBNC defaults; future: read from policy config.
 */
export function getTierDefinitions(): TierDefinition[] {
  // Get the WA mapping from policy to ensure we have tiers for all mapped values
  const waMapping = getPolicy("membership.tiers.waMapping", { orgId: "tenant-zero" });
  const defaultCode = getPolicy("membership.tiers.defaultCode", { orgId: "tenant-zero" });

  // Extract unique tier codes from mapping
  const mappedCodes = new Set(Object.values(waMapping));
  mappedCodes.add(defaultCode);

  // Filter definitions to only include codes that are in the mapping
  const definitions = SBNC_TIER_DEFINITIONS.filter(
    (tier) => mappedCodes.has(tier.code)
  );

  // Ensure all mapped codes have definitions
  const definedCodes = new Set(definitions.map((d) => d.code));
  for (const code of mappedCodes) {
    if (!definedCodes.has(code)) {
      // Add a generic definition for unmapped codes
      definitions.push({
        code,
        name: code.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        sortOrder: 999,
      });
    }
  }

  return definitions.sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Seed membership tiers into the database.
 * Idempotent: creates missing tiers, logs existing ones.
 */
export async function seedMembershipTiers(
  prisma: PrismaClient,
  options: { dryRun?: boolean; verbose?: boolean } = {}
): Promise<SeedResult> {
  const { dryRun = false, verbose = false } = options;
  const result: SeedResult = {
    created: [],
    reused: [],
    skipped: [],
    errors: [],
  };

  // Check feature flag
  if (!isTierSeedingEnabled()) {
    result.skipped.push("Feature flag membership_tiers_enabled is OFF");
    return result;
  }

  const definitions = getTierDefinitions();

  if (verbose) {
    console.log(`[seed-tiers] Processing ${definitions.length} tier definitions`);
  }

  // Fetch existing tiers
  const existingTiers = await prisma.membershipTier.findMany({
    select: { code: true, name: true, sortOrder: true },
  });
  const existingCodes = new Set(existingTiers.map((t) => t.code));

  for (const tier of definitions) {
    try {
      if (existingCodes.has(tier.code)) {
        // Tier already exists
        result.reused.push(tier);
        if (verbose) {
          console.log(`[seed-tiers] REUSED: ${tier.code} (${tier.name})`);
        }
      } else {
        // Create new tier
        if (!dryRun) {
          await prisma.membershipTier.create({
            data: {
              code: tier.code,
              name: tier.name,
              sortOrder: tier.sortOrder,
            },
          });
        }
        result.created.push(tier);
        if (verbose) {
          console.log(
            `[seed-tiers] ${dryRun ? "WOULD CREATE" : "CREATED"}: ${tier.code} (${tier.name})`
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`${tier.code}: ${message}`);
      if (verbose) {
        console.error(`[seed-tiers] ERROR: ${tier.code} - ${message}`);
      }
    }
  }

  return result;
}

/**
 * Validate that all WA mapping targets have corresponding tiers.
 */
export async function validateTierMapping(
  prisma: PrismaClient
): Promise<{ valid: boolean; missing: string[]; extra: string[] }> {
  const waMapping = getPolicy("membership.tiers.waMapping", { orgId: "tenant-zero" });
  const defaultCode = getPolicy("membership.tiers.defaultCode", { orgId: "tenant-zero" });

  // Get required tier codes from policy
  const requiredCodes = new Set(Object.values(waMapping));
  requiredCodes.add(defaultCode);

  // Get existing tier codes from database
  const existingTiers = await prisma.membershipTier.findMany({
    select: { code: true },
  });
  const existingCodes = new Set(existingTiers.map((t) => t.code));

  // Find missing tiers (required but not in DB)
  const missing: string[] = [];
  for (const code of requiredCodes) {
    if (!existingCodes.has(code)) {
      missing.push(code);
    }
  }

  // Find extra tiers (in DB but not required by policy)
  const extra: string[] = [];
  for (const code of existingCodes) {
    if (!requiredCodes.has(code)) {
      extra.push(code);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    extra,
  };
}

// =============================================================================
// CLI Entry Point
// =============================================================================

async function main() {
  const dryRun = process.env.DRY_RUN === "1";

  console.log("\n" + "=".repeat(60));
  console.log("ClubOS Membership Tier Seeding");
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log("=".repeat(60) + "\n");

  // Check feature flag first
  if (!isTierSeedingEnabled()) {
    console.log("[seed-tiers] Feature flag membership_tiers_enabled is OFF");
    console.log("[seed-tiers] Set CLUBOS_FLAG_MEMBERSHIP_TIERS_ENABLED=1 to enable");
    process.exit(0);
  }

  const prisma = new PrismaClient();

  try {
    // Show tier definitions
    const definitions = getTierDefinitions();
    console.log(`[seed-tiers] Tier definitions (${definitions.length}):`);
    for (const tier of definitions) {
      console.log(`  - ${tier.code}: ${tier.name} (order: ${tier.sortOrder})`);
    }
    console.log();

    // Seed tiers
    const result = await seedMembershipTiers(prisma, { dryRun, verbose: true });

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY");
    console.log("=".repeat(60));
    console.log(`Created: ${result.created.length}`);
    console.log(`Reused:  ${result.reused.length}`);
    console.log(`Errors:  ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log("\nErrors:");
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
    }

    // Validate mapping
    console.log("\n[seed-tiers] Validating tier mapping...");
    const validation = await validateTierMapping(prisma);
    if (validation.valid) {
      console.log("[seed-tiers] All required tiers present");
    } else {
      console.error("[seed-tiers] MISSING TIERS:", validation.missing.join(", "));
      process.exit(1);
    }

    if (validation.extra.length > 0) {
      console.log(`[seed-tiers] Extra tiers in DB (not in policy): ${validation.extra.join(", ")}`);
    }

    console.log("\n" + "=".repeat(60) + "\n");
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("FATAL:", error);
    process.exit(1);
  });
}
