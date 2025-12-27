#!/usr/bin/env npx tsx
/**
 * Demo Scenarios Seeder
 *
 * Creates demo fixtures for the demo dashboard including:
 * - Officer role members (President, VP Activities, Event Chair, etc.)
 * - Committees with role assignments
 * - Events in various states (upcoming, past, full, waitlist, draft)
 * - Lifecycle state members (handled by seed_demo_members.ts)
 *
 * Usage:
 *   DRY_RUN=1 npx tsx scripts/demo/seed_demo_scenarios.ts  # Preview mode
 *   npx tsx scripts/demo/seed_demo_scenarios.ts            # Execute
 *
 * Environment variables:
 *   ALLOW_PROD_SEED - Required in production: Set to "1" to allow
 *   DRY_RUN         - Optional: Set to "1" for preview mode (no writes)
 *
 * Guardrails:
 * - Additive only; does NOT delete real data
 * - Demo accounts use @sbnc.example domain
 * - Idempotent: safe to rerun
 *
 * Charter: P7 (audit trail) - seed actions are logged
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
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
// Utility Functions
// ============================================================================

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function _hoursFromNow(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
}

// ============================================================================
// Demo Data Definitions
// ============================================================================

const DEMO_EMAIL_DOMAIN = "sbnc.example";

/**
 * Demo officer members with specific roles for demonstrating role-based features.
 * These are separate from the lifecycle demo members.
 */
const DEMO_OFFICERS = [
  {
    email: `demo.president@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Patricia",
    lastName: "President",
    roleName: "President",
    committeeSlug: "executive-board",
    roleSlug: "president",
    description: "Club President - approves transitions, full visibility",
  },
  {
    email: `demo.vp-activities@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Victor",
    lastName: "VPActivities",
    roleName: "VP Activities",
    committeeSlug: "executive-board",
    roleSlug: "vp-activities",
    description: "VP Activities - manages events, approves transitions",
  },
  {
    email: `demo.vp-membership@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Melissa",
    lastName: "VPMembership",
    roleName: "VP Membership",
    committeeSlug: "executive-board",
    roleSlug: "vp-membership",
    description: "VP Membership - manages member onboarding",
  },
  {
    email: `demo.secretary@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Sarah",
    lastName: "Secretary",
    roleName: "Secretary",
    committeeSlug: "executive-board",
    roleSlug: "secretary",
    description: "Secretary - drafts and submits meeting minutes",
  },
  {
    email: `demo.parliamentarian@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Paul",
    lastName: "Parliamentarian",
    roleName: "Parliamentarian",
    committeeSlug: "executive-board",
    roleSlug: "parliamentarian",
    description: "Parliamentarian - manages governance and bylaws",
  },
  {
    email: `demo.eventchair@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Evan",
    lastName: "EventChair",
    roleName: "Event Chair",
    committeeSlug: "activities",
    roleSlug: "event-chair",
    description: "Event Chair - hosts specific events",
  },
  {
    email: `demo.webmaster@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Wendy",
    lastName: "Webmaster",
    roleName: "Webmaster",
    committeeSlug: "communications",
    roleSlug: "webmaster",
    description: "Webmaster - manages website content and publishing",
  },
];

/**
 * Demo committees to ensure role assignments work.
 */
const DEMO_COMMITTEES = [
  {
    slug: "executive-board",
    name: "Executive Board",
    description: "Club officers and leadership",
    roles: [
      { slug: "president", name: "President", sortOrder: 1 },
      { slug: "vp-activities", name: "VP Activities", sortOrder: 2 },
      { slug: "vp-membership", name: "VP Membership", sortOrder: 3 },
      { slug: "secretary", name: "Secretary", sortOrder: 4 },
      { slug: "treasurer", name: "Treasurer", sortOrder: 5 },
      { slug: "parliamentarian", name: "Parliamentarian", sortOrder: 6 },
    ],
  },
  {
    slug: "activities",
    name: "Activities Committee",
    description: "Plans and executes club events",
    roles: [
      { slug: "chair", name: "Chair", sortOrder: 1 },
      { slug: "event-chair", name: "Event Chair", sortOrder: 2 },
      { slug: "member", name: "Committee Member", sortOrder: 3 },
    ],
  },
  {
    slug: "communications",
    name: "Communications Committee",
    description: "Website, newsletters, and member communications",
    roles: [
      { slug: "chair", name: "Chair", sortOrder: 1 },
      { slug: "webmaster", name: "Webmaster", sortOrder: 2 },
      { slug: "newsletter-editor", name: "Newsletter Editor", sortOrder: 3 },
    ],
  },
];

/**
 * Demo events showcasing different event states for demo purposes.
 */
const DEMO_EVENTS = [
  {
    titlePrefix: "Demo:",
    title: "Upcoming Wine Tasting",
    category: "Social",
    description: "A fun wine tasting event for members. Demo scenario: upcoming published event with open registration.",
    startTimeDaysFromNow: 14,
    capacity: 30,
    isPublished: true,
    registrationsToCreate: 5,
    scenario: "upcoming_open",
    demoNotes: "Published event with available spots",
  },
  {
    titlePrefix: "Demo:",
    title: "Monthly Coffee Meetup",
    category: "Social",
    description: "Casual coffee gathering. Demo scenario: past event with attendance records.",
    startTimeDaysFromNow: -7,
    capacity: 20,
    isPublished: true,
    registrationsToCreate: 15,
    scenario: "past_completed",
    demoNotes: "Completed event with registration history",
  },
  {
    titlePrefix: "Demo:",
    title: "Sold Out Concert Trip",
    category: "Excursion",
    description: "Bus trip to LA for a concert. Demo scenario: at capacity with waitlist.",
    startTimeDaysFromNow: 21,
    capacity: 10,
    isPublished: true,
    registrationsToCreate: 10, // Full capacity
    waitlistCount: 3,
    scenario: "full_with_waitlist",
    demoNotes: "Shows capacity limits and waitlist",
  },
  {
    titlePrefix: "Demo:",
    title: "Draft: Beach Cleanup",
    category: "Volunteer",
    description: "Community service event. Demo scenario: unpublished draft event.",
    startTimeDaysFromNow: 30,
    capacity: 50,
    isPublished: false,
    registrationsToCreate: 0,
    scenario: "draft_unpublished",
    demoNotes: "Shows draft state before publishing",
  },
  {
    titlePrefix: "Demo:",
    title: "Free Garden Tour",
    category: "Educational",
    description: "Visit to local botanical gardens. Demo scenario: free event with no capacity limit.",
    startTimeDaysFromNow: 10,
    capacity: null, // No limit
    isPublished: true,
    registrationsToCreate: 8,
    scenario: "unlimited_free",
    demoNotes: "Free event with unlimited capacity",
  },
];

// ============================================================================
// Seeding Functions
// ============================================================================

interface SeedStats {
  committees: { created: number; updated: number };
  committeeRoles: { created: number; updated: number };
  terms: { created: number; updated: number };
  members: { created: number; updated: number };
  roleAssignments: { created: number; updated: number };
  events: { created: number; updated: number };
  registrations: { created: number; updated: number };
}

async function seedCommittees(
  prisma: PrismaClient,
  stats: SeedStats,
  dryRun: boolean
): Promise<Map<string, { id: string; roles: Map<string, string> }>> {
  console.log("\n--- Seeding Committees ---");

  const committeeMap = new Map<string, { id: string; roles: Map<string, string> }>();

  for (const committee of DEMO_COMMITTEES) {
    if (dryRun) {
      console.log(`  [DRY] Would upsert committee: ${committee.name}`);
      for (const role of committee.roles) {
        console.log(`    [DRY] Would upsert role: ${role.name}`);
      }
      committeeMap.set(committee.slug, { id: "dry-run-id", roles: new Map() });
      continue;
    }

    // Upsert committee
    const existing = await prisma.committee.findUnique({
      where: { slug: committee.slug },
    });

    let committeeId: string;
    if (existing) {
      await prisma.committee.update({
        where: { slug: committee.slug },
        data: {
          name: committee.name,
          description: committee.description,
          isActive: true,
        },
      });
      committeeId = existing.id;
      stats.committees.updated++;
      console.log(`  [UPDATE] Committee: ${committee.name}`);
    } else {
      const created = await prisma.committee.create({
        data: {
          name: committee.name,
          slug: committee.slug,
          description: committee.description,
          isActive: true,
        },
      });
      committeeId = created.id;
      stats.committees.created++;
      console.log(`  [CREATE] Committee: ${committee.name}`);
    }

    // Upsert roles for this committee
    const rolesMap = new Map<string, string>();
    for (const role of committee.roles) {
      const existingRole = await prisma.committeeRole.findUnique({
        where: {
          committeeId_slug: {
            committeeId,
            slug: role.slug,
          },
        },
      });

      if (existingRole) {
        await prisma.committeeRole.update({
          where: { id: existingRole.id },
          data: {
            name: role.name,
            sortOrder: role.sortOrder,
          },
        });
        rolesMap.set(role.slug, existingRole.id);
        stats.committeeRoles.updated++;
      } else {
        const createdRole = await prisma.committeeRole.create({
          data: {
            committeeId,
            name: role.name,
            slug: role.slug,
            sortOrder: role.sortOrder,
          },
        });
        rolesMap.set(role.slug, createdRole.id);
        stats.committeeRoles.created++;
      }
    }

    committeeMap.set(committee.slug, { id: committeeId, roles: rolesMap });
  }

  return committeeMap;
}

async function ensureCurrentTerm(
  prisma: PrismaClient,
  stats: SeedStats,
  dryRun: boolean
): Promise<string> {
  console.log("\n--- Ensuring Current Term ---");

  if (dryRun) {
    console.log("  [DRY] Would ensure current term exists");
    return "dry-run-term-id";
  }

  // Find or create a current term
  const currentTerm = await prisma.term.findFirst({
    where: { isCurrent: true },
  });

  if (currentTerm) {
    console.log(`  [OK] Using existing term: ${currentTerm.name}`);
    return currentTerm.id;
  }

  // Create a new term for the current year
  const year = new Date().getFullYear();
  const newTerm = await prisma.term.create({
    data: {
      name: `${year}-${year + 1}`,
      startDate: new Date(`${year}-07-01`),
      endDate: new Date(`${year + 1}-06-30`),
      isCurrent: true,
    },
  });

  stats.terms.created++;
  console.log(`  [CREATE] Term: ${newTerm.name}`);
  return newTerm.id;
}

async function seedOfficerMembers(
  prisma: PrismaClient,
  committeeMap: Map<string, { id: string; roles: Map<string, string> }>,
  termId: string,
  statusMap: Map<string, string>,
  tierMap: Map<string, string>,
  stats: SeedStats,
  dryRun: boolean
): Promise<Map<string, string>> {
  console.log("\n--- Seeding Demo Officer Members ---");

  const memberMap = new Map<string, string>();
  const activeStatusId = statusMap.get("active");
  const memberTierId = tierMap.get("member");

  if (!activeStatusId) {
    throw new Error("Missing 'active' membership status");
  }

  for (const officer of DEMO_OFFICERS) {
    if (dryRun) {
      console.log(`  [DRY] Would upsert member: ${officer.email}`);
      console.log(`        Role: ${officer.roleName} in ${officer.committeeSlug}`);
      memberMap.set(officer.email, "dry-run-member-id");
      continue;
    }

    // Upsert member
    const existing = await prisma.member.findUnique({
      where: { email: officer.email },
    });

    let memberId: string;
    if (existing) {
      await prisma.member.update({
        where: { email: officer.email },
        data: {
          firstName: officer.firstName,
          lastName: officer.lastName,
          membershipStatusId: activeStatusId,
          membershipTierId: memberTierId,
        },
      });
      memberId = existing.id;
      stats.members.updated++;
      console.log(`  [UPDATE] ${officer.firstName} ${officer.lastName} (${officer.email})`);
    } else {
      const created = await prisma.member.create({
        data: {
          firstName: officer.firstName,
          lastName: officer.lastName,
          email: officer.email,
          joinedAt: daysAgo(365), // Officers are established members
          membershipStatusId: activeStatusId,
          membershipTierId: memberTierId,
        },
      });
      memberId = created.id;
      stats.members.created++;
      console.log(`  [CREATE] ${officer.firstName} ${officer.lastName} (${officer.email})`);
    }

    memberMap.set(officer.email, memberId);

    // Create role assignment
    const committeeData = committeeMap.get(officer.committeeSlug);
    if (committeeData) {
      const roleId = committeeData.roles.get(officer.roleSlug);
      if (roleId) {
        // Check if assignment already exists
        const existingAssignment = await prisma.roleAssignment.findFirst({
          where: {
            memberId,
            committeeId: committeeData.id,
            committeeRoleId: roleId,
            termId,
          },
        });

        if (!existingAssignment) {
          await prisma.roleAssignment.create({
            data: {
              memberId,
              committeeId: committeeData.id,
              committeeRoleId: roleId,
              termId,
              startDate: daysAgo(180),
            },
          });
          stats.roleAssignments.created++;
          console.log(`    + Assigned: ${officer.roleName}`);
        } else {
          stats.roleAssignments.updated++;
        }
      }
    }
  }

  return memberMap;
}

async function seedDemoEvents(
  prisma: PrismaClient,
  memberMap: Map<string, string>,
  stats: SeedStats,
  dryRun: boolean
): Promise<void> {
  console.log("\n--- Seeding Demo Events ---");

  // Get some demo members for registrations
  const _demoMemberEmails = Array.from(memberMap.keys());

  for (const eventDef of DEMO_EVENTS) {
    const fullTitle = `${eventDef.titlePrefix} ${eventDef.title}`;

    if (dryRun) {
      console.log(`  [DRY] Would upsert event: ${fullTitle}`);
      console.log(`        Scenario: ${eventDef.scenario}`);
      continue;
    }

    // Look for existing demo event by title pattern
    const existing = await prisma.event.findFirst({
      where: {
        AND: [
          { title: { startsWith: eventDef.titlePrefix } },
          { title: { contains: eventDef.title.replace(eventDef.titlePrefix, "").trim() } },
        ],
      },
    });

    const startTime = daysFromNow(eventDef.startTimeDaysFromNow);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 2);

    let eventId: string;
    if (existing) {
      await prisma.event.update({
        where: { id: existing.id },
        data: {
          title: fullTitle,
          description: eventDef.description,
          category: eventDef.category,
          startTime,
          endTime,
          capacity: eventDef.capacity,
          isPublished: eventDef.isPublished,
        },
      });
      eventId = existing.id;
      stats.events.updated++;
      console.log(`  [UPDATE] ${fullTitle}`);
    } else {
      const created = await prisma.event.create({
        data: {
          title: fullTitle,
          description: eventDef.description,
          category: eventDef.category,
          startTime,
          endTime,
          capacity: eventDef.capacity,
          isPublished: eventDef.isPublished,
        },
      });
      eventId = created.id;
      stats.events.created++;
      console.log(`  [CREATE] ${fullTitle}`);
    }

    // Create demo registrations if needed
    if (eventDef.registrationsToCreate > 0 || (eventDef.waitlistCount ?? 0) > 0) {
      // Get demo members that don't already have registrations
      const existingRegs = await prisma.eventRegistration.findMany({
        where: { eventId },
        select: { memberId: true },
      });
      const existingMemberIds = new Set(existingRegs.map((r) => r.memberId));

      // Get additional demo members for registrations
      const availableMembers = await prisma.member.findMany({
        where: {
          email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` },
          id: { notIn: Array.from(existingMemberIds) },
        },
        take: eventDef.registrationsToCreate + (eventDef.waitlistCount ?? 0),
        select: { id: true },
      });

      let confirmedCount = 0;
      let waitlistCount = 0;

      for (let i = 0; i < availableMembers.length && i < eventDef.registrationsToCreate; i++) {
        await prisma.eventRegistration.create({
          data: {
            eventId,
            memberId: availableMembers[i].id,
            status: "CONFIRMED",
            registeredAt: daysAgo(Math.floor(Math.random() * 14) + 1),
          },
        });
        confirmedCount++;
        stats.registrations.created++;
      }

      // Add waitlist registrations
      if (eventDef.waitlistCount) {
        for (
          let i = eventDef.registrationsToCreate;
          i < availableMembers.length && waitlistCount < eventDef.waitlistCount;
          i++
        ) {
          await prisma.eventRegistration.create({
            data: {
              eventId,
              memberId: availableMembers[i].id,
              status: "WAITLISTED",
              waitlistPosition: waitlistCount + 1,
              registeredAt: daysAgo(Math.floor(Math.random() * 7)),
            },
          });
          waitlistCount++;
          stats.registrations.created++;
        }
      }

      if (confirmedCount > 0 || waitlistCount > 0) {
        console.log(`    + ${confirmedCount} confirmed, ${waitlistCount} waitlisted`);
      }
    }
  }
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log("");
  console.log("=".repeat(60));
  console.log("  Demo Scenarios Seeder");
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
    console.error("  ALLOW_PROD_SEED=1 npx tsx scripts/demo/seed_demo_scenarios.ts");
    console.error("");
    process.exit(1);
  }

  const dryRun = isDryRun();
  if (dryRun) {
    console.log("Mode: DRY RUN (no database writes)");
    console.log("      Remove DRY_RUN=1 to execute changes");
    console.log("");
  }

  const prisma = createPrismaClient();

  try {
    // Check database connectivity
    console.log("Checking database connection...");
    await prisma.$queryRaw`SELECT 1`;
    console.log("[OK] Database connection established\n");

    // Load membership status and tier maps
    console.log("Loading membership statuses and tiers...");
    const statuses = await prisma.membershipStatus.findMany();
    const tiers = await prisma.membershipTier.findMany();

    const statusMap = new Map(statuses.map((s) => [s.code, s.id]));
    const tierMap = new Map(tiers.map((t) => [t.code, t.id]));

    console.log(`  Found ${statuses.length} statuses, ${tiers.length} tiers`);

    // Validate required statuses exist
    if (!statusMap.has("active")) {
      throw new Error("Missing required MembershipStatus: active. Run seed_membership_statuses.ts first.");
    }

    // Initialize stats
    const stats: SeedStats = {
      committees: { created: 0, updated: 0 },
      committeeRoles: { created: 0, updated: 0 },
      terms: { created: 0, updated: 0 },
      members: { created: 0, updated: 0 },
      roleAssignments: { created: 0, updated: 0 },
      events: { created: 0, updated: 0 },
      registrations: { created: 0, updated: 0 },
    };

    // Seed in order
    const committeeMap = await seedCommittees(prisma, stats, dryRun);
    const termId = await ensureCurrentTerm(prisma, stats, dryRun);
    const memberMap = await seedOfficerMembers(
      prisma,
      committeeMap,
      termId,
      statusMap,
      tierMap,
      stats,
      dryRun
    );
    await seedDemoEvents(prisma, memberMap, stats, dryRun);

    // Print summary
    console.log("");
    console.log("=".repeat(60));
    if (dryRun) {
      console.log("  DRY RUN COMPLETE - No changes made");
    } else {
      console.log("  SEEDING COMPLETE");
    }
    console.log("=".repeat(60));
    console.log("");
    console.log("Summary:");
    console.log(`  Committees:      ${stats.committees.created} created, ${stats.committees.updated} updated`);
    console.log(`  Committee Roles: ${stats.committeeRoles.created} created, ${stats.committeeRoles.updated} updated`);
    console.log(`  Terms:           ${stats.terms.created} created, ${stats.terms.updated} updated`);
    console.log(`  Members:         ${stats.members.created} created, ${stats.members.updated} updated`);
    console.log(`  Role Assignments:${stats.roleAssignments.created} created, ${stats.roleAssignments.updated} updated`);
    console.log(`  Events:          ${stats.events.created} created, ${stats.events.updated} updated`);
    console.log(`  Registrations:   ${stats.registrations.created} created, ${stats.registrations.updated} updated`);
    console.log("");

    // Print demo scenario reference
    console.log("Demo Scenarios Created:");
    console.log("-".repeat(60));
    console.log("");
    console.log("Officer Roles (@sbnc.example):");
    for (const officer of DEMO_OFFICERS) {
      console.log(`  ${officer.roleName.padEnd(20)} ${officer.email}`);
    }
    console.log("");
    console.log("Event Scenarios:");
    for (const event of DEMO_EVENTS) {
      console.log(`  [${event.scenario}] ${event.title}`);
      console.log(`    ${event.demoNotes}`);
    }
    console.log("-".repeat(60));
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
