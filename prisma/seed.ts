/**
 * Prisma Seed Script for ClubOS
 *
 * Creates minimal, coherent seed data for local development and testing.
 * See docs/schema/SEED_DATA_PLAN.md for the full seed data specification.
 *
 * This script is idempotent - running it twice produces the same result.
 *
 * Usage:
 *   npx prisma db seed
 *   # or
 *   npm run db:seed
 */

import { PrismaClient, RegistrationStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Load .env manually for seed script
import { config } from "dotenv";
config();

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

// Safety check: prevent running against production
function checkEnvironment(): void {
  const dbUrl = process.env.DATABASE_URL || "";
  const isProduction =
    process.env.NODE_ENV === "production" ||
    dbUrl.includes("production") ||
    dbUrl.includes("prod.") ||
    dbUrl.includes(".com"); // Simple heuristic

  if (isProduction) {
    console.error("ERROR: Seed script detected production environment.");
    console.error("DATABASE_URL:", dbUrl.substring(0, 30) + "...");
    console.error("Aborting to prevent data loss.");
    process.exit(1);
  }
}

async function clearData(): Promise<void> {
  console.log("Clearing existing data...");

  // Delete in reverse dependency order
  await prisma.ticketEligibilityOverride.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.eventSponsorship.deleteMany();
  await prisma.committeeMembership.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.photoAlbum.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.userAccount.deleteMany();
  await prisma.roleAssignment.deleteMany();
  await prisma.term.deleteMany();
  await prisma.committeeRole.deleteMany();
  await prisma.committee.deleteMany();
  await prisma.member.deleteMany();
  await prisma.membershipStatus.deleteMany();

  console.log("Data cleared.");
}

async function seedMembershipStatuses(): Promise<Map<string, string>> {
  console.log("Seeding membership statuses...");

  const statuses = [
    {
      code: "PROSPECT",
      label: "Prospect",
      description: "Interested but not yet a member",
      isActive: false,
      isEligibleForRenewal: false,
      isBoardEligible: false,
      sortOrder: 1,
    },
    {
      code: "NEWCOMER",
      label: "Newcomer",
      description: "New member within first 2 years",
      isActive: true,
      isEligibleForRenewal: true,
      isBoardEligible: false,
      sortOrder: 2,
    },
    {
      code: "EXTENDED",
      label: "Extended Member",
      description: "Member beyond initial newcomer period",
      isActive: true,
      isEligibleForRenewal: true,
      isBoardEligible: true,
      sortOrder: 3,
    },
    {
      code: "ALUMNI",
      label: "Alumni",
      description: "Former active member",
      isActive: true,
      isEligibleForRenewal: false,
      isBoardEligible: false,
      sortOrder: 4,
    },
    {
      code: "LAPSED",
      label: "Lapsed",
      description: "Membership expired",
      isActive: false,
      isEligibleForRenewal: true,
      isBoardEligible: false,
      sortOrder: 5,
    },
  ];

  const statusMap = new Map<string, string>();

  for (const status of statuses) {
    const created = await prisma.membershipStatus.upsert({
      where: { code: status.code },
      update: status,
      create: status,
    });
    statusMap.set(status.code, created.id);
  }

  console.log(`  Created ${statuses.length} membership statuses`);
  return statusMap;
}

async function seedMembers(
  statusMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log("Seeding members...");

  const extendedId = statusMap.get("EXTENDED")!;
  const newcomerId = statusMap.get("NEWCOMER")!;
  const lapsedId = statusMap.get("LAPSED")!;

  const members = [
    {
      email: "alice@example.com",
      firstName: "Alice",
      lastName: "Chen",
      phone: "+1-555-0101",
      membershipStatusId: extendedId,
      joinedAt: new Date("2022-01-15"),
    },
    {
      email: "carol@example.com",
      firstName: "Carol",
      lastName: "Johnson",
      phone: "+1-555-0102",
      membershipStatusId: newcomerId,
      joinedAt: new Date("2024-06-01"),
    },
    {
      // Dave has lapsed membership - for testing NOT_MEMBER_ON_EVENT_DATE
      email: "dave@example.com",
      firstName: "Dave",
      lastName: "Wilson",
      phone: "+1-555-0103",
      membershipStatusId: lapsedId,
      joinedAt: new Date("2020-01-01"),
    },
  ];

  const memberMap = new Map<string, string>();

  for (const member of members) {
    const created = await prisma.member.upsert({
      where: { email: member.email },
      update: member,
      create: member,
    });
    memberMap.set(member.email, created.id);
  }

  console.log(`  Created ${members.length} members`);
  return memberMap;
}

async function seedUserAccounts(memberMap: Map<string, string>): Promise<void> {
  console.log("Seeding user accounts...");

  const aliceId = memberMap.get("alice@example.com")!;

  // Simple hash for demo purposes - in production use bcrypt
  // This is "password123" - NOT secure, for local dev only
  const demoPasswordHash =
    "$2b$10$demohashdemohashdemohashdemohashdemohashdemoha";

  await prisma.userAccount.upsert({
    where: { email: "alice@example.com" },
    update: {
      memberId: aliceId,
      passwordHash: demoPasswordHash,
      isActive: true,
    },
    create: {
      memberId: aliceId,
      email: "alice@example.com",
      passwordHash: demoPasswordHash,
      isActive: true,
    },
  });

  console.log("  Created 1 admin user account (alice@example.com)");
}

async function seedCommittees(): Promise<Map<string, string>> {
  console.log("Seeding committees...");

  const committees = [
    {
      name: "Activities Committee",
      slug: "activities",
      description: "Plans and executes club social events and activities",
      isActive: true,
    },
    {
      name: "Outdoor Adventures Committee",
      slug: "outdoor-adventures",
      description: "Organizes hiking, camping, and other outdoor activities",
      isActive: true,
    },
  ];

  const committeeMap = new Map<string, string>();

  for (const committee of committees) {
    const created = await prisma.committee.upsert({
      where: { slug: committee.slug },
      update: committee,
      create: committee,
    });
    committeeMap.set(committee.slug, created.id);
  }

  console.log(`  Created ${committees.length} committees`);
  return committeeMap;
}

async function seedCommitteeMemberships(
  memberMap: Map<string, string>,
  committeeMap: Map<string, string>
): Promise<void> {
  console.log("Seeding committee memberships...");

  const aliceId = memberMap.get("alice@example.com")!;
  const carolId = memberMap.get("carol@example.com")!;
  const activitiesId = committeeMap.get("activities")!;
  const outdoorId = committeeMap.get("outdoor-adventures")!;

  const memberships = [
    {
      memberId: aliceId,
      committeeId: activitiesId,
      startDate: new Date("2023-01-01"),
      endDate: null, // Current member
      role: "Chair",
    },
    {
      memberId: aliceId,
      committeeId: outdoorId,
      startDate: new Date("2023-06-01"),
      endDate: null, // Current member
      role: null,
    },
    {
      memberId: carolId,
      committeeId: outdoorId,
      startDate: new Date("2024-06-15"),
      endDate: null, // Current member
      role: null,
    },
    // Carol's old membership that ended - for testing date-based eligibility
    {
      memberId: carolId,
      committeeId: activitiesId,
      startDate: new Date("2024-06-01"),
      endDate: new Date("2024-12-31"), // Ended membership
      role: null,
    },
  ];

  for (const membership of memberships) {
    await prisma.committeeMembership.create({ data: membership });
  }

  console.log(`  Created ${memberships.length} committee memberships`);
}

async function seedEvents(
  memberMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log("Seeding events...");

  const aliceId = memberMap.get("alice@example.com")!;
  const carolId = memberMap.get("carol@example.com")!;

  const events = [
    {
      title: "Welcome Coffee",
      description:
        "A casual gathering for new and prospective members to learn about the club.",
      category: "Social",
      location: "Community Center, Room A",
      startTime: new Date("2025-07-15T10:00:00Z"),
      endTime: new Date("2025-07-15T12:00:00Z"),
      capacity: 20,
      isPublished: true,
      eventChairId: aliceId, // Alice chairs this event
    },
    {
      title: "Morning Hike at Rattlesnake Canyon",
      description: "A moderate 5-mile hike with beautiful ocean views.",
      category: "Outdoors",
      location: "Rattlesnake Canyon Trailhead",
      startTime: new Date("2025-06-10T08:00:00Z"),
      endTime: new Date("2025-06-10T12:00:00Z"),
      capacity: 15,
      isPublished: true,
      eventChairId: carolId, // Carol chairs this event
    },
    {
      title: "Summer Beach Picnic",
      description: "Annual beach gathering with food, games, and swimming.",
      category: "Social",
      location: "East Beach Pavilion",
      startTime: new Date("2025-08-20T11:00:00Z"),
      endTime: new Date("2025-08-20T15:00:00Z"),
      capacity: 50,
      isPublished: true,
      // No event chair - tests unchaired event access
    },
    {
      title: "Draft Event (not published)",
      description: "This event should not appear in member-facing lists.",
      category: "Social",
      location: "TBD",
      startTime: new Date("2025-09-01T10:00:00Z"),
      endTime: new Date("2025-09-01T12:00:00Z"),
      capacity: 10,
      isPublished: false,
      // No event chair
    },
  ];

  const eventMap = new Map<string, string>();

  for (const event of events) {
    const created = await prisma.event.create({
      data: event,
    });
    eventMap.set(event.title, created.id);
  }

  console.log(`  Created ${events.length} events (2 with event chairs)`);
  return eventMap;
}

async function seedEventSponsorships(
  eventMap: Map<string, string>,
  committeeMap: Map<string, string>
): Promise<void> {
  console.log("Seeding event sponsorships...");

  const welcomeCoffeeId = eventMap.get("Welcome Coffee")!;
  const hikeId = eventMap.get("Morning Hike at Rattlesnake Canyon")!;
  const activitiesId = committeeMap.get("activities")!;
  const outdoorId = committeeMap.get("outdoor-adventures")!;

  const sponsorships = [
    {
      eventId: welcomeCoffeeId,
      committeeId: activitiesId,
      isPrimary: true,
    },
    {
      // Co-sponsor for Welcome Coffee
      eventId: welcomeCoffeeId,
      committeeId: outdoorId,
      isPrimary: false,
    },
    {
      eventId: hikeId,
      committeeId: outdoorId,
      isPrimary: true,
    },
  ];

  for (const sponsorship of sponsorships) {
    await prisma.eventSponsorship.create({ data: sponsorship });
  }

  console.log(`  Created ${sponsorships.length} event sponsorships`);
}

async function seedTicketTypes(
  eventMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log("Seeding ticket types...");

  const welcomeCoffeeId = eventMap.get("Welcome Coffee")!;
  const hikeId = eventMap.get("Morning Hike at Rattlesnake Canyon")!;
  const picnicId = eventMap.get("Summer Beach Picnic")!;

  const ticketTypes = [
    // Welcome Coffee event - has all ticket types
    {
      eventId: welcomeCoffeeId,
      code: "MEMBER_STANDARD",
      name: "Standard Member Ticket",
      description: "General admission for active members",
      price: 0,
      sortOrder: 1,
    },
    {
      eventId: welcomeCoffeeId,
      code: "SPONSOR_COMMITTEE",
      name: "Sponsor Committee Ticket",
      description: "Ticket for sponsoring committee members",
      price: 0,
      sortOrder: 2,
    },
    {
      eventId: welcomeCoffeeId,
      code: "WORKING_COMMITTEE",
      name: "Working Committee Ticket",
      description: "Ticket for any committee member helping with the event",
      price: 0,
      sortOrder: 3,
    },
    // Hike event - member and sponsor tickets
    {
      eventId: hikeId,
      code: "MEMBER_STANDARD",
      name: "Standard Hike Ticket",
      description: "General admission for active members",
      price: 5,
      sortOrder: 1,
    },
    {
      eventId: hikeId,
      code: "SPONSOR_COMMITTEE",
      name: "Outdoor Committee Ticket",
      description: "Free ticket for Outdoor Adventures committee members",
      price: 0,
      sortOrder: 2,
    },
    // Beach picnic - just member standard (no sponsor)
    {
      eventId: picnicId,
      code: "MEMBER_STANDARD",
      name: "Picnic Ticket",
      description: "General admission to the beach picnic",
      price: 10,
      sortOrder: 1,
    },
  ];

  const ticketTypeMap = new Map<string, string>();

  for (const ticketType of ticketTypes) {
    const created = await prisma.ticketType.create({ data: ticketType });
    // Store with composite key: eventId-code
    ticketTypeMap.set(`${ticketType.eventId}-${ticketType.code}`, created.id);
  }

  console.log(`  Created ${ticketTypes.length} ticket types`);
  return ticketTypeMap;
}

async function seedEligibilityOverrides(
  eventMap: Map<string, string>,
  memberMap: Map<string, string>,
  ticketTypeMap: Map<string, string>
): Promise<void> {
  console.log("Seeding eligibility overrides...");

  const welcomeCoffeeId = eventMap.get("Welcome Coffee")!;
  const carolId = memberMap.get("carol@example.com")!;
  const daveId = memberMap.get("dave@example.com")!;
  const workingTicketId = ticketTypeMap.get(
    `${welcomeCoffeeId}-WORKING_COMMITTEE`
  )!;
  const memberTicketId = ticketTypeMap.get(
    `${welcomeCoffeeId}-MEMBER_STANDARD`
  )!;

  const overrides = [
    {
      // Deny Carol from WORKING_COMMITTEE ticket despite being in a committee
      eventId: welcomeCoffeeId,
      ticketTypeId: workingTicketId,
      memberId: carolId,
      allow: false,
      reason: "Not scheduled to work this event",
    },
    {
      // Allow Dave (lapsed member) to purchase member ticket as special case
      eventId: welcomeCoffeeId,
      ticketTypeId: memberTicketId,
      memberId: daveId,
      allow: true,
      reason: "Approved by VP Activities for reinstatement consideration",
    },
  ];

  for (const override of overrides) {
    await prisma.ticketEligibilityOverride.create({ data: override });
  }

  console.log(`  Created ${overrides.length} eligibility overrides`);
}

async function seedEventRegistrations(
  eventMap: Map<string, string>,
  memberMap: Map<string, string>
): Promise<void> {
  console.log("Seeding event registrations...");

  const welcomeCoffeeId = eventMap.get("Welcome Coffee")!;
  const hikeId = eventMap.get("Morning Hike at Rattlesnake Canyon")!;
  const picnicId = eventMap.get("Summer Beach Picnic")!;
  const carolId = memberMap.get("carol@example.com")!;
  const aliceId = memberMap.get("alice@example.com")!;

  const registrations = [
    {
      eventId: welcomeCoffeeId,
      memberId: carolId,
      status: RegistrationStatus.CONFIRMED,
      registeredAt: new Date("2025-06-20T14:30:00Z"),
    },
    {
      eventId: hikeId,
      memberId: carolId,
      status: RegistrationStatus.CONFIRMED,
      registeredAt: new Date("2025-06-01T09:00:00Z"),
    },
    {
      eventId: hikeId,
      memberId: aliceId,
      status: RegistrationStatus.WAITLISTED,
      waitlistPosition: 1,
      registeredAt: new Date("2025-06-02T10:30:00Z"),
    },
    {
      eventId: picnicId,
      memberId: aliceId,
      status: RegistrationStatus.CONFIRMED,
      registeredAt: new Date("2025-07-15T08:00:00Z"),
    },
  ];

  for (const reg of registrations) {
    await prisma.eventRegistration.create({ data: reg });
  }

  console.log(`  Created ${registrations.length} event registrations`);
}

async function main(): Promise<void> {
  console.log("=== ClubOS Seed Script ===\n");

  checkEnvironment();

  try {
    await clearData();

    const statusMap = await seedMembershipStatuses();
    const memberMap = await seedMembers(statusMap);
    await seedUserAccounts(memberMap);
    const committeeMap = await seedCommittees();
    await seedCommitteeMemberships(memberMap, committeeMap);
    const eventMap = await seedEvents(memberMap);
    await seedEventSponsorships(eventMap, committeeMap);
    const ticketTypeMap = await seedTicketTypes(eventMap);
    await seedEligibilityOverrides(eventMap, memberMap, ticketTypeMap);
    await seedEventRegistrations(eventMap, memberMap);

    console.log("\n=== Seed Complete ===");
    console.log("Summary:");
    console.log("  - 5 membership statuses");
    console.log("  - 3 members (Alice Chen, Carol Johnson, Dave Wilson)");
    console.log("  - 1 admin user account (alice@example.com)");
    console.log("  - 2 committees (Activities, Outdoor Adventures)");
    console.log("  - 4 committee memberships");
    console.log("  - 4 events (3 published, 1 draft)");
    console.log("  - 3 event sponsorships (1 event with co-sponsor)");
    console.log("  - 6 ticket types");
    console.log("  - 2 eligibility overrides (1 deny, 1 allow)");
    console.log("  - 4 event registrations (3 confirmed, 1 waitlisted)");
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
