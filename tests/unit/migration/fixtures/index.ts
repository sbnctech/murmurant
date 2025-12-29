/**
 * Migration Test Fixtures
 *
 * Minimal but realistic test data for migration unit tests.
 * All dates are fixed to ensure deterministic tests.
 *
 * Related: Issue #274 (A9: Migration Unit Tests)
 */

import type { MigrationConfig } from "../../../../scripts/migration/lib/types";

// =============================================================================
// Fixed Timestamps (for deterministic tests)
// =============================================================================

export const FIXED_DATES = {
  /** Fixed "now" for tests: 2024-03-15T12:00:00Z */
  NOW: new Date("2024-03-15T12:00:00Z"),
  /** Member join date */
  MEMBER_JOINED: new Date("2024-01-15T00:00:00Z"),
  /** Event start time */
  EVENT_START: new Date("2024-02-10T09:00:00Z"),
  /** Event end time */
  EVENT_END: new Date("2024-02-10T11:00:00Z"),
  /** Registration date */
  REGISTRATION_DATE: new Date("2024-02-01T00:00:00Z"),
};

// =============================================================================
// CSV Content Fixtures
// =============================================================================

export const MEMBERS_CSV = `Contact ID,Member ID,First name,Last name,Email,Phone,Member since,Membership level
WA001,M001,Alice,Anderson,alice@example.com,805-555-0101,01/15/2024,Newcomer
WA002,M002,Bob,Baker,bob@example.com,805-555-0102,06/01/2023,2nd Year
WA003,M003,Carol,Chen,carol@example.com,,01/10/2022,Third Year`;

export const EVENTS_CSV = `Event ID,Event name,Description,Tags,Location,Start date,End date,Registration limit
EVT001,Welcome Coffee,Monthly new member welcome,Social,Handlebar Coffee,01/15/2024 09:00,01/15/2024 11:00,30
EVT002,Wine Tasting,Local wineries visit,Dining,Foxen Winery,02/10/2024 13:00,02/10/2024 17:00,24`;

export const REGISTRATIONS_CSV = `Registration ID,Contact ID,Event ID,Registration status,Registration date,Cancellation date
REG001,WA001,EVT001,Confirmed,01/10/2024,
REG002,WA002,EVT001,Confirmed,01/11/2024,
REG003,WA001,EVT002,Cancelled,02/01/2024,02/08/2024`;

// =============================================================================
// Edge Case CSV Fixtures
// =============================================================================

export const EMPTY_CSV = "";

export const HEADERS_ONLY_CSV = `Contact ID,First name,Last name,Email`;

export const CSV_WITH_QUOTES = `Contact ID,First name,Last name,Email,Notes
WA001,Alice,Anderson,alice@example.com,"Has ""special"" notes"
WA002,Bob,"Baker, Jr.",bob@example.com,"Line 1
Line 2"`;

export const CSV_WITH_MISSING_FIELDS = `Contact ID,First name,Last name,Email,Phone,Member since,Membership level
WA001,,Anderson,alice@example.com,805-555-0101,01/15/2024,Newcomer
WA002,Bob,,bob@example.com,805-555-0102,06/01/2023,2nd Year
WA003,Carol,Chen,,,01/10/2022,Third Year`;

export const CSV_WITH_WINDOWS_LINE_ENDINGS = "Contact ID,First name,Email\r\nWA001,Alice,alice@example.com\r\nWA002,Bob,bob@example.com\r\n";

// =============================================================================
// Minimal Config Fixture
// =============================================================================

export const MINIMAL_CONFIG: MigrationConfig = {
  version: "1.0",
  source: "wild-apricot",
  target: "murmurant",
  membership_status_mapping: {
    Newcomer: "NEWCOMER",
    "2nd Year": "NEWCOMER",
    "Third Year": "EXTENDED",
    Alumni: "ALUMNI",
    _default: "PROSPECT",
  },
  member_fields: {
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone",
    joinedAt: "Member since",
    membershipStatusId: {
      source: "Membership level",
      transform: "membership_status_lookup",
    },
    _wa_contact_id: "Contact ID",
  },
  event_fields: {
    title: "Event name",
    description: "Description",
    category: "Tags",
    location: "Location",
    startTime: "Start date",
    endTime: "End date",
    capacity: "Registration limit",
    isPublished: true,
    _wa_event_id: "Event ID",
  },
  event_category_mapping: {
    Social: "Social",
    Outdoor: "Outdoor Activities",
    Dining: "Dining Out",
    _default: "General",
  },
  registration_fields: {
    memberId: { source: "Contact ID", transform: "member_id_lookup" },
    eventId: { source: "Event ID", transform: "event_id_lookup" },
    status: { source: "Registration status", transform: "registration_status_lookup" },
    registeredAt: "Registration date",
    cancelledAt: "Cancellation date",
    _wa_registration_id: "Registration ID",
  },
  registration_status_mapping: {
    Confirmed: "CONFIRMED",
    Cancelled: "CANCELLED",
    Waitlisted: "WAITLISTED",
    _default: "CONFIRMED",
  },
  id_reconciliation: {
    members: { primary_key: "email", on_conflict: "update" },
    events: { composite_key: ["title", "startTime"], time_tolerance_minutes: 60, on_conflict: "skip" },
    registrations: { composite_key: ["memberId", "eventId"], on_conflict: "update" },
  },
  import_options: {
    batch_size: 100,
    continue_on_error: true,
    date_format: "MM/DD/YYYY",
    datetime_format: "MM/DD/YYYY HH:mm",
    source_timezone: "America/Los_Angeles",
    skip_incomplete: true,
    required_fields: {
      members: ["email", "firstName", "lastName"],
      events: ["title", "startTime"],
      registrations: ["memberId", "eventId"],
    },
  },
};

// =============================================================================
// Expected Parse Results
// =============================================================================

export const EXPECTED_MEMBER_ROWS = [
  {
    "Contact ID": "WA001",
    "Member ID": "M001",
    "First name": "Alice",
    "Last name": "Anderson",
    Email: "alice@example.com",
    Phone: "805-555-0101",
    "Member since": "01/15/2024",
    "Membership level": "Newcomer",
  },
  {
    "Contact ID": "WA002",
    "Member ID": "M002",
    "First name": "Bob",
    "Last name": "Baker",
    Email: "bob@example.com",
    Phone: "805-555-0102",
    "Member since": "06/01/2023",
    "Membership level": "2nd Year",
  },
  {
    "Contact ID": "WA003",
    "Member ID": "M003",
    "First name": "Carol",
    "Last name": "Chen",
    Email: "carol@example.com",
    Phone: "",
    "Member since": "01/10/2022",
    "Membership level": "Third Year",
  },
];
