import { describe, expect, test } from "vitest";
import {
  createServiceRecordSchema,
  closeServiceRecordSchema,
  createTransitionPlanSchema,
  createAssignmentSchema,
  paginationSchema,
  approvalSchema,
} from "@/lib/serviceHistory/validation";

describe("serviceHistory validation schemas", () => {
  describe("createServiceRecordSchema", () => {
    test("accepts valid service record input", () => {
      const input = {
        memberId: "123e4567-e89b-12d3-a456-426614174000",
        serviceType: "BOARD_OFFICER",
        roleTitle: "President",
        startAt: "2025-02-01T08:00:00.000Z",
      };

      const result = createServiceRecordSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.memberId).toBe(input.memberId);
        expect(result.data.serviceType).toBe("BOARD_OFFICER");
        expect(result.data.roleTitle).toBe("President");
        expect(result.data.startAt).toBeInstanceOf(Date);
      }
    });

    test("accepts optional fields", () => {
      const input = {
        memberId: "123e4567-e89b-12d3-a456-426614174000",
        serviceType: "COMMITTEE_CHAIR",
        roleTitle: "Chair",
        committeeId: "223e4567-e89b-12d3-a456-426614174001",
        termId: "323e4567-e89b-12d3-a456-426614174002",
        startAt: "2025-02-01T08:00:00.000Z",
        notes: "Test notes",
      };

      const result = createServiceRecordSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.committeeId).toBe(input.committeeId);
        expect(result.data.termId).toBe(input.termId);
        expect(result.data.notes).toBe("Test notes");
      }
    });

    test("rejects invalid member ID", () => {
      const input = {
        memberId: "invalid-uuid",
        serviceType: "BOARD_OFFICER",
        roleTitle: "President",
        startAt: "2025-02-01T08:00:00.000Z",
      };

      const result = createServiceRecordSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("rejects empty role title", () => {
      const input = {
        memberId: "123e4567-e89b-12d3-a456-426614174000",
        serviceType: "BOARD_OFFICER",
        roleTitle: "",
        startAt: "2025-02-01T08:00:00.000Z",
      };

      const result = createServiceRecordSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("rejects invalid service type", () => {
      const input = {
        memberId: "123e4567-e89b-12d3-a456-426614174000",
        serviceType: "INVALID_TYPE",
        roleTitle: "President",
        startAt: "2025-02-01T08:00:00.000Z",
      };

      const result = createServiceRecordSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("closeServiceRecordSchema", () => {
    test("accepts valid end date", () => {
      const input = { endAt: "2025-08-01T08:00:00.000Z" };
      const result = closeServiceRecordSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.endAt).toBeInstanceOf(Date);
      }
    });

    test("rejects invalid date format", () => {
      const input = { endAt: "not-a-date" };
      const result = closeServiceRecordSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("createTransitionPlanSchema", () => {
    test("accepts valid transition plan", () => {
      const input = {
        name: "Spring 2025 Transition",
        description: "Annual board transition",
        targetTermId: "123e4567-e89b-12d3-a456-426614174000",
        effectiveAt: "2025-02-01T08:00:00.000Z",
      };

      const result = createTransitionPlanSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe(input.name);
        expect(result.data.description).toBe(input.description);
        expect(result.data.effectiveAt).toBeInstanceOf(Date);
      }
    });

    test("rejects empty name", () => {
      const input = {
        name: "",
        targetTermId: "123e4567-e89b-12d3-a456-426614174000",
        effectiveAt: "2025-02-01T08:00:00.000Z",
      };

      const result = createTransitionPlanSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("rejects name over 100 characters", () => {
      const input = {
        name: "a".repeat(101),
        targetTermId: "123e4567-e89b-12d3-a456-426614174000",
        effectiveAt: "2025-02-01T08:00:00.000Z",
      };

      const result = createTransitionPlanSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("createAssignmentSchema", () => {
    test("accepts valid incoming assignment", () => {
      const input = {
        memberId: "123e4567-e89b-12d3-a456-426614174000",
        serviceType: "BOARD_OFFICER",
        roleTitle: "President",
        isOutgoing: false,
      };

      const result = createAssignmentSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isOutgoing).toBe(false);
      }
    });

    test("accepts valid outgoing assignment with existingServiceId", () => {
      const input = {
        memberId: "123e4567-e89b-12d3-a456-426614174000",
        serviceType: "BOARD_OFFICER",
        roleTitle: "President",
        isOutgoing: true,
        existingServiceId: "223e4567-e89b-12d3-a456-426614174001",
      };

      const result = createAssignmentSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isOutgoing).toBe(true);
        expect(result.data.existingServiceId).toBe(input.existingServiceId);
      }
    });
  });

  describe("approvalSchema", () => {
    test("accepts president role", () => {
      const result = approvalSchema.safeParse({ role: "president" });
      expect(result.success).toBe(true);
    });

    test("accepts vp-activities role", () => {
      const result = approvalSchema.safeParse({ role: "vp-activities" });
      expect(result.success).toBe(true);
    });

    test("rejects invalid role", () => {
      const result = approvalSchema.safeParse({ role: "secretary" });
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
