/**
 * Prisma Seed Script for Murmurant
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

import {
  PrismaClient,
  RegistrationStatus,
  ProductType,
  StoreOrderStatus,
  FulfillmentType,
  GovernanceMeetingType,
  MinutesStatus,
  MotionResult,
  EmailStatus,
  ActivityGroupStatus,
  ActivityGroupRole,
} from "@prisma/client";
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
  // Activity Groups
  await prisma.activityGroupAnnouncement.deleteMany();
  await prisma.activityGroupMember.deleteMany();
  await prisma.activityGroup.deleteMany();
  // Governance
  await prisma.governanceAnnotation.deleteMany();
  await prisma.governanceMotion.deleteMany();
  await prisma.governanceMinutes.deleteMany();
  await prisma.governanceMeeting.deleteMany();
  // Photos
  await prisma.photo.deleteMany();
  await prisma.photoAlbum.deleteMany();
  // Email
  await prisma.emailLog.deleteMany();
  // Events and registrations
  await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();
  // Users and roles
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
  const prospectId = statusMap.get("PROSPECT")!;
  const alumniId = statusMap.get("ALUMNI")!;
  const lapsedId = statusMap.get("LAPSED")!;

  const members = [
    // Active members
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
    // Prospect: interested but hasn't completed membership
    {
      email: "karen@example.com",
      firstName: "Karen",
      lastName: "Liu",
      phone: "+1-555-0103",
      membershipStatusId: prospectId,
      joinedAt: new Date("2025-01-10"), // Recent interest
    },
    // Alumni: former active member
    {
      email: "larry@example.com",
      firstName: "Larry",
      lastName: "Davis",
      phone: "+1-555-0104",
      membershipStatusId: alumniId,
      joinedAt: new Date("2018-03-15"), // Long-time former member
    },
    // Lapsed: membership expired, eligible for renewal
    {
      email: "henry@example.com",
      firstName: "Henry",
      lastName: "Wilson",
      phone: "+1-555-0105",
      membershipStatusId: lapsedId,
      joinedAt: new Date("2021-09-01"), // Membership lapsed
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

// ============================================================================
// Demo Users for Role-Based Testing
// ============================================================================

interface DemoUser {
  email: string;
  firstName: string;
  lastName: string;
  roleSlug?: string; // Committee role slug to assign
}

const DEMO_USERS: DemoUser[] = [
  { email: "president@demo.murmurant.test", firstName: "Pat", lastName: "President", roleSlug: "president" },
  { email: "secretary@demo.murmurant.test", firstName: "Sam", lastName: "Secretary", roleSlug: "secretary" },
  { email: "parliamentarian@demo.murmurant.test", firstName: "Parker", lastName: "Parliamentarian", roleSlug: "parliamentarian" },
  { email: "eventchair@demo.murmurant.test", firstName: "Evelyn", lastName: "EventChair", roleSlug: "chair" }, // Activities chair
  { email: "member@demo.murmurant.test", firstName: "Morgan", lastName: "Member" }, // No special role
];

async function seedDemoUsers(
  statusMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log("Seeding demo users for role-based testing...");

  const extendedId = statusMap.get("EXTENDED")!;
  const demoPasswordHash = "$2b$10$demohashdemohashdemohashdemohashdemohashdemoha";

  // Get the current term for role assignments
  const currentTerm = await prisma.term.findFirst({
    where: { isCurrent: true },
  });

  if (!currentTerm) {
    console.log("  WARNING: No current term found, skipping role assignments");
  }

  // Get committees and roles for assignment
  const boardCommittee = await prisma.committee.findUnique({
    where: { slug: "board" },
    include: { committeeRoles: true },
  });

  const activitiesCommittee = await prisma.committee.findUnique({
    where: { slug: "activities" },
    include: { committeeRoles: true },
  });

  const demoMemberMap = new Map<string, string>();

  for (const demoUser of DEMO_USERS) {
    // Create or update member
    const member = await prisma.member.upsert({
      where: { email: demoUser.email },
      update: {
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        membershipStatusId: extendedId,
      },
      create: {
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        email: demoUser.email,
        membershipStatusId: extendedId,
        joinedAt: new Date("2023-01-01"),
      },
    });

    demoMemberMap.set(demoUser.email, member.id);

    // Create user account
    await prisma.userAccount.upsert({
      where: { email: demoUser.email },
      update: {
        memberId: member.id,
        passwordHash: demoPasswordHash,
        isActive: true,
      },
      create: {
        memberId: member.id,
        email: demoUser.email,
        passwordHash: demoPasswordHash,
        isActive: true,
      },
    });

    // Assign role if specified
    if (demoUser.roleSlug && currentTerm) {
      // Find the committee role
      let committee = boardCommittee;
      let role = boardCommittee?.committeeRoles.find(
        (r) => r.slug === demoUser.roleSlug
      );

      // If not found in board, check activities (for event chair)
      if (!role && activitiesCommittee) {
        role = activitiesCommittee.committeeRoles.find(
          (r) => r.slug === demoUser.roleSlug
        );
        if (role) {
          committee = activitiesCommittee;
        }
      }

      if (role && committee) {
        // Delete any existing role assignment for this combo
        await prisma.roleAssignment.deleteMany({
          where: {
            memberId: member.id,
            committeeRoleId: role.id,
            termId: currentTerm.id,
          },
        });

        // Create role assignment
        await prisma.roleAssignment.create({
          data: {
            memberId: member.id,
            committeeId: committee.id,
            committeeRoleId: role.id,
            termId: currentTerm.id,
            startDate: currentTerm.startDate,
            endDate: currentTerm.endDate,
          },
        });
      }
    }
  }

  console.log(`  Created ${DEMO_USERS.length} demo users with accounts:`);
  for (const user of DEMO_USERS) {
    const role = user.roleSlug || "member";
    console.log(`    - ${user.email} (${role})`);
  }

  return demoMemberMap;
}

async function seedEvents(
  memberMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log("Seeding events...");

  const aliceId = memberMap.get("alice@example.com")!;
  const carolId = memberMap.get("carol@example.com")!;

  const events = [
    // ============================================
    // PAST EVENTS (for photo albums and history)
    // ============================================
    {
      title: "Spring Hike 2024",
      description: "Beautiful spring hike through the canyon with wildflower views.",
      category: "Outdoors",
      location: "Valley Trail",
      startTime: new Date("2024-04-15T08:00:00Z"),
      endTime: new Date("2024-04-15T12:00:00Z"),
      capacity: 15,
      isPublished: true,
      eventChairId: aliceId,
    },
    {
      title: "April DiningIn 2024",
      description: "Intimate dining experience at member homes.",
      category: "Social",
      location: "Member Homes",
      startTime: new Date("2024-04-20T18:00:00Z"),
      endTime: new Date("2024-04-20T21:00:00Z"),
      capacity: 24,
      isPublished: true,
      eventChairId: carolId,
    },
    {
      title: "Summer Potluck 2024",
      description: "Annual summer potluck gathering at the park.",
      category: "Social",
      location: "Oak Park Pavilion",
      startTime: new Date("2024-07-10T17:00:00Z"),
      endTime: new Date("2024-07-10T20:00:00Z"),
      capacity: 40,
      isPublished: true,
      eventChairId: aliceId,
    },
    // ============================================
    // FUTURE EVENTS (for registration testing)
    // ============================================
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
    // Cancelled event for testing
    {
      title: "Cancelled Wine Tasting",
      description: "This event was cancelled due to venue issues.",
      category: "Social",
      location: "Wine Country Vineyard",
      startTime: new Date("2025-05-15T16:00:00Z"),
      endTime: new Date("2025-05-15T19:00:00Z"),
      capacity: 30,
      isPublished: false,
      // Represents a cancelled event
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

  // Future events
  const welcomeCoffeeId = eventMap.get("Welcome Coffee")!;
  const hikeId = eventMap.get("Morning Hike at Rattlesnake Canyon")!;
  const picnicId = eventMap.get("Summer Beach Picnic")!;

  // Past events
  const springHikeId = eventMap.get("Spring Hike 2024")!;
  const diningInId = eventMap.get("April DiningIn 2024")!;
  const potluckId = eventMap.get("Summer Potluck 2024")!;

  // Members
  const carolId = memberMap.get("carol@example.com")!;
  const aliceId = memberMap.get("alice@example.com")!;
  const henryId = memberMap.get("henry@example.com")!; // Lapsed member - for no-show testing
  const larryId = memberMap.get("larry@example.com")!; // Alumni - for history testing

  const registrations = [
    // ============================================
    // CONFIRMED registrations
    // ============================================
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
      eventId: picnicId,
      memberId: aliceId,
      status: RegistrationStatus.CONFIRMED,
      registeredAt: new Date("2025-07-15T08:00:00Z"),
    },
    // Past event - attended
    {
      eventId: springHikeId,
      memberId: carolId,
      status: RegistrationStatus.CONFIRMED,
      registeredAt: new Date("2024-04-01T10:00:00Z"),
    },
    {
      eventId: springHikeId,
      memberId: aliceId,
      status: RegistrationStatus.CONFIRMED,
      registeredAt: new Date("2024-04-02T11:00:00Z"),
    },
    {
      eventId: diningInId,
      memberId: aliceId,
      status: RegistrationStatus.CONFIRMED,
      registeredAt: new Date("2024-04-10T09:00:00Z"),
    },
    {
      eventId: potluckId,
      memberId: carolId,
      status: RegistrationStatus.CONFIRMED,
      registeredAt: new Date("2024-07-01T14:00:00Z"),
    },
    // ============================================
    // WAITLISTED registrations
    // ============================================
    {
      eventId: hikeId,
      memberId: aliceId,
      status: RegistrationStatus.WAITLISTED,
      waitlistPosition: 1,
      registeredAt: new Date("2025-06-02T10:30:00Z"),
    },
    {
      eventId: hikeId,
      memberId: henryId,
      status: RegistrationStatus.WAITLISTED,
      waitlistPosition: 2,
      registeredAt: new Date("2025-06-03T09:00:00Z"),
    },
    // ============================================
    // CANCELLED registrations
    // ============================================
    {
      eventId: welcomeCoffeeId,
      memberId: aliceId,
      status: RegistrationStatus.CANCELLED,
      registeredAt: new Date("2025-06-18T10:00:00Z"),
      cancelledAt: new Date("2025-06-19T15:00:00Z"),
    },
    {
      eventId: picnicId,
      memberId: carolId,
      status: RegistrationStatus.CANCELLED,
      registeredAt: new Date("2025-07-10T11:00:00Z"),
      cancelledAt: new Date("2025-07-12T09:00:00Z"),
    },
    // ============================================
    // NO_SHOW registrations (from past events)
    // ============================================
    {
      eventId: springHikeId,
      memberId: henryId,
      status: RegistrationStatus.NO_SHOW,
      registeredAt: new Date("2024-04-05T08:00:00Z"),
    },
    {
      eventId: potluckId,
      memberId: henryId,
      status: RegistrationStatus.NO_SHOW,
      registeredAt: new Date("2024-07-05T10:00:00Z"),
    },
    // ============================================
    // REFUND_PENDING registrations
    // ============================================
    {
      eventId: picnicId,
      memberId: henryId,
      status: RegistrationStatus.REFUND_PENDING,
      registeredAt: new Date("2025-07-20T14:00:00Z"),
      cancelledAt: new Date("2025-08-01T10:00:00Z"),
    },
    // ============================================
    // Historical registrations for alumni
    // ============================================
    {
      eventId: diningInId,
      memberId: larryId,
      status: RegistrationStatus.CONFIRMED,
      registeredAt: new Date("2024-04-08T16:00:00Z"),
    },
    {
      eventId: potluckId,
      memberId: larryId,
      status: RegistrationStatus.CONFIRMED,
      registeredAt: new Date("2024-07-02T11:00:00Z"),
    },
  ];

  for (const reg of registrations) {
    await prisma.eventRegistration.create({ data: reg });
  }

  console.log(`  Created ${registrations.length} event registrations:`);
  console.log("    - 9 CONFIRMED");
  console.log("    - 2 WAITLISTED");
  console.log("    - 2 CANCELLED");
  console.log("    - 2 NO_SHOW");
  console.log("    - 1 REFUND_PENDING");
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

// ============================================================================
// Store Seeding
// ============================================================================

async function seedProducts(): Promise<Map<string, string>> {
  console.log("Seeding store products...");

  const products = [
    // Physical products
    {
      name: "Club Logo T-Shirt",
      slug: "club-logo-tshirt",
      description: "Premium cotton t-shirt with embroidered club logo. Available in multiple sizes.",
      type: ProductType.PHYSICAL,
      priceCents: 2500, // $25.00
      memberPriceCents: 2000, // $20.00 for members
      comparePriceCents: 3000, // "Was $30"
      imageUrl: "/images/store/tshirt-navy.jpg",
      allowsShipping: true,
      allowsPickup: true,
      trackInventory: true,
      quantity: 0, // Will be on variants
      lowStockThreshold: 5,
      sortOrder: 1,
    },
    {
      name: "Club Baseball Cap",
      slug: "club-baseball-cap",
      description: "Adjustable baseball cap with embroidered club logo.",
      type: ProductType.PHYSICAL,
      priceCents: 1800, // $18.00
      memberPriceCents: 1500, // $15.00 for members
      imageUrl: "/images/store/cap-navy.jpg",
      allowsShipping: true,
      allowsPickup: true,
      trackInventory: true,
      quantity: 45,
      lowStockThreshold: 10,
      sortOrder: 2,
    },
    {
      name: "Ceramic Coffee Mug",
      slug: "ceramic-coffee-mug",
      description: "12oz ceramic mug with club logo. Dishwasher and microwave safe.",
      type: ProductType.PHYSICAL,
      priceCents: 1200, // $12.00
      memberPriceCents: 1000, // $10.00 for members
      imageUrl: "/images/store/mug-white.jpg",
      allowsShipping: true,
      allowsPickup: true,
      trackInventory: true,
      quantity: 75,
      lowStockThreshold: 15,
      sortOrder: 3,
    },
    {
      name: "Club Tote Bag",
      slug: "club-tote-bag",
      description: "Sturdy canvas tote bag with club logo. Perfect for events and shopping.",
      type: ProductType.PHYSICAL,
      priceCents: 1500, // $15.00
      memberPriceCents: 1200, // $12.00 for members
      imageUrl: "/images/store/tote-natural.jpg",
      allowsShipping: true,
      allowsPickup: true,
      trackInventory: true,
      quantity: 60,
      lowStockThreshold: 10,
      sortOrder: 4,
    },
    // Digital products
    {
      name: "2024 Event Photo Collection",
      slug: "2024-event-photos",
      description: "High-resolution digital photo collection from all 2024 club events. Includes over 500 photos.",
      type: ProductType.DIGITAL,
      priceCents: 1500, // $15.00
      memberPriceCents: 0, // Free for members
      imageUrl: "/images/store/photo-collection.jpg",
      allowsShipping: false,
      allowsPickup: false,
      trackInventory: false,
      digitalAssetUrl: "s3://murmurant-assets/digital/2024-photos.zip",
      downloadLimit: 3,
      sortOrder: 5,
    },
    {
      name: "New Member Welcome Guide",
      slug: "welcome-guide-pdf",
      description: "Comprehensive PDF guide for new members. Includes club history, upcoming events, and how to get involved.",
      type: ProductType.DIGITAL,
      priceCents: 0, // Free
      imageUrl: "/images/store/welcome-guide.jpg",
      allowsShipping: false,
      allowsPickup: false,
      trackInventory: false,
      digitalAssetUrl: "s3://murmurant-assets/digital/welcome-guide.pdf",
      downloadLimit: null, // Unlimited
      sortOrder: 6,
    },
    // Members-only product
    {
      name: "Annual Gala Tickets",
      slug: "annual-gala-tickets",
      description: "Tickets for the annual gala dinner. Members only.",
      type: ProductType.PHYSICAL,
      priceCents: 7500, // $75.00
      memberPriceCents: 6500, // $65.00 for members
      imageUrl: "/images/store/gala-ticket.jpg",
      isPublic: false, // Members only
      allowsShipping: false,
      allowsPickup: true,
      trackInventory: true,
      quantity: 100,
      lowStockThreshold: 20,
      sortOrder: 7,
    },
  ];

  const productMap = new Map<string, string>();

  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
    productMap.set(product.slug, created.id);
  }

  console.log(`  Created ${products.length} products`);
  return productMap;
}

async function seedProductVariants(productMap: Map<string, string>): Promise<Map<string, string>> {
  console.log("Seeding product variants...");

  const tshirtId = productMap.get("club-logo-tshirt")!;

  const variants = [
    // T-shirt size variants
    { productId: tshirtId, name: "Small", sku: "TSHIRT-S", quantity: 25, sortOrder: 1, attributes: { size: "S" } },
    { productId: tshirtId, name: "Medium", sku: "TSHIRT-M", quantity: 40, sortOrder: 2, attributes: { size: "M" } },
    { productId: tshirtId, name: "Large", sku: "TSHIRT-L", quantity: 35, sortOrder: 3, attributes: { size: "L" } },
    { productId: tshirtId, name: "X-Large", sku: "TSHIRT-XL", quantity: 20, sortOrder: 4, attributes: { size: "XL" } },
    { productId: tshirtId, name: "2X-Large", sku: "TSHIRT-2XL", quantity: 10, priceCents: 2800, memberPriceCents: 2300, sortOrder: 5, attributes: { size: "2XL" } },
  ];

  const variantMap = new Map<string, string>();

  for (const variant of variants) {
    const created = await prisma.productVariant.upsert({
      where: { sku: variant.sku },
      update: variant,
      create: variant,
    });
    variantMap.set(variant.sku!, created.id);
  }

  console.log(`  Created ${variants.length} product variants`);
  return variantMap;
}

async function seedShippingAddresses(memberMap: Map<string, string>): Promise<Map<string, string>> {
  console.log("Seeding shipping addresses...");

  const aliceId = memberMap.get("alice@example.com");
  const carolId = memberMap.get("carol@example.com");

  const addresses = [
    // Member addresses
    {
      customerId: aliceId,
      firstName: "Alice",
      lastName: "Chen",
      addressLine1: "123 Oak Street",
      addressLine2: "Apt 4B",
      city: "Santa Barbara",
      state: "CA",
      postalCode: "93101",
      country: "US",
      phone: "+1-555-0101",
      isDefault: true,
    },
    {
      customerId: carolId,
      firstName: "Carol",
      lastName: "Johnson",
      addressLine1: "456 Palm Avenue",
      city: "Santa Barbara",
      state: "CA",
      postalCode: "93103",
      country: "US",
      phone: "+1-555-0102",
      isDefault: true,
    },
    // Guest address (no customerId)
    {
      customerId: null,
      firstName: "Guest",
      lastName: "Buyer",
      addressLine1: "789 Beach Road",
      city: "Ventura",
      state: "CA",
      postalCode: "93001",
      country: "US",
      phone: "+1-555-0999",
      isDefault: false,
    },
  ];

  const addressMap = new Map<string, string>();

  for (const address of addresses) {
    const created = await prisma.shippingAddress.create({
      data: address,
    });
    const key = address.customerId ? `member-${address.customerId}` : "guest";
    addressMap.set(key, created.id);
  }

  console.log(`  Created ${addresses.length} shipping addresses`);
  return addressMap;
}

async function seedStoreOrders(
  memberMap: Map<string, string>,
  productMap: Map<string, string>,
  variantMap: Map<string, string>,
  addressMap: Map<string, string>
): Promise<void> {
  console.log("Seeding store orders...");

  const aliceId = memberMap.get("alice@example.com");
  const carolId = memberMap.get("carol@example.com");

  const tshirtId = productMap.get("club-logo-tshirt")!;
  const capId = productMap.get("club-baseball-cap")!;
  const mugId = productMap.get("ceramic-coffee-mug")!;
  const toteId = productMap.get("club-tote-bag")!;
  const photosId = productMap.get("2024-event-photos")!;
  const guideId = productMap.get("welcome-guide-pdf")!;
  const galaId = productMap.get("annual-gala-tickets")!;

  const variantM = variantMap.get("TSHIRT-M");
  const variantL = variantMap.get("TSHIRT-L");

  // Order 1: Completed member order with shipping
  await prisma.storeOrder.create({
    data: {
      status: StoreOrderStatus.COMPLETED,
      fulfillmentType: FulfillmentType.SHIPPING,
      customerId: aliceId,
      subtotalCents: 4300, // $25 shirt + $18 cap = $43
      shippingCents: 599, // $5.99
      taxCents: 387, // ~9% tax
      totalCents: 5286,
      paidAt: new Date("2024-11-15T10:30:00Z"),
      shippedAt: new Date("2024-11-16T14:00:00Z"),
      deliveredAt: new Date("2024-11-19T11:00:00Z"),
      completedAt: new Date("2024-11-19T11:00:00Z"),
      shippingAddressId: addressMap.get(`member-${aliceId}`),
      trackingNumber: "1Z999AA10123456784",
      carrier: "UPS",
      items: {
        create: [
          {
            productId: tshirtId,
            variantId: variantM,
            productName: "Club Logo T-Shirt",
            variantName: "Medium",
            sku: "TSHIRT-M",
            quantity: 1,
            unitPriceCents: 2000, // Member price
            totalPriceCents: 2000,
          },
          {
            productId: capId,
            productName: "Club Baseball Cap",
            quantity: 1,
            unitPriceCents: 1500, // Member price
            totalPriceCents: 1500,
          },
        ],
      },
    },
  });

  // Order 2: Completed member order with pickup
  await prisma.storeOrder.create({
    data: {
      status: StoreOrderStatus.PICKED_UP,
      fulfillmentType: FulfillmentType.PICKUP,
      customerId: carolId,
      subtotalCents: 2200, // $10 mug + $12 tote = $22 (member prices)
      shippingCents: 0,
      taxCents: 198,
      totalCents: 2398,
      paidAt: new Date("2024-12-01T09:00:00Z"),
      pickedUpAt: new Date("2024-12-05T15:30:00Z"),
      completedAt: new Date("2024-12-05T15:30:00Z"),
      pickupLocation: "Club Office - 100 Main Street",
      pickupCode: "CAROL-1205",
      items: {
        create: [
          {
            productId: mugId,
            productName: "Ceramic Coffee Mug",
            quantity: 1,
            unitPriceCents: 1000,
            totalPriceCents: 1000,
          },
          {
            productId: toteId,
            productName: "Club Tote Bag",
            quantity: 1,
            unitPriceCents: 1200,
            totalPriceCents: 1200,
          },
        ],
      },
    },
  });

  // Order 3: Member order for digital product
  const digitalOrder = await prisma.storeOrder.create({
    data: {
      status: StoreOrderStatus.COMPLETED,
      fulfillmentType: FulfillmentType.DIGITAL_DELIVERY,
      customerId: aliceId,
      subtotalCents: 0, // Free for members
      shippingCents: 0,
      taxCents: 0,
      totalCents: 0,
      paidAt: new Date("2024-12-10T08:00:00Z"),
      completedAt: new Date("2024-12-10T08:00:00Z"),
      items: {
        create: [
          {
            productId: photosId,
            productName: "2024 Event Photo Collection",
            quantity: 1,
            unitPriceCents: 0,
            totalPriceCents: 0,
          },
        ],
      },
    },
  });

  // Create digital delivery for the digital order
  await prisma.digitalDelivery.create({
    data: {
      orderId: digitalOrder.id,
      productId: photosId,
      downloadCount: 1,
      maxDownloads: 3,
      firstDownloadAt: new Date("2024-12-10T08:05:00Z"),
      lastDownloadAt: new Date("2024-12-10T08:05:00Z"),
    },
  });

  // Order 4: Guest checkout order - shipped
  await prisma.storeOrder.create({
    data: {
      status: StoreOrderStatus.SHIPPED,
      fulfillmentType: FulfillmentType.SHIPPING,
      guestEmail: "guest.shopper@example.com",
      guestFirstName: "Guest",
      guestLastName: "Shopper",
      guestPhone: "+1-555-0999",
      subtotalCents: 5000, // 2x $25 shirts (non-member price)
      shippingCents: 799,
      taxCents: 450,
      totalCents: 6249,
      paidAt: new Date("2024-12-20T14:00:00Z"),
      shippedAt: new Date("2024-12-21T09:00:00Z"),
      shippingAddressId: addressMap.get("guest"),
      trackingNumber: "9400111899223033005436",
      carrier: "USPS",
      items: {
        create: [
          {
            productId: tshirtId,
            variantId: variantL,
            productName: "Club Logo T-Shirt",
            variantName: "Large",
            sku: "TSHIRT-L",
            quantity: 2,
            unitPriceCents: 2500, // Non-member price
            totalPriceCents: 5000,
          },
        ],
      },
    },
  });

  // Order 5: Guest checkout - pending payment (abandoned cart conversion)
  await prisma.storeOrder.create({
    data: {
      status: StoreOrderStatus.PENDING_PAYMENT,
      guestEmail: "almost.buyer@example.com",
      guestFirstName: "Almost",
      guestLastName: "Buyer",
      subtotalCents: 1800,
      shippingCents: 599,
      taxCents: 162,
      totalCents: 2561,
      checkoutStartedAt: new Date("2024-12-22T16:30:00Z"),
      items: {
        create: [
          {
            productId: capId,
            productName: "Club Baseball Cap",
            quantity: 1,
            unitPriceCents: 1800,
            totalPriceCents: 1800,
          },
        ],
      },
    },
  });

  // Order 6: Member order - processing (paid, being prepared)
  await prisma.storeOrder.create({
    data: {
      status: StoreOrderStatus.PROCESSING,
      fulfillmentType: FulfillmentType.SHIPPING,
      customerId: carolId,
      subtotalCents: 6500, // Gala tickets at member price
      shippingCents: 0, // Pickup only for gala
      taxCents: 0, // No tax on tickets
      totalCents: 6500,
      paidAt: new Date("2024-12-23T10:00:00Z"),
      items: {
        create: [
          {
            productId: galaId,
            productName: "Annual Gala Tickets",
            quantity: 1,
            unitPriceCents: 6500,
            totalPriceCents: 6500,
          },
        ],
      },
    },
  });

  // Order 7: Cart (not checked out yet)
  await prisma.storeOrder.create({
    data: {
      status: StoreOrderStatus.CART,
      sessionId: "session_abc123xyz",
      subtotalCents: 3700, // $25 shirt + $12 mug
      shippingCents: 0,
      taxCents: 0,
      totalCents: 3700,
      items: {
        create: [
          {
            productId: tshirtId,
            variantId: variantM,
            productName: "Club Logo T-Shirt",
            variantName: "Medium",
            sku: "TSHIRT-M",
            quantity: 1,
            unitPriceCents: 2500,
            totalPriceCents: 2500,
          },
          {
            productId: mugId,
            productName: "Ceramic Coffee Mug",
            quantity: 1,
            unitPriceCents: 1200,
            totalPriceCents: 1200,
          },
        ],
      },
    },
  });

  // Order 8: Cancelled order
  await prisma.storeOrder.create({
    data: {
      status: StoreOrderStatus.CANCELLED,
      customerId: aliceId,
      subtotalCents: 1500,
      shippingCents: 0,
      taxCents: 0,
      totalCents: 1500,
      checkoutStartedAt: new Date("2024-12-01T12:00:00Z"),
      cancelledAt: new Date("2024-12-01T12:15:00Z"),
      adminNotes: "Customer requested cancellation before payment",
      items: {
        create: [
          {
            productId: toteId,
            productName: "Club Tote Bag",
            quantity: 1,
            unitPriceCents: 1500,
            totalPriceCents: 1500,
          },
        ],
      },
    },
  });

  // Order 9: Refunded order
  await prisma.storeOrder.create({
    data: {
      status: StoreOrderStatus.REFUNDED,
      fulfillmentType: FulfillmentType.SHIPPING,
      customerId: carolId,
      subtotalCents: 2500,
      shippingCents: 599,
      taxCents: 225,
      totalCents: 3324,
      paidAt: new Date("2024-10-15T09:00:00Z"),
      shippedAt: new Date("2024-10-16T10:00:00Z"),
      deliveredAt: new Date("2024-10-19T14:00:00Z"),
      refundedAt: new Date("2024-10-25T11:00:00Z"),
      adminNotes: "Product was defective, full refund issued",
      items: {
        create: [
          {
            productId: tshirtId,
            variantId: variantL,
            productName: "Club Logo T-Shirt",
            variantName: "Large",
            sku: "TSHIRT-L",
            quantity: 1,
            unitPriceCents: 2000,
            totalPriceCents: 2000,
          },
        ],
      },
    },
  });

  console.log("  Created 9 store orders with various statuses");
  console.log("    - 3 completed orders (2 member, 1 digital)");
  console.log("    - 1 shipped order (guest)");
  console.log("    - 1 processing order");
  console.log("    - 1 pending payment (abandoned)");
  console.log("    - 1 cart (not checked out)");
  console.log("    - 1 cancelled order");
  console.log("    - 1 refunded order");
}

async function clearStoreData(): Promise<void> {
  console.log("Clearing store data...");
  await prisma.digitalDelivery.deleteMany();
  await prisma.storeOrderItem.deleteMany();
  await prisma.storeOrder.deleteMany();
  await prisma.shippingAddress.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
}

// ============================================================================
// Governance Seeding
// ============================================================================

async function seedGovernanceData(memberMap: Map<string, string>): Promise<void> {
  console.log("Seeding governance data...");

  // Get demo users for governance roles
  const presidentId = await prisma.member.findUnique({
    where: { email: "president@demo.murmurant.test" },
    select: { id: true },
  }).then(m => m?.id);

  const secretaryId = await prisma.member.findUnique({
    where: { email: "secretary@demo.murmurant.test" },
    select: { id: true },
  }).then(m => m?.id);

  const aliceId = memberMap.get("alice@example.com");
  const carolId = memberMap.get("carol@example.com");

  // Create governance meetings
  const meetings = [
    // Past meetings with published minutes
    {
      date: new Date("2024-09-15"),
      type: GovernanceMeetingType.BOARD,
      title: "September 2024 Board Meeting",
      location: "Community Center, Room B",
      attendanceCount: 8,
      quorumMet: true,
      createdById: secretaryId,
    },
    {
      date: new Date("2024-10-20"),
      type: GovernanceMeetingType.BOARD,
      title: "October 2024 Board Meeting",
      location: "Community Center, Room B",
      attendanceCount: 9,
      quorumMet: true,
      createdById: secretaryId,
    },
    {
      date: new Date("2024-11-17"),
      type: GovernanceMeetingType.BOARD,
      title: "November 2024 Board Meeting",
      location: "Virtual (Zoom)",
      attendanceCount: 7,
      quorumMet: true,
      createdById: secretaryId,
    },
    // Meeting with draft minutes (for testing workflow)
    {
      date: new Date("2024-12-15"),
      type: GovernanceMeetingType.BOARD,
      title: "December 2024 Board Meeting",
      location: "Community Center, Room A",
      attendanceCount: 8,
      quorumMet: true,
      createdById: secretaryId,
    },
    // Annual meeting
    {
      date: new Date("2024-02-10"),
      type: GovernanceMeetingType.ANNUAL,
      title: "2024 Annual General Meeting",
      location: "Santa Barbara Museum of Natural History",
      attendanceCount: 145,
      quorumMet: true,
      createdById: secretaryId,
    },
    // Executive session
    {
      date: new Date("2024-11-05"),
      type: GovernanceMeetingType.EXECUTIVE,
      title: "Executive Session - Personnel Matter",
      location: "Virtual (Zoom)",
      attendanceCount: 4,
      quorumMet: true,
      createdById: presidentId,
    },
  ];

  const meetingMap = new Map<string, string>();

  for (const meeting of meetings) {
    const created = await prisma.governanceMeeting.create({
      data: meeting,
    });
    meetingMap.set(meeting.title!, created.id);
  }

  console.log(`  Created ${meetings.length} governance meetings`);

  // Create minutes for meetings
  const septMeetingId = meetingMap.get("September 2024 Board Meeting")!;
  const octMeetingId = meetingMap.get("October 2024 Board Meeting")!;
  const novMeetingId = meetingMap.get("November 2024 Board Meeting")!;
  const decMeetingId = meetingMap.get("December 2024 Board Meeting")!;
  const annualMeetingId = meetingMap.get("2024 Annual General Meeting")!;

  // Published minutes
  await prisma.governanceMinutes.create({
    data: {
      meetingId: septMeetingId,
      status: MinutesStatus.PUBLISHED,
      version: 1,
      content: {
        sections: [
          { type: "heading", text: "Call to Order" },
          { type: "paragraph", text: "The meeting was called to order at 6:30 PM by President Pat President." },
          { type: "heading", text: "Approval of Minutes" },
          { type: "paragraph", text: "August minutes were approved unanimously." },
          { type: "heading", text: "Treasurer's Report" },
          { type: "paragraph", text: "Current balance: $45,234. All bills paid." },
          { type: "heading", text: "New Business" },
          { type: "paragraph", text: "Discussed upcoming holiday party venue options." },
        ],
      },
      summary: "Routine board meeting. Approved August minutes. Discussed holiday party plans.",
      submittedAt: new Date("2024-09-16T10:00:00Z"),
      submittedById: secretaryId,
      approvedAt: new Date("2024-09-17T14:00:00Z"),
      approvedById: presidentId,
      publishedAt: new Date("2024-09-18T09:00:00Z"),
      publishedById: secretaryId,
      createdById: secretaryId,
      lastEditedById: secretaryId,
    },
  });

  await prisma.governanceMinutes.create({
    data: {
      meetingId: octMeetingId,
      status: MinutesStatus.PUBLISHED,
      version: 1,
      content: {
        sections: [
          { type: "heading", text: "Call to Order" },
          { type: "paragraph", text: "The meeting was called to order at 6:30 PM." },
          { type: "heading", text: "Holiday Party Update" },
          { type: "paragraph", text: "Venue booked at Cabrillo Pavilion. Budget approved for catering." },
          { type: "heading", text: "Membership Report" },
          { type: "paragraph", text: "Current membership: 285 active members. 12 new applications received." },
        ],
      },
      summary: "Finalized holiday party plans. Membership growing steadily.",
      submittedAt: new Date("2024-10-21T10:00:00Z"),
      submittedById: secretaryId,
      approvedAt: new Date("2024-10-22T11:00:00Z"),
      approvedById: presidentId,
      publishedAt: new Date("2024-10-23T09:00:00Z"),
      publishedById: secretaryId,
      createdById: secretaryId,
      lastEditedById: secretaryId,
    },
  });

  // Approved but not yet published
  await prisma.governanceMinutes.create({
    data: {
      meetingId: novMeetingId,
      status: MinutesStatus.APPROVED,
      version: 1,
      content: {
        sections: [
          { type: "heading", text: "Call to Order" },
          { type: "paragraph", text: "Virtual meeting called to order at 6:30 PM." },
          { type: "heading", text: "Budget Discussion" },
          { type: "paragraph", text: "Preliminary 2025 budget reviewed. Final vote scheduled for December." },
        ],
      },
      summary: "Virtual meeting. Reviewed 2025 budget proposal.",
      submittedAt: new Date("2024-11-18T10:00:00Z"),
      submittedById: secretaryId,
      approvedAt: new Date("2024-11-19T14:00:00Z"),
      approvedById: presidentId,
      createdById: secretaryId,
      lastEditedById: secretaryId,
    },
  });

  // Draft minutes (not yet submitted)
  await prisma.governanceMinutes.create({
    data: {
      meetingId: decMeetingId,
      status: MinutesStatus.DRAFT,
      version: 1,
      content: {
        sections: [
          { type: "heading", text: "Call to Order" },
          { type: "paragraph", text: "Meeting called to order at 6:30 PM." },
          { type: "heading", text: "TODO" },
          { type: "paragraph", text: "[Secretary to complete notes]" },
        ],
      },
      createdById: secretaryId,
      lastEditedById: secretaryId,
    },
  });

  // Annual meeting minutes
  await prisma.governanceMinutes.create({
    data: {
      meetingId: annualMeetingId,
      status: MinutesStatus.PUBLISHED,
      version: 1,
      content: {
        sections: [
          { type: "heading", text: "Welcome and Call to Order" },
          { type: "paragraph", text: "President welcomed 145 members to the Annual General Meeting." },
          { type: "heading", text: "Year in Review" },
          { type: "paragraph", text: "Highlights included 48 events with 1,200+ total attendees." },
          { type: "heading", text: "Election Results" },
          { type: "paragraph", text: "New board members elected by acclamation." },
          { type: "heading", text: "Member Recognition" },
          { type: "paragraph", text: "Awards presented to volunteers of the year." },
        ],
      },
      summary: "Annual meeting with 145 attendees. New board elected. Volunteer recognition.",
      submittedAt: new Date("2024-02-11T10:00:00Z"),
      submittedById: secretaryId,
      approvedAt: new Date("2024-02-12T14:00:00Z"),
      approvedById: presidentId,
      publishedAt: new Date("2024-02-13T09:00:00Z"),
      publishedById: secretaryId,
      createdById: secretaryId,
      lastEditedById: secretaryId,
    },
  });

  console.log("  Created 5 meeting minutes in various states");

  // Create motions
  const motions = [
    // September meeting motions
    {
      meetingId: septMeetingId,
      motionNumber: 1,
      motionText: "Motion to approve August 2024 meeting minutes as presented.",
      movedById: aliceId,
      secondedById: carolId,
      votesYes: 8,
      votesNo: 0,
      votesAbstain: 0,
      result: MotionResult.PASSED,
      createdById: secretaryId,
    },
    {
      meetingId: septMeetingId,
      motionNumber: 2,
      motionText: "Motion to approve holiday party budget of $2,500.",
      movedById: carolId,
      secondedById: aliceId,
      votesYes: 7,
      votesNo: 1,
      votesAbstain: 0,
      result: MotionResult.PASSED,
      createdById: secretaryId,
    },
    // October meeting motions
    {
      meetingId: octMeetingId,
      motionNumber: 1,
      motionText: "Motion to approve September 2024 meeting minutes.",
      movedById: aliceId,
      secondedById: carolId,
      votesYes: 9,
      votesNo: 0,
      votesAbstain: 0,
      result: MotionResult.PASSED,
      createdById: secretaryId,
    },
    {
      meetingId: octMeetingId,
      motionNumber: 2,
      motionText: "Motion to increase dues by $5 effective January 2025.",
      movedById: presidentId,
      secondedById: aliceId,
      votesYes: 5,
      votesNo: 3,
      votesAbstain: 1,
      result: MotionResult.PASSED,
      resultNotes: "Narrow passage; concerns noted about affordability.",
      createdById: secretaryId,
    },
    // Tabled motion for testing
    {
      meetingId: novMeetingId,
      motionNumber: 1,
      motionText: "Motion to create a new standing committee for technology oversight.",
      movedById: carolId,
      secondedById: aliceId,
      votesYes: 2,
      votesNo: 1,
      votesAbstain: 4,
      result: MotionResult.TABLED,
      resultNotes: "Tabled for further research and to be revisited in Q1 2025.",
      createdById: secretaryId,
    },
    // Annual meeting motion
    {
      meetingId: annualMeetingId,
      motionNumber: 1,
      motionText: "Motion to approve the slate of officers for 2024-2025 as presented by the Nominating Committee.",
      movedById: aliceId,
      secondedById: carolId,
      votesYes: 142,
      votesNo: 0,
      votesAbstain: 3,
      result: MotionResult.PASSED,
      resultNotes: "Elected by acclamation.",
      createdById: secretaryId,
    },
    {
      meetingId: annualMeetingId,
      motionNumber: 2,
      motionText: "Motion to adopt the revised bylaws as presented.",
      movedById: presidentId,
      secondedById: aliceId,
      votesYes: 138,
      votesNo: 5,
      votesAbstain: 2,
      result: MotionResult.PASSED,
      createdById: secretaryId,
    },
  ];

  for (const motion of motions) {
    await prisma.governanceMotion.create({ data: motion });
  }

  console.log(`  Created ${motions.length} motions with voting records`);
}

// ============================================================================
// Photo Album Seeding
// ============================================================================

async function seedPhotoAlbums(
  eventMap: Map<string, string>,
  memberMap: Map<string, string>
): Promise<void> {
  console.log("Seeding photo albums and photos...");

  const springHikeId = eventMap.get("Spring Hike 2024");
  const potluckId = eventMap.get("Summer Potluck 2024");
  const diningInId = eventMap.get("April DiningIn 2024");

  const aliceId = memberMap.get("alice@example.com")!;
  const carolId = memberMap.get("carol@example.com")!;

  // Create albums for past events
  const springHikeAlbum = await prisma.photoAlbum.create({
    data: {
      eventId: springHikeId,
      title: "Spring Hike 2024 Photos",
      description: "Beautiful wildflower views from our April canyon hike.",
    },
  });

  const potluckAlbum = await prisma.photoAlbum.create({
    data: {
      eventId: potluckId,
      title: "Summer Potluck 2024",
      description: "Annual potluck gathering at Oak Park.",
    },
  });

  const diningInAlbum = await prisma.photoAlbum.create({
    data: {
      eventId: diningInId,
      title: "April DiningIn 2024",
      description: "Photos from our intimate dining experience.",
    },
  });

  // Standalone album (not tied to event)
  const standaloneAlbum = await prisma.photoAlbum.create({
    data: {
      title: "Club Memories 2024",
      description: "Miscellaneous photos from throughout the year.",
    },
  });

  console.log("  Created 4 photo albums (3 event-linked, 1 standalone)");

  // Create photos for Spring Hike album
  const springHikePhotos = [
    {
      albumId: springHikeAlbum.id,
      uploaderId: aliceId,
      filename: "spring-hike-001.jpg",
      url: "/photos/2024/spring-hike/001.jpg",
      caption: "Group photo at the trailhead",
      takenAt: new Date("2024-04-15T08:15:00Z"),
    },
    {
      albumId: springHikeAlbum.id,
      uploaderId: aliceId,
      filename: "spring-hike-002.jpg",
      url: "/photos/2024/spring-hike/002.jpg",
      caption: "California poppies in bloom",
      takenAt: new Date("2024-04-15T09:30:00Z"),
    },
    {
      albumId: springHikeAlbum.id,
      uploaderId: carolId,
      filename: "spring-hike-003.jpg",
      url: "/photos/2024/spring-hike/003.jpg",
      caption: "View from the summit",
      takenAt: new Date("2024-04-15T10:45:00Z"),
    },
    {
      albumId: springHikeAlbum.id,
      uploaderId: carolId,
      filename: "spring-hike-004.jpg",
      url: "/photos/2024/spring-hike/004.jpg",
      caption: "Picnic lunch break",
      takenAt: new Date("2024-04-15T11:30:00Z"),
    },
  ];

  // Create photos for Summer Potluck
  const potluckPhotos = [
    {
      albumId: potluckAlbum.id,
      uploaderId: aliceId,
      filename: "potluck-001.jpg",
      url: "/photos/2024/potluck/001.jpg",
      caption: "The amazing spread of dishes",
      takenAt: new Date("2024-07-10T17:30:00Z"),
    },
    {
      albumId: potluckAlbum.id,
      uploaderId: aliceId,
      filename: "potluck-002.jpg",
      url: "/photos/2024/potluck/002.jpg",
      caption: "Members enjoying the picnic",
      takenAt: new Date("2024-07-10T18:00:00Z"),
    },
    {
      albumId: potluckAlbum.id,
      uploaderId: carolId,
      filename: "potluck-003.jpg",
      url: "/photos/2024/potluck/003.jpg",
      caption: "Sunset at the park",
      takenAt: new Date("2024-07-10T19:45:00Z"),
    },
  ];

  // Create photos for DiningIn
  const diningInPhotos = [
    {
      albumId: diningInAlbum.id,
      uploaderId: carolId,
      filename: "diningin-001.jpg",
      url: "/photos/2024/diningin/001.jpg",
      caption: "Beautifully set table",
      takenAt: new Date("2024-04-20T18:00:00Z"),
    },
    {
      albumId: diningInAlbum.id,
      uploaderId: carolId,
      filename: "diningin-002.jpg",
      url: "/photos/2024/diningin/002.jpg",
      caption: "Host presenting the first course",
      takenAt: new Date("2024-04-20T18:30:00Z"),
    },
  ];

  // Create photos for standalone album
  const standalonePhotos = [
    {
      albumId: standaloneAlbum.id,
      uploaderId: aliceId,
      filename: "club-001.jpg",
      url: "/photos/2024/misc/001.jpg",
      caption: "Board meeting in action",
      takenAt: new Date("2024-03-15T14:00:00Z"),
    },
    {
      albumId: standaloneAlbum.id,
      uploaderId: aliceId,
      filename: "club-002.jpg",
      url: "/photos/2024/misc/002.jpg",
      caption: "New member orientation",
      takenAt: new Date("2024-05-10T10:00:00Z"),
    },
  ];

  const allPhotos = [...springHikePhotos, ...potluckPhotos, ...diningInPhotos, ...standalonePhotos];

  let coverPhotoId: string | undefined;
  for (const photo of allPhotos) {
    const created = await prisma.photo.create({ data: photo });
    // Set first photo of spring hike as cover
    if (photo.filename === "spring-hike-001.jpg") {
      coverPhotoId = created.id;
    }
  }

  // Set cover photo for spring hike album
  if (coverPhotoId) {
    await prisma.photoAlbum.update({
      where: { id: springHikeAlbum.id },
      data: { coverPhotoId },
    });
  }

  console.log(`  Created ${allPhotos.length} photos across 4 albums`);
}

// ============================================================================
// Email Log Seeding
// ============================================================================

async function seedEmailLogs(memberMap: Map<string, string>): Promise<void> {
  console.log("Seeding email logs...");

  const aliceId = memberMap.get("alice@example.com");
  const carolId = memberMap.get("carol@example.com");
  const karenId = memberMap.get("karen@example.com"); // Prospect
  const larryId = memberMap.get("larry@example.com"); // Alumni
  const henryId = memberMap.get("henry@example.com"); // Lapsed

  const emailLogs = [
    // Successful deliveries
    {
      memberId: aliceId,
      recipientEmail: "alice@example.com",
      subject: "Your Event Registration Confirmation",
      bodyPreview: "Thank you for registering for Welcome Coffee...",
      sentAt: new Date("2024-12-01T10:00:00Z"),
      channel: "transactional",
      templateKey: "event-registration-confirmation",
      status: EmailStatus.DELIVERED,
    },
    {
      memberId: carolId,
      recipientEmail: "carol@example.com",
      subject: "December Newsletter",
      bodyPreview: "Happy holidays from the Club! Here's what's happening...",
      sentAt: new Date("2024-12-05T09:00:00Z"),
      channel: "newsletter",
      templateKey: "monthly-newsletter",
      status: EmailStatus.DELIVERED,
    },
    {
      memberId: aliceId,
      recipientEmail: "alice@example.com",
      subject: "Board Meeting Reminder",
      bodyPreview: "Reminder: December Board Meeting this Thursday...",
      sentAt: new Date("2024-12-12T08:00:00Z"),
      channel: "governance",
      templateKey: "meeting-reminder",
      status: EmailStatus.DELIVERED,
    },
    // Sent but not yet delivered
    {
      memberId: carolId,
      recipientEmail: "carol@example.com",
      subject: "Your Membership Renewal",
      bodyPreview: "Your membership expires in 30 days...",
      sentAt: new Date("2024-12-20T10:00:00Z"),
      channel: "transactional",
      templateKey: "renewal-reminder",
      status: EmailStatus.SENT,
    },
    // Bounced email (common for testing error handling)
    {
      memberId: henryId,
      recipientEmail: "henry@example.com",
      subject: "December Newsletter",
      bodyPreview: "Happy holidays from the Club!...",
      sentAt: new Date("2024-12-05T09:05:00Z"),
      channel: "newsletter",
      templateKey: "monthly-newsletter",
      status: EmailStatus.BOUNCED,
    },
    // Failed delivery
    {
      memberId: larryId,
      recipientEmail: "larry@example.com",
      subject: "Alumni Event Invitation",
      bodyPreview: "You're invited to our special alumni gathering...",
      sentAt: new Date("2024-11-15T14:00:00Z"),
      channel: "marketing",
      templateKey: "alumni-event-invite",
      status: EmailStatus.FAILED,
    },
    // Queued (not yet sent)
    {
      memberId: karenId,
      recipientEmail: "karen@example.com",
      subject: "Welcome to the Club!",
      bodyPreview: "We're excited to have you as a prospective member...",
      sentAt: new Date("2024-12-22T16:00:00Z"),
      channel: "transactional",
      templateKey: "prospect-welcome",
      status: EmailStatus.QUEUED,
    },
    // More delivered for history
    {
      memberId: aliceId,
      recipientEmail: "alice@example.com",
      subject: "November Newsletter",
      bodyPreview: "Thanksgiving greetings from the Club!...",
      sentAt: new Date("2024-11-05T09:00:00Z"),
      channel: "newsletter",
      templateKey: "monthly-newsletter",
      status: EmailStatus.DELIVERED,
    },
    {
      memberId: carolId,
      recipientEmail: "carol@example.com",
      subject: "Event Waitlist Update",
      bodyPreview: "You've been moved off the waitlist for Morning Hike...",
      sentAt: new Date("2024-11-20T11:30:00Z"),
      channel: "transactional",
      templateKey: "waitlist-promotion",
      status: EmailStatus.DELIVERED,
    },
    {
      memberId: aliceId,
      recipientEmail: "alice@example.com",
      subject: "Your Order Has Shipped",
      bodyPreview: "Your order #1234 is on its way...",
      sentAt: new Date("2024-11-16T14:30:00Z"),
      channel: "store",
      templateKey: "order-shipped",
      status: EmailStatus.DELIVERED,
    },
  ];

  for (const log of emailLogs) {
    await prisma.emailLog.create({ data: log });
  }

  console.log(`  Created ${emailLogs.length} email log entries:`);
  console.log("    - 7 DELIVERED");
  console.log("    - 1 SENT (pending delivery)");
  console.log("    - 1 BOUNCED");
  console.log("    - 1 FAILED");
  console.log("    - 1 QUEUED");
}

// ============================================================================
// Activity Groups
// ============================================================================

async function seedActivityGroups(
  memberMap: Map<string, string>
): Promise<void> {
  console.log("Seeding activity groups...");

  const aliceId = memberMap.get("alice@example.com")!;
  const carolId = memberMap.get("carol@example.com")!;
  const karenId = memberMap.get("karen@example.com")!;

  // Create activity groups in various states
  const groups = [
    // Approved and active group: Book Club
    {
      name: "Book Club",
      slug: "book-club",
      description: "Monthly book discussions with members. We read a variety of genres from fiction to biography.",
      category: "Arts & Culture",
      schedule: "First Thursday, 7:00 PM",
      imageEmoji: "📚",
      status: ActivityGroupStatus.APPROVED,
      isPublic: true,
      proposedById: aliceId,
      proposedAt: new Date("2024-06-01"),
      approvedById: aliceId,
      approvedAt: new Date("2024-06-05"),
    },
    // Approved and active group: Hiking Club
    {
      name: "Hiking Club",
      slug: "hiking-club",
      description: "Weekly hikes through local trails. All skill levels welcome!",
      category: "Outdoor",
      schedule: "Every Saturday, 8:00 AM",
      imageEmoji: "🥾",
      status: ActivityGroupStatus.APPROVED,
      isPublic: true,
      proposedById: carolId,
      proposedAt: new Date("2024-07-15"),
      approvedById: aliceId,
      approvedAt: new Date("2024-07-20"),
    },
    // Approved private group: Wine Tasting
    {
      name: "Wine Tasting Society",
      slug: "wine-tasting",
      description: "Exclusive wine tasting events. Members only.",
      category: "Social",
      schedule: "Third Friday, 6:00 PM",
      imageEmoji: "🍷",
      status: ActivityGroupStatus.APPROVED,
      isPublic: false, // Private group
      proposedById: aliceId,
      proposedAt: new Date("2024-08-01"),
      approvedById: aliceId,
      approvedAt: new Date("2024-08-05"),
    },
    // Proposed group: Board Games
    {
      name: "Board Games Night",
      slug: "board-games",
      description: "Weekly board game nights. Modern and classic games!",
      category: "Games",
      schedule: "Tuesdays, 7:00 PM",
      imageEmoji: "🎲",
      status: ActivityGroupStatus.PROPOSED,
      isPublic: true,
      proposedById: carolId,
      proposedAt: new Date("2025-01-10"),
      approvedById: null,
      approvedAt: null,
    },
    // Rejected group
    {
      name: "Duplicate Book Group",
      slug: "duplicate-book-group",
      description: "Another book reading group (rejected as duplicate).",
      category: "Arts & Culture",
      schedule: "Mondays, 7:00 PM",
      imageEmoji: "📖",
      status: ActivityGroupStatus.REJECTED,
      isPublic: true,
      proposedById: karenId,
      proposedAt: new Date("2025-01-05"),
      approvedById: null,
      approvedAt: null,
      rejectedById: aliceId,
      rejectedAt: new Date("2025-01-08"),
      rejectionNotes: "We already have a Book Club. Consider joining that instead!",
    },
    // Deactivated group
    {
      name: "Photography Walk",
      slug: "photography-walk",
      description: "Monthly photography walks (discontinued due to low attendance).",
      category: "Outdoor",
      schedule: "Second Sunday, 10:00 AM",
      imageEmoji: "📷",
      status: ActivityGroupStatus.DEACTIVATED,
      isPublic: true,
      proposedById: aliceId,
      proposedAt: new Date("2023-06-01"),
      approvedById: aliceId,
      approvedAt: new Date("2023-06-05"),
      deactivatedById: aliceId,
      deactivatedAt: new Date("2024-12-01"),
      deactivationReason: "Low attendance over past 6 months.",
    },
  ];

  const groupMap = new Map<string, string>();

  for (const group of groups) {
    const created = await prisma.activityGroup.create({
      data: group as Parameters<typeof prisma.activityGroup.create>[0]["data"],
    });
    groupMap.set(group.slug, created.id);
  }

  // Add members to approved groups
  const bookClubId = groupMap.get("book-club")!;
  const hikingClubId = groupMap.get("hiking-club")!;
  const wineId = groupMap.get("wine-tasting")!;

  // Book Club members
  await prisma.activityGroupMember.createMany({
    data: [
      {
        groupId: bookClubId,
        memberId: aliceId,
        role: ActivityGroupRole.COORDINATOR,
        joinedAt: new Date("2024-06-05"),
      },
      {
        groupId: bookClubId,
        memberId: carolId,
        role: ActivityGroupRole.MEMBER,
        joinedAt: new Date("2024-06-10"),
      },
    ],
  });

  // Hiking Club members
  await prisma.activityGroupMember.createMany({
    data: [
      {
        groupId: hikingClubId,
        memberId: carolId,
        role: ActivityGroupRole.COORDINATOR,
        joinedAt: new Date("2024-07-20"),
      },
      {
        groupId: hikingClubId,
        memberId: aliceId,
        role: ActivityGroupRole.MEMBER,
        joinedAt: new Date("2024-07-25"),
      },
    ],
  });

  // Wine Tasting members
  await prisma.activityGroupMember.createMany({
    data: [
      {
        groupId: wineId,
        memberId: aliceId,
        role: ActivityGroupRole.COORDINATOR,
        joinedAt: new Date("2024-08-05"),
      },
    ],
  });

  // Add announcements to Book Club
  await prisma.activityGroupAnnouncement.createMany({
    data: [
      {
        groupId: bookClubId,
        title: "January Book Selection: The Midnight Library",
        content: "Our January pick is 'The Midnight Library' by Matt Haig. Get your copy and join us for discussion!",
        isPinned: true,
        publishedAt: new Date("2025-01-02"),
        expiresAt: new Date("2025-02-01"),
        createdById: aliceId,
      },
      {
        groupId: bookClubId,
        title: "Meeting Location Change",
        content: "This month we'll meet at the Santa Barbara Library, Room 201 instead of the usual location.",
        isPinned: false,
        publishedAt: new Date("2025-01-10"),
        createdById: aliceId,
      },
    ],
  });

  // Add announcement to Hiking Club
  await prisma.activityGroupAnnouncement.create({
    data: {
      groupId: hikingClubId,
      title: "This Saturday: Cold Spring Trail",
      content: "We're hiking Cold Spring Trail this Saturday. Meet at the trailhead at 8 AM. Bring water!",
      isPinned: true,
      publishedAt: new Date("2025-01-08"),
      expiresAt: new Date("2025-01-12"),
      createdById: carolId,
    },
  });

  console.log(`  Created ${groups.length} activity groups:`);
  console.log("    - 3 APPROVED (2 public, 1 private)");
  console.log("    - 1 PROPOSED (pending approval)");
  console.log("    - 1 REJECTED");
  console.log("    - 1 DEACTIVATED");
  console.log("  Created 5 group memberships (coordinators + members)");
  console.log("  Created 3 group announcements");
}

async function main(): Promise<void> {
  console.log("=== Murmurant Seed Script ===\n");

  checkEnvironment();

  try {
    // Clear store data first (new)
    await clearStoreData();
    await clearData();

    const statusMap = await seedMembershipStatuses();
    const memberMap = await seedMembers(statusMap);
    await seedUserAccounts(memberMap);
    await seedCommitteesAndRoles();
    await seedTerms();

    // Seed demo users AFTER terms and committees are created
    await seedDemoUsers(statusMap);

    const eventMap = await seedEvents(memberMap);
    await seedEventRegistrations(eventMap, memberMap);

    // Seed store data
    const productMap = await seedProducts();
    const variantMap = await seedProductVariants(productMap);
    const addressMap = await seedShippingAddresses(memberMap);
    await seedStoreOrders(memberMap, productMap, variantMap, addressMap);

    // Seed governance data (after demo users created)
    await seedGovernanceData(memberMap);

    // Seed photo albums (after events created)
    await seedPhotoAlbums(eventMap, memberMap);

    // Seed email logs (after members created)
    await seedEmailLogs(memberMap);

    // Seed activity groups (after members created)
    await seedActivityGroups(memberMap);

    console.log("\n=== Seed Complete ===");
    console.log("Summary:");
    console.log("  - 5 membership statuses (PROSPECT, NEWCOMER, EXTENDED, ALUMNI, LAPSED)");
    console.log("  - 5 members in all statuses");
    console.log("  - 1 admin user account (alice@example.com)");
    console.log("  - 5 committees with 18 committee roles");
    console.log("  - 3 terms (Winter 2024, Winter 2025, Summer 2025)");
    console.log("  - 8 events (3 past, 4 future, 1 draft)");
    console.log("  - 16 event registrations across all states:");
    console.log("    - CONFIRMED, WAITLISTED, CANCELLED, NO_SHOW, REFUND_PENDING");
    console.log("  - 5 demo users with role-based access:");
    console.log("    - president@demo.murmurant.test (President)");
    console.log("    - secretary@demo.murmurant.test (Secretary)");
    console.log("    - parliamentarian@demo.murmurant.test (Parliamentarian)");
    console.log("    - eventchair@demo.murmurant.test (Event Chair)");
    console.log("    - member@demo.murmurant.test (Member)");
    console.log("  - 7 store products (4 physical, 2 digital, 1 members-only)");
    console.log("  - 5 t-shirt size variants");
    console.log("  - 3 shipping addresses (2 member, 1 guest)");
    console.log("  - 9 store orders covering all statuses");
    console.log("  - 6 governance meetings (BOARD, ANNUAL, EXECUTIVE)");
    console.log("  - 5 meeting minutes (DRAFT, APPROVED, PUBLISHED)");
    console.log("  - 7 motions (PASSED, TABLED)");
    console.log("  - 4 photo albums with 11 photos");
    console.log("  - 11 email logs (DELIVERED, SENT, BOUNCED, FAILED, QUEUED)");
    console.log("  - 6 activity groups (3 approved, 1 proposed, 1 rejected, 1 deactivated)");
    console.log("  - 5 group memberships and 3 announcements");
    console.log("\nDemo Login Instructions:");
    console.log("  1. Go to /login");
    console.log("  2. Enter demo email (e.g., president@demo.murmurant.test)");
    console.log("  3. Click 'Send sign-in link'");
    console.log("  4. Check console for magic link (in dev mode)");
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
