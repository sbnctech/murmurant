/**
 * Seed Data Constants for Tests
 *
 * These values match the PFOS (Pacific Field Observers Society) seed data.
 * Tests should import from here to avoid hardcoding.
 *
 * For full constants including UUIDs, import from:
 *   prisma/seed/pfos-constants.ts
 */

// Re-export PFOS constants for test use
export {
  PFOS_MEMBER_IDS,
  PFOS_EVENT_IDS,
  PFOS_COMMITTEE_IDS,
  PFOS_STATUS_IDS,
  PFOS_ROLE_IDS,
  PFOS_TERM_IDS,
  PFOS_MEMBERS,
  PFOS_EVENTS,
  PFOS_COMMITTEES,
  PFOS_STATUSES,
  PFOS_COUNTS,
  PFOS_TEST_USERS,
  PFOS_METADATA,
} from "../../prisma/seed/pfos-constants";

// Backwards compatibility: Map old names to new PFOS data
// TODO: Remove after all tests are updated

export const SEED_MEMBERS = {
  // Map ALICE -> David Chen-Ramirez (President, Extended status)
  ALICE: {
    email: "david.chenramirez@pfos.example",
    firstName: "David",
    lastName: "Chen-Ramirez",
    fullName: "David Chen-Ramirez",
    status: "EXTENDED",
  },
  // Map CAROL -> Aiden Newby (Newcomer)
  CAROL: {
    email: "aiden.newby@pfos.example",
    firstName: "Aiden",
    lastName: "Newby",
    fullName: "Aiden Newby",
    status: "NEWCOMER",
  },
  // Additional mappings for common test scenarios
  MURIEL: {
    email: "muriel.kessler@pfos.example",
    firstName: "Muriel",
    lastName: "Kessler",
    fullName: "Muriel Kessler",
    status: "EXTENDED",
  },
  ADMIN: {
    email: "admin@demo.pfos.test",
    firstName: "Admin",
    lastName: "Demo",
    fullName: "Admin Demo",
    status: "EXTENDED",
  },
  MEMBER: {
    email: "member@demo.pfos.test",
    firstName: "Member",
    lastName: "Demo",
    fullName: "Member Demo",
    status: "EXTENDED",
  },
  NEWCOMER: {
    email: "new@demo.pfos.test",
    firstName: "New",
    lastName: "Demo",
    fullName: "New Demo",
    status: "NEWCOMER",
  },
} as const;

// Events from seed (mapped to PFOS events)
export const SEED_EVENTS = {
  // Map WELCOME_COFFEE -> Annual House Sparrow Count
  WELCOME_COFFEE: {
    title: "Annual House Sparrow Count",
    category: "Census",
    chairEmail: SEED_MEMBERS.MURIEL.email,
  },
  // Map MORNING_HIKE -> The Completely Ordinary Bird Walk
  MORNING_HIKE: {
    title: "The Completely Ordinary Bird Walk",
    category: "Outing",
    chairEmail: "dorothy.finch@pfos.example",
  },
  // Map BEACH_PICNIC -> Fog Appreciation Morning
  BEACH_PICNIC: {
    title: "Fog Appreciation Morning",
    category: "Social",
    chairEmail: "patricia.overcast@pfos.example",
  },
  // Map DRAFT_EVENT -> Summer Solstice Dawn Watch (PLANNING)
  DRAFT_EVENT: {
    title: "Summer Solstice Dawn Watch (PLANNING)",
    category: "Outing",
    chairEmail: "burt.halverson@pfos.example",
    isPublished: false,
  },
  // Additional PFOS events for new tests
  PARKING_LOT_TOUR: {
    title: "Parking Lot Ecology Tour",
    category: "Outing",
    chairEmail: "steven.seagal@pfos.example",
  },
  LICHEN_WORKSHOP: {
    title: "Lichen Identification Workshop",
    category: "Workshop",
    chairEmail: "yuki.tanaka@pfos.example",
  },
  BOARD_MEETING: {
    title: "Q1 Board of Observers Meeting",
    category: "Governance",
    chairEmail: "david.chenramirez@pfos.example",
  },
  ANNUAL_POTLUCK: {
    title: "Annual Potluck & Awards Night",
    category: "Social",
    chairEmail: "dorothy.finch@pfos.example",
  },
} as const;

// Registration statuses
export const REGISTRATION_STATUS = {
  CONFIRMED: "CONFIRMED",
  WAITLISTED: "WAITLISTED",
  CANCELLED: "CANCELLED",
  PENDING: "PENDING",
} as const;

// Counts for assertions (PFOS values)
export const SEED_COUNTS = {
  // Member counts
  members: 72,
  activeMembers: 69, // Extended + Newcomer + Alumni
  extendedMembers: 58,
  newcomerMembers: 10,

  // Event counts
  events: 18,
  publishedEvents: 16,
  upcomingEvents: 11,

  // Registrations (approximate - varies by seeded random)
  registrations: 371,
  confirmedRegistrations: 347,
  waitlistedRegistrations: 24,
} as const;

// Categories present in PFOS seed (for filter tests)
export const SEED_CATEGORIES = [
  "Census",
  "Social",
  "Outing",
  "Workshop",
  "Orientation",
  "Meeting",
  "Governance",
  "Experimental",
] as const;

// Committee names for governance tests
export const SEED_COMMITTEES = {
  BOARD: "Board of Observers",
  ACTIVITIES: "Activities & Expeditions Committee",
  MEMBERSHIP: "Membership & Welcoming Committee",
  COMMUNICATIONS: "Communications & Chronicle Committee",
  SCIENCE: "Scientific Standards Committee",
  FINANCE: "Finance & Fundraising Committee",
} as const;
