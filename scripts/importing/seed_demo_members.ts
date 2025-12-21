#!/usr/bin/env npx tsx
/**
 * Demo Member Seeder for Lifecycle Explainer
 *
 * Creates demo members with predictable lifecycle states for demonstration.
 * This script is idempotent - running it multiple times is safe.
 *
 * Run with:
 *   npx tsx scripts/importing/seed_demo_members.ts
 *
 * Environment variables:
 *   ALLOW_PROD_SEED - Required in production: Set to "1" to allow
 *   DRY_RUN         - Optional: Set to "1" for preview mode (no writes)
 *
 * Demo members created:
 *   - demo.pending@sbnc.example        -> pending_new (5 days ago)
 *   - demo.newbie@sbnc.example         -> active_newbie (80 days ago)
 *   - demo.member@sbnc.example         -> active_member (200 days ago)
 *   - demo.offer_extended@sbnc.example -> offer_extended (750 days ago)
 *   - demo.extended@sbnc.example       -> active_extended (800 days ago)
 *   - demo.lapsed@sbnc.example         -> lapsed (900 days ago)
 *   - demo.suspended@sbnc.example      -> suspended (300 days ago)
 *   - demo.unknown@sbnc.example        -> unknown (100 days ago)
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Load .env manually
import { config } from "dotenv";
config();

// ============================================================================
// Safety Checks
// ============================================================================

function isProductionDatabase(): boolean {
  const dbUrl = process.env.DATABASE_URL || "";
  return (
    process.env.NODE_ENV === "production" ||
    dbUrl.includes("production") ||
    dbUrl.includes("prod.") ||
    dbUrl.includes("neon.tech") ||
    dbUrl.includes("supabase.co") ||
    (dbUrl.includes(".com") && !dbUrl.includes("localhost"))
  );
}

function validateProductionSafety(): void {
  if (isProductionDatabase() && process.env.ALLOW_PROD_SEED !== "1") {
    throw new Error(
      "Production database detected. Set ALLOW_PROD_SEED=1 to proceed."
    );
  }
}

function isDryRun(): boolean {
  return process.env.DRY_RUN === "1";
}

// ============================================================================
// Prisma Client
// ============================================================================

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

// ============================================================================
// Demo Member Definitions
// ============================================================================

/**
 * Calculate a date N days ago from now.
 */
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Demo member fixtures with deterministic lifecycle states.
 *
 * Each fixture is designed to show a specific lifecycle state
 * when viewed through the lifecycle explainer.
 */
const DEMO_MEMBERS = [
  {
    email: "demo.pending@sbnc.example",
    firstName: "Penny",
    lastName: "Pending",
    joinedAtDaysAgo: 5, // Just applied
    membershipStatusCode: "pending_new",
    membershipTierCode: "newbie_member",
    waMembershipLevelRaw: "NewbieNewcomer",
    expectedState: "pending_new",
    description: "Membership application pending approval",
  },
  {
    email: "demo.newbie@sbnc.example",
    firstName: "Nancy",
    lastName: "Newbie",
    joinedAtDaysAgo: 80, // Within 90-day newbie period
    membershipStatusCode: "active",
    membershipTierCode: "newbie_member",
    waMembershipLevelRaw: "NewbieNewcomer",
    expectedState: "active_newbie",
    description: "Active newbie, 10 days until transition to regular member",
  },
  {
    email: "demo.member@sbnc.example",
    firstName: "Mary",
    lastName: "Member",
    joinedAtDaysAgo: 200, // Past newbie, before 2-year mark
    membershipStatusCode: "active",
    membershipTierCode: "member",
    waMembershipLevelRaw: "NewcomerMember",
    expectedState: "active_member",
    description: "Standard active member, 530 days until 2-year mark",
  },
  {
    email: "demo.offer_extended@sbnc.example",
    firstName: "Oscar",
    lastName: "Offerwaiting",
    joinedAtDaysAgo: 750, // Past 2-year mark (730 days), not yet extended
    membershipStatusCode: "active",
    membershipTierCode: "member",
    waMembershipLevelRaw: "NewcomerMember",
    expectedState: "offer_extended",
    description: "2-year mark passed, extended offer pending response",
  },
  {
    email: "demo.extended@sbnc.example",
    firstName: "Edna",
    lastName: "Extended",
    joinedAtDaysAgo: 800, // Extended member
    membershipStatusCode: "active",
    membershipTierCode: "extended_member",
    waMembershipLevelRaw: "ExtendedNewcomer",
    expectedState: "active_extended",
    description: "Extended member who accepted and paid",
  },
  {
    email: "demo.lapsed@sbnc.example",
    firstName: "Larry",
    lastName: "Lapsed",
    joinedAtDaysAgo: 900, // Lapsed after membership ended
    membershipStatusCode: "lapsed",
    membershipTierCode: "member",
    waMembershipLevelRaw: "NewcomerMember",
    expectedState: "lapsed",
    description: "Membership ended, no active privileges",
  },
  {
    email: "demo.suspended@sbnc.example",
    firstName: "Sam",
    lastName: "Suspended",
    joinedAtDaysAgo: 300, // Suspended by admin
    membershipStatusCode: "suspended",
    membershipTierCode: "member",
    waMembershipLevelRaw: "NewcomerMember",
    expectedState: "suspended",
    description: "Membership suspended, awaiting admin action",
  },
  {
    email: "demo.unknown@sbnc.example",
    firstName: "Uma",
    lastName: "Unknown",
    joinedAtDaysAgo: 100, // Unknown tier
    membershipStatusCode: "active",
    membershipTierCode: "unknown",
    waMembershipLevelRaw: "Admins", // Admins maps to unknown
    expectedState: "unknown",
    description: "Active status but tier unknown, needs admin review",
  },
];

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log("");
  console.log("=".repeat(60));
  console.log("  Demo Member Seeder for Lifecycle Explainer");
  console.log("=".repeat(60));
  console.log("");

  // Safety check
  try {
    validateProductionSafety();
  } catch (error) {
    console.error("");
    console.error("ERROR:", error instanceof Error ? error.message : error);
    console.error("");
    console.error("To run against production, set:");
    console.error(
      "  ALLOW_PROD_SEED=1 npx tsx scripts/importing/seed_demo_members.ts"
    );
    console.error("");
    process.exit(1);
  }

  // Show mode
  if (isDryRun()) {
    console.log("Mode: DRY RUN (no database writes)");
    console.log("");
  }

  const prisma = createPrismaClient();

  try {
    // Check database connectivity
    console.log("Checking database connection...");
    await prisma.$queryRaw`SELECT 1`;
    console.log("[OK] Database connection established");
    console.log("");

    // Load membership status and tier maps
    console.log("Loading membership statuses and tiers...");
    const statuses = await prisma.membershipStatus.findMany();
    const tiers = await prisma.membershipTier.findMany();

    const statusMap = new Map(statuses.map((s) => [s.code, s.id]));
    const tierMap = new Map(tiers.map((t) => [t.code, t.id]));

    console.log(`  Found ${statuses.length} statuses, ${tiers.length} tiers`);
    console.log("");

    // Validate required statuses and tiers exist
    const requiredStatuses = ["active", "lapsed", "suspended", "pending_new"];
    const requiredTiers = ["newbie_member", "member", "extended_member", "unknown"];

    for (const code of requiredStatuses) {
      if (!statusMap.has(code)) {
        throw new Error(
          `Missing required MembershipStatus: ${code}. Run seed_membership_statuses.ts first.`
        );
      }
    }

    for (const code of requiredTiers) {
      if (!tierMap.has(code)) {
        throw new Error(
          `Missing required MembershipTier: ${code}. Run seed_membership_tiers.ts first.`
        );
      }
    }

    console.log("[OK] All required statuses and tiers exist");
    console.log("");

    // Process demo members
    console.log("Processing demo members...");
    console.log("");

    let created = 0;
    let updated = 0;
    const skipped = 0; // No skip logic in current implementation

    for (const demo of DEMO_MEMBERS) {
      const statusId = statusMap.get(demo.membershipStatusCode);
      const tierId = tierMap.get(demo.membershipTierCode);

      if (!statusId) {
        console.log(`  [ERROR] Status not found: ${demo.membershipStatusCode}`);
        continue;
      }

      const joinedAt = daysAgo(demo.joinedAtDaysAgo);

      if (isDryRun()) {
        const existing = await prisma.member.findUnique({
          where: { email: demo.email },
        });

        if (existing) {
          console.log(`  [DRY] Would update: ${demo.email}`);
          console.log(`        -> ${demo.expectedState}: ${demo.description}`);
        } else {
          console.log(`  [DRY] Would create: ${demo.email}`);
          console.log(`        -> ${demo.expectedState}: ${demo.description}`);
        }
        console.log("");
      } else {
        const existing = await prisma.member.findUnique({
          where: { email: demo.email },
        });

        if (existing) {
          // Update existing member
          await prisma.member.update({
            where: { email: demo.email },
            data: {
              firstName: demo.firstName,
              lastName: demo.lastName,
              joinedAt,
              membershipStatusId: statusId,
              membershipTierId: tierId || null,
              waMembershipLevelRaw: demo.waMembershipLevelRaw,
            },
          });
          console.log(`  [UPDATE] ${demo.email} (id: ${existing.id})`);
          console.log(`           -> ${demo.expectedState}`);
          updated++;
        } else {
          // Create new member
          const member = await prisma.member.create({
            data: {
              firstName: demo.firstName,
              lastName: demo.lastName,
              email: demo.email,
              joinedAt,
              membershipStatusId: statusId,
              membershipTierId: tierId || null,
              waMembershipLevelRaw: demo.waMembershipLevelRaw,
            },
          });
          console.log(`  [CREATE] ${demo.email} (id: ${member.id})`);
          console.log(`           -> ${demo.expectedState}`);
          created++;
        }
        console.log("");
      }
    }

    // Summary
    console.log("=".repeat(60));
    if (isDryRun()) {
      console.log("  Dry run complete - no changes made");
      console.log(`  Would create: ${DEMO_MEMBERS.length} demo members`);
    } else {
      console.log("  Seeding complete");
      console.log(`  Created: ${created}`);
      console.log(`  Updated: ${updated}`);
      console.log(`  Skipped: ${skipped}`);
    }
    console.log("=".repeat(60));
    console.log("");

    // Print demo member summary table
    console.log("Demo Members Summary:");
    console.log("-".repeat(80));
    console.log("Email                              | Expected State    | Description");
    console.log("-".repeat(80));
    for (const demo of DEMO_MEMBERS) {
      const email = demo.email.padEnd(34);
      const state = demo.expectedState.padEnd(17);
      console.log(`${email} | ${state} | ${demo.description.slice(0, 30)}...`);
    }
    console.log("-".repeat(80));
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("");
    console.error("ERROR:", error instanceof Error ? error.message : error);
    console.error("");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(2);
});
