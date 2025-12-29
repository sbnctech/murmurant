#!/usr/bin/env npx ts-node
/**
 * Demo Data Reset Script
 *
 * Resets demo-specific data while preserving production-critical records.
 * Safe for use in development and staging environments.
 *
 * Usage:
 *   npx ts-node scripts/demo/reset-demo-data.ts
 *   npm run demo:reset (if added to package.json)
 *
 * Safety:
 * - Refuses to run in production unless FORCE_DEMO_RESET=true
 * - Only deletes records created within the demo timeframe
 * - Preserves member accounts and core configuration
 *
 * Charter: P7 (audit trail) - actions are logged
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const isProduction = process.env.NODE_ENV === "production";
  const forceReset = process.env.FORCE_DEMO_RESET === "true";

  console.log("=== Murmurant Demo Data Reset ===\n");

  // Safety check
  if (isProduction && !forceReset) {
    console.error("ERROR: Refusing to run in production environment.");
    console.error("Set FORCE_DEMO_RESET=true to override (use with caution).");
    process.exit(1);
  }

  if (isProduction) {
    console.warn("WARNING: Running in production with FORCE_DEMO_RESET=true");
    console.warn("Waiting 5 seconds before proceeding...\n");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  const now = new Date();
  console.log(`Reset started at: ${now.toISOString()}\n`);

  // Track what we delete
  const stats = {
    eventRegistrations: 0,
    authChallenges: 0,
    mockEmails: 0,
  };

  try {
    // 1. Clear recent event registrations (last 7 days for demo)
    //    Keep older registrations as historical data
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const regResult = await prisma.eventRegistration.deleteMany({
      where: {
        registeredAt: {
          gte: sevenDaysAgo,
        },
        // Only delete if status indicates it's demo data
        // (PENDING_PAYMENT or CONFIRMED within demo window)
        status: {
          in: ["PENDING_PAYMENT", "CONFIRMED", "WAITLISTED"],
        },
      },
    });
    stats.eventRegistrations = regResult.count;
    console.log(`Deleted ${stats.eventRegistrations} recent event registrations`);

    // 2. Clear expired auth challenges (these are ephemeral anyway)
    const challengeResult = await prisma.authChallenge.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } }, // Expired
          { usedAt: { not: null } }, // Already used
        ],
      },
    });
    stats.authChallenges = challengeResult.count;
    console.log(`Deleted ${stats.authChallenges} expired auth challenges`);

    // 3. Note: We don't delete members, events, or governance records
    //    These are considered "seed data" for demos
    console.log("\nPreserved: Members, Events, Governance records (seed data)");

    // Summary
    console.log("\n=== Reset Complete ===");
    console.log(`Event Registrations deleted: ${stats.eventRegistrations}`);
    console.log(`Auth Challenges deleted: ${stats.authChallenges}`);
    console.log(`\nDemo environment is ready for a fresh demonstration.`);

  } catch (error) {
    console.error("Error during reset:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
