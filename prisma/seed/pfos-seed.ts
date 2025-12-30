#!/usr/bin/env npx tsx
/**
 * PFOS (Pacific Field Observers Society) - Deterministic Demo Seed
 * "Documenting the Unremarkable Since 1987"
 *
 * Uses fixed UUIDs from pfos-constants.ts for E2E test reproducibility.
 *
 * Usage:
 *   npx tsx prisma/seed/pfos-seed.ts
 *   ALLOW_PROD_SEED=1 npx tsx prisma/seed/pfos-seed.ts  # For staging
 *
 * All data is fictional. No real PII.
 */

import { PrismaClient, RegistrationStatus, EventStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config } from "dotenv";

import {
  PFOS_STATUS_IDS,
  PFOS_MEMBER_IDS,
  PFOS_COMMITTEE_IDS,
  PFOS_ROLE_IDS,
  PFOS_EVENT_IDS,
  PFOS_TERM_IDS,
  PFOS_METADATA,
} from "./pfos-constants";

config();

// ============================================================================
// Prisma Client Setup
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

const prisma = createPrismaClient();

// ============================================================================
// Safety Check
// ============================================================================

function checkEnvironment(): void {
  const dbUrl = process.env.DATABASE_URL || "";
  const isProduction =
    dbUrl.includes("prod.") ||
    (dbUrl.includes(".com") && !dbUrl.includes("neon.tech"));

  if (isProduction && process.env.ALLOW_PROD_SEED !== "1") {
    console.error("ERROR: Production database detected.");
    console.error("Set ALLOW_PROD_SEED=1 to override.");
    process.exit(1);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function yearsAgo(years: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d;
}

// Seeded random for deterministic registrations
let seed = 12345;
function seededRandom(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

function shuffledWithSeed<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ============================================================================
// MEMBERSHIP STATUSES
// ============================================================================

const MEMBERSHIP_STATUSES = [
  {
    id: PFOS_STATUS_IDS.PROSPECT,
    code: "PROSPECT",
    label: "Curious Observer",
    description: "Showed interest at a Fog Appreciation Morning",
    isActive: false,
    isEligibleForRenewal: false,
    isBoardEligible: false,
    sortOrder: 1,
  },
  {
    id: PFOS_STATUS_IDS.NEWCOMER,
    code: "NEWCOMER",
    label: "Fledgling",
    description: "New to the flock, still learning to identify common sparrows",
    isActive: true,
    isEligibleForRenewal: true,
    isBoardEligible: false,
    sortOrder: 2,
  },
  {
    id: PFOS_STATUS_IDS.EXTENDED,
    code: "EXTENDED",
    label: "Seasoned Observer",
    description: "Has survived at least two Annual Sparrow Counts",
    isActive: true,
    isEligibleForRenewal: true,
    isBoardEligible: true,
    sortOrder: 3,
  },
  {
    id: PFOS_STATUS_IDS.ALUMNI,
    code: "ALUMNI",
    label: "Migratory Member",
    description: "Flew south but remains in our hearts",
    isActive: true,
    isEligibleForRenewal: false,
    isBoardEligible: false,
    sortOrder: 4,
  },
  {
    id: PFOS_STATUS_IDS.LAPSED,
    code: "LAPSED",
    label: "Hibernating",
    description: "Temporarily dormant, like a particularly lazy lichen",
    isActive: false,
    isEligibleForRenewal: true,
    isBoardEligible: false,
    sortOrder: 5,
  },
];

// ============================================================================
// MEMBERS - Using deterministic IDs
// ============================================================================

interface MemberData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  joinedYearsAgo: number;
  statusCode: string;
}

const MEMBERS: MemberData[] = [
  // === FOUNDING & LEADERSHIP ===
  {
    id: PFOS_MEMBER_IDS.murielKessler,
    firstName: "Muriel",
    lastName: "Kessler",
    email: "muriel.kessler@pfos.example",
    bio: "Founded PFOS in 1987 after noticing nobody was counting the sparrows. Still hasn't missed a count.",
    joinedYearsAgo: 37,
    statusCode: "EXTENDED",
  },
  {
    id: PFOS_MEMBER_IDS.davidChenRamirez,
    firstName: "David",
    lastName: "Chen-Ramirez",
    email: "david.chenramirez@pfos.example",
    bio: "Retired park ranger. Can identify 47 species of gull by their disappointed expressions.",
    joinedYearsAgo: 12,
    statusCode: "EXTENDED",
  },
  {
    id: PFOS_MEMBER_IDS.priyaOkonkwo,
    firstName: "Priya",
    lastName: "Okonkwo",
    email: "priya.okonkwo@pfos.example",
    bio: "Marine biologist turned consultant. Brings scientific rigor to our parking lot seagull studies.",
    joinedYearsAgo: 8,
    statusCode: "EXTENDED",
  },
  {
    id: PFOS_MEMBER_IDS.tedAlbright,
    firstName: "Theodore",
    lastName: "Albright",
    email: "ted.albright@pfos.example",
    bio: "Former accountant. Counts everything. His spreadsheets have spreadsheets.",
    joinedYearsAgo: 15,
    statusCode: "EXTENDED",
  },
  {
    id: PFOS_MEMBER_IDS.sandraYee,
    firstName: "Sandra",
    lastName: "Yee",
    email: "sandra.yee@pfos.example",
    bio: "Tech worker by day, meticulous minute-taker by calling. Her meeting notes are legendary.",
    joinedYearsAgo: 5,
    statusCode: "EXTENDED",
  },

  // === KEY MEMBERS ===
  {
    id: PFOS_MEMBER_IDS.burtHalverson,
    firstName: "Burt",
    lastName: "Halverson",
    email: "burt.halverson@pfos.example",
    bio: "Claims personal count of 10,847 house sparrows. Keeps receipts.",
    joinedYearsAgo: 22,
    statusCode: "EXTENDED",
  },
  {
    id: PFOS_MEMBER_IDS.dorothyFinch,
    firstName: "Dorothy",
    lastName: "Finch",
    email: "dorothy.finch@pfos.example",
    bio: "Ironically named. Has never seen a finch she couldn't ignore in favor of sparrows.",
    joinedYearsAgo: 18,
    statusCode: "EXTENDED",
  },
  {
    id: PFOS_MEMBER_IDS.geraldWren,
    firstName: "Gerald",
    lastName: "Wren",
    email: "gerald.wren@pfos.example",
    bio: "Professor Emeritus. Studies the migration patterns of birds that don't migrate.",
    joinedYearsAgo: 25,
    statusCode: "EXTENDED",
  },
  {
    id: PFOS_MEMBER_IDS.stevenSeagal,
    firstName: "Steven",
    lastName: "Seagal",
    email: "steven.seagal@pfos.example",
    bio: "Yes, that's his real name. No, he's not the actor. Gets asked constantly.",
    joinedYearsAgo: 5,
    statusCode: "EXTENDED",
  },
  {
    id: PFOS_MEMBER_IDS.marinaBarnacle,
    firstName: "Marina",
    lastName: "Barnacle",
    email: "marina.barnacle@pfos.example",
    bio: "Claims barnacles are underappreciated. She's not wrong.",
    joinedYearsAgo: 8,
    statusCode: "EXTENDED",
  },
  {
    id: PFOS_MEMBER_IDS.yukiTanaka,
    firstName: "Yuki",
    lastName: "Tanaka",
    email: "yuki.tanaka@pfos.example",
    bio: "Competitive lichen identifier. Holds the club record for fastest Xanthoria parietina ID.",
    joinedYearsAgo: 6,
    statusCode: "EXTENDED",
  },
  {
    id: PFOS_MEMBER_IDS.kenjiTanaka,
    firstName: "Kenji",
    lastName: "Tanaka",
    email: "kenji.tanaka@pfos.example",
    bio: "Yuki's twin. Their lichen rivalry is both inspiring and slightly concerning.",
    joinedYearsAgo: 6,
    statusCode: "EXTENDED",
  },
  {
    id: PFOS_MEMBER_IDS.patriciaOvercast,
    firstName: "Patricia",
    lastName: "Overcast",
    email: "patricia.overcast@pfos.example",
    bio: "Insists overcast days are underrated. Has a point.",
    joinedYearsAgo: 7,
    statusCode: "EXTENDED",
  },

  // === ADDITIONAL EXTENDED MEMBERS (auto-generated IDs for bulk) ===
  ...generateBulkMembers(),

  // === NEWCOMERS ===
  {
    id: PFOS_MEMBER_IDS.aidenNewby,
    firstName: "Aiden",
    lastName: "Newby",
    email: "aiden.newby@pfos.example",
    bio: "Just moved to Quiet Harbor. Thought this was a hiking club. Staying anyway.",
    joinedYearsAgo: 0,
    statusCode: "NEWCOMER",
  },
  {
    id: PFOS_MEMBER_IDS.briannaFresh,
    firstName: "Brianna",
    lastName: "Fresh",
    email: "brianna.fresh@pfos.example",
    bio: "Tech worker seeking offline hobbies. Counting sparrows counts.",
    joinedYearsAgo: 1,
    statusCode: "NEWCOMER",
  },
  {
    id: PFOS_MEMBER_IDS.cameronCurious,
    firstName: "Cameron",
    lastName: "Curious",
    email: "cameron.curious@pfos.example",
    bio: "Asks a lot of questions. Muriel loves him.",
    joinedYearsAgo: 0,
    statusCode: "NEWCOMER",
  },

  // === ALUMNI/LAPSED ===
  {
    id: PFOS_MEMBER_IDS.patriciaDeaparted,
    firstName: "Patricia",
    lastName: "Departed",
    email: "patricia.departed@pfos.example",
    bio: "Moved to Arizona. Still counts sparrows. Sends postcards.",
    joinedYearsAgo: 15,
    statusCode: "ALUMNI",
  },
  {
    id: PFOS_MEMBER_IDS.robertaResting,
    firstName: "Roberta",
    lastName: "Resting",
    email: "roberta.resting@pfos.example",
    bio: "Taking a break. Will return when she's seen enough of her grandchildren.",
    joinedYearsAgo: 12,
    statusCode: "LAPSED",
  },

  // === DEMO TEST ACCOUNTS ===
  {
    id: PFOS_MEMBER_IDS.adminDemo,
    firstName: "Admin",
    lastName: "Demo",
    email: "admin@demo.pfos.test",
    bio: "Test account with admin access.",
    joinedYearsAgo: 5,
    statusCode: "EXTENDED",
  },
  {
    id: PFOS_MEMBER_IDS.memberDemo,
    firstName: "Member",
    lastName: "Demo",
    email: "member@demo.pfos.test",
    bio: "Test account with member access.",
    joinedYearsAgo: 2,
    statusCode: "EXTENDED",
  },
  {
    id: PFOS_MEMBER_IDS.newDemo,
    firstName: "New",
    lastName: "Demo",
    email: "new@demo.pfos.test",
    bio: "Test account for newcomer workflows.",
    joinedYearsAgo: 0,
    statusCode: "NEWCOMER",
  },
];

// Generate additional members to reach ~72 total
function generateBulkMembers(): MemberData[] {
  type BulkMemberInput = Omit<MemberData, "id" | "email">;
  const additionalMembers: BulkMemberInput[] = [
    { firstName: "Margaret", lastName: "Stonehouse", bio: "Patience is a virtue. Margaret has been watching the same lichen for 9 years.", joinedYearsAgo: 14, statusCode: "EXTENDED" },
    { firstName: "Harriet", lastName: "Moss", bio: "Not to be confused with actual moss, though the resemblance on foggy mornings is noted.", joinedYearsAgo: 11, statusCode: "EXTENDED" },
    { firstName: "Cumulus", lastName: "Jones", bio: "Legal name. Parents were meteorologists. Feels destined for greatness.", joinedYearsAgo: 4, statusCode: "EXTENDED" },
    { firstName: "Raymond", lastName: "Stratus", bio: "No relation to the cloud type. Disappointed daily.", joinedYearsAgo: 3, statusCode: "EXTENDED" },
    { firstName: "Wendy", lastName: "Gale", bio: "Wind specialist. Her hair is always doing something interesting.", joinedYearsAgo: 9, statusCode: "EXTENDED" },
    { firstName: "Francesca", lastName: "Pelletier", bio: "French-Canadian gull enthusiast. Brings croissants to parking lot observations.", joinedYearsAgo: 4, statusCode: "EXTENDED" },
    { firstName: "Martin", lastName: "Chips", bio: "Studies what gulls eat. The answer is always 'everything, especially chips.'", joinedYearsAgo: 6, statusCode: "EXTENDED" },
    { firstName: "Oscar", lastName: "Kelp", bio: "Retired submarine chef. Now observes seaweed with professional interest.", joinedYearsAgo: 10, statusCode: "EXTENDED" },
    { firstName: "Coral", lastName: "Reef-Johannsen", bio: "Marine names are coincidental. Her parents were hippies.", joinedYearsAgo: 3, statusCode: "NEWCOMER" },
    { firstName: "Shelley", lastName: "Conch", bio: "Collects shells. Gets it. Knows what you're thinking.", joinedYearsAgo: 5, statusCode: "EXTENDED" },
    { firstName: "Daniel", lastName: "Lyon", bio: "Goes by 'Dandelion Dan.' Won't explain why. Brings wine to weed walks.", joinedYearsAgo: 7, statusCode: "EXTENDED" },
    { firstName: "Ivy", lastName: "Greenleaf", bio: "Advocates for invasive species rights. Controversial at potlucks.", joinedYearsAgo: 4, statusCode: "EXTENDED" },
    { firstName: "Russell", lastName: "Thistle", bio: "Scottish heritage. Defensive about thistles. Don't start.", joinedYearsAgo: 6, statusCode: "EXTENDED" },
    { firstName: "Sage", lastName: "Meadows", bio: "Herbalist vibes. Actually an accountant. Contains multitudes.", joinedYearsAgo: 2, statusCode: "NEWCOMER" },
    { firstName: "Barbara", lastName: "Benchley", bio: "Knows every bench in Quiet Harbor by comfort rating. Essential field knowledge.", joinedYearsAgo: 13, statusCode: "EXTENDED" },
    { firstName: "Walter", lastName: "Binoculars", bio: "Changed his name legally. Says it simplified introductions.", joinedYearsAgo: 20, statusCode: "EXTENDED" },
    { firstName: "Constance", lastName: "Patience", bio: "Perfect name for a field observer. Lives up to it.", joinedYearsAgo: 16, statusCode: "EXTENDED" },
    { firstName: "Edwin", lastName: "Dull", bio: "Embraces his surname. 'Dull is the new interesting,' he says, often.", joinedYearsAgo: 11, statusCode: "EXTENDED" },
    { firstName: "Florence", lastName: "Fog", bio: "Moved here for the weather. Not ironically.", joinedYearsAgo: 8, statusCode: "EXTENDED" },
    { firstName: "Gregory", lastName: "Grayman", bio: "Specializes in overcast photography. His Instagram is very consistent.", joinedYearsAgo: 5, statusCode: "EXTENDED" },
    { firstName: "Helen", lastName: "Hush", bio: "Advocates for silent observation. Leads by example.", joinedYearsAgo: 9, statusCode: "EXTENDED" },
    { firstName: "Irving", lastName: "Idle", bio: "Retired early. Observes things. Living the dream.", joinedYearsAgo: 12, statusCode: "EXTENDED" },
    { firstName: "Janet", lastName: "Journal", bio: "Maintains field journals since 1994. Leather-bound. Alphabetized.", joinedYearsAgo: 30, statusCode: "EXTENDED" },
    { firstName: "Kenneth", lastName: "Keen", bio: "Very observant. Notices things others miss. Like that typo on the website.", joinedYearsAgo: 7, statusCode: "EXTENDED" },
    { firstName: "Fiona", lastName: "Fieldnotes", bio: "Journalist. Takes the best notes. Writes the newsletter.", joinedYearsAgo: 6, statusCode: "EXTENDED" },
    { firstName: "Gordon", lastName: "Granite", bio: "Geology enthusiast among birders. We let him talk about rocks sometimes.", joinedYearsAgo: 8, statusCode: "EXTENDED" },
    { firstName: "Hazel", lastName: "Hedgerow", bio: "Expert on hedge habitats. Can identify 12 types of suburban shrubbery.", joinedYearsAgo: 14, statusCode: "EXTENDED" },
    { firstName: "Isaac", lastName: "Insight", bio: "Philosophy professor. Asks whether the sparrow knows it's being counted.", joinedYearsAgo: 4, statusCode: "EXTENDED" },
    { firstName: "Julia", lastName: "Jumprope", bio: "Elementary school teacher. Brings kids on educational walks. They love gulls.", joinedYearsAgo: 3, statusCode: "EXTENDED" },
    { firstName: "Karl", lastName: "Clipboard", bio: "Always has a clipboard. Always. Nobody knows what's on it.", joinedYearsAgo: 10, statusCode: "EXTENDED" },
    { firstName: "Lillian", lastName: "Lens", bio: "Photographer. Her macro shots of lichen belong in galleries.", joinedYearsAgo: 7, statusCode: "EXTENDED" },
    { firstName: "Morris", lastName: "Mundane", bio: "Embraces the ordinary. His business card says 'Professional Unremarkable.'", joinedYearsAgo: 9, statusCode: "EXTENDED" },
    { firstName: "Nancy", lastName: "Notebook", bio: "Stationery enthusiast. Has strong opinions about field journal bindings.", joinedYearsAgo: 5, statusCode: "EXTENDED" },
    { firstName: "Oliver", lastName: "Obvious", bio: "States the obvious. 'That's a bird,' he'll note, helpfully.", joinedYearsAgo: 11, statusCode: "EXTENDED" },
    { firstName: "Xavier", lastName: "Xerox", bio: "Makes copies of everything. Archives enthusiast. Essential.", joinedYearsAgo: 17, statusCode: "EXTENDED" },
    { firstName: "Yvonne", lastName: "Yesterday", bio: "Historian. Documents what we observed yesterday. And the day before.", joinedYearsAgo: 19, statusCode: "EXTENDED" },
    { firstName: "Zachary", lastName: "Zoom", bio: "Runs the virtual meetings. 'You're on mute' is his catchphrase.", joinedYearsAgo: 4, statusCode: "EXTENDED" },
    { firstName: "Barista", lastName: "Brewster", bio: "Runs the coffee station at Fog Appreciation Mornings. Hero.", joinedYearsAgo: 5, statusCode: "EXTENDED" },
    { firstName: "Earl", lastName: "Grey", bio: "Tea person surrounded by coffee drinkers. Maintains dignity.", joinedYearsAgo: 8, statusCode: "EXTENDED" },
    { firstName: "Madison", lastName: "Millennial", bio: "Joined ironically. Stayed sincerely. Documents on TikTok.", joinedYearsAgo: 2, statusCode: "NEWCOMER" },
    { firstName: "Jayden", lastName: "Zoomer", bio: "Gen Z. Thinks this is 'cottagecore adjacent.' We don't argue.", joinedYearsAgo: 1, statusCode: "NEWCOMER" },
    { firstName: "Puddle", lastName: "Patterson", bio: "Studies puddle ecosystems. More interesting than it sounds.", joinedYearsAgo: 6, statusCode: "EXTENDED" },
    { firstName: "Edith", lastName: "Edge", bio: "Specialist in edge habitats. Where the lawn meets the wild.", joinedYearsAgo: 10, statusCode: "EXTENDED" },
    { firstName: "Norm", lastName: "Normal", bio: "Completely normal. Suspiciously so. What's he hiding?", joinedYearsAgo: 7, statusCode: "EXTENDED" },
    { firstName: "Diana", lastName: "Dewdrop", bio: "Morning person. Documents dew. Surprisingly competitive about it.", joinedYearsAgo: 1, statusCode: "NEWCOMER" },
    { firstName: "Ethan", lastName: "Eager", bio: "Bought binoculars before attending first meeting. We respect the commitment.", joinedYearsAgo: 0, statusCode: "NEWCOMER" },
    { firstName: "Quentin", lastName: "Quit", bio: "Left for a hiking club. Came back. 'They walk too fast,' he said.", joinedYearsAgo: 8, statusCode: "EXTENDED" },
    { firstName: "Stanley", lastName: "Snooze", bio: "Hasn't renewed. Might be literally hibernating. Someone should check.", joinedYearsAgo: 6, statusCode: "LAPSED" },
    { firstName: "Uma", lastName: "Uncertain", bio: "Not sure if this is her thing. Keeps coming back though.", joinedYearsAgo: 0, statusCode: "NEWCOMER" },
    { firstName: "Victor", lastName: "Viewer", bio: "Just likes watching things. Found his people.", joinedYearsAgo: 1, statusCode: "NEWCOMER" },
    { firstName: "Wanda", lastName: "Walker", bio: "Power walker who slowed down. Discovered she was missing everything.", joinedYearsAgo: 1, statusCode: "NEWCOMER" },
  ];

  // Generate stable IDs based on email (for bulk members without predefined IDs)
  return additionalMembers.map((m, i) => {
    const email = `${m.firstName.toLowerCase()}.${m.lastName.toLowerCase()}@pfos.example`;
    // Use index-based deterministic ID for bulk members
    const id = `11111111-1111-1111-1111-${String(100 + i).padStart(12, "0")}`;
    return { ...m, id, email };
  });
}

// ============================================================================
// COMMITTEES
// ============================================================================

interface CommitteeData {
  id: string;
  name: string;
  slug: string;
  description: string;
  roles: {
    id: string;
    name: string;
    slug: string;
    description: string;
  }[];
}

const COMMITTEES: CommitteeData[] = [
  {
    id: PFOS_COMMITTEE_IDS.board,
    name: "Board of Observers",
    slug: "board",
    description:
      "The governing body. Meets monthly to discuss important matters like the sparrow count methodology.",
    roles: [
      { id: PFOS_ROLE_IDS.boardPresident, name: "Chief Observer", slug: "president", description: "Presides over meetings. Breaks ties on whether that was a house sparrow or a song sparrow." },
      { id: PFOS_ROLE_IDS.boardVicePresident, name: "Deputy Observer", slug: "vice-president", description: "Fills in when the Chief Observer is observing elsewhere." },
      { id: PFOS_ROLE_IDS.boardSecretary, name: "Keeper of Records", slug: "secretary", description: "Documents everything. And we mean everything. Even the pauses." },
      { id: PFOS_ROLE_IDS.boardTreasurer, name: "Counter of Coins", slug: "treasurer", description: "Manages the $3,847.52 treasury with the gravity it deserves." },
      { id: PFOS_ROLE_IDS.boardParliamentarian, name: "Arbiter of Procedure", slug: "parliamentarian", description: "Ensures Robert's Rules are followed. Even when counting pigeons." },
      { id: PFOS_ROLE_IDS.boardPastPresident, name: "Emeritus Observer", slug: "past-president", description: "Provides wisdom. Shares stories. Occasionally naps." },
    ],
  },
  {
    id: PFOS_COMMITTEE_IDS.activities,
    name: "Activities & Expeditions Committee",
    slug: "activities",
    description: "Plans outings, walks, counts, and the occasional potluck. Very busy.",
    roles: [
      { id: PFOS_ROLE_IDS.activitiesChair, name: "Expedition Leader", slug: "chair", description: "Coordinates all activities. Knows every trail within 50 miles." },
      { id: PFOS_ROLE_IDS.activitiesViceChair, name: "Deputy Expedition Leader", slug: "vice-chair", description: "Leads when the leader is leading elsewhere." },
      { id: PFOS_ROLE_IDS.activitiesRefreshments, name: "Refreshments Coordinator", slug: "refreshments", description: "Ensures coffee at morning events, wine at evening ones. Critical role." },
    ],
  },
  {
    id: PFOS_COMMITTEE_IDS.membership,
    name: "Membership & Welcoming Committee",
    slug: "membership",
    description: "Greets new fledglings. Explains why we count sparrows. Provides binoculars.",
    roles: [
      { id: PFOS_ROLE_IDS.membershipChair, name: "Chief Welcomer", slug: "chair", description: "Makes newcomers feel at home. Expert in reassuring confused guests." },
      { id: PFOS_ROLE_IDS.membershipOrientation, name: "Orientation Guide", slug: "orientation", description: "Leads 'So You Want to Count Sparrows' sessions for new members." },
      { id: PFOS_ROLE_IDS.membershipDatabase, name: "Roster Keeper", slug: "database", description: "Maintains the member database. Knows everyone's preferred tea." },
    ],
  },
  {
    id: PFOS_COMMITTEE_IDS.communications,
    name: "Communications & Chronicle Committee",
    slug: "communications",
    description: "Publishes 'The Field Observer' newsletter and maintains our modest web presence.",
    roles: [
      { id: PFOS_ROLE_IDS.communicationsChair, name: "Chief Chronicler", slug: "chair", description: "Oversees all communications. Crafts the monthly report." },
      { id: PFOS_ROLE_IDS.communicationsNewsletter, name: "Newsletter Editor", slug: "newsletter", description: "Edits 'The Field Observer.' Rejects articles about rare birds." },
      { id: PFOS_ROLE_IDS.communicationsWebmaster, name: "Web Tender", slug: "webmaster", description: "Maintains the website. Updated it in 2019 and again last month." },
      { id: PFOS_ROLE_IDS.communicationsSocialMedia, name: "Social Media Observer", slug: "social-media", description: "Posts photos of common birds. Engagement is modest but sincere." },
    ],
  },
  {
    id: PFOS_COMMITTEE_IDS.science,
    name: "Scientific Standards Committee",
    slug: "science",
    description: "Ensures our counting methodologies are rigorous. Argues about taxonomy.",
    roles: [
      { id: PFOS_ROLE_IDS.scienceChair, name: "Chief Scientist", slug: "chair", description: "Former biology professor. Takes sparrow subspecies very seriously." },
      { id: PFOS_ROLE_IDS.scienceTaxonomy, name: "Taxonomy Arbiter", slug: "taxonomy", description: "Settles 'is that a subspecies' debates. Often grumpy." },
      { id: PFOS_ROLE_IDS.scienceData, name: "Data Integrity Officer", slug: "data", description: "Validates count submissions. Rejects obvious exaggerations." },
    ],
  },
  {
    id: PFOS_COMMITTEE_IDS.finance,
    name: "Finance & Fundraising Committee",
    slug: "finance",
    description: "Manages the budget. Organizes the annual bake sale. Buys binoculars for lending library.",
    roles: [
      { id: PFOS_ROLE_IDS.financeChair, name: "Finance Chair", slug: "chair", description: "Presents quarterly reports. They're always 'on track.'" },
      { id: PFOS_ROLE_IDS.financeFundraising, name: "Fundraising Coordinator", slug: "fundraising", description: "Organizes the bake sale. Dorothy's scones are the top seller." },
      { id: PFOS_ROLE_IDS.financeGrants, name: "Grants Researcher", slug: "grants", description: "Looks for grants supporting observation of common species. Surprisingly, there are some." },
    ],
  },
];

// ============================================================================
// EVENTS - Using deterministic IDs
// ============================================================================

interface EventData {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  daysFromNow: number;
  durationHours: number;
  capacity: number;
  isPublished: boolean;
  chairEmail?: string;
  registrationCount?: number;
  waitlistCount?: number;
}

const EVENTS: EventData[] = [
  // === UPCOMING PUBLISHED EVENTS ===
  {
    id: PFOS_EVENT_IDS.annualSparrowCount,
    title: "Annual House Sparrow Count",
    description: "Our flagship event! Join us for the 37th annual census of Quiet Harbor's house sparrow population. Muriel will lead the downtown sector. Coffee provided. Rain or shine—sparrows don't cancel for weather.",
    category: "Census",
    location: "Various locations throughout Quiet Harbor",
    daysFromNow: 14,
    durationHours: 4,
    capacity: 60,
    isPublished: true,
    chairEmail: "muriel.kessler@pfos.example",
    registrationCount: 47,
  },
  {
    id: PFOS_EVENT_IDS.fogAppreciationMorning,
    title: "Fog Appreciation Morning",
    description: "Monthly gathering to observe and categorize fog types. Barista Brewster provides coffee. Patricia Overcast leads the classification discussion. Visibility optional.",
    category: "Social",
    location: "Harbor Point Overlook",
    daysFromNow: 7,
    durationHours: 2,
    capacity: 25,
    isPublished: true,
    chairEmail: "patricia.overcast@pfos.example",
    registrationCount: 22,
    waitlistCount: 3,
  },
  {
    id: PFOS_EVENT_IDS.ordinaryBirdWalk,
    title: "The Completely Ordinary Bird Walk",
    description: "A gentle stroll to observe common birds. No rare species allowed. If you spot something unusual, please keep it to yourself.",
    category: "Outing",
    location: "Quiet Harbor Municipal Park",
    daysFromNow: 3,
    durationHours: 2,
    capacity: 20,
    isPublished: true,
    chairEmail: "dorothy.finch@pfos.example",
    registrationCount: 18,
  },
  {
    id: PFOS_EVENT_IDS.parkingLotEcology,
    title: "Parking Lot Ecology Tour",
    description: "Explore the surprisingly rich ecosystem of the Safeway parking lot. Steven Seagal leads. Bring notepad. Don't feed the gulls.",
    category: "Outing",
    location: "Safeway Parking Lot, Main Street",
    daysFromNow: 10,
    durationHours: 1.5,
    capacity: 15,
    isPublished: true,
    chairEmail: "steven.seagal@pfos.example",
    registrationCount: 15,
    waitlistCount: 5,
  },
  {
    id: PFOS_EVENT_IDS.lichenWorkshop,
    title: "Lichen Identification Workshop",
    description: "The Tanaka twins host an intensive session on Pacific Coast lichen species. Magnifying glasses provided. Patience required.",
    category: "Workshop",
    location: "Community Center, Room B",
    daysFromNow: 21,
    durationHours: 3,
    capacity: 12,
    isPublished: true,
    chairEmail: "yuki.tanaka@pfos.example",
    registrationCount: 12,
    waitlistCount: 8,
  },
  {
    id: PFOS_EVENT_IDS.newMemberOrientation,
    title: "New Member Orientation & Binocular Fitting",
    description: "Welcome new fledglings! Learn our history, methods, and philosophy. Get fitted for loaner binoculars. Light refreshments served.",
    category: "Orientation",
    location: "Community Center, Main Hall",
    daysFromNow: 5,
    durationHours: 2,
    capacity: 20,
    isPublished: true,
    chairEmail: "sandra.yee@pfos.example",
    registrationCount: 8,
  },
  {
    id: PFOS_EVENT_IDS.tidalPoolTuesday,
    title: "Tidal Pool Tuesday",
    description: "Monthly low-tide observation session. Marina Barnacle leads. Rubber boots recommended. Barnacle enthusiasm expected.",
    category: "Outing",
    location: "Pelican Cove",
    daysFromNow: 12,
    durationHours: 2,
    capacity: 18,
    isPublished: true,
    chairEmail: "marina.barnacle@pfos.example",
    registrationCount: 14,
  },
  {
    id: PFOS_EVENT_IDS.cloudClassification,
    title: "Cloud Classification Circle",
    description: "Monthly meeting to review the month's cloud observations and update our cumulative sky database. Heated debates about cirrus vs. cirrostratus expected.",
    category: "Meeting",
    location: "Community Center, Room A",
    daysFromNow: 18,
    durationHours: 2,
    capacity: 30,
    isPublished: true,
    chairEmail: "patricia.overcast@pfos.example",
    registrationCount: 16,
  },
  {
    id: PFOS_EVENT_IDS.weedAppreciationWalk,
    title: "Weed Appreciation Walk",
    description: "Celebrate the resilience of invasive species on our quarterly sidewalk botany tour. Dandelion Dan brings wine. Ivy Greenleaf brings controversy.",
    category: "Outing",
    location: "Downtown Quiet Harbor",
    daysFromNow: 25,
    durationHours: 2,
    capacity: 20,
    isPublished: true,
    chairEmail: "daniel.lyon@pfos.example",
    registrationCount: 12,
  },
  {
    id: PFOS_EVENT_IDS.boardMeeting,
    title: "Q1 Board of Observers Meeting",
    description: "Regular board meeting. Agenda: Sparrow count methodology review, budget update, discussion of whether squirrels fall under our mandate (they don't).",
    category: "Governance",
    location: "Community Center, Board Room",
    daysFromNow: 8,
    durationHours: 2,
    capacity: 15,
    isPublished: true,
    chairEmail: "david.chenramirez@pfos.example",
    registrationCount: 9,
  },
  {
    id: PFOS_EVENT_IDS.annualPotluck,
    title: "Annual Potluck & Awards Night",
    description: "Celebrate the year's achievements! Awards include: Most Sparrows Counted, Best Field Notes, Most Patient Observer, and the coveted 'Muriel Award' for lifetime contribution to the unremarkable.",
    category: "Social",
    location: "Quiet Harbor Community Hall",
    daysFromNow: 45,
    durationHours: 4,
    capacity: 80,
    isPublished: true,
    chairEmail: "dorothy.finch@pfos.example",
    registrationCount: 52,
  },

  // === PAST EVENTS ===
  {
    id: PFOS_EVENT_IDS.winterFogCensus,
    title: "Winter Fog Census",
    description: "Documented fog occurrences throughout winter. Results: 47 foggy mornings, 12 'merely misty.'",
    category: "Census",
    location: "Various locations",
    daysFromNow: -30,
    durationHours: 3,
    capacity: 25,
    isPublished: true,
    registrationCount: 19,
  },
  {
    id: PFOS_EVENT_IDS.holidaySparrowSocial,
    title: "Holiday Sparrow Social",
    description: "End-of-year gathering with mulled cider and sparrow-shaped cookies courtesy of Dorothy Finch.",
    category: "Social",
    location: "Muriel's Garden",
    daysFromNow: -45,
    durationHours: 3,
    capacity: 40,
    isPublished: true,
    registrationCount: 38,
    waitlistCount: 2,
  },
  {
    id: PFOS_EVENT_IDS.fallMigrationWatch,
    title: "Fall Migration Watch (Common Species Only)",
    description: "Observed birds leaving for the winter. Focused exclusively on species that come back.",
    category: "Outing",
    location: "Harbor Point",
    daysFromNow: -90,
    durationHours: 4,
    capacity: 30,
    isPublished: true,
    registrationCount: 24,
  },
  {
    id: PFOS_EVENT_IDS.gullBehaviorReport,
    title: "Gull Behavior Unit: Summer Report",
    description: "Steven Seagal presented findings on parking lot gull behavior. Key insight: they still eat everything.",
    category: "Meeting",
    location: "Community Center",
    daysFromNow: -60,
    durationHours: 2,
    capacity: 25,
    isPublished: true,
    registrationCount: 18,
  },
  {
    id: PFOS_EVENT_IDS.greatPigeonCount,
    title: "The Great Pigeon Count of 2024",
    description: "Special census requested by Burt Halverson. Final count: 847. Burt's personal count: 'about the same.'",
    category: "Census",
    location: "Downtown Quiet Harbor",
    daysFromNow: -120,
    durationHours: 3,
    capacity: 35,
    isPublished: true,
    registrationCount: 29,
  },

  // === DRAFT EVENTS ===
  {
    id: PFOS_EVENT_IDS.summerSolsticeDawn,
    title: "Summer Solstice Dawn Watch (PLANNING)",
    description: "Early morning observation of the longest day. Still determining if 4:30 AM is too early. Survey pending.",
    category: "Outing",
    location: "TBD - somewhere with sunrise views",
    daysFromNow: 60,
    durationHours: 3,
    capacity: 30,
    isPublished: false,
    chairEmail: "burt.halverson@pfos.example",
  },
  {
    id: PFOS_EVENT_IDS.nocturnalObservation,
    title: "Nocturnal Observation Experiment",
    description: "Can we observe common species at night? Probably not. But Norm Normal wants to try.",
    category: "Experimental",
    location: "Municipal Park (if permits approved)",
    daysFromNow: 40,
    durationHours: 2,
    capacity: 15,
    isPublished: false,
  },
];

// ============================================================================
// SEEDING FUNCTIONS
// ============================================================================

async function clearData(): Promise<void> {
  console.log("🧹 Clearing existing data...");

  // Delete in reverse dependency order
  await prisma.eventRegistration.deleteMany();
  await prisma.eventPostmortem.deleteMany();
  await prisma.eventNote.deleteMany();
  await prisma.ticketTier.deleteMany();
  await prisma.event.deleteMany();
  await prisma.roleAssignment.deleteMany();
  await prisma.term.deleteMany();
  await prisma.committeeRole.deleteMany();
  await prisma.committee.deleteMany();
  await prisma.session.deleteMany();
  await prisma.passkeyCredential.deleteMany();
  await prisma.userAccount.deleteMany();
  await prisma.member.deleteMany();
  await prisma.membershipStatus.deleteMany();

  console.log("   Done.\n");
}

async function seedMembershipStatuses(): Promise<void> {
  console.log("📋 Seeding membership statuses...");

  for (const status of MEMBERSHIP_STATUSES) {
    await prisma.membershipStatus.upsert({
      where: { id: status.id },
      update: {
        code: status.code,
        label: status.label,
        description: status.description,
        isActive: status.isActive,
        isEligibleForRenewal: status.isEligibleForRenewal,
        isBoardEligible: status.isBoardEligible,
        sortOrder: status.sortOrder,
      },
      create: status,
    });
  }

  console.log(`   Created ${MEMBERSHIP_STATUSES.length} statuses\n`);
}

async function seedMembers(): Promise<Map<string, string>> {
  console.log("👥 Seeding members...");

  const memberMap = new Map<string, string>();
  const demoPasswordHash =
    "$2b$10$demohashdemohashdemohashdemohashdemohashdemoha";

  for (const m of MEMBERS) {
    const statusId =
      m.statusCode === "PROSPECT"
        ? PFOS_STATUS_IDS.PROSPECT
        : m.statusCode === "NEWCOMER"
        ? PFOS_STATUS_IDS.NEWCOMER
        : m.statusCode === "EXTENDED"
        ? PFOS_STATUS_IDS.EXTENDED
        : m.statusCode === "ALUMNI"
        ? PFOS_STATUS_IDS.ALUMNI
        : PFOS_STATUS_IDS.LAPSED;

    const joinedAt = yearsAgo(m.joinedYearsAgo);

    await prisma.member.upsert({
      where: { id: m.id },
      update: {
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        phone: m.phone,
        membershipStatusId: statusId,
      },
      create: {
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        phone: m.phone,
        membershipStatusId: statusId,
        joinedAt,
      },
    });

    memberMap.set(m.email, m.id);

    // Create user account for active members
    if (m.statusCode !== "LAPSED" && m.statusCode !== "PROSPECT") {
      await prisma.userAccount.upsert({
        where: { email: m.email },
        update: {
          memberId: m.id,
          passwordHash: demoPasswordHash,
          isActive: true,
        },
        create: {
          memberId: m.id,
          email: m.email,
          passwordHash: demoPasswordHash,
          isActive: true,
        },
      });
    }
  }

  console.log(`   Created ${MEMBERS.length} members with accounts\n`);
  return memberMap;
}

async function seedCommittees(): Promise<void> {
  console.log("🏛️  Seeding committees...");

  let roleCount = 0;

  for (const c of COMMITTEES) {
    await prisma.committee.upsert({
      where: { id: c.id },
      update: { name: c.name, slug: c.slug, description: c.description },
      create: { id: c.id, name: c.name, slug: c.slug, description: c.description },
    });

    // Create roles
    for (let i = 0; i < c.roles.length; i++) {
      const role = c.roles[i];
      await prisma.committeeRole.upsert({
        where: { id: role.id },
        update: {
          committeeId: c.id,
          name: role.name,
          slug: role.slug,
          description: role.description,
          sortOrder: i + 1,
        },
        create: {
          id: role.id,
          committeeId: c.id,
          name: role.name,
          slug: role.slug,
          description: role.description,
          sortOrder: i + 1,
        },
      });
      roleCount++;
    }
  }

  console.log(`   Created ${COMMITTEES.length} committees with ${roleCount} roles\n`);
}

async function seedTerms(): Promise<void> {
  console.log("📅 Seeding terms...");

  const currentYear = new Date().getFullYear();

  // Current term
  await prisma.term.upsert({
    where: { id: PFOS_TERM_IDS.current },
    update: {
      name: `${currentYear} Term`,
      startDate: new Date(`${currentYear}-01-01`),
      endDate: new Date(`${currentYear}-12-31`),
      isCurrent: true,
    },
    create: {
      id: PFOS_TERM_IDS.current,
      name: `${currentYear} Term`,
      startDate: new Date(`${currentYear}-01-01`),
      endDate: new Date(`${currentYear}-12-31`),
      isCurrent: true,
    },
  });

  // Previous term
  await prisma.term.upsert({
    where: { id: PFOS_TERM_IDS.previous },
    update: {
      name: `${currentYear - 1} Term`,
      startDate: new Date(`${currentYear - 1}-01-01`),
      endDate: new Date(`${currentYear - 1}-12-31`),
      isCurrent: false,
    },
    create: {
      id: PFOS_TERM_IDS.previous,
      name: `${currentYear - 1} Term`,
      startDate: new Date(`${currentYear - 1}-01-01`),
      endDate: new Date(`${currentYear - 1}-12-31`),
      isCurrent: false,
    },
  });

  console.log(`   Created 2 terms\n`);
}

async function seedRoleAssignments(memberMap: Map<string, string>): Promise<void> {
  console.log("🎭 Seeding role assignments...");

  const assignments = [
    // Board
    { email: "david.chenramirez@pfos.example", committeeId: PFOS_COMMITTEE_IDS.board, roleId: PFOS_ROLE_IDS.boardPresident },
    { email: "priya.okonkwo@pfos.example", committeeId: PFOS_COMMITTEE_IDS.board, roleId: PFOS_ROLE_IDS.boardVicePresident },
    { email: "sandra.yee@pfos.example", committeeId: PFOS_COMMITTEE_IDS.board, roleId: PFOS_ROLE_IDS.boardSecretary },
    { email: "ted.albright@pfos.example", committeeId: PFOS_COMMITTEE_IDS.board, roleId: PFOS_ROLE_IDS.boardTreasurer },
    { email: "gerald.wren@pfos.example", committeeId: PFOS_COMMITTEE_IDS.board, roleId: PFOS_ROLE_IDS.boardParliamentarian },
    { email: "muriel.kessler@pfos.example", committeeId: PFOS_COMMITTEE_IDS.board, roleId: PFOS_ROLE_IDS.boardPastPresident },

    // Activities
    { email: "dorothy.finch@pfos.example", committeeId: PFOS_COMMITTEE_IDS.activities, roleId: PFOS_ROLE_IDS.activitiesChair },
    { email: "burt.halverson@pfos.example", committeeId: PFOS_COMMITTEE_IDS.activities, roleId: PFOS_ROLE_IDS.activitiesViceChair },
    { email: "barista.brewster@pfos.example", committeeId: PFOS_COMMITTEE_IDS.activities, roleId: PFOS_ROLE_IDS.activitiesRefreshments },

    // Membership
    { email: "constance.patience@pfos.example", committeeId: PFOS_COMMITTEE_IDS.membership, roleId: PFOS_ROLE_IDS.membershipChair },
    { email: "julia.jumprope@pfos.example", committeeId: PFOS_COMMITTEE_IDS.membership, roleId: PFOS_ROLE_IDS.membershipOrientation },
    { email: "karl.clipboard@pfos.example", committeeId: PFOS_COMMITTEE_IDS.membership, roleId: PFOS_ROLE_IDS.membershipDatabase },

    // Communications
    { email: "fiona.fieldnotes@pfos.example", committeeId: PFOS_COMMITTEE_IDS.communications, roleId: PFOS_ROLE_IDS.communicationsChair },
    { email: "janet.journal@pfos.example", committeeId: PFOS_COMMITTEE_IDS.communications, roleId: PFOS_ROLE_IDS.communicationsNewsletter },
    { email: "zachary.zoom@pfos.example", committeeId: PFOS_COMMITTEE_IDS.communications, roleId: PFOS_ROLE_IDS.communicationsWebmaster },
    { email: "madison.millennial@pfos.example", committeeId: PFOS_COMMITTEE_IDS.communications, roleId: PFOS_ROLE_IDS.communicationsSocialMedia },

    // Science
    { email: "gerald.wren@pfos.example", committeeId: PFOS_COMMITTEE_IDS.science, roleId: PFOS_ROLE_IDS.scienceChair },
    { email: "yuki.tanaka@pfos.example", committeeId: PFOS_COMMITTEE_IDS.science, roleId: PFOS_ROLE_IDS.scienceTaxonomy },
    { email: "kenneth.keen@pfos.example", committeeId: PFOS_COMMITTEE_IDS.science, roleId: PFOS_ROLE_IDS.scienceData },

    // Finance
    { email: "ted.albright@pfos.example", committeeId: PFOS_COMMITTEE_IDS.finance, roleId: PFOS_ROLE_IDS.financeChair },
    { email: "dorothy.finch@pfos.example", committeeId: PFOS_COMMITTEE_IDS.finance, roleId: PFOS_ROLE_IDS.financeFundraising },
    { email: "sage.meadows@pfos.example", committeeId: PFOS_COMMITTEE_IDS.finance, roleId: PFOS_ROLE_IDS.financeGrants },
  ];

  let count = 0;
  for (const a of assignments) {
    const memberId = memberMap.get(a.email);
    if (!memberId) continue;

    await prisma.roleAssignment.create({
      data: {
        memberId,
        committeeId: a.committeeId,
        committeeRoleId: a.roleId,
        termId: PFOS_TERM_IDS.current,
        startDate: new Date(`${new Date().getFullYear()}-01-01`),
        endDate: new Date(`${new Date().getFullYear()}-12-31`),
      },
    });
    count++;
  }

  console.log(`   Created ${count} role assignments\n`);
}

async function seedEvents(memberMap: Map<string, string>): Promise<void> {
  console.log("📆 Seeding events...");

  for (const e of EVENTS) {
    const startTime = daysFromNow(e.daysFromNow);
    startTime.setHours(10, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + e.durationHours);

    const chairId = e.chairEmail ? memberMap.get(e.chairEmail) : null;

    await prisma.event.upsert({
      where: { id: e.id },
      update: {
        title: e.title,
        description: e.description,
        category: e.category,
        location: e.location,
        startTime,
        endTime,
        capacity: e.capacity,
        isPublished: e.isPublished,
        status: e.isPublished ? EventStatus.PUBLISHED : EventStatus.DRAFT,
        eventChairId: chairId,
      },
      create: {
        id: e.id,
        title: e.title,
        description: e.description,
        category: e.category,
        location: e.location,
        startTime,
        endTime,
        capacity: e.capacity,
        isPublished: e.isPublished,
        status: e.isPublished ? EventStatus.PUBLISHED : EventStatus.DRAFT,
        eventChairId: chairId,
      },
    });
  }

  console.log(`   Created ${EVENTS.length} events\n`);
}

async function seedEventRegistrations(memberMap: Map<string, string>): Promise<void> {
  console.log("🎫 Seeding event registrations...");

  let totalRegistrations = 0;
  const memberIds = Array.from(memberMap.values());

  for (const e of EVENTS) {
    if (!e.registrationCount) continue;

    // Use seeded shuffle for deterministic results
    const registrants = shuffledWithSeed(memberIds).slice(
      0,
      e.registrationCount + (e.waitlistCount || 0)
    );

    for (let i = 0; i < registrants.length; i++) {
      const memberId = registrants[i];
      const isWaitlisted = i >= e.registrationCount;
      const daysOffset =
        e.daysFromNow > 0 ? -Math.floor(seededRandom() * 30) : e.daysFromNow - 5;

      try {
        await prisma.eventRegistration.create({
          data: {
            eventId: e.id,
            memberId,
            status: isWaitlisted
              ? RegistrationStatus.WAITLISTED
              : RegistrationStatus.CONFIRMED,
            waitlistPosition: isWaitlisted ? i - e.registrationCount + 1 : null,
            registeredAt: daysFromNow(daysOffset),
          },
        });
        totalRegistrations++;
      } catch {
        // Skip duplicate registrations (member already registered for this event)
      }
    }
  }

  console.log(`   Created ${totalRegistrations} registrations\n`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║                                                           ║");
  console.log("║   🦜 THE PACIFIC FIELD OBSERVERS SOCIETY                  ║");
  console.log(`║      "${PFOS_METADATA.tagline}"            ║`);
  console.log("║                                                           ║");
  console.log("║   DETERMINISTIC SEED - E2E Test Ready                     ║");
  console.log("║                                                           ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  checkEnvironment();

  try {
    await clearData();

    await seedMembershipStatuses();
    const memberMap = await seedMembers();
    await seedCommittees();
    await seedTerms();
    await seedRoleAssignments(memberMap);
    await seedEvents(memberMap);
    await seedEventRegistrations(memberMap);

    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log("║  ✅ SEED COMPLETE                                         ║");
    console.log("╠═══════════════════════════════════════════════════════════╣");
    console.log(`║  📊 ${MEMBERS.length} members with deterministic IDs                 ║`);
    console.log(`║  🏛️  ${COMMITTEES.length} committees with ${COMMITTEES.reduce((a, c) => a + c.roles.length, 0)} roles                         ║`);
    console.log(`║  📆 ${EVENTS.length} events with deterministic IDs                  ║`);
    console.log("║  🎫 Event registrations (seeded random)                   ║");
    console.log("║  🎭 Leadership role assignments                           ║");
    console.log("╠═══════════════════════════════════════════════════════════╣");
    console.log("║  Demo accounts:                                           ║");
    console.log("║    admin@demo.pfos.test (full access)                     ║");
    console.log("║    member@demo.pfos.test (member access)                  ║");
    console.log("║    new@demo.pfos.test (newcomer)                          ║");
    console.log("╚═══════════════════════════════════════════════════════════╝\n");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
