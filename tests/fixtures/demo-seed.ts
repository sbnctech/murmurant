/**
 * Demo Seed Data Constants
 *
 * This file defines the expected seed data that matches prisma/seed.ts.
 * Tests should import these constants to reference stable, known data
 * instead of hardcoding values.
 *
 * IMPORTANT: Keep this file in sync with prisma/seed.ts
 *
 * Last synced: 2025-12-14
 */

// =============================================================================
// MEMBERS
// =============================================================================

export const DEMO_MEMBERS = {
  ALICE: {
    firstName: "Alice",
    lastName: "Chen",
    fullName: "Alice Chen",
    email: "alice@example.com",
    phone: "+1-555-0101",
    status: "EXTENDED",
    statusLabel: "Extended Member",
  },
  CAROL: {
    firstName: "Carol",
    lastName: "Johnson",
    fullName: "Carol Johnson",
    email: "carol@example.com",
    phone: "+1-555-0102",
    status: "NEWCOMER",
    statusLabel: "Newcomer",
  },
} as const;

/** All member emails for iteration */
export const DEMO_MEMBER_EMAILS = [
  DEMO_MEMBERS.ALICE.email,
  DEMO_MEMBERS.CAROL.email,
] as const;

/** Count of seeded members */
export const DEMO_MEMBER_COUNT = 2;

// =============================================================================
// EVENTS
// =============================================================================

export const DEMO_EVENTS = {
  WELCOME_COFFEE: {
    title: "Welcome Coffee",
    category: "Social",
    location: "Community Center, Room A",
    capacity: 20,
    isPublished: true,
    chairEmail: DEMO_MEMBERS.ALICE.email,
  },
  MORNING_HIKE: {
    title: "Morning Hike at Rattlesnake Canyon",
    category: "Outdoors",
    location: "Rattlesnake Canyon Trailhead",
    capacity: 15,
    isPublished: true,
    chairEmail: DEMO_MEMBERS.CAROL.email,
  },
  BEACH_PICNIC: {
    title: "Summer Beach Picnic",
    category: "Social",
    location: "East Beach Pavilion",
    capacity: 50,
    isPublished: true,
    chairEmail: null, // No event chair
  },
  DRAFT_EVENT: {
    title: "Draft Event (not published)",
    category: "Social",
    location: "TBD",
    capacity: 10,
    isPublished: false,
    chairEmail: null,
  },
} as const;

/** All event titles for iteration */
export const DEMO_EVENT_TITLES = [
  DEMO_EVENTS.WELCOME_COFFEE.title,
  DEMO_EVENTS.MORNING_HIKE.title,
  DEMO_EVENTS.BEACH_PICNIC.title,
  DEMO_EVENTS.DRAFT_EVENT.title,
] as const;

/** Published events only */
export const DEMO_PUBLISHED_EVENT_TITLES = [
  DEMO_EVENTS.WELCOME_COFFEE.title,
  DEMO_EVENTS.MORNING_HIKE.title,
  DEMO_EVENTS.BEACH_PICNIC.title,
] as const;

/** Count of seeded events */
export const DEMO_EVENT_COUNT = 4;
export const DEMO_PUBLISHED_EVENT_COUNT = 3;

// =============================================================================
// REGISTRATIONS
// =============================================================================

export const DEMO_REGISTRATIONS = {
  /** Carol is CONFIRMED for Welcome Coffee */
  CAROL_WELCOME_COFFEE: {
    memberEmail: DEMO_MEMBERS.CAROL.email,
    eventTitle: DEMO_EVENTS.WELCOME_COFFEE.title,
    status: "CONFIRMED",
    waitlistPosition: null,
  },
  /** Carol is CONFIRMED for Morning Hike */
  CAROL_MORNING_HIKE: {
    memberEmail: DEMO_MEMBERS.CAROL.email,
    eventTitle: DEMO_EVENTS.MORNING_HIKE.title,
    status: "CONFIRMED",
    waitlistPosition: null,
  },
  /** Alice is WAITLISTED for Morning Hike */
  ALICE_MORNING_HIKE: {
    memberEmail: DEMO_MEMBERS.ALICE.email,
    eventTitle: DEMO_EVENTS.MORNING_HIKE.title,
    status: "WAITLISTED",
    waitlistPosition: 1,
  },
  /** Alice is CONFIRMED for Beach Picnic */
  ALICE_BEACH_PICNIC: {
    memberEmail: DEMO_MEMBERS.ALICE.email,
    eventTitle: DEMO_EVENTS.BEACH_PICNIC.title,
    status: "CONFIRMED",
    waitlistPosition: null,
  },
} as const;

/** Count of seeded registrations */
export const DEMO_REGISTRATION_COUNT = 4;
export const DEMO_CONFIRMED_COUNT = 3;
export const DEMO_WAITLISTED_COUNT = 1;

// =============================================================================
// MEMBERSHIP STATUSES
// =============================================================================

export const DEMO_MEMBERSHIP_STATUSES = {
  PROSPECT: { code: "PROSPECT", label: "Prospect", isActive: false },
  NEWCOMER: { code: "NEWCOMER", label: "Newcomer", isActive: true },
  EXTENDED: { code: "EXTENDED", label: "Extended Member", isActive: true },
  ALUMNI: { code: "ALUMNI", label: "Alumni", isActive: true },
  LAPSED: { code: "LAPSED", label: "Lapsed", isActive: false },
} as const;

export const DEMO_MEMBERSHIP_STATUS_COUNT = 5;

// =============================================================================
// USER ACCOUNTS
// =============================================================================

export const DEMO_ADMIN_USER = {
  email: DEMO_MEMBERS.ALICE.email,
  // Password for local dev only (NOT secure)
  password: "password123",
};

// =============================================================================
// SUMMARY STATS (for dashboard tests)
// =============================================================================

export const DEMO_SUMMARY = {
  /** Total members in seed */
  totalMembers: DEMO_MEMBER_COUNT,

  /** Members with active membership status */
  activeMembers: 2, // Alice (EXTENDED) and Carol (NEWCOMER) are both active

  /** Total events including drafts */
  totalEvents: DEMO_EVENT_COUNT,

  /** Published events only */
  publishedEvents: DEMO_PUBLISHED_EVENT_COUNT,

  /** Total registrations */
  totalRegistrations: DEMO_REGISTRATION_COUNT,

  /** WAITLISTED registrations */
  waitlistedRegistrations: DEMO_WAITLISTED_COUNT,

  /** CONFIRMED registrations */
  confirmedRegistrations: DEMO_CONFIRMED_COUNT,
};

// =============================================================================
// HELPER TYPE EXPORTS
// =============================================================================

export type DemoMemberKey = keyof typeof DEMO_MEMBERS;
export type DemoEventKey = keyof typeof DEMO_EVENTS;
export type DemoRegistrationKey = keyof typeof DEMO_REGISTRATIONS;
