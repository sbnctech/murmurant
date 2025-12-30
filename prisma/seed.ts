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

    console.log("\n=== Seed Complete ===");
    console.log("Summary:");
    console.log("  - 5 membership statuses");
    console.log("  - 2 members (Alice Chen, Carol Johnson)");
    console.log("  - 1 admin user account (alice@example.com)");
    console.log("  - 5 committees with 18 committee roles");
    console.log("  - 3 terms (Winter 2024, Winter 2025, Summer 2025)");
    console.log("  - 4 events (3 published, 1 draft)");
    console.log("  - 4 event registrations (3 confirmed, 1 waitlisted)");
    console.log("  - 5 demo users with role-based access:");
    console.log("    - president@demo.murmurant.test (President)");
    console.log("    - secretary@demo.murmurant.test (Secretary)");
    console.log("    - parliamentarian@demo.murmurant.test (Parliamentarian)");
    console.log("    - eventchair@demo.murmurant.test (Event Chair)");
    console.log("    - member@demo.murmurant.test (Member)");
    console.log("  - 7 store products (4 physical, 2 digital, 1 members-only)");
    console.log("  - 5 t-shirt size variants");
    console.log("  - 3 shipping addresses (2 member, 1 guest)");
    console.log("  - 9 store orders covering all statuses:");
    console.log("    - Completed, Picked Up, Shipped, Processing");
    console.log("    - Pending Payment, Cart, Cancelled, Refunded");
    console.log("    - Includes guest checkout and digital delivery");
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
