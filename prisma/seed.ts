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

import { PrismaClient, RegistrationStatus, UserRole } from "@prisma/client";
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

// Stable tokens for dev/test - deterministic and easy to remember
// NEVER use these in production!
const DEV_TOKENS = {
  admin: "dev-admin-token-alice-12345",
  member: "dev-member-token-carol-67890",
};

async function seedUserAccounts(
  memberMap: Map<string, string>
): Promise<void> {
  console.log("Seeding user accounts...");

  const aliceId = memberMap.get("alice@example.com")!;
  const carolId = memberMap.get("carol@example.com")!;

  // Simple hash for demo purposes - in production use bcrypt
  // This is "password123" - NOT secure, for local dev only
  const demoPasswordHash =
    "$2b$10$demohashdemohashdemohashdemohashdemohashdemoha";

  // Admin user: Alice
  await prisma.userAccount.upsert({
    where: { email: "alice@example.com" },
    update: {
      memberId: aliceId,
      passwordHash: demoPasswordHash,
      apiToken: DEV_TOKENS.admin,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      memberId: aliceId,
      email: "alice@example.com",
      passwordHash: demoPasswordHash,
      apiToken: DEV_TOKENS.admin,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  // Member user: Carol
  await prisma.userAccount.upsert({
    where: { email: "carol@example.com" },
    update: {
      memberId: carolId,
      passwordHash: demoPasswordHash,
      apiToken: DEV_TOKENS.member,
      role: UserRole.MEMBER,
      isActive: true,
    },
    create: {
      memberId: carolId,
      email: "carol@example.com",
      passwordHash: demoPasswordHash,
      apiToken: DEV_TOKENS.member,
      role: UserRole.MEMBER,
      isActive: true,
    },
  });

  console.log("  Created 2 user accounts:");
  console.log("    - alice@example.com (ADMIN)");
  console.log("    - carol@example.com (MEMBER)");
}

async function seedEvents(): Promise<Map<string, string>> {
  console.log("Seeding events...");

  const events = [
    {
      title: "Welcome Coffee",
      description: "A casual gathering for new and prospective members to learn about the club.",
      category: "Social",
      location: "Community Center, Room A",
      startTime: new Date("2025-07-15T10:00:00Z"),
      endTime: new Date("2025-07-15T12:00:00Z"),
      capacity: 20,
      isPublished: true,
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
    },
  ];

  const eventMap = new Map<string, string>();

  for (const event of events) {
    const created = await prisma.event.create({
      data: event,
    });
    eventMap.set(event.title, created.id);
  }

  console.log(`  Created ${events.length} events`);
  return eventMap;
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
    const eventMap = await seedEvents();
    await seedEventRegistrations(eventMap, memberMap);

    console.log("\n=== Seed Complete ===");
    console.log("Summary:");
    console.log("  - 5 membership statuses");
    console.log("  - 2 members (Alice Chen, Carol Johnson)");
    console.log("  - 2 user accounts (1 admin, 1 member)");
    console.log("  - 4 events (3 published, 1 draft)");
    console.log("  - 4 event registrations (3 confirmed, 1 waitlisted)");
    console.log("\n=== Dev API Tokens (for local testing) ===");
    console.log(`  Admin token: ${DEV_TOKENS.admin}`);
    console.log(`  Member token: ${DEV_TOKENS.member}`);
    console.log("\n  Usage: Authorization: Bearer <token>");
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
