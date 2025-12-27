/**
 * CSV Parser Unit Tests
 *
 * Tests for CSV parsing, field mapping, and edge case handling.
 *
 * Related: Issue #274 (A9: Migration Unit Tests)
 */

import { describe, it, expect } from "vitest";
import {
  parseCSV,
  mapMemberRecord,
  mapEventRecord,
  mapRegistrationRecord,
} from "../../../scripts/migration/lib/csv-parser";
import {
  MEMBERS_CSV,
  EVENTS_CSV,
  REGISTRATIONS_CSV,
  EMPTY_CSV,
  HEADERS_ONLY_CSV,
  CSV_WITH_MISSING_FIELDS,
  CSV_WITH_WINDOWS_LINE_ENDINGS,
  MINIMAL_CONFIG,
  EXPECTED_MEMBER_ROWS,
} from "./fixtures";

// =============================================================================
// parseCSV Tests
// =============================================================================

describe("parseCSV", () => {
  describe("basic parsing", () => {
    it("parses simple CSV with headers and data", () => {
      const result = parseCSV(MEMBERS_CSV);

      expect(result).toHaveLength(3);
      expect(result[0]["Contact ID"]).toBe("WA001");
      expect(result[0]["First name"]).toBe("Alice");
      expect(result[0]["Email"]).toBe("alice@example.com");
    });

    it("returns array of objects keyed by header names", () => {
      const result = parseCSV(MEMBERS_CSV);

      expect(result[0]).toEqual(EXPECTED_MEMBER_ROWS[0]);
      expect(result[1]).toEqual(EXPECTED_MEMBER_ROWS[1]);
      expect(result[2]).toEqual(EXPECTED_MEMBER_ROWS[2]);
    });

    it("handles empty cells as empty strings", () => {
      const result = parseCSV(MEMBERS_CSV);

      // Carol has no phone number
      expect(result[2]["Phone"]).toBe("");
    });
  });

  describe("edge cases", () => {
    it("returns empty array for empty input", () => {
      const result = parseCSV(EMPTY_CSV);
      expect(result).toEqual([]);
    });

    it("returns empty array for headers-only input", () => {
      const result = parseCSV(HEADERS_ONLY_CSV);
      expect(result).toEqual([]);
    });

    it("handles quoted fields (strips outer quotes)", () => {
      const csv = `Name,Notes
Alice,"Simple quoted value"`;
      const result = parseCSV(csv);

      expect(result[0]["Notes"]).toBe("Simple quoted value");
    });

    it("handles simple quoted fields", () => {
      const csv = `Name,Title
Bob,"Simple Title"`;
      const result = parseCSV(csv);

      expect(result[0]["Title"]).toBe("Simple Title");
    });

    it("handles quoted fields with embedded newlines", () => {
      const csv = `Name,Notes
Alice,"Line 1
Line 2"`;
      const result = parseCSV(csv);

      expect(result[0]["Notes"]).toBe("Line 1\nLine 2");
    });

    it("handles Windows-style line endings (CRLF)", () => {
      const result = parseCSV(CSV_WITH_WINDOWS_LINE_ENDINGS);

      expect(result).toHaveLength(2);
      expect(result[0]["First name"]).toBe("Alice");
      expect(result[1]["First name"]).toBe("Bob");
    });

    it("trims whitespace from values", () => {
      const csv = `Name,Value
  Alice  ,  123  `;
      const result = parseCSV(csv);

      expect(result[0]["Name"]).toBe("Alice");
      expect(result[0]["Value"]).toBe("123");
    });
  });

  describe("deterministic output", () => {
    it("produces same output for same input", () => {
      const result1 = parseCSV(MEMBERS_CSV);
      const result2 = parseCSV(MEMBERS_CSV);

      expect(result1).toEqual(result2);
    });

    it("preserves row order from input", () => {
      const result = parseCSV(MEMBERS_CSV);

      expect(result[0]["First name"]).toBe("Alice");
      expect(result[1]["First name"]).toBe("Bob");
      expect(result[2]["First name"]).toBe("Carol");
    });
  });
});

// =============================================================================
// mapMemberRecord Tests
// =============================================================================

describe("mapMemberRecord", () => {
  describe("field mapping", () => {
    it("maps WA fields to ClubOS member fields", () => {
      const rows = parseCSV(MEMBERS_CSV);
      const member = mapMemberRecord(rows[0], 2, MINIMAL_CONFIG);

      expect(member.firstName).toBe("Alice");
      expect(member.lastName).toBe("Anderson");
      expect(member.email).toBe("alice@example.com");
      expect(member.phone).toBe("805-555-0101");
    });

    it("extracts WA contact ID as _waId", () => {
      const rows = parseCSV(MEMBERS_CSV);
      const member = mapMemberRecord(rows[0], 2, MINIMAL_CONFIG);

      expect(member._waId).toBe("WA001");
    });

    it("sets _sourceRow to provided row index", () => {
      const rows = parseCSV(MEMBERS_CSV);
      const member = mapMemberRecord(rows[0], 5, MINIMAL_CONFIG);

      expect(member._sourceRow).toBe(5);
    });

    it("parses MM/DD/YYYY date format for joinedAt", () => {
      const rows = parseCSV(MEMBERS_CSV);
      const member = mapMemberRecord(rows[0], 2, MINIMAL_CONFIG);

      expect(member.joinedAt).toBeInstanceOf(Date);
      expect(member.joinedAt.getFullYear()).toBe(2024);
      expect(member.joinedAt.getMonth()).toBe(0); // January
      expect(member.joinedAt.getDate()).toBe(15);
    });

    it("maps membership level through status lookup", () => {
      const rows = parseCSV(MEMBERS_CSV);

      const member1 = mapMemberRecord(rows[0], 2, MINIMAL_CONFIG);
      expect(member1.membershipStatusCode).toBe("NEWCOMER");

      const member3 = mapMemberRecord(rows[2], 4, MINIMAL_CONFIG);
      expect(member3.membershipStatusCode).toBe("EXTENDED");
    });
  });

  describe("validation", () => {
    it("records error for missing email", () => {
      const rows = parseCSV(CSV_WITH_MISSING_FIELDS);
      // Row with missing email
      const row = { ...rows[2], Email: "" };
      const member = mapMemberRecord(row, 5, MINIMAL_CONFIG);

      expect(member._errors).toBeDefined();
      expect(member._errors).toContain("Missing email");
    });

    it("records error for missing firstName", () => {
      const rows = parseCSV(CSV_WITH_MISSING_FIELDS);
      const member = mapMemberRecord(rows[0], 2, MINIMAL_CONFIG); // Missing first name

      expect(member._errors).toBeDefined();
      expect(member._errors).toContain("Missing firstName");
    });

    it("records error for missing lastName", () => {
      const rows = parseCSV(CSV_WITH_MISSING_FIELDS);
      const member = mapMemberRecord(rows[1], 3, MINIMAL_CONFIG); // Missing last name

      expect(member._errors).toBeDefined();
      expect(member._errors).toContain("Missing lastName");
    });

    it("records multiple errors for multiple missing fields", () => {
      const row = { "Contact ID": "WA999", "First name": "", "Last name": "", Email: "" };
      const member = mapMemberRecord(row, 99, MINIMAL_CONFIG);

      expect(member._errors).toBeDefined();
      expect(member._errors!.length).toBeGreaterThanOrEqual(3);
    });

    it("has no errors for valid record", () => {
      const rows = parseCSV(MEMBERS_CSV);
      const member = mapMemberRecord(rows[0], 2, MINIMAL_CONFIG);

      expect(member._errors).toBeUndefined();
    });
  });

  describe("status mapping edge cases", () => {
    it("uses default status for unknown membership level", () => {
      const row = {
        "Contact ID": "WA999",
        "First name": "Test",
        "Last name": "User",
        Email: "test@example.com",
        Phone: "",
        "Member since": "01/01/2024",
        "Membership level": "Unknown Level",
      };
      const member = mapMemberRecord(row, 99, MINIMAL_CONFIG);

      expect(member.membershipStatusCode).toBe("PROSPECT");
    });
  });
});

// =============================================================================
// mapEventRecord Tests
// =============================================================================

describe("mapEventRecord", () => {
  describe("field mapping", () => {
    it("maps WA fields to ClubOS event fields", () => {
      const rows = parseCSV(EVENTS_CSV);
      const event = mapEventRecord(rows[0], 2, MINIMAL_CONFIG);

      expect(event.title).toBe("Welcome Coffee");
      expect(event.description).toBe("Monthly new member welcome");
      expect(event.location).toBe("Handlebar Coffee");
    });

    it("extracts WA event ID as _waId", () => {
      const rows = parseCSV(EVENTS_CSV);
      const event = mapEventRecord(rows[0], 2, MINIMAL_CONFIG);

      expect(event._waId).toBe("EVT001");
    });

    it("parses datetime for startTime and endTime", () => {
      const rows = parseCSV(EVENTS_CSV);
      const event = mapEventRecord(rows[0], 2, MINIMAL_CONFIG);

      expect(event.startTime).toBeInstanceOf(Date);
      expect(event.startTime.getFullYear()).toBe(2024);
      expect(event.startTime.getMonth()).toBe(0); // January
      expect(event.startTime.getDate()).toBe(15);
      expect(event.startTime.getHours()).toBe(9);

      expect(event.endTime).toBeInstanceOf(Date);
      expect(event.endTime!.getHours()).toBe(11);
    });

    it("parses capacity as number", () => {
      const rows = parseCSV(EVENTS_CSV);
      const event = mapEventRecord(rows[0], 2, MINIMAL_CONFIG);

      expect(event.capacity).toBe(30);
    });

    it("maps category through category mapping", () => {
      const rows = parseCSV(EVENTS_CSV);

      const event1 = mapEventRecord(rows[0], 2, MINIMAL_CONFIG);
      expect(event1.category).toBe("Social");

      const event2 = mapEventRecord(rows[1], 3, MINIMAL_CONFIG);
      expect(event2.category).toBe("Dining Out");
    });

    it("sets isPublished from config", () => {
      const rows = parseCSV(EVENTS_CSV);
      const event = mapEventRecord(rows[0], 2, MINIMAL_CONFIG);

      expect(event.isPublished).toBe(true);
    });
  });

  describe("validation", () => {
    it("records error for missing title", () => {
      const row = {
        "Event ID": "EVT999",
        "Event name": "",
        Description: "",
        Tags: "",
        Location: "",
        "Start date": "01/01/2024 09:00",
        "End date": "",
        "Registration limit": "",
      };
      const event = mapEventRecord(row, 99, MINIMAL_CONFIG);

      expect(event._errors).toBeDefined();
      expect(event._errors).toContain("Missing title");
    });

    it("has no errors for valid record", () => {
      const rows = parseCSV(EVENTS_CSV);
      const event = mapEventRecord(rows[0], 2, MINIMAL_CONFIG);

      expect(event._errors).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("handles missing capacity gracefully", () => {
      const row = {
        "Event ID": "EVT999",
        "Event name": "Test Event",
        Description: "",
        Tags: "",
        Location: "",
        "Start date": "01/01/2024 09:00",
        "End date": "",
        "Registration limit": "",
      };
      const event = mapEventRecord(row, 99, MINIMAL_CONFIG);

      expect(event.capacity).toBeUndefined();
    });

    it("handles invalid capacity gracefully", () => {
      const row = {
        "Event ID": "EVT999",
        "Event name": "Test Event",
        Description: "",
        Tags: "",
        Location: "",
        "Start date": "01/01/2024 09:00",
        "End date": "",
        "Registration limit": "not a number",
      };
      const event = mapEventRecord(row, 99, MINIMAL_CONFIG);

      expect(event.capacity).toBeUndefined();
    });

    it("uses default category for unknown tags", () => {
      const row = {
        "Event ID": "EVT999",
        "Event name": "Test Event",
        Description: "",
        Tags: "UnknownCategory",
        Location: "",
        "Start date": "01/01/2024 09:00",
        "End date": "",
        "Registration limit": "",
      };
      const event = mapEventRecord(row, 99, MINIMAL_CONFIG);

      expect(event.category).toBe("General");
    });
  });
});

// =============================================================================
// mapRegistrationRecord Tests
// =============================================================================

describe("mapRegistrationRecord", () => {
  describe("field mapping", () => {
    it("maps WA fields to ClubOS registration fields", () => {
      const rows = parseCSV(REGISTRATIONS_CSV);
      const reg = mapRegistrationRecord(rows[0], 2, MINIMAL_CONFIG);

      expect(reg.memberId).toBe("WA001"); // Will be resolved later by engine
      expect(reg.eventId).toBe("EVT001"); // Will be resolved later by engine
      expect(reg.status).toBe("CONFIRMED");
    });

    it("extracts WA registration ID as _waId", () => {
      const rows = parseCSV(REGISTRATIONS_CSV);
      const reg = mapRegistrationRecord(rows[0], 2, MINIMAL_CONFIG);

      expect(reg._waId).toBe("REG001");
    });

    it("parses registeredAt date", () => {
      const rows = parseCSV(REGISTRATIONS_CSV);
      const reg = mapRegistrationRecord(rows[0], 2, MINIMAL_CONFIG);

      expect(reg.registeredAt).toBeInstanceOf(Date);
      expect(reg.registeredAt.getFullYear()).toBe(2024);
      expect(reg.registeredAt.getMonth()).toBe(0); // January
      expect(reg.registeredAt.getDate()).toBe(10);
    });

    it("parses cancelledAt date when present", () => {
      const rows = parseCSV(REGISTRATIONS_CSV);
      const reg = mapRegistrationRecord(rows[2], 4, MINIMAL_CONFIG); // Cancelled registration

      expect(reg.cancelledAt).toBeInstanceOf(Date);
      expect(reg.cancelledAt!.getMonth()).toBe(1); // February
      expect(reg.cancelledAt!.getDate()).toBe(8);
    });

    it("leaves cancelledAt undefined when not present", () => {
      const rows = parseCSV(REGISTRATIONS_CSV);
      const reg = mapRegistrationRecord(rows[0], 2, MINIMAL_CONFIG);

      expect(reg.cancelledAt).toBeUndefined();
    });
  });

  describe("status mapping", () => {
    it("maps Confirmed to CONFIRMED", () => {
      const rows = parseCSV(REGISTRATIONS_CSV);
      const reg = mapRegistrationRecord(rows[0], 2, MINIMAL_CONFIG);

      expect(reg.status).toBe("CONFIRMED");
    });

    it("maps Cancelled to CANCELLED", () => {
      const rows = parseCSV(REGISTRATIONS_CSV);
      const reg = mapRegistrationRecord(rows[2], 4, MINIMAL_CONFIG);

      expect(reg.status).toBe("CANCELLED");
    });

    it("uses default status for unknown status", () => {
      const row = {
        "Registration ID": "REG999",
        "Contact ID": "WA001",
        "Event ID": "EVT001",
        "Registration status": "Unknown",
        "Registration date": "01/01/2024",
        "Cancellation date": "",
      };
      const reg = mapRegistrationRecord(row, 99, MINIMAL_CONFIG);

      expect(reg.status).toBe("CONFIRMED");
    });
  });
});

// =============================================================================
// Date Parsing Tests (timezone-independent)
// =============================================================================

describe("date parsing", () => {
  it("parses MM/DD/YYYY format correctly", () => {
    const csv = `Date
01/15/2024`;
    const rows = parseCSV(csv);
    const row = { ...rows[0], "First name": "Test", "Last name": "User", Email: "test@test.com" };
    const member = mapMemberRecord({ ...row, "Member since": "01/15/2024" }, 2, MINIMAL_CONFIG);

    expect(member.joinedAt.getFullYear()).toBe(2024);
    expect(member.joinedAt.getMonth()).toBe(0);
    expect(member.joinedAt.getDate()).toBe(15);
  });

  it("parses MM/DD/YYYY HH:mm format correctly", () => {
    const row = {
      "Event ID": "EVT999",
      "Event name": "Test",
      "Start date": "02/20/2024 14:30",
      Description: "",
      Tags: "",
      Location: "",
      "End date": "",
      "Registration limit": "",
    };
    const event = mapEventRecord(row, 99, MINIMAL_CONFIG);

    expect(event.startTime.getFullYear()).toBe(2024);
    expect(event.startTime.getMonth()).toBe(1);
    expect(event.startTime.getDate()).toBe(20);
    expect(event.startTime.getHours()).toBe(14);
    expect(event.startTime.getMinutes()).toBe(30);
  });

  it("parses ISO format dates", () => {
    const row = {
      "Event ID": "EVT999",
      "Event name": "Test",
      "Start date": "2024-03-25T10:00:00Z",
      Description: "",
      Tags: "",
      Location: "",
      "End date": "",
      "Registration limit": "",
    };
    const event = mapEventRecord(row, 99, MINIMAL_CONFIG);

    expect(event.startTime).toBeInstanceOf(Date);
    expect(event.startTime.toISOString()).toBe("2024-03-25T10:00:00.000Z");
  });
});
