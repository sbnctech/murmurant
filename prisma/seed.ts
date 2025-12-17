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

async function seedUserAccounts(
  memberMap: Map<string, string>
): Promise<void> {
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

async function seedEvents(
  memberMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log("Seeding events...");

  const aliceId = memberMap.get("alice@example.com")!;
  const carolId = memberMap.get("carol@example.com")!;

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
      // No event chair - tests unchained event access
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

async function seedCommitteesAndRoles(): Promise<void> {
  console.log("Seeding committees and roles...");

  // Define committees
  const committees = [
    {
      name: "Board of Directors",
      slug: "board",
      description: "The governing body responsible for overall club leadership, policy decisions, and strategic direction.",
    },
    {
      name: "Activities Committee",
      slug: "activities",
      description: "Plans and coordinates social events, outings, interest groups, and recreational activities for members.",
    },
    {
      name: "Membership Committee",
      slug: "membership",
      description: "Manages member recruitment, orientation, retention, and maintains the membership database.",
    },
    {
      name: "Communications Committee",
      slug: "communications",
      description: "Handles newsletter publication, website maintenance, social media, and public relations.",
    },
    {
      name: "Finance Committee",
      slug: "finance",
      description: "Oversees budget planning, financial reporting, dues collection, and fiscal responsibility.",
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

  // Define roles for each committee
  const boardId = committeeMap.get("board")!;
  const activitiesId = committeeMap.get("activities")!;
  const membershipId = committeeMap.get("membership")!;
  const communicationsId = committeeMap.get("communications")!;
  const financeId = committeeMap.get("finance")!;

  const roles = [
    // Board of Directors roles
    {
      committeeId: boardId,
      name: "President",
      slug: "president",
      sortOrder: 1,
      description: "Presides over all Board and general membership meetings. Serves as the official representative of the club. Coordinates activities of all officers and committees. Appoints committee chairs with Board approval. Signs contracts and official documents on behalf of the club. Ensures the club operates in accordance with its bylaws and policies.",
    },
    {
      committeeId: boardId,
      name: "Vice President",
      slug: "vice-president",
      sortOrder: 2,
      description: "Assumes the duties of the President in their absence. Assists the President in coordinating club activities. Oversees special projects as assigned by the President. Serves as liaison between the Board and committee chairs. Coordinates the annual planning process and goal setting. Succeeds to the Presidency at the end of the term.",
    },
    {
      committeeId: boardId,
      name: "Secretary",
      slug: "secretary",
      sortOrder: 3,
      description: "Records and maintains minutes of all Board and general membership meetings. Handles official club correspondence. Maintains club records, bylaws, and historical documents. Sends meeting notices and agendas to Board members. Manages the club calendar and scheduling. Ensures proper documentation of all official club actions.",
    },
    {
      committeeId: boardId,
      name: "Treasurer",
      slug: "treasurer",
      sortOrder: 4,
      description: "Manages all club financial accounts and transactions. Prepares and presents monthly financial reports to the Board. Develops the annual budget in coordination with the Finance Committee. Collects dues and processes payments. Files required tax documents and maintains financial records. Ensures compliance with financial policies and procedures.",
    },
    {
      committeeId: boardId,
      name: "Parliamentarian",
      slug: "parliamentarian",
      sortOrder: 5,
      description: "Advises the President and Board on parliamentary procedure. Ensures meetings are conducted according to Roberts Rules of Order. Reviews proposed bylaw amendments for proper form and consistency. Maintains current copies of bylaws and standing rules. Assists in resolving procedural disputes. Provides training on meeting procedures as needed.",
    },
    {
      committeeId: boardId,
      name: "Past President",
      slug: "past-president",
      sortOrder: 6,
      description: "Provides continuity and institutional knowledge to the Board. Mentors the current President and new Board members. Chairs the Nominating Committee. Serves as an advisor on policy and procedural matters. Assists with leadership transition and training. May represent the club at external functions as requested.",
    },

    // Activities Committee roles
    {
      committeeId: activitiesId,
      name: "Activities Chair",
      slug: "chair",
      sortOrder: 1,
      description: "Leads the Activities Committee and coordinates all club events. Recruits and supports event hosts. Maintains the master calendar of activities. Reports to the Board on event participation and trends. Develops new activity offerings based on member interests. Ensures events are inclusive and accessible to all members.",
    },
    {
      committeeId: activitiesId,
      name: "Activities Vice Chair",
      slug: "vice-chair",
      sortOrder: 2,
      description: "Assists the Chair in coordinating committee activities. Assumes Chair duties when the Chair is unavailable. Helps recruit and train new event hosts. Coordinates special event series and themed activities. Maintains event hosting guidelines and resources. Supports event hosts with logistics and problem-solving.",
    },
    {
      committeeId: activitiesId,
      name: "Interest Groups Coordinator",
      slug: "interest-groups",
      sortOrder: 3,
      description: "Oversees all special interest groups within the club. Helps establish new interest groups based on member demand. Supports interest group leaders with resources and guidance. Ensures interest groups align with club policies. Promotes interest group activities to the general membership. Maintains directory of active interest groups and contacts.",
    },

    // Membership Committee roles
    {
      committeeId: membershipId,
      name: "Membership Chair",
      slug: "chair",
      sortOrder: 1,
      description: "Leads the Membership Committee and oversees all membership functions. Develops and implements member recruitment strategies. Coordinates new member orientation sessions. Monitors membership trends and retention rates. Reports membership statistics to the Board. Ensures accurate maintenance of the membership database.",
    },
    {
      committeeId: membershipId,
      name: "Orientation Coordinator",
      slug: "orientation",
      sortOrder: 2,
      description: "Plans and conducts new member orientation sessions. Creates welcoming experience for prospective and new members. Develops orientation materials and presentations. Coordinates mentor assignments for new members. Follows up with new members during their first months. Gathers feedback to improve the orientation process.",
    },
    {
      committeeId: membershipId,
      name: "Database Administrator",
      slug: "database-admin",
      sortOrder: 3,
      description: "Maintains the accuracy and integrity of the membership database. Processes new member applications and renewals. Updates member contact information and preferences. Generates membership reports and mailing lists. Ensures data privacy and security compliance. Provides database training to authorized users.",
    },

    // Communications Committee roles
    {
      committeeId: communicationsId,
      name: "Communications Chair",
      slug: "chair",
      sortOrder: 1,
      description: "Leads the Communications Committee and oversees all club communications. Develops the communications strategy and editorial calendar. Coordinates messaging across all channels. Ensures brand consistency in club materials. Reports to the Board on communications activities. Manages relationships with media and external partners.",
    },
    {
      committeeId: communicationsId,
      name: "Newsletter Editor",
      slug: "newsletter",
      sortOrder: 2,
      description: "Produces the monthly club newsletter. Solicits and edits articles from members and committees. Maintains editorial standards and publication schedule. Coordinates with graphic designer and printer. Manages newsletter distribution list. Archives past issues and maintains content library.",
    },
    {
      committeeId: communicationsId,
      name: "Webmaster",
      slug: "webmaster",
      sortOrder: 3,
      description: "Maintains and updates the club website. Ensures website content is current and accurate. Manages online event registration and calendars. Implements website improvements and new features. Monitors website analytics and user experience. Provides technical support for website users.",
    },
    {
      committeeId: communicationsId,
      name: "Social Media Coordinator",
      slug: "social-media",
      sortOrder: 4,
      description: "Manages the clubs social media presence. Creates and schedules engaging social media content. Monitors and responds to social media interactions. Grows the clubs following and engagement. Coordinates social media coverage of events. Reports on social media metrics and trends.",
    },

    // Finance Committee roles
    {
      committeeId: financeId,
      name: "Finance Chair",
      slug: "chair",
      sortOrder: 1,
      description: "Leads the Finance Committee and oversees financial planning. Works with Treasurer on budget development. Reviews financial policies and recommends updates. Coordinates the annual financial review or audit. Advises the Board on financial matters. Ensures long-term financial sustainability of the club.",
    },
    {
      committeeId: financeId,
      name: "Audit Coordinator",
      slug: "audit",
      sortOrder: 2,
      description: "Coordinates the annual review of club financial records. Ensures proper internal controls are in place. Reviews expense reports and reimbursement requests. Verifies accuracy of financial transactions. Reports findings to the Finance Committee and Board. Recommends improvements to financial procedures.",
    },
  ];

  let roleCount = 0;
  for (const role of roles) {
    await prisma.committeeRole.upsert({
      where: {
        committeeId_slug: {
          committeeId: role.committeeId,
          slug: role.slug,
        },
      },
      update: role,
      create: role,
    });
    roleCount++;
  }

  console.log(`  Created ${roleCount} committee roles with job descriptions`);
}

async function seedTerms(): Promise<Map<string, string>> {
  console.log("Seeding terms...");

  const terms = [
    {
      name: "Winter 2025",
      startDate: new Date("2025-02-01T08:00:00Z"),
      endDate: new Date("2025-07-31T07:59:59Z"),
      isCurrent: true,
    },
    {
      name: "Summer 2025",
      startDate: new Date("2025-08-01T07:00:00Z"),
      endDate: new Date("2026-01-31T08:59:59Z"),
      isCurrent: false,
    },
    {
      name: "Winter 2024",
      startDate: new Date("2024-02-01T08:00:00Z"),
      endDate: new Date("2024-07-31T07:59:59Z"),
      isCurrent: false,
    },
  ];

  const termMap = new Map<string, string>();

  for (const term of terms) {
    const created = await prisma.term.create({
      data: term,
    });
    termMap.set(term.name, created.id);
  }

  console.log(`  Created ${terms.length} terms`);
  return termMap;
}

async function main(): Promise<void> {
  console.log("=== ClubOS Seed Script ===\n");

  checkEnvironment();

  try {
    await clearData();

    const statusMap = await seedMembershipStatuses();
    const memberMap = await seedMembers(statusMap);
    await seedUserAccounts(memberMap);
    await seedCommitteesAndRoles();
    await seedTerms();
    const eventMap = await seedEvents(memberMap);
    await seedEventRegistrations(eventMap, memberMap);

    console.log("\n=== Seed Complete ===");
    console.log("Summary:");
    console.log("  - 5 membership statuses");
    console.log("  - 2 members (Alice Chen, Carol Johnson)");
    console.log("  - 1 admin user account (alice@example.com)");
    console.log("  - 5 committees with 18 committee roles");
    console.log("  - 3 terms (Winter 2024, Winter 2025, Summer 2025)");
    console.log("  - 4 events (3 published, 1 draft)");
    console.log("  - 4 event registrations (3 confirmed, 1 waitlisted)");
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
