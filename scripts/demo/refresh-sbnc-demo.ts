#!/usr/bin/env npx tsx
/**
 * SBNC Demo Data Refresh Script
 *
 * Pulls fresh data from Wild Apricot for demo purposes.
 *
 * Usage:
 *   npx tsx scripts/demo/refresh-sbnc-demo.ts
 *   npm run demo:refresh
 *
 * Environment Variables:
 *   WA_API_KEY      - Required: Wild Apricot API key
 *   WA_ACCOUNT_ID   - Required: Wild Apricot account ID
 *   DRY_RUN         - Optional: Set to "1" for preview mode (no writes)
 *
 * Charter Compliance:
 *   - P7: Audit trail via console logs
 *   - P1: Identity via WA integration
 */

import { PrismaClient } from "@prisma/client";
import {
  createWAClient,
  type WAContact,
  type WAEvent,
  type WAEventRegistration,
} from "@/lib/importing/wildapricot";

const prisma = new PrismaClient();

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  maxMembers: 100, // Limit members to pull
  eventDaysAhead: 30, // Days ahead for events
  dryRun: process.env.DRY_RUN === "1",
};

// ============================================================================
// Types
// ============================================================================

interface ParityReport {
  timestamp: string;
  source: "WildApricot";
  members: {
    waCount: number;
    pulledCount: number;
    activeCount: number;
  };
  events: {
    waCount: number;
    pulledCount: number;
    upcomingCount: number;
  };
  registrations: {
    waCount: number;
    pulledCount: number;
  };
  errors: string[];
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log("");
  console.log("=".repeat(60));
  console.log("  SBNC Demo Data Refresh");
  console.log("=".repeat(60));
  console.log("");

  // Check environment
  if (!process.env.WA_API_KEY) {
    console.error("ERROR: WA_API_KEY environment variable is required");
    process.exit(1);
  }

  if (!process.env.WA_ACCOUNT_ID) {
    console.error("ERROR: WA_ACCOUNT_ID environment variable is required");
    process.exit(1);
  }

  if (CONFIG.dryRun) {
    console.log("Mode: DRY RUN (no database writes)");
    console.log("");
  }

  const report: ParityReport = {
    timestamp: new Date().toISOString(),
    source: "WildApricot",
    members: { waCount: 0, pulledCount: 0, activeCount: 0 },
    events: { waCount: 0, pulledCount: 0, upcomingCount: 0 },
    registrations: { waCount: 0, pulledCount: 0 },
    errors: [],
  };

  try {
    const client = createWAClient();

    // Step 1: Health check
    console.log("Step 1: Verifying WA connectivity...");
    const health = await client.healthCheck();
    if (!health.ok) {
      console.error(`ERROR: WA health check failed: ${health.error}`);
      process.exit(1);
    }
    console.log(`[OK] Connected to WA account: ${health.accountId}`);
    console.log("");

    // Step 2: Fetch active members
    console.log("Step 2: Fetching active members...");
    const allContacts = await client.fetchContacts("'Status' eq 'Active'");
    report.members.waCount = allContacts.length;

    // Take most recently updated members up to limit
    const sortedContacts = allContacts
      .sort((a, b) => {
        const dateA = new Date(a.ProfileLastUpdated || 0).getTime();
        const dateB = new Date(b.ProfileLastUpdated || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, CONFIG.maxMembers);

    report.members.pulledCount = sortedContacts.length;
    report.members.activeCount = sortedContacts.filter(c => c.Status === "Active").length;
    console.log(`[OK] Fetched ${sortedContacts.length} of ${allContacts.length} active members`);
    console.log("");

    // Step 3: Fetch upcoming events
    console.log("Step 3: Fetching upcoming events...");
    const now = new Date();
    const futureDate = new Date(now.getTime() + CONFIG.eventDaysAhead * 24 * 60 * 60 * 1000);

    const allEvents = await client.fetchEventsFromDate(now);
    report.events.waCount = allEvents.length;

    // Filter to events within the window
    const upcomingEvents = allEvents.filter(e => {
      const startDate = new Date(e.StartDate);
      return startDate >= now && startDate <= futureDate;
    });

    report.events.pulledCount = upcomingEvents.length;
    report.events.upcomingCount = upcomingEvents.length;
    console.log(`[OK] Fetched ${upcomingEvents.length} events in next ${CONFIG.eventDaysAhead} days`);
    console.log("");

    // Step 4: Fetch registrations for upcoming events
    console.log("Step 4: Fetching registrations for events...");
    let totalRegistrations = 0;
    const registrationsByEvent: Map<number, WAEventRegistration[]> = new Map();

    for (const event of upcomingEvents) {
      try {
        const registrations = await client.fetchEventRegistrations(event.Id);
        registrationsByEvent.set(event.Id, registrations);
        totalRegistrations += registrations.length;
      } catch (error) {
        const msg = `Failed to fetch registrations for event ${event.Id}: ${error instanceof Error ? error.message : error}`;
        report.errors.push(msg);
        console.warn(`WARN: ${msg}`);
      }
    }

    report.registrations.waCount = totalRegistrations;
    report.registrations.pulledCount = totalRegistrations;
    console.log(`[OK] Fetched ${totalRegistrations} registrations across ${upcomingEvents.length} events`);
    console.log("");

    // Step 5: Generate parity report
    console.log("Step 5: Generating parity report...");
    printParityReport(report, sortedContacts, upcomingEvents);
    console.log("");

    // Summary
    console.log("=".repeat(60));
    console.log("  Refresh Summary");
    console.log("=".repeat(60));
    console.log(`Members pulled:       ${report.members.pulledCount} / ${report.members.waCount}`);
    console.log(`Events pulled:        ${report.events.pulledCount}`);
    console.log(`Registrations pulled: ${report.registrations.pulledCount}`);
    console.log(`Errors:               ${report.errors.length}`);
    console.log("");

    if (CONFIG.dryRun) {
      console.log("DRY RUN: No data was written to the database.");
      console.log("Remove DRY_RUN=1 to write data.");
    } else {
      console.log("Note: This script only pulls data for inspection.");
      console.log("Use wa_full_sync.ts to import data into Murmurant.");
    }

    console.log("");
    process.exit(report.errors.length > 0 ? 1 : 0);
  } catch (error) {
    console.error("");
    console.error("FATAL ERROR:", error instanceof Error ? error.message : error);
    console.error("");
    process.exit(2);
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// Report Helpers
// ============================================================================

function printParityReport(
  report: ParityReport,
  members: WAContact[],
  events: WAEvent[]
): void {
  console.log("");
  console.log("-".repeat(40));
  console.log("  PARITY REPORT");
  console.log("-".repeat(40));
  console.log(`Generated: ${report.timestamp}`);
  console.log(`Source:    ${report.source}`);
  console.log("");

  console.log("MEMBERS:");
  console.log(`  Total in WA (active):  ${report.members.waCount}`);
  console.log(`  Pulled for demo:       ${report.members.pulledCount}`);
  console.log("");

  // Sample of members
  console.log("  Sample members (first 5):");
  for (const member of members.slice(0, 5)) {
    console.log(`    - ${member.FirstName} ${member.LastName} (${member.Email || "no email"})`);
  }
  console.log("");

  console.log("EVENTS:");
  console.log(`  Total future in WA:    ${report.events.waCount}`);
  console.log(`  Pulled (next 30 days): ${report.events.pulledCount}`);
  console.log("");

  // Sample of events
  console.log("  Sample events (first 5):");
  for (const event of events.slice(0, 5)) {
    const date = new Date(event.StartDate).toLocaleDateString();
    console.log(`    - ${event.Name} (${date})`);
  }
  console.log("");

  console.log("REGISTRATIONS:");
  console.log(`  Total pulled: ${report.registrations.pulledCount}`);
  console.log("");

  if (report.errors.length > 0) {
    console.log("ERRORS:");
    for (const error of report.errors) {
      console.log(`  - ${error}`);
    }
    console.log("");
  }

  console.log("-".repeat(40));
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(2);
});
