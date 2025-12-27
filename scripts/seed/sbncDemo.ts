#!/usr/bin/env npx tsx
/**
 * SBNC Demo Dataset Seeder
 *
 * Creates a realistic but safe demo dataset for SBNC evaluation scenarios.
 * All data is fictional - no real member information is used.
 *
 * Dataset includes:
 * - 15 demo members with realistic Santa Barbara names
 * - 3 events (upcoming coffee, hike, luncheon)
 * - 1 paid registration to demonstrate payment flow
 * - Various membership statuses for lifecycle demos
 *
 * Supports:
 * - Demo spine walkthrough
 * - Migration dry-run testing
 * - Calendar export verification
 * - Payment processing demos
 *
 * Usage:
 *   DRY_RUN=1 npx tsx scripts/seed/sbncDemo.ts  # Preview mode
 *   npx tsx scripts/seed/sbncDemo.ts            # Execute
 *
 * Safety:
 * - Uses @sbnc-demo.example email domain (not deliverable)
 * - Clearly marked as demo data
 * - Idempotent: safe to rerun
 * - No production credentials used
 *
 * See: docs/DEMO/SBNC_DATASET.md
 */

import { PrismaClient, RegistrationStatus, PaymentIntentStatus, EventStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config } from "dotenv";

config();

// ============================================================================
// Configuration
// ============================================================================

const DEMO_EMAIL_DOMAIN = "sbnc-demo.example";
const DEMO_MARKER = "[DEMO]";

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

function validateEnvironment(): void {
  if (isProductionDatabase() && process.env.ALLOW_PROD_SEED !== "1") {
    throw new Error(
      "Production database detected. Set ALLOW_PROD_SEED=1 to proceed.\n" +
      "WARNING: This will add demo data to production."
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
// Date Utilities
// ============================================================================

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(10, 0, 0, 0); // 10 AM Pacific
  return date;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function yearsAgo(years: number): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
}

// ============================================================================
// Demo Member Data
// ============================================================================

interface DemoMember {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  statusCode: string;
  joinedAt: Date;
  notes?: string;
}

/**
 * 15 demo members with Santa Barbara-themed fictional names.
 * Distributed across membership statuses for lifecycle demos.
 */
const DEMO_MEMBERS: DemoMember[] = [
  // Extended Members (5) - Board eligible, full access
  {
    email: `margaret.montecito@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Margaret",
    lastName: "Montecito",
    phone: "805-555-0101",
    statusCode: "EXTENDED",
    joinedAt: yearsAgo(3),
    notes: "Active volunteer, past board member",
  },
  {
    email: `robert.riviera@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Robert",
    lastName: "Riviera",
    phone: "805-555-0102",
    statusCode: "EXTENDED",
    joinedAt: yearsAgo(4),
    notes: "Interest group leader - hiking",
  },
  {
    email: `susan.stearns@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Susan",
    lastName: "Stearns",
    phone: "805-555-0103",
    statusCode: "EXTENDED",
    joinedAt: yearsAgo(2),
    notes: "Event host, newsletter contributor",
  },
  {
    email: `william.waterfront@${DEMO_EMAIL_DOMAIN}`,
    firstName: "William",
    lastName: "Waterfront",
    phone: "805-555-0104",
    statusCode: "EXTENDED",
    joinedAt: yearsAgo(5),
    notes: "Founding member",
  },
  {
    email: `patricia.paseo@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Patricia",
    lastName: "Paseo",
    phone: "805-555-0105",
    statusCode: "EXTENDED",
    joinedAt: yearsAgo(3),
    notes: "Current VP Activities",
  },

  // Newcomer Members (5) - First two years
  {
    email: `james.jardine@${DEMO_EMAIL_DOMAIN}`,
    firstName: "James",
    lastName: "Jardine",
    phone: "805-555-0201",
    statusCode: "NEWCOMER",
    joinedAt: daysAgo(90),
    notes: "Recent joiner, attended 3 events",
  },
  {
    email: `linda.laguna@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Linda",
    lastName: "Laguna",
    phone: "805-555-0202",
    statusCode: "NEWCOMER",
    joinedAt: daysAgo(180),
    notes: "Joined via welcome coffee",
  },
  {
    email: `michael.mission@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Michael",
    lastName: "Mission",
    phone: "805-555-0203",
    statusCode: "NEWCOMER",
    joinedAt: daysAgo(45),
    notes: "Brand new member",
  },
  {
    email: `elizabeth.eastside@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Elizabeth",
    lastName: "Eastside",
    phone: "805-555-0204",
    statusCode: "NEWCOMER",
    joinedAt: daysAgo(365),
    notes: "Approaching extended status",
  },
  {
    email: `david.downtown@${DEMO_EMAIL_DOMAIN}`,
    firstName: "David",
    lastName: "Downtown",
    phone: "805-555-0205",
    statusCode: "NEWCOMER",
    joinedAt: daysAgo(60),
    notes: "Very active in interest groups",
  },

  // Alumni Members (2) - Former active, now social
  {
    email: `barbara.beachside@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Barbara",
    lastName: "Beachside",
    phone: "805-555-0301",
    statusCode: "ALUMNI",
    joinedAt: yearsAgo(8),
    notes: "Past President, alumni mentor",
  },
  {
    email: `richard.rancho@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Richard",
    lastName: "Rancho",
    phone: "805-555-0302",
    statusCode: "ALUMNI",
    joinedAt: yearsAgo(6),
    notes: "Alumni, occasional event attendee",
  },

  // Lapsed Members (2) - Expired, can renew
  {
    email: `nancy.noleta@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Nancy",
    lastName: "Noleta",
    phone: "805-555-0401",
    statusCode: "LAPSED",
    joinedAt: yearsAgo(2),
    notes: "Membership expired 30 days ago",
  },
  {
    email: `thomas.trigo@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Thomas",
    lastName: "Trigo",
    phone: "805-555-0402",
    statusCode: "LAPSED",
    joinedAt: yearsAgo(3),
    notes: "Lapsed 6 months ago, renewal reminder sent",
  },

  // Prospect (1) - Interested, not yet joined
  {
    email: `jennifer.junipero@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Jennifer",
    lastName: "Junipero",
    phone: "805-555-0501",
    statusCode: "PROSPECT",
    joinedAt: daysAgo(14),
    notes: "Attended welcome coffee, considering membership",
  },
];

// ============================================================================
// Demo Event Data
// ============================================================================

interface DemoEvent {
  title: string;
  description: string;
  category: string;
  location: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  fee?: number;
  requiresPayment: boolean;
  status: EventStatus;
}

/**
 * 3 demo events covering common SBNC activities.
 * Dates are relative to "now" for freshness.
 */
const DEMO_EVENTS: DemoEvent[] = [
  {
    title: `${DEMO_MARKER} Welcome Coffee - New Member Orientation`,
    description:
      "Join us for coffee and conversation! Learn about club activities, " +
      "meet current members, and discover interest groups. Light refreshments provided. " +
      "Open to prospective members and their guests.",
    category: "Social",
    location: "Faulkner Gallery, Santa Barbara Public Library",
    startTime: daysFromNow(7),
    endTime: (() => { const d = daysFromNow(7); d.setHours(12, 0, 0, 0); return d; })(),
    capacity: 30,
    requiresPayment: false,
    status: EventStatus.PUBLISHED,
  },
  {
    title: `${DEMO_MARKER} Morning Hike - Inspiration Point`,
    description:
      "Moderate 4-mile round trip hike to Inspiration Point with panoramic views " +
      "of the Santa Barbara coastline and Channel Islands. Bring water, snacks, and " +
      "sturdy shoes. Meet at the Tunnel Road trailhead.",
    category: "Outdoors",
    location: "Tunnel Road Trailhead, Santa Barbara",
    startTime: daysFromNow(14),
    endTime: (() => { const d = daysFromNow(14); d.setHours(13, 0, 0, 0); return d; })(),
    capacity: 15,
    requiresPayment: false,
    status: EventStatus.PUBLISHED,
  },
  {
    title: `${DEMO_MARKER} Monthly Luncheon - Guest Speaker`,
    description:
      "Monthly members-only luncheon featuring a guest speaker from the " +
      "Santa Barbara Historical Museum. Three-course meal included. " +
      "Vegetarian option available upon request.",
    category: "Social",
    location: "Santa Barbara Club, 1105 Chapala Street",
    startTime: daysFromNow(21),
    endTime: (() => { const d = daysFromNow(21); d.setHours(14, 0, 0, 0); return d; })(),
    capacity: 50,
    fee: 35.00,
    requiresPayment: true,
    status: EventStatus.PUBLISHED,
  },
];

// ============================================================================
// Seeding Functions
// ============================================================================

async function seedDemoMembers(
  prisma: PrismaClient,
  statusMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log("\nSeeding SBNC demo members...");

  const memberMap = new Map<string, string>();

  for (const member of DEMO_MEMBERS) {
    const statusId = statusMap.get(member.statusCode);
    if (!statusId) {
      console.warn(`  WARNING: Status ${member.statusCode} not found, skipping ${member.email}`);
      continue;
    }

    if (isDryRun()) {
      console.log(`  [DRY-RUN] Would create: ${member.firstName} ${member.lastName} (${member.statusCode})`);
      memberMap.set(member.email, `dry-run-${member.email}`);
      continue;
    }

    const created = await prisma.member.upsert({
      where: { email: member.email },
      update: {
        firstName: member.firstName,
        lastName: member.lastName,
        phone: member.phone,
        membershipStatusId: statusId,
      },
      create: {
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        membershipStatusId: statusId,
        joinedAt: member.joinedAt,
      },
    });

    memberMap.set(member.email, created.id);
    console.log(`  Created: ${member.firstName} ${member.lastName} (${member.statusCode})`);
  }

  console.log(`  Total: ${DEMO_MEMBERS.length} demo members`);
  return memberMap;
}

async function seedDemoEvents(
  prisma: PrismaClient,
  memberMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log("\nSeeding SBNC demo events...");

  const eventMap = new Map<string, string>();

  // Use Patricia Paseo as default event chair (VP Activities)
  const eventChairId = memberMap.get(`patricia.paseo@${DEMO_EMAIL_DOMAIN}`);

  for (const event of DEMO_EVENTS) {
    if (isDryRun()) {
      console.log(`  [DRY-RUN] Would create: ${event.title}`);
      eventMap.set(event.title, `dry-run-${event.title}`);
      continue;
    }

    // Check if event already exists (by title)
    const existing = await prisma.event.findFirst({
      where: { title: event.title },
    });

    if (existing) {
      console.log(`  Exists: ${event.title}`);
      eventMap.set(event.title, existing.id);
      continue;
    }

    const created = await prisma.event.create({
      data: {
        title: event.title,
        description: event.description,
        category: event.category,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        capacity: event.capacity,
        status: event.status,
        eventChairId: eventChairId,
        isPublished: event.status === EventStatus.PUBLISHED,
      },
    });

    eventMap.set(event.title, created.id);
    console.log(`  Created: ${event.title}`);
  }

  console.log(`  Total: ${DEMO_EVENTS.length} demo events`);
  return eventMap;
}

async function seedDemoRegistrations(
  prisma: PrismaClient,
  memberMap: Map<string, string>,
  eventMap: Map<string, string>
): Promise<void> {
  console.log("\nSeeding SBNC demo registrations...");

  const luncheonTitle = `${DEMO_MARKER} Monthly Luncheon - Guest Speaker`;
  const luncheonId = eventMap.get(luncheonTitle);
  const hikeTitle = `${DEMO_MARKER} Morning Hike - Inspiration Point`;
  const hikeId = eventMap.get(hikeTitle);
  const coffeeTitle = `${DEMO_MARKER} Welcome Coffee - New Member Orientation`;
  const coffeeId = eventMap.get(coffeeTitle);

  // Registrations to create
  const registrations = [
    // Paid registration for luncheon (demo payment flow)
    {
      eventId: luncheonId,
      memberEmail: `margaret.montecito@${DEMO_EMAIL_DOMAIN}`,
      status: RegistrationStatus.CONFIRMED,
      isPaid: true,
      amount: 35.00,
      description: "Paid luncheon registration",
    },
    // Additional luncheon registrations
    {
      eventId: luncheonId,
      memberEmail: `susan.stearns@${DEMO_EMAIL_DOMAIN}`,
      status: RegistrationStatus.CONFIRMED,
      isPaid: true,
      amount: 35.00,
      description: "Paid luncheon registration",
    },
    // Hike registrations (free event)
    {
      eventId: hikeId,
      memberEmail: `robert.riviera@${DEMO_EMAIL_DOMAIN}`,
      status: RegistrationStatus.CONFIRMED,
      isPaid: false,
      description: "Hike leader",
    },
    {
      eventId: hikeId,
      memberEmail: `james.jardine@${DEMO_EMAIL_DOMAIN}`,
      status: RegistrationStatus.CONFIRMED,
      isPaid: false,
      description: "Newcomer first hike",
    },
    {
      eventId: hikeId,
      memberEmail: `david.downtown@${DEMO_EMAIL_DOMAIN}`,
      status: RegistrationStatus.CONFIRMED,
      isPaid: false,
      description: "Regular hiker",
    },
    // Coffee registrations (free, open event)
    {
      eventId: coffeeId,
      memberEmail: `jennifer.junipero@${DEMO_EMAIL_DOMAIN}`,
      status: RegistrationStatus.CONFIRMED,
      isPaid: false,
      description: "Prospect attending orientation",
    },
    {
      eventId: coffeeId,
      memberEmail: `michael.mission@${DEMO_EMAIL_DOMAIN}`,
      status: RegistrationStatus.CONFIRMED,
      isPaid: false,
      description: "New member mentor match",
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const reg of registrations) {
    const memberId = memberMap.get(reg.memberEmail);

    if (!memberId || !reg.eventId) {
      console.log(`  Skipped: Missing member or event for ${reg.memberEmail}`);
      skipped++;
      continue;
    }

    if (isDryRun()) {
      console.log(`  [DRY-RUN] Would create: ${reg.description}`);
      created++;
      continue;
    }

    // Check if registration exists
    const existing = await prisma.eventRegistration.findFirst({
      where: {
        eventId: reg.eventId,
        memberId: memberId,
      },
    });

    if (existing) {
      console.log(`  Exists: ${reg.description}`);
      skipped++;
      continue;
    }

    await prisma.eventRegistration.create({
      data: {
        eventId: reg.eventId,
        memberId: memberId,
        status: reg.status,
        registeredAt: new Date(),
      },
    });

    // Create payment intent for paid registrations
    if (reg.isPaid && reg.amount) {
      const registration = await prisma.eventRegistration.findFirst({
        where: { eventId: reg.eventId, memberId: memberId },
      });
      if (registration) {
        const idempotencyKey = `demo_${registration.id}_${Date.now()}`;
        await prisma.paymentIntent.create({
          data: {
            registrationId: registration.id,
            idempotencyKey: idempotencyKey,
            amountCents: Math.round(reg.amount * 100),
            currency: "USD",
            status: PaymentIntentStatus.SUCCEEDED,
            provider: "fake",
            providerRef: `demo_pi_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            description: reg.description,
            metadata: { demo: true },
            webhookReceivedAt: new Date(),
          },
        });
      }
      console.log(`  Created: ${reg.description} (with payment: $${reg.amount})`);
    } else {
      console.log(`  Created: ${reg.description}`);
    }

    created++;
  }

  console.log(`  Total: ${created} registrations created, ${skipped} skipped`);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("SBNC Demo Dataset Seeder");
  console.log("=".repeat(60));

  if (isDryRun()) {
    console.log("\n*** DRY RUN MODE - No changes will be made ***\n");
  }

  validateEnvironment();

  const prisma = createPrismaClient();

  try {
    // Get existing membership statuses
    const statuses = await prisma.membershipStatus.findMany();
    const statusMap = new Map<string, string>();
    for (const status of statuses) {
      statusMap.set(status.code, status.id);
    }

    if (statusMap.size === 0) {
      throw new Error(
        "No membership statuses found. Run the main seed script first:\n" +
        "  npx prisma db seed"
      );
    }

    console.log(`\nFound ${statusMap.size} membership statuses`);

    // Seed demo data
    const memberMap = await seedDemoMembers(prisma, statusMap);
    const eventMap = await seedDemoEvents(prisma, memberMap);
    await seedDemoRegistrations(prisma, memberMap, eventMap);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("SBNC Demo Dataset Summary");
    console.log("=".repeat(60));
    console.log(`
Members:  ${DEMO_MEMBERS.length} demo members
  - Extended:  5 (board-eligible veterans)
  - Newcomer:  5 (first two years)
  - Alumni:    2 (former active members)
  - Lapsed:    2 (expired, can renew)
  - Prospect:  1 (interested, not joined)

Events:   ${DEMO_EVENTS.length} demo events
  - Welcome Coffee (free, open)
  - Morning Hike (free, capacity 15)
  - Monthly Luncheon (paid, $35)

Registrations: 7 demo registrations
  - 2 paid registrations with payment records
  - 5 free event registrations

Email Domain: ${DEMO_EMAIL_DOMAIN}
  (Non-deliverable, safe for testing)

Use Cases Supported:
  - Demo spine walkthrough
  - Migration dry-run testing
  - Calendar export verification
  - Payment processing demos
  - Membership lifecycle demos
`);

    if (isDryRun()) {
      console.log("*** DRY RUN COMPLETE - No changes were made ***\n");
    } else {
      console.log("Demo dataset seeded successfully.\n");
    }

  } catch (error) {
    console.error("\nSeeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
