/**
 * Governance Validation Schema Tests
 *
 * Tests for Zod validation schemas in the governance module.
 *
 * Charter P9: Validation before execution (fail closed)
 */

import { describe, expect, test } from "vitest";
import {
  createMeetingSchema,
  createMinutesSchema,
  createMotionSchema,
  recordVoteSchema,
  createAnnotationSchema,
  createFlagSchema,
  resolveFlagSchema,
  paginationSchema,
} from "@/lib/governance/schemas";

describe("governance validation schemas", () => {
  describe("createMeetingSchema", () => {
    test("accepts valid meeting input", () => {
      const input = {
        date: "2025-02-15",
        type: "BOARD",
      };

      const result = createMeetingSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date).toBe("2025-02-15");
        expect(result.data.type).toBe("BOARD");
      }
    });

    test("accepts all meeting types", () => {
      const types = ["BOARD", "EXECUTIVE", "SPECIAL", "ANNUAL"];
      for (const type of types) {
        const result = createMeetingSchema.safeParse({
          date: "2025-02-15",
          type,
        });
        expect(result.success).toBe(true);
      }
    });

    test("accepts optional fields", () => {
      const input = {
        date: "2025-02-15",
        type: "BOARD",
        title: "February Board Meeting",
        location: "Community Center",
        attendanceCount: 12,
        quorumMet: true,
      };

      const result = createMeetingSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("February Board Meeting");
        expect(result.data.location).toBe("Community Center");
        expect(result.data.attendanceCount).toBe(12);
        expect(result.data.quorumMet).toBe(true);
      }
    });

    test("rejects invalid date format", () => {
      const input = {
        date: "02/15/2025", // Wrong format
        type: "BOARD",
      };

      const result = createMeetingSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("rejects invalid meeting type", () => {
      const input = {
        date: "2025-02-15",
        type: "COMMITTEE", // Not a valid type
      };

      const result = createMeetingSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("rejects negative attendance count", () => {
      const input = {
        date: "2025-02-15",
        type: "BOARD",
        attendanceCount: -1,
      };

      const result = createMeetingSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("createMinutesSchema", () => {
    test("accepts valid minutes input", () => {
      const input = {
        meetingId: "123e4567-e89b-12d3-a456-426614174000",
        content: { sections: [] },
      };

      const result = createMinutesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("accepts optional summary", () => {
      const input = {
        meetingId: "123e4567-e89b-12d3-a456-426614174000",
        content: { sections: [] },
        summary: "Brief summary of the meeting",
      };

      const result = createMinutesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("rejects invalid meeting ID", () => {
      const input = {
        meetingId: "not-a-uuid",
        content: { sections: [] },
      };

      const result = createMinutesSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("rejects summary over 2000 characters", () => {
      const input = {
        meetingId: "123e4567-e89b-12d3-a456-426614174000",
        content: { sections: [] },
        summary: "a".repeat(2001),
      };

      const result = createMinutesSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("createMotionSchema", () => {
    test("accepts valid motion input", () => {
      const input = {
        meetingId: "123e4567-e89b-12d3-a456-426614174000",
        motionText: "Motion to approve the budget",
      };

      const result = createMotionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("accepts optional mover and seconder", () => {
      const input = {
        meetingId: "123e4567-e89b-12d3-a456-426614174000",
        motionText: "Motion to approve the budget",
        movedById: "223e4567-e89b-12d3-a456-426614174001",
        secondedById: "323e4567-e89b-12d3-a456-426614174002",
      };

      const result = createMotionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("rejects empty motion text", () => {
      const input = {
        meetingId: "123e4567-e89b-12d3-a456-426614174000",
        motionText: "",
      };

      const result = createMotionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("rejects motion text over 5000 characters", () => {
      const input = {
        meetingId: "123e4567-e89b-12d3-a456-426614174000",
        motionText: "a".repeat(5001),
      };

      const result = createMotionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("recordVoteSchema", () => {
    test("accepts valid vote input", () => {
      const input = {
        motionId: "123e4567-e89b-12d3-a456-426614174000",
        votesYes: 8,
        votesNo: 2,
        votesAbstain: 1,
        result: "PASSED",
      };

      const result = recordVoteSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("accepts all result types", () => {
      const results = ["PASSED", "FAILED", "TABLED", "WITHDRAWN"];
      for (const motionResult of results) {
        const input = {
          motionId: "123e4567-e89b-12d3-a456-426614174000",
          votesYes: 5,
          votesNo: 3,
          votesAbstain: 0,
          result: motionResult,
        };
        const parseResult = recordVoteSchema.safeParse(input);
        expect(parseResult.success).toBe(true);
      }
    });

    test("rejects negative vote counts", () => {
      const input = {
        motionId: "123e4567-e89b-12d3-a456-426614174000",
        votesYes: -1,
        votesNo: 2,
        votesAbstain: 1,
        result: "PASSED",
      };

      const result = recordVoteSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("rejects invalid result", () => {
      const input = {
        motionId: "123e4567-e89b-12d3-a456-426614174000",
        votesYes: 8,
        votesNo: 2,
        votesAbstain: 1,
        result: "PENDING",
      };

      const result = recordVoteSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("createAnnotationSchema", () => {
    test("accepts valid annotation input", () => {
      const input = {
        targetType: "motion",
        targetId: "123e4567-e89b-12d3-a456-426614174000",
        body: "Procedural note: This motion follows Robert's Rules",
      };

      const result = createAnnotationSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("accepts all target types", () => {
      const types = ["motion", "bylaw", "policy", "page", "file"];
      for (const targetType of types) {
        const input = {
          targetType,
          targetId: "123e4567-e89b-12d3-a456-426614174000",
          body: "Annotation body",
        };
        const result = createAnnotationSchema.safeParse(input);
        expect(result.success).toBe(true);
      }
    });

    test("accepts optional fields", () => {
      const input = {
        targetType: "motion",
        targetId: "123e4567-e89b-12d3-a456-426614174000",
        motionId: "223e4567-e89b-12d3-a456-426614174001",
        anchor: "section-2",
        body: "Annotation body",
        isPublished: true,
      };

      const result = createAnnotationSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("rejects empty body", () => {
      const input = {
        targetType: "motion",
        targetId: "123e4567-e89b-12d3-a456-426614174000",
        body: "",
      };

      const result = createAnnotationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("rejects body over 10000 characters", () => {
      const input = {
        targetType: "motion",
        targetId: "123e4567-e89b-12d3-a456-426614174000",
        body: "a".repeat(10001),
      };

      const result = createAnnotationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("createFlagSchema", () => {
    test("accepts valid flag input", () => {
      const input = {
        targetType: "event",
        targetId: "123e4567-e89b-12d3-a456-426614174000",
        flagType: "INSURANCE_REVIEW",
        title: "High-risk activity needs insurance verification",
      };

      const result = createFlagSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("accepts all flag types", () => {
      const types = [
        "INSURANCE_REVIEW",
        "LEGAL_REVIEW",
        "POLICY_REVIEW",
        "COMPLIANCE_CHECK",
        "GENERAL",
      ];
      for (const flagType of types) {
        const input = {
          targetType: "event",
          targetId: "123e4567-e89b-12d3-a456-426614174000",
          flagType,
          title: "Test flag",
        };
        const result = createFlagSchema.safeParse(input);
        expect(result.success).toBe(true);
      }
    });

    test("accepts all target types", () => {
      const types = ["page", "file", "policy", "event", "bylaw", "minutes", "motion"];
      for (const targetType of types) {
        const input = {
          targetType,
          targetId: "123e4567-e89b-12d3-a456-426614174000",
          flagType: "GENERAL",
          title: "Test flag",
        };
        const result = createFlagSchema.safeParse(input);
        expect(result.success).toBe(true);
      }
    });

    test("accepts optional fields", () => {
      const input = {
        targetType: "event",
        targetId: "123e4567-e89b-12d3-a456-426614174000",
        flagType: "INSURANCE_REVIEW",
        title: "Test flag",
        notes: "Detailed notes about the flag",
        dueDate: "2025-03-01T00:00:00Z",
      };

      const result = createFlagSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("rejects empty title", () => {
      const input = {
        targetType: "event",
        targetId: "123e4567-e89b-12d3-a456-426614174000",
        flagType: "GENERAL",
        title: "",
      };

      const result = createFlagSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("rejects title over 200 characters", () => {
      const input = {
        targetType: "event",
        targetId: "123e4567-e89b-12d3-a456-426614174000",
        flagType: "GENERAL",
        title: "a".repeat(201),
      };

      const result = createFlagSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("resolveFlagSchema", () => {
    test("accepts valid resolution input", () => {
      const input = {
        flagId: "123e4567-e89b-12d3-a456-426614174000",
        resolution: "Insurance verified with carrier",
        status: "RESOLVED",
      };

      const result = resolveFlagSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("accepts DISMISSED status", () => {
      const input = {
        flagId: "123e4567-e89b-12d3-a456-426614174000",
        resolution: "Not applicable - event cancelled",
        status: "DISMISSED",
      };

      const result = resolveFlagSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("rejects other statuses", () => {
      const input = {
        flagId: "123e4567-e89b-12d3-a456-426614174000",
        resolution: "Working on it",
        status: "IN_PROGRESS",
      };

      const result = resolveFlagSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("rejects empty resolution", () => {
      const input = {
        flagId: "123e4567-e89b-12d3-a456-426614174000",
        resolution: "",
        status: "RESOLVED",
      };

      const result = resolveFlagSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("paginationSchema", () => {
    test("provides defaults when no values given", () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    test("parses string values to numbers", () => {
      const result = paginationSchema.safeParse({ page: "3", limit: "50" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(50);
      }
    });

    test("rejects page less than 1", () => {
      const result = paginationSchema.safeParse({ page: "0" });
      expect(result.success).toBe(false);
    });

    test("rejects limit over 100", () => {
      const result = paginationSchema.safeParse({ limit: "101" });
      expect(result.success).toBe(false);
    });
  });
});
