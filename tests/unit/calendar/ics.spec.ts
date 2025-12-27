/**
 * ICS Generator Tests
 *
 * Golden file tests to ensure ICS output is compatible with
 * Google Calendar, Apple Calendar, and Outlook.
 *
 * Key assertions:
 * - TZID uses IANA timezone names
 * - DTSTART/DTEND semantics are correct
 * - All-day events use VALUE=DATE with exclusive end
 * - Line folding follows RFC 5545
 * - Special characters are properly escaped
 */

import { describe, it, expect } from "vitest";
import {
  generateIcs,
  generateSingleEventIcs,
  generateVEvent,
  escapeIcsText,
  foldLine,
  formatDtstamp,
  formatLocalDateTime,
  formatDateOnly,
  generateUid,
  type IcsEventInput,
} from "@/lib/calendar";

describe("ICS Generator", () => {
  describe("escapeIcsText", () => {
    it("escapes backslashes", () => {
      expect(escapeIcsText("path\\to\\file")).toBe("path\\\\to\\\\file");
    });

    it("escapes semicolons", () => {
      expect(escapeIcsText("a;b;c")).toBe("a\\;b\\;c");
    });

    it("escapes commas", () => {
      expect(escapeIcsText("a,b,c")).toBe("a\\,b\\,c");
    });

    it("escapes newlines", () => {
      expect(escapeIcsText("line1\nline2")).toBe("line1\\nline2");
      expect(escapeIcsText("line1\r\nline2")).toBe("line1\\nline2");
    });

    it("handles mixed special characters", () => {
      expect(escapeIcsText("a\\b;c,d\ne")).toBe("a\\\\b\\;c\\,d\\ne");
    });
  });

  describe("foldLine", () => {
    it("does not fold short lines", () => {
      const short = "SUMMARY:Short title";
      expect(foldLine(short)).toBe(short);
    });

    it("folds lines at 75 characters", () => {
      const long = "DESCRIPTION:" + "x".repeat(100);
      const folded = foldLine(long);

      // First line should be exactly 75 chars
      const lines = folded.split("\r\n");
      expect(lines[0].length).toBe(75);

      // Continuation lines start with space
      expect(lines[1].startsWith(" ")).toBe(true);
    });

    it("produces valid continuation lines", () => {
      const input = "X".repeat(200);
      const folded = foldLine(input);

      // Unfold should give back original
      const unfolded = folded.replace(/\r\n /g, "");
      expect(unfolded).toBe(input);
    });
  });

  describe("formatDtstamp", () => {
    it("formats UTC timestamp correctly", () => {
      const date = new Date("2025-06-15T14:30:45Z");
      expect(formatDtstamp(date)).toBe("20250615T143045Z");
    });

    it("always uses UTC regardless of input timezone", () => {
      const date = new Date(Date.UTC(2025, 11, 25, 8, 0, 0)); // Dec 25, 2025 08:00 UTC
      expect(formatDtstamp(date)).toBe("20251225T080000Z");
    });
  });

  describe("formatLocalDateTime", () => {
    it("formats local datetime for America/Los_Angeles", () => {
      // 2025-06-15T21:30:00Z is 2:30 PM PDT (UTC-7 in summer)
      const date = new Date("2025-06-15T21:30:00Z");
      expect(formatLocalDateTime(date, "America/Los_Angeles")).toBe(
        "20250615T143000",
      );
    });

    it("formats local datetime for America/New_York", () => {
      // 2025-06-15T21:30:00Z is 5:30 PM EDT (UTC-4 in summer)
      const date = new Date("2025-06-15T21:30:00Z");
      expect(formatLocalDateTime(date, "America/New_York")).toBe(
        "20250615T173000",
      );
    });

    it("handles DST transitions correctly", () => {
      // Winter time in LA: PST (UTC-8)
      const winter = new Date("2025-01-15T20:00:00Z"); // noon PST
      expect(formatLocalDateTime(winter, "America/Los_Angeles")).toBe(
        "20250115T120000",
      );

      // Summer time in LA: PDT (UTC-7)
      const summer = new Date("2025-07-15T19:00:00Z"); // noon PDT
      expect(formatLocalDateTime(summer, "America/Los_Angeles")).toBe(
        "20250715T120000",
      );
    });
  });

  describe("formatDateOnly", () => {
    it("formats date without time", () => {
      const date = new Date("2025-06-15T21:30:00Z");
      expect(formatDateOnly(date, "America/Los_Angeles")).toBe("20250615");
    });

    it("respects timezone for date boundaries", () => {
      // 2025-06-16T03:00:00Z is still June 15 in LA (PDT is UTC-7)
      const date = new Date("2025-06-16T03:00:00Z");
      expect(formatDateOnly(date, "America/Los_Angeles")).toBe("20250615");
      expect(formatDateOnly(date, "UTC")).toBe("20250616");
    });
  });

  describe("generateUid", () => {
    it("generates UID with event ID and domain", () => {
      expect(generateUid("abc-123", "clubos.app")).toBe("abc-123@clubos.app");
    });
  });

  describe("generateVEvent", () => {
    const baseEvent: IcsEventInput = {
      id: "evt-001",
      title: "Monthly Lunch",
      startTime: new Date("2025-06-15T18:00:00Z"), // 11 AM PDT
    };

    it("includes required VEVENT properties", () => {
      const vevent = generateVEvent(baseEvent);

      expect(vevent).toContain("BEGIN:VEVENT");
      expect(vevent).toContain("END:VEVENT");
      expect(vevent).toContain("UID:evt-001@clubos.app");
      expect(vevent).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
      expect(vevent).toContain("SUMMARY:Monthly Lunch");
    });

    it("uses TZID for timed events", () => {
      const vevent = generateVEvent(baseEvent, {
        timezone: "America/Los_Angeles",
      });

      expect(vevent).toContain(
        "DTSTART;TZID=America/Los_Angeles:20250615T110000",
      );
    });

    it("includes DTEND when endTime is provided", () => {
      const event: IcsEventInput = {
        ...baseEvent,
        endTime: new Date("2025-06-15T20:00:00Z"), // 1 PM PDT
      };
      const vevent = generateVEvent(event, { timezone: "America/Los_Angeles" });

      expect(vevent).toContain("DTEND;TZID=America/Los_Angeles:20250615T130000");
    });

    it("includes optional fields when provided", () => {
      const event: IcsEventInput = {
        ...baseEvent,
        description: "A fun lunch event",
        location: "The Restaurant, 123 Main St",
      };
      const vevent = generateVEvent(event);

      expect(vevent).toContain("DESCRIPTION:A fun lunch event");
      expect(vevent).toContain("LOCATION:The Restaurant\\, 123 Main St");
    });

    it("escapes special characters in text fields", () => {
      const event: IcsEventInput = {
        ...baseEvent,
        title: "Meeting; Important, Urgent",
        description: "Line 1\nLine 2",
      };
      const vevent = generateVEvent(event);

      expect(vevent).toContain("SUMMARY:Meeting\\; Important\\, Urgent");
      expect(vevent).toContain("DESCRIPTION:Line 1\\nLine 2");
    });
  });

  describe("All-day events", () => {
    it("uses VALUE=DATE format for all-day events", () => {
      const event: IcsEventInput = {
        id: "evt-allday",
        title: "Club Anniversary",
        startTime: new Date("2025-06-15T07:00:00Z"), // Midnight PDT
        isAllDay: true,
      };
      const vevent = generateVEvent(event, { timezone: "America/Los_Angeles" });

      expect(vevent).toContain("DTSTART;VALUE=DATE:20250615");
      expect(vevent).not.toContain("TZID");
    });

    it("uses exclusive end date for multi-day all-day events", () => {
      // RFC 5545: DTEND for VALUE=DATE is exclusive
      // Event on June 15-16 should have DTEND of June 17
      const event: IcsEventInput = {
        id: "evt-multiday",
        title: "Weekend Retreat",
        startTime: new Date("2025-06-15T07:00:00Z"),
        endTime: new Date("2025-06-16T07:00:00Z"),
        isAllDay: true,
      };
      const vevent = generateVEvent(event, { timezone: "America/Los_Angeles" });

      expect(vevent).toContain("DTSTART;VALUE=DATE:20250615");
      // End date should be June 17 (exclusive of June 16)
      expect(vevent).toContain("DTEND;VALUE=DATE:20250617");
    });
  });

  describe("generateIcs (full calendar)", () => {
    it("generates valid VCALENDAR structure", () => {
      const event: IcsEventInput = {
        id: "evt-001",
        title: "Test Event",
        startTime: new Date("2025-06-15T18:00:00Z"),
      };
      const ics = generateIcs([event]);

      expect(ics).toContain("BEGIN:VCALENDAR");
      expect(ics).toContain("VERSION:2.0");
      expect(ics).toContain("PRODID:-//ClubOS//Event Calendar//EN");
      expect(ics).toContain("CALSCALE:GREGORIAN");
      expect(ics).toContain("METHOD:PUBLISH");
      expect(ics).toContain("END:VCALENDAR");
    });

    it("includes VTIMEZONE for timed events", () => {
      const event: IcsEventInput = {
        id: "evt-001",
        title: "Timed Event",
        startTime: new Date("2025-06-15T18:00:00Z"),
        isAllDay: false,
      };
      const ics = generateIcs([event], { timezone: "America/Los_Angeles" });

      expect(ics).toContain("BEGIN:VTIMEZONE");
      expect(ics).toContain("TZID:America/Los_Angeles");
      expect(ics).toContain("END:VTIMEZONE");
    });

    it("omits VTIMEZONE for all-day only events", () => {
      const event: IcsEventInput = {
        id: "evt-allday",
        title: "All Day Event",
        startTime: new Date("2025-06-15T07:00:00Z"),
        isAllDay: true,
      };
      const ics = generateIcs([event]);

      expect(ics).not.toContain("BEGIN:VTIMEZONE");
    });

    it("includes multiple events", () => {
      const events: IcsEventInput[] = [
        {
          id: "evt-1",
          title: "Event 1",
          startTime: new Date("2025-06-15T18:00:00Z"),
        },
        {
          id: "evt-2",
          title: "Event 2",
          startTime: new Date("2025-06-16T18:00:00Z"),
        },
      ];
      const ics = generateIcs(events);

      expect(ics).toContain("UID:evt-1@clubos.app");
      expect(ics).toContain("UID:evt-2@clubos.app");
      expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(2);
    });

    it("ends with CRLF", () => {
      const event: IcsEventInput = {
        id: "evt-001",
        title: "Test",
        startTime: new Date("2025-06-15T18:00:00Z"),
      };
      const ics = generateIcs([event]);

      expect(ics.endsWith("\r\n")).toBe(true);
    });
  });

  describe("generateSingleEventIcs", () => {
    it("generates ICS for a single event", () => {
      const event: IcsEventInput = {
        id: "single-001",
        title: "Solo Event",
        startTime: new Date("2025-06-15T18:00:00Z"),
      };
      const ics = generateSingleEventIcs(event);

      expect(ics).toContain("BEGIN:VCALENDAR");
      expect(ics).toContain("UID:single-001@clubos.app");
      expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(1);
    });
  });

  describe("Golden file: realistic event", () => {
    it("generates expected output for typical SBNC event", () => {
      const event: IcsEventInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Monthly Luncheon - Garden Room",
        description:
          "Join us for our monthly luncheon at the Garden Room. " +
          "Menu: Choice of salmon or chicken. " +
          "Cost: $25 members, $30 guests.",
        location: "The Garden Room, 123 State Street, Santa Barbara, CA 93101",
        startTime: new Date("2025-06-15T18:30:00Z"), // 11:30 AM PDT
        endTime: new Date("2025-06-15T21:00:00Z"), // 2:00 PM PDT
      };

      const ics = generateIcs([event], {
        timezone: "America/Los_Angeles",
        baseUrl: "sbnewcomers.org",
      });

      // Verify structure
      expect(ics).toContain("BEGIN:VCALENDAR");
      expect(ics).toContain("VERSION:2.0");
      expect(ics).toContain("PRODID:-//ClubOS//Event Calendar//EN");

      // Verify timezone block is present
      expect(ics).toContain("BEGIN:VTIMEZONE");
      expect(ics).toContain("TZID:America/Los_Angeles");

      // Verify event properties
      expect(ics).toContain(
        "UID:550e8400-e29b-41d4-a716-446655440000@sbnewcomers.org",
      );
      expect(ics).toContain("SUMMARY:Monthly Luncheon - Garden Room");
      expect(ics).toContain("DTSTART;TZID=America/Los_Angeles:20250615T113000");
      expect(ics).toContain("DTEND;TZID=America/Los_Angeles:20250615T140000");

      // Verify escaping
      expect(ics).toContain("$25 members\\, $30 guests");
      expect(ics).toContain("Santa Barbara\\, CA");

      // Verify structure ends correctly
      expect(ics).toContain("END:VEVENT");
      expect(ics).toContain("END:VCALENDAR");
    });
  });
});
