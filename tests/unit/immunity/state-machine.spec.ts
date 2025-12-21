// Copyright (c) Santa Barbara Newcomers Club
// Immunity Tests: State Machine Validation
//
// These tests verify that ClubOS uses explicit state machines
// and rejects invalid transitions (MF-5: Implicit State Machines).
//
// Narrative 6: State Machine Rejects Invalid Transition
// - Status fields are enums, not booleans
// - Invalid transitions return error
// - Transition validation runs before write
//
// These tests are BLOCKING. If they fail, merges are blocked.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventStatus, PageStatus, RegistrationStatus } from "@prisma/client";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({
        id: "test-audit-id",
        action: "UPDATE",
        resourceType: "Event",
        resourceId: "event-123",
        memberId: "test-member-id",
        metadata: {},
        createdAt: new Date(),
      }),
    },
  },
}));

// Mock audit module
vi.mock("@/lib/audit", () => ({
  createAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

// Import after mocks are set up
const { isValidTransition, EDITABLE_STATES } = await import("@/lib/events/status");

describe("Immunity: Status Is Enum (IMM-006)", () => {
  // ============================================================================
  // INVARIANT: EventStatus is an enum with explicit values
  // ============================================================================

  describe("EventStatus enum structure", () => {
    it("EventStatus has exactly 7 defined states", () => {
      const states = Object.values(EventStatus);
      expect(states).toHaveLength(7);
    });

    it("EventStatus includes required states", () => {
      const states = Object.values(EventStatus);
      expect(states).toContain("DRAFT");
      expect(states).toContain("PENDING_APPROVAL");
      expect(states).toContain("APPROVED");
      expect(states).toContain("PUBLISHED");
      expect(states).toContain("CANCELED");
      expect(states).toContain("COMPLETED");
      expect(states).toContain("CHANGES_REQUESTED");
    });

    it("EventStatus does not have boolean-like values", () => {
      const states = Object.values(EventStatus);
      // Should not have values that look like boolean alternatives
      expect(states).not.toContain("ACTIVE");
      expect(states).not.toContain("INACTIVE");
      expect(states).not.toContain("TRUE");
      expect(states).not.toContain("FALSE");
      expect(states).not.toContain("ENABLED");
      expect(states).not.toContain("DISABLED");
    });
  });

  // ============================================================================
  // INVARIANT: PageStatus is an enum with explicit values
  // ============================================================================

  describe("PageStatus enum structure", () => {
    it("PageStatus has defined states", () => {
      const states = Object.values(PageStatus);
      expect(states.length).toBeGreaterThan(0);
    });

    it("PageStatus includes required states", () => {
      const states = Object.values(PageStatus);
      expect(states).toContain("DRAFT");
      expect(states).toContain("PUBLISHED");
    });

    it("PageStatus does not have boolean-like values", () => {
      const states = Object.values(PageStatus);
      expect(states).not.toContain("ACTIVE");
      expect(states).not.toContain("INACTIVE");
    });
  });

  // ============================================================================
  // INVARIANT: RegistrationStatus is an enum with explicit values
  // ============================================================================

  describe("RegistrationStatus enum structure", () => {
    it("RegistrationStatus has defined states", () => {
      const states = Object.values(RegistrationStatus);
      expect(states.length).toBeGreaterThan(0);
    });

    it("RegistrationStatus includes required states", () => {
      const states = Object.values(RegistrationStatus);
      expect(states).toContain("CONFIRMED");
      expect(states).toContain("CANCELLED"); // British spelling in schema
    });
  });
});

describe("Immunity: Invalid Transition Rejected (IMM-007)", () => {
  // ============================================================================
  // INVARIANT: Direct jumps to COMPLETED are invalid
  // ============================================================================

  describe("invalid transitions are rejected", () => {
    it("rejects DRAFT -> COMPLETED (must go through workflow)", () => {
      const result = isValidTransition("DRAFT", "COMPLETED", false, false);
      expect(result).toBe(false);
    });

    it("rejects DRAFT -> PUBLISHED (must be approved first)", () => {
      const result = isValidTransition("DRAFT", "PUBLISHED", false, false);
      expect(result).toBe(false);
    });

    it("rejects DRAFT -> APPROVED (must go through pending)", () => {
      const result = isValidTransition("DRAFT", "APPROVED", false, false);
      expect(result).toBe(false);
    });

    it("rejects PUBLISHED -> DRAFT (cannot un-publish to draft)", () => {
      const result = isValidTransition("PUBLISHED", "DRAFT", false, true);
      expect(result).toBe(false);
    });

    it("rejects COMPLETED -> any state (terminal state)", () => {
      const allStates: EventStatus[] = [
        "DRAFT",
        "PENDING_APPROVAL",
        "APPROVED",
        "PUBLISHED",
        "CANCELED",
      ];

      allStates.forEach((targetState) => {
        const result = isValidTransition("COMPLETED", targetState, false, true);
        expect(result).toBe(false);
      });
    });
  });

  // ============================================================================
  // INVARIANT: Valid transitions are allowed
  // ============================================================================

  describe("valid transitions are allowed", () => {
    it("allows DRAFT -> PENDING_APPROVAL (chair submits)", () => {
      const result = isValidTransition("DRAFT", "PENDING_APPROVAL", true, false);
      expect(result).toBe(true);
    });

    it("allows PENDING_APPROVAL -> APPROVED (VP approves)", () => {
      const result = isValidTransition("PENDING_APPROVAL", "APPROVED", false, true);
      expect(result).toBe(true);
    });

    it("allows APPROVED -> PUBLISHED (VP publishes)", () => {
      const result = isValidTransition("APPROVED", "PUBLISHED", false, true);
      expect(result).toBe(true);
    });

    it("allows PUBLISHED -> CANCELED (VP cancels)", () => {
      const result = isValidTransition("PUBLISHED", "CANCELED", false, true);
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // INVARIANT: Editable states are explicit
  // ============================================================================

  describe("editable states are explicit", () => {
    it("EDITABLE_STATES includes DRAFT", () => {
      expect(EDITABLE_STATES).toContain("DRAFT");
    });

    it("EDITABLE_STATES includes CHANGES_REQUESTED", () => {
      expect(EDITABLE_STATES).toContain("CHANGES_REQUESTED");
    });

    it("EDITABLE_STATES does NOT include PUBLISHED", () => {
      expect(EDITABLE_STATES).not.toContain("PUBLISHED");
    });

    it("EDITABLE_STATES does NOT include COMPLETED", () => {
      expect(EDITABLE_STATES).not.toContain("COMPLETED");
    });

    it("EDITABLE_STATES does NOT include CANCELED", () => {
      expect(EDITABLE_STATES).not.toContain("CANCELED");
    });
  });
});

describe("Immunity: Transition Matrix Coverage (IMM-007b)", () => {
  // ============================================================================
  // PROPERTY: Every state pair has a defined outcome
  // ============================================================================

  it("all state pairs have defined behavior (not undefined)", () => {
    const allStates: EventStatus[] = Object.values(EventStatus);

    allStates.forEach((from) => {
      allStates.forEach((to) => {
        // Transition result should be boolean, not undefined
        const chairResult = isValidTransition(from, to, true, false);
        const vpResult = isValidTransition(from, to, false, true);

        expect(typeof chairResult).toBe("boolean");
        expect(typeof vpResult).toBe("boolean");
      });
    });
  });
});
