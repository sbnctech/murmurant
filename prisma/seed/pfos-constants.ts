/**
 * PFOS (Pacific Field Observers Society) Test Constants
 *
 * Deterministic UUIDs and expected values for E2E testing.
 * These IDs are used by:
 * - prisma/seed/pfos-seed.ts (data creation)
 * - tests/fixtures/seed-data.ts (test assertions)
 *
 * UUID Pattern: Using predictable UUIDs for easy identification
 * - Members:     11111111-1111-1111-1111-XXXXXXXXXXXX
 * - Statuses:    22222222-2222-2222-2222-XXXXXXXXXXXX
 * - Committees:  33333333-3333-3333-3333-XXXXXXXXXXXX
 * - Roles:       44444444-4444-4444-4444-XXXXXXXXXXXX
 * - Events:      55555555-5555-5555-5555-XXXXXXXXXXXX
 * - Terms:       66666666-6666-6666-6666-XXXXXXXXXXXX
 *
 * All data is fictional - no real PII.
 */

// ============================================================================
// MEMBERSHIP STATUS IDS
// ============================================================================

export const PFOS_STATUS_IDS = {
  PROSPECT: "22222222-2222-2222-2222-000000000001",
  NEWCOMER: "22222222-2222-2222-2222-000000000002",
  EXTENDED: "22222222-2222-2222-2222-000000000003",
  ALUMNI: "22222222-2222-2222-2222-000000000004",
  LAPSED: "22222222-2222-2222-2222-000000000005",
} as const;

// ============================================================================
// MEMBER IDS - Leadership & Key Test Accounts
// ============================================================================

export const PFOS_MEMBER_IDS = {
  // Founding & Leadership
  murielKessler: "11111111-1111-1111-1111-000000000001", // Founder, Past President
  davidChenRamirez: "11111111-1111-1111-1111-000000000002", // Current President
  priyaOkonkwo: "11111111-1111-1111-1111-000000000003", // VP
  tedAlbright: "11111111-1111-1111-1111-000000000004", // Treasurer
  sandraYee: "11111111-1111-1111-1111-000000000005", // Secretary

  // Key Volunteers
  burtHalverson: "11111111-1111-1111-1111-000000000006", // Sparrow Counter
  dorothyFinch: "11111111-1111-1111-1111-000000000007", // Activities Chair
  geraldWren: "11111111-1111-1111-1111-000000000008", // Science Chair

  // Notable Members
  stevenSeagal: "11111111-1111-1111-1111-000000000009", // Gull specialist
  marinaBarnacle: "11111111-1111-1111-1111-000000000010", // Tidal pool
  yukiTanaka: "11111111-1111-1111-1111-000000000011", // Lichen expert
  kenjiTanaka: "11111111-1111-1111-1111-000000000012", // Lichen expert twin
  patriciaOvercast: "11111111-1111-1111-1111-000000000013", // Cloud classifier

  // Newcomers
  aidenNewby: "11111111-1111-1111-1111-000000000050",
  briannaFresh: "11111111-1111-1111-1111-000000000051",
  cameronCurious: "11111111-1111-1111-1111-000000000052",

  // Lapsed/Alumni
  patriciaDeaparted: "11111111-1111-1111-1111-000000000060",
  robertaResting: "11111111-1111-1111-1111-000000000061",

  // Demo Test Accounts
  adminDemo: "11111111-1111-1111-1111-000000000090",
  memberDemo: "11111111-1111-1111-1111-000000000091",
  newDemo: "11111111-1111-1111-1111-000000000092",
} as const;

// ============================================================================
// COMMITTEE IDS
// ============================================================================

export const PFOS_COMMITTEE_IDS = {
  board: "33333333-3333-3333-3333-000000000001",
  activities: "33333333-3333-3333-3333-000000000002",
  membership: "33333333-3333-3333-3333-000000000003",
  communications: "33333333-3333-3333-3333-000000000004",
  science: "33333333-3333-3333-3333-000000000005",
  finance: "33333333-3333-3333-3333-000000000006",
} as const;

// ============================================================================
// COMMITTEE ROLE IDS
// ============================================================================

export const PFOS_ROLE_IDS = {
  // Board roles
  boardPresident: "44444444-4444-4444-4444-001000000001",
  boardVicePresident: "44444444-4444-4444-4444-001000000002",
  boardSecretary: "44444444-4444-4444-4444-001000000003",
  boardTreasurer: "44444444-4444-4444-4444-001000000004",
  boardParliamentarian: "44444444-4444-4444-4444-001000000005",
  boardPastPresident: "44444444-4444-4444-4444-001000000006",

  // Activities roles
  activitiesChair: "44444444-4444-4444-4444-002000000001",
  activitiesViceChair: "44444444-4444-4444-4444-002000000002",
  activitiesRefreshments: "44444444-4444-4444-4444-002000000003",

  // Membership roles
  membershipChair: "44444444-4444-4444-4444-003000000001",
  membershipOrientation: "44444444-4444-4444-4444-003000000002",
  membershipDatabase: "44444444-4444-4444-4444-003000000003",

  // Communications roles
  communicationsChair: "44444444-4444-4444-4444-004000000001",
  communicationsNewsletter: "44444444-4444-4444-4444-004000000002",
  communicationsWebmaster: "44444444-4444-4444-4444-004000000003",
  communicationsSocialMedia: "44444444-4444-4444-4444-004000000004",

  // Science roles
  scienceChair: "44444444-4444-4444-4444-005000000001",
  scienceTaxonomy: "44444444-4444-4444-4444-005000000002",
  scienceData: "44444444-4444-4444-4444-005000000003",

  // Finance roles
  financeChair: "44444444-4444-4444-4444-006000000001",
  financeFundraising: "44444444-4444-4444-4444-006000000002",
  financeGrants: "44444444-4444-4444-4444-006000000003",
} as const;

// ============================================================================
// EVENT IDS
// ============================================================================

export const PFOS_EVENT_IDS = {
  // Upcoming Published Events
  annualSparrowCount: "55555555-5555-5555-5555-000000000001",
  fogAppreciationMorning: "55555555-5555-5555-5555-000000000002",
  ordinaryBirdWalk: "55555555-5555-5555-5555-000000000003",
  parkingLotEcology: "55555555-5555-5555-5555-000000000004",
  lichenWorkshop: "55555555-5555-5555-5555-000000000005",
  newMemberOrientation: "55555555-5555-5555-5555-000000000006",
  tidalPoolTuesday: "55555555-5555-5555-5555-000000000007",
  cloudClassification: "55555555-5555-5555-5555-000000000008",
  weedAppreciationWalk: "55555555-5555-5555-5555-000000000009",
  boardMeeting: "55555555-5555-5555-5555-000000000010",
  annualPotluck: "55555555-5555-5555-5555-000000000011",

  // Past Events
  winterFogCensus: "55555555-5555-5555-5555-000000000020",
  holidaySparrowSocial: "55555555-5555-5555-5555-000000000021",
  fallMigrationWatch: "55555555-5555-5555-5555-000000000022",
  gullBehaviorReport: "55555555-5555-5555-5555-000000000023",
  greatPigeonCount: "55555555-5555-5555-5555-000000000024",

  // Draft Events (not published)
  summerSolsticeDawn: "55555555-5555-5555-5555-000000000030",
  nocturnalObservation: "55555555-5555-5555-5555-000000000031",
} as const;

// ============================================================================
// TERM IDS
// ============================================================================

export const PFOS_TERM_IDS = {
  current: "66666666-6666-6666-6666-000000000001",
  previous: "66666666-6666-6666-6666-000000000002",
} as const;

// ============================================================================
// MEMBER DETAILS (for test assertions)
// ============================================================================

export const PFOS_MEMBERS = {
  murielKessler: {
    id: PFOS_MEMBER_IDS.murielKessler,
    firstName: "Muriel",
    lastName: "Kessler",
    fullName: "Muriel Kessler",
    email: "muriel.kessler@pfos.example",
    status: "EXTENDED",
    bio: "Founded PFOS in 1987 after noticing nobody was counting the sparrows. Still hasn't missed a count.",
  },
  davidChenRamirez: {
    id: PFOS_MEMBER_IDS.davidChenRamirez,
    firstName: "David",
    lastName: "Chen-Ramirez",
    fullName: "David Chen-Ramirez",
    email: "david.chenramirez@pfos.example",
    status: "EXTENDED",
    bio: "Retired park ranger. Can identify 47 species of gull by their disappointed expressions.",
  },
  priyaOkonkwo: {
    id: PFOS_MEMBER_IDS.priyaOkonkwo,
    firstName: "Priya",
    lastName: "Okonkwo",
    fullName: "Priya Okonkwo",
    email: "priya.okonkwo@pfos.example",
    status: "EXTENDED",
    bio: "Marine biologist turned consultant. Brings scientific rigor to our parking lot seagull studies.",
  },
  tedAlbright: {
    id: PFOS_MEMBER_IDS.tedAlbright,
    firstName: "Theodore",
    lastName: "Albright",
    fullName: "Theodore Albright",
    email: "ted.albright@pfos.example",
    status: "EXTENDED",
    bio: "Former accountant. Counts everything. His spreadsheets have spreadsheets.",
  },
  sandraYee: {
    id: PFOS_MEMBER_IDS.sandraYee,
    firstName: "Sandra",
    lastName: "Yee",
    fullName: "Sandra Yee",
    email: "sandra.yee@pfos.example",
    status: "EXTENDED",
    bio: "Tech worker by day, meticulous minute-taker by calling. Her meeting notes are legendary.",
  },
  stevenSeagal: {
    id: PFOS_MEMBER_IDS.stevenSeagal,
    firstName: "Steven",
    lastName: "Seagal",
    fullName: "Steven Seagal",
    email: "steven.seagal@pfos.example",
    status: "EXTENDED",
    bio: "Yes, that's his real name. No, he's not the actor. Gets asked constantly.",
  },
  aidenNewby: {
    id: PFOS_MEMBER_IDS.aidenNewby,
    firstName: "Aiden",
    lastName: "Newby",
    fullName: "Aiden Newby",
    email: "aiden.newby@pfos.example",
    status: "NEWCOMER",
    bio: "Just moved to Quiet Harbor. Thought this was a hiking club. Staying anyway.",
  },
  // Demo accounts
  adminDemo: {
    id: PFOS_MEMBER_IDS.adminDemo,
    firstName: "Admin",
    lastName: "Demo",
    fullName: "Admin Demo",
    email: "admin@demo.pfos.test",
    status: "EXTENDED",
    bio: "Test account with admin access.",
  },
  memberDemo: {
    id: PFOS_MEMBER_IDS.memberDemo,
    firstName: "Member",
    lastName: "Demo",
    fullName: "Member Demo",
    email: "member@demo.pfos.test",
    status: "EXTENDED",
    bio: "Test account with member access.",
  },
  newDemo: {
    id: PFOS_MEMBER_IDS.newDemo,
    firstName: "New",
    lastName: "Demo",
    fullName: "New Demo",
    email: "new@demo.pfos.test",
    status: "NEWCOMER",
    bio: "Test account for newcomer workflows.",
  },
} as const;

// ============================================================================
// EVENT DETAILS (for test assertions)
// ============================================================================

export const PFOS_EVENTS = {
  annualSparrowCount: {
    id: PFOS_EVENT_IDS.annualSparrowCount,
    title: "Annual House Sparrow Count",
    category: "Census",
    location: "Various locations throughout Quiet Harbor",
    capacity: 60,
    isPublished: true,
    chairId: PFOS_MEMBER_IDS.murielKessler,
    expectedRegistrations: 47,
  },
  fogAppreciationMorning: {
    id: PFOS_EVENT_IDS.fogAppreciationMorning,
    title: "Fog Appreciation Morning",
    category: "Social",
    location: "Harbor Point Overlook",
    capacity: 25,
    isPublished: true,
    chairId: PFOS_MEMBER_IDS.patriciaOvercast,
    expectedRegistrations: 22,
    expectedWaitlist: 3,
  },
  ordinaryBirdWalk: {
    id: PFOS_EVENT_IDS.ordinaryBirdWalk,
    title: "The Completely Ordinary Bird Walk",
    category: "Outing",
    location: "Quiet Harbor Municipal Park",
    capacity: 20,
    isPublished: true,
    chairId: PFOS_MEMBER_IDS.dorothyFinch,
    expectedRegistrations: 18,
  },
  parkingLotEcology: {
    id: PFOS_EVENT_IDS.parkingLotEcology,
    title: "Parking Lot Ecology Tour",
    category: "Outing",
    location: "Safeway Parking Lot, Main Street",
    capacity: 15,
    isPublished: true,
    chairId: PFOS_MEMBER_IDS.stevenSeagal,
    expectedRegistrations: 15,
    expectedWaitlist: 5,
  },
  lichenWorkshop: {
    id: PFOS_EVENT_IDS.lichenWorkshop,
    title: "Lichen Identification Workshop",
    category: "Workshop",
    location: "Community Center, Room B",
    capacity: 12,
    isPublished: true,
    chairId: PFOS_MEMBER_IDS.yukiTanaka,
    expectedRegistrations: 12,
    expectedWaitlist: 8,
  },
  newMemberOrientation: {
    id: PFOS_EVENT_IDS.newMemberOrientation,
    title: "New Member Orientation & Binocular Fitting",
    category: "Orientation",
    location: "Community Center, Main Hall",
    capacity: 20,
    isPublished: true,
    chairId: PFOS_MEMBER_IDS.sandraYee,
    expectedRegistrations: 8,
  },
  boardMeeting: {
    id: PFOS_EVENT_IDS.boardMeeting,
    title: "Q1 Board of Observers Meeting",
    category: "Governance",
    location: "Community Center, Board Room",
    capacity: 15,
    isPublished: true,
    chairId: PFOS_MEMBER_IDS.davidChenRamirez,
    expectedRegistrations: 9,
  },
  annualPotluck: {
    id: PFOS_EVENT_IDS.annualPotluck,
    title: "Annual Potluck & Awards Night",
    category: "Social",
    location: "Quiet Harbor Community Hall",
    capacity: 80,
    isPublished: true,
    chairId: PFOS_MEMBER_IDS.dorothyFinch,
    expectedRegistrations: 52,
  },
  // Draft event for testing unpublished state
  summerSolsticeDawn: {
    id: PFOS_EVENT_IDS.summerSolsticeDawn,
    title: "Summer Solstice Dawn Watch (PLANNING)",
    category: "Outing",
    location: "TBD - somewhere with sunrise views",
    capacity: 30,
    isPublished: false,
    chairId: PFOS_MEMBER_IDS.burtHalverson,
    expectedRegistrations: 0,
  },
} as const;

// ============================================================================
// COMMITTEE DETAILS (for test assertions)
// ============================================================================

export const PFOS_COMMITTEES = {
  board: {
    id: PFOS_COMMITTEE_IDS.board,
    name: "Board of Observers",
    slug: "board",
    description:
      "The governing body. Meets monthly to discuss important matters like the sparrow count methodology.",
  },
  activities: {
    id: PFOS_COMMITTEE_IDS.activities,
    name: "Activities & Expeditions Committee",
    slug: "activities",
    description: "Plans outings, walks, counts, and the occasional potluck. Very busy.",
  },
  membership: {
    id: PFOS_COMMITTEE_IDS.membership,
    name: "Membership & Welcoming Committee",
    slug: "membership",
    description:
      "Greets new fledglings. Explains why we count sparrows. Provides binoculars.",
  },
  communications: {
    id: PFOS_COMMITTEE_IDS.communications,
    name: "Communications & Chronicle Committee",
    slug: "communications",
    description:
      "Publishes 'The Field Observer' newsletter and maintains our modest web presence.",
  },
  science: {
    id: PFOS_COMMITTEE_IDS.science,
    name: "Scientific Standards Committee",
    slug: "science",
    description: "Ensures our counting methodologies are rigorous. Argues about taxonomy.",
  },
  finance: {
    id: PFOS_COMMITTEE_IDS.finance,
    name: "Finance & Fundraising Committee",
    slug: "finance",
    description:
      "Manages the budget. Organizes the annual bake sale. Buys binoculars for lending library.",
  },
} as const;

// ============================================================================
// EXPECTED COUNTS (for aggregate assertions)
// ============================================================================

export const PFOS_COUNTS = {
  // Member counts
  totalMembers: 72,
  extendedMembers: 58,
  newcomerMembers: 10,
  alumniMembers: 1,
  lapsedMembers: 2,
  prospectMembers: 1,

  // Event counts
  totalEvents: 18,
  publishedEvents: 16,
  draftEvents: 2,
  upcomingEvents: 11,
  pastEvents: 5,

  // Committee counts
  committees: 6,
  committeeRoles: 22,

  // Registration counts (approximate - varies by random seed)
  minTotalRegistrations: 350,
  maxTotalRegistrations: 400,
} as const;

// ============================================================================
// MEMBERSHIP STATUS DETAILS
// ============================================================================

export const PFOS_STATUSES = {
  PROSPECT: {
    id: PFOS_STATUS_IDS.PROSPECT,
    code: "PROSPECT",
    label: "Curious Observer",
    description: "Showed interest at a Fog Appreciation Morning",
    isActive: false,
  },
  NEWCOMER: {
    id: PFOS_STATUS_IDS.NEWCOMER,
    code: "NEWCOMER",
    label: "Fledgling",
    description: "New to the flock, still learning to identify common sparrows",
    isActive: true,
  },
  EXTENDED: {
    id: PFOS_STATUS_IDS.EXTENDED,
    code: "EXTENDED",
    label: "Seasoned Observer",
    description: "Has survived at least two Annual Sparrow Counts",
    isActive: true,
  },
  ALUMNI: {
    id: PFOS_STATUS_IDS.ALUMNI,
    code: "ALUMNI",
    label: "Migratory Member",
    description: "Flew south but remains in our hearts",
    isActive: true,
  },
  LAPSED: {
    id: PFOS_STATUS_IDS.LAPSED,
    code: "LAPSED",
    label: "Hibernating",
    description: "Temporarily dormant, like a particularly lazy lichen",
    isActive: false,
  },
} as const;

// ============================================================================
// TEST USER CREDENTIALS
// ============================================================================

export const PFOS_TEST_USERS = {
  admin: {
    email: "admin@demo.pfos.test",
    memberId: PFOS_MEMBER_IDS.adminDemo,
    role: "admin",
  },
  member: {
    email: "member@demo.pfos.test",
    memberId: PFOS_MEMBER_IDS.memberDemo,
    role: "member",
  },
  newcomer: {
    email: "new@demo.pfos.test",
    memberId: PFOS_MEMBER_IDS.newDemo,
    role: "newcomer",
  },
  president: {
    email: "david.chenramirez@pfos.example",
    memberId: PFOS_MEMBER_IDS.davidChenRamirez,
    role: "board_president",
  },
  secretary: {
    email: "sandra.yee@pfos.example",
    memberId: PFOS_MEMBER_IDS.sandraYee,
    role: "board_secretary",
  },
} as const;

// ============================================================================
// CLUB METADATA
// ============================================================================

export const PFOS_METADATA = {
  name: "Pacific Field Observers Society",
  tagline: "Documenting the Unremarkable Since 1987",
  city: "Quiet Harbor, CA",
  foundedYear: 1987,
} as const;
