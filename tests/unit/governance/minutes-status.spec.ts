/**
 * Minutes Status Machine Tests
 *
 * Tests for the minutes workflow state machine.
 *
 * Charter P3: Explicit state machine for minutes workflow
 */

import { describe, expect, test } from "vitest";
import {
  MINUTES_STATUS_TRANSITIONS,
  SECRETARY_EDITABLE_STATUSES,
  isValidStatusTransition,
  getStatusDescription,
} from "@/lib/governance/minutes";
import { MinutesStatus } from "@prisma/client";

describe("minutes status machine", () => {
  describe("MINUTES_STATUS_TRANSITIONS", () => {
    test("DRAFT can only transition to SUBMITTED", () => {
      expect(MINUTES_STATUS_TRANSITIONS.DRAFT).toEqual(["SUBMITTED"]);
    });

    test("SUBMITTED can transition to REVISED or APPROVED", () => {
      expect(MINUTES_STATUS_TRANSITIONS.SUBMITTED).toContain("REVISED");
      expect(MINUTES_STATUS_TRANSITIONS.SUBMITTED).toContain("APPROVED");
      expect(MINUTES_STATUS_TRANSITIONS.SUBMITTED).toHaveLength(2);
    });

    test("REVISED can only transition back to SUBMITTED", () => {
      expect(MINUTES_STATUS_TRANSITIONS.REVISED).toEqual(["SUBMITTED"]);
    });

    test("APPROVED can only transition to PUBLISHED", () => {
      expect(MINUTES_STATUS_TRANSITIONS.APPROVED).toEqual(["PUBLISHED"]);
    });

    test("PUBLISHED can only transition to ARCHIVED", () => {
      expect(MINUTES_STATUS_TRANSITIONS.PUBLISHED).toEqual(["ARCHIVED"]);
    });

    test("ARCHIVED has no allowed transitions (terminal state)", () => {
      expect(MINUTES_STATUS_TRANSITIONS.ARCHIVED).toEqual([]);
    });

    test("all MinutesStatus values are represented", () => {
      const allStatuses: MinutesStatus[] = [
        "DRAFT",
        "SUBMITTED",
        "REVISED",
        "APPROVED",
        "PUBLISHED",
        "ARCHIVED",
      ];

      for (const status of allStatuses) {
        expect(MINUTES_STATUS_TRANSITIONS).toHaveProperty(status);
      }
    });
  });

  describe("SECRETARY_EDITABLE_STATUSES", () => {
    test("includes DRAFT", () => {
      expect(SECRETARY_EDITABLE_STATUSES).toContain("DRAFT");
    });

    test("includes REVISED", () => {
      expect(SECRETARY_EDITABLE_STATUSES).toContain("REVISED");
    });

    test("excludes SUBMITTED", () => {
      expect(SECRETARY_EDITABLE_STATUSES).not.toContain("SUBMITTED");
    });

    test("excludes APPROVED", () => {
      expect(SECRETARY_EDITABLE_STATUSES).not.toContain("APPROVED");
    });

    test("excludes PUBLISHED", () => {
      expect(SECRETARY_EDITABLE_STATUSES).not.toContain("PUBLISHED");
    });

    test("excludes ARCHIVED", () => {
      expect(SECRETARY_EDITABLE_STATUSES).not.toContain("ARCHIVED");
    });

    test("only contains 2 statuses", () => {
      expect(SECRETARY_EDITABLE_STATUSES).toHaveLength(2);
    });
  });

  describe("isValidStatusTransition", () => {
    // Valid transitions
    test("DRAFT -> SUBMITTED is valid", () => {
      expect(isValidStatusTransition("DRAFT", "SUBMITTED")).toBe(true);
    });

    test("SUBMITTED -> APPROVED is valid", () => {
      expect(isValidStatusTransition("SUBMITTED", "APPROVED")).toBe(true);
    });

    test("SUBMITTED -> REVISED is valid", () => {
      expect(isValidStatusTransition("SUBMITTED", "REVISED")).toBe(true);
    });

    test("REVISED -> SUBMITTED is valid", () => {
      expect(isValidStatusTransition("REVISED", "SUBMITTED")).toBe(true);
    });

    test("APPROVED -> PUBLISHED is valid", () => {
      expect(isValidStatusTransition("APPROVED", "PUBLISHED")).toBe(true);
    });

    test("PUBLISHED -> ARCHIVED is valid", () => {
      expect(isValidStatusTransition("PUBLISHED", "ARCHIVED")).toBe(true);
    });

    // Invalid transitions - backwards
    test("SUBMITTED -> DRAFT is invalid (no going back)", () => {
      expect(isValidStatusTransition("SUBMITTED", "DRAFT")).toBe(false);
    });

    test("APPROVED -> SUBMITTED is invalid (no going back)", () => {
      expect(isValidStatusTransition("APPROVED", "SUBMITTED")).toBe(false);
    });

    test("PUBLISHED -> APPROVED is invalid (no going back)", () => {
      expect(isValidStatusTransition("PUBLISHED", "APPROVED")).toBe(false);
    });

    test("ARCHIVED -> PUBLISHED is invalid (terminal state)", () => {
      expect(isValidStatusTransition("ARCHIVED", "PUBLISHED")).toBe(false);
    });

    // Invalid transitions - skipping steps
    test("DRAFT -> APPROVED is invalid (must go through SUBMITTED)", () => {
      expect(isValidStatusTransition("DRAFT", "APPROVED")).toBe(false);
    });

    test("DRAFT -> PUBLISHED is invalid (must go through workflow)", () => {
      expect(isValidStatusTransition("DRAFT", "PUBLISHED")).toBe(false);
    });

    test("SUBMITTED -> PUBLISHED is invalid (must be approved first)", () => {
      expect(isValidStatusTransition("SUBMITTED", "PUBLISHED")).toBe(false);
    });

    test("REVISED -> APPROVED is invalid (must resubmit first)", () => {
      expect(isValidStatusTransition("REVISED", "APPROVED")).toBe(false);
    });

    // Same state transition
    test("DRAFT -> DRAFT is invalid (no self-transition)", () => {
      expect(isValidStatusTransition("DRAFT", "DRAFT")).toBe(false);
    });
  });

  describe("getStatusDescription", () => {
    test("DRAFT description mentions Secretary editing", () => {
      const desc = getStatusDescription("DRAFT");
      expect(desc).toContain("Secretary");
      expect(desc).toContain("edit");
    });

    test("SUBMITTED description mentions President review", () => {
      const desc = getStatusDescription("SUBMITTED");
      expect(desc).toContain("President");
      expect(desc).toContain("review");
    });

    test("REVISED description mentions President requested changes", () => {
      const desc = getStatusDescription("REVISED");
      expect(desc).toContain("President");
      expect(desc).toContain("change");
    });

    test("APPROVED description mentions can publish", () => {
      const desc = getStatusDescription("APPROVED");
      expect(desc).toContain("approved");
      expect(desc).toContain("publish");
    });

    test("PUBLISHED description mentions members", () => {
      const desc = getStatusDescription("PUBLISHED");
      expect(desc).toContain("Published");
      expect(desc).toContain("member");
    });

    test("ARCHIVED description mentions historical record", () => {
      const desc = getStatusDescription("ARCHIVED");
      expect(desc).toContain("Historical");
    });
  });

  describe("workflow integrity", () => {
    test("DRAFT is the starting state (reachable only through creation)", () => {
      // No status should transition TO DRAFT
      for (const [, nextStatuses] of Object.entries(MINUTES_STATUS_TRANSITIONS)) {
        expect(nextStatuses).not.toContain("DRAFT");
      }
    });

    test("ARCHIVED is the terminal state (no outgoing transitions)", () => {
      expect(MINUTES_STATUS_TRANSITIONS.ARCHIVED).toHaveLength(0);
    });

    test("there is exactly one path from DRAFT to PUBLISHED without revisions", () => {
      // DRAFT -> SUBMITTED -> APPROVED -> PUBLISHED
      expect(isValidStatusTransition("DRAFT", "SUBMITTED")).toBe(true);
      expect(isValidStatusTransition("SUBMITTED", "APPROVED")).toBe(true);
      expect(isValidStatusTransition("APPROVED", "PUBLISHED")).toBe(true);
    });

    test("revision loop exists: SUBMITTED -> REVISED -> SUBMITTED", () => {
      expect(isValidStatusTransition("SUBMITTED", "REVISED")).toBe(true);
      expect(isValidStatusTransition("REVISED", "SUBMITTED")).toBe(true);
    });

    test("cannot skip required approvals", () => {
      // Cannot go directly from editable states to published
      expect(isValidStatusTransition("DRAFT", "PUBLISHED")).toBe(false);
      expect(isValidStatusTransition("REVISED", "PUBLISHED")).toBe(false);
      expect(isValidStatusTransition("SUBMITTED", "PUBLISHED")).toBe(false);
    });
  });
});
