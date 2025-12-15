/**
 * Seed Data Constants for Tests
 *
 * These values must match prisma/seed.ts exactly.
 * Tests should import from here to avoid hardcoding.
 */

// Members from seed
export const SEED_MEMBERS = {
  ALICE: {
    email: "alice@example.com",
    firstName: "Alice",
    lastName: "Chen",
    fullName: "Alice Chen",
    status: "EXTENDED",
  },
  CAROL: {
    email: "carol@example.com",
    firstName: "Carol",
    lastName: "Johnson",
    fullName: "Carol Johnson",
    status: "NEWCOMER",
  },
} as const;

// Events from seed
export const SEED_EVENTS = {
  WELCOME_COFFEE: {
    title: "Welcome Coffee",
    category: "Social",
    chairEmail: SEED_MEMBERS.ALICE.email,
  },
  MORNING_HIKE: {
    title: "Morning Hike at Rattlesnake Canyon",
    category: "Outdoors",
    chairEmail: SEED_MEMBERS.CAROL.email,
  },
  BEACH_PICNIC: {
    title: "Summer Beach Picnic",
    category: "Social",
    chairEmail: null,
  },
  DRAFT_EVENT: {
    title: "Draft Event (not published)",
    category: "Social",
    chairEmail: null,
    isPublished: false,
  },
} as const;

// Registration statuses
export const REGISTRATION_STATUS = {
  CONFIRMED: "CONFIRMED",
  WAITLISTED: "WAITLISTED",
  CANCELLED: "CANCELLED",
  PENDING: "PENDING",
} as const;

// Counts for assertions
export const SEED_COUNTS = {
  members: 2,
  events: 4,
  publishedEvents: 3,
  registrations: 4,
  confirmedRegistrations: 3,
  waitlistedRegistrations: 1,
} as const;
