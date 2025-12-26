// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for event status lifecycle
// Charter P5: Approval chain enforced
// Charter P3: Explicit state machine (no boolean flags)
// Charter P7: Audit logging for all transitions

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventStatus } from "@prisma/client";
import { freezeTime, restoreTime } from "../../helpers/freezeTime";

// Mock prisma before importing status module
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

import { prisma } from "@/lib/prisma";
import type { AuthContext, GlobalRole } from "@/lib/auth";

// Import after mocks are set up
const {
  isValidTransition,
  getValidNextStates,
  getEffectiveStatus,
  isEventCompleted,
  canEditEventContent,
  EDITABLE_STATES,
  submitForApproval,
  approveEvent,
  requestChanges,
  publishEvent,
  cancelEvent,
} = await import("@/lib/events/status");

describe("Event Status Lifecycle", () => {
  // ============================================================================
  // HELPER FIXTURES
  // ============================================================================

  const createMockAuthContext = (role: GlobalRole, memberId: string = "test-member-id"): AuthContext => ({
    memberId,
    email: `${role}@test.com`,
    globalRole: role,
  });

  const adminActor = createMockAuthContext("admin", "admin-id");
  const vpActor = createMockAuthContext("vp-activities", "vp-id");
  const chairActor = createMockAuthContext("event-chair", "chair-id");
  const memberActor = createMockAuthContext("member", "member-id");

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    vi.mocked(prisma.event.findUnique).mockReset();
    vi.mocked(prisma.event.update).mockReset();
  });

  afterEach(() => {
    restoreTime();
  });

  /**
   * Helper to set up event mocks for transition tests.
   * Sets up both findUnique and update to return the expected event state.
   */
  function setupEventMocks(
    currentEvent: Record<string, unknown>,
    updatedEvent?: Record<string, unknown>
  ) {
    vi.mocked(prisma.event.findUnique).mockResolvedValue(currentEvent as never);
    if (updatedEvent) {
      vi.mocked(prisma.event.update).mockResolvedValue(updatedEvent as never);
    }
  }

  // ============================================================================
  // isValidTransition TESTS
  // ============================================================================

  describe("isValidTransition", () => {
    describe("Event Chair transitions", () => {
      it("allows chair to submit DRAFT event for approval", () => {
        expect(isValidTransition("DRAFT", "PENDING_APPROVAL", true, false)).toBe(true);
      });

      it("allows chair to resubmit CHANGES_REQUESTED event", () => {
        expect(isValidTransition("CHANGES_REQUESTED", "PENDING_APPROVAL", true, false)).toBe(true);
      });

      it("denies chair from approving events", () => {
        expect(isValidTransition("PENDING_APPROVAL", "APPROVED", true, false)).toBe(false);
      });

      it("denies chair from publishing events", () => {
        expect(isValidTransition("APPROVED", "PUBLISHED", true, false)).toBe(false);
      });

      it("denies chair from canceling events", () => {
        expect(isValidTransition("DRAFT", "CANCELED", true, false)).toBe(false);
        expect(isValidTransition("PENDING_APPROVAL", "CANCELED", true, false)).toBe(false);
      });

      it("denies chair from requesting changes", () => {
        expect(isValidTransition("PENDING_APPROVAL", "CHANGES_REQUESTED", true, false)).toBe(false);
      });
    });

    describe("VP of Activities transitions", () => {
      it("allows VP to approve pending events", () => {
        expect(isValidTransition("PENDING_APPROVAL", "APPROVED", false, true)).toBe(true);
      });

      it("allows VP to request changes on pending events", () => {
        expect(isValidTransition("PENDING_APPROVAL", "CHANGES_REQUESTED", false, true)).toBe(true);
      });

      it("allows VP to publish approved events", () => {
        expect(isValidTransition("APPROVED", "PUBLISHED", false, true)).toBe(true);
      });

      it("allows VP to cancel events from any cancelable state", () => {
        expect(isValidTransition("DRAFT", "CANCELED", false, true)).toBe(true);
        expect(isValidTransition("PENDING_APPROVAL", "CANCELED", false, true)).toBe(true);
        expect(isValidTransition("CHANGES_REQUESTED", "CANCELED", false, true)).toBe(true);
        expect(isValidTransition("APPROVED", "CANCELED", false, true)).toBe(true);
        expect(isValidTransition("PUBLISHED", "CANCELED", false, true)).toBe(true);
      });

      it("denies VP from canceling completed events", () => {
        expect(isValidTransition("COMPLETED", "CANCELED", false, true)).toBe(false);
      });

      it("allows VP to perform chair transitions as well", () => {
        expect(isValidTransition("DRAFT", "PENDING_APPROVAL", false, true)).toBe(true);
        expect(isValidTransition("CHANGES_REQUESTED", "PENDING_APPROVAL", false, true)).toBe(true);
      });
    });

    describe("Invalid transitions", () => {
      it("denies transition to COMPLETED (derived status)", () => {
        expect(isValidTransition("PUBLISHED", "COMPLETED", false, true)).toBe(false);
        expect(isValidTransition("PUBLISHED", "COMPLETED", true, true)).toBe(false);
      });

      it("denies skipping approval workflow", () => {
        expect(isValidTransition("DRAFT", "APPROVED", false, true)).toBe(false);
        expect(isValidTransition("DRAFT", "PUBLISHED", false, true)).toBe(false);
      });

      it("denies backward transitions", () => {
        expect(isValidTransition("APPROVED", "PENDING_APPROVAL", false, true)).toBe(false);
        expect(isValidTransition("PUBLISHED", "APPROVED", false, true)).toBe(false);
      });

      it("denies member from any transitions", () => {
        expect(isValidTransition("DRAFT", "PENDING_APPROVAL", false, false)).toBe(false);
        expect(isValidTransition("PENDING_APPROVAL", "APPROVED", false, false)).toBe(false);
      });
    });
  });

  // ============================================================================
  // getValidNextStates TESTS
  // ============================================================================

  describe("getValidNextStates", () => {
    it("returns submit option for chair on DRAFT event", async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValueOnce({
        id: "event-123",
        status: "DRAFT",
        eventChairId: "chair-id",
      } as never);

      const states = await getValidNextStates("event-123", chairActor);
      expect(states).toContain("PENDING_APPROVAL");
      expect(states).not.toContain("APPROVED");
      expect(states).not.toContain("CANCELED");
    });

    it("returns VP options for pending event", async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValueOnce({
        id: "event-123",
        status: "PENDING_APPROVAL",
        eventChairId: "other-chair-id",
      } as never);

      const states = await getValidNextStates("event-123", vpActor);
      expect(states).toContain("APPROVED");
      expect(states).toContain("CHANGES_REQUESTED");
      expect(states).toContain("CANCELED");
    });

    it("returns empty array for non-existent event", async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValueOnce(null);

      const states = await getValidNextStates("non-existent", vpActor);
      expect(states).toEqual([]);
    });

    it("returns empty array for member role", async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValueOnce({
        id: "event-123",
        status: "DRAFT",
        eventChairId: "other-chair-id",
      } as never);

      const states = await getValidNextStates("event-123", memberActor);
      expect(states).toEqual([]);
    });
  });

  // ============================================================================
  // EDITABLE_STATES TESTS
  // ============================================================================

  describe("EDITABLE_STATES", () => {
    it("includes DRAFT as editable", () => {
      expect(EDITABLE_STATES).toContain("DRAFT");
    });

    it("includes CHANGES_REQUESTED as editable", () => {
      expect(EDITABLE_STATES).toContain("CHANGES_REQUESTED");
    });

    it("does not include PENDING_APPROVAL as editable", () => {
      expect(EDITABLE_STATES).not.toContain("PENDING_APPROVAL");
    });

    it("does not include APPROVED as editable", () => {
      expect(EDITABLE_STATES).not.toContain("APPROVED");
    });

    it("does not include PUBLISHED as editable", () => {
      expect(EDITABLE_STATES).not.toContain("PUBLISHED");
    });
  });

  // ============================================================================
  // canEditEventContent TESTS
  // ============================================================================

  describe("canEditEventContent", () => {
    it("allows chair to edit DRAFT event", async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValueOnce({
        id: "event-123",
        status: "DRAFT",
        eventChairId: "chair-id",
      } as never);

      const result = await canEditEventContent("event-123", chairActor);
      expect(result.allowed).toBe(true);
    });

    it("allows chair to edit CHANGES_REQUESTED event", async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValueOnce({
        id: "event-123",
        status: "CHANGES_REQUESTED",
        eventChairId: "chair-id",
      } as never);

      const result = await canEditEventContent("event-123", chairActor);
      expect(result.allowed).toBe(true);
    });

    it("denies editing PENDING_APPROVAL event", async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValueOnce({
        id: "event-123",
        status: "PENDING_APPROVAL",
        eventChairId: "chair-id",
      } as never);

      const result = await canEditEventContent("event-123", chairActor);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("PENDING_APPROVAL");
    });

    it("denies editing PUBLISHED event", async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValueOnce({
        id: "event-123",
        status: "PUBLISHED",
        eventChairId: "chair-id",
      } as never);

      const result = await canEditEventContent("event-123", chairActor);
      expect(result.allowed).toBe(false);
    });

    it("denies non-chair/non-VP from editing", async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValueOnce({
        id: "event-123",
        status: "DRAFT",
        eventChairId: "other-chair-id",
      } as never);

      const result = await canEditEventContent("event-123", memberActor);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("permission");
    });

    it("returns not found for missing event", async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValueOnce(null);

      const result = await canEditEventContent("non-existent", chairActor);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Event not found");
    });
  });

  // ============================================================================
  // getEffectiveStatus TESTS
  // ============================================================================

  describe("getEffectiveStatus", () => {
    it("returns COMPLETED for published past event", () => {
      freezeTime("2025-01-15T12:00:00Z");
      const pastDate = new Date("2025-01-14T12:00:00Z"); // Yesterday
      const status = getEffectiveStatus({
        status: "PUBLISHED",
        startTime: pastDate,
        endTime: pastDate,
      });
      expect(status).toBe("COMPLETED");
    });

    it("returns PUBLISHED for future published event", () => {
      freezeTime("2025-01-15T12:00:00Z");
      const futureDate = new Date("2025-01-16T12:00:00Z"); // Tomorrow
      const status = getEffectiveStatus({
        status: "PUBLISHED",
        startTime: futureDate,
        endTime: futureDate,
      });
      expect(status).toBe("PUBLISHED");
    });

    it("returns original status for non-published events", () => {
      freezeTime("2025-01-15T12:00:00Z");
      const pastDate = new Date("2025-01-14T12:00:00Z");
      expect(getEffectiveStatus({ status: "DRAFT", startTime: pastDate, endTime: pastDate })).toBe("DRAFT");
      expect(getEffectiveStatus({ status: "APPROVED", startTime: pastDate, endTime: pastDate })).toBe("APPROVED");
      expect(getEffectiveStatus({ status: "CANCELED", startTime: pastDate, endTime: pastDate })).toBe("CANCELED");
    });

    it("uses default 2-hour duration when endTime is null", () => {
      freezeTime("2025-01-15T12:00:00Z");
      // Event that started 3 hours ago (should be completed)
      const threeHoursAgo = new Date("2025-01-15T09:00:00Z");
      expect(
        getEffectiveStatus({
          status: "PUBLISHED",
          startTime: threeHoursAgo,
          endTime: null,
        })
      ).toBe("COMPLETED");

      // Event that started 1 hour ago (not completed yet - within 2hr default)
      const oneHourAgo = new Date("2025-01-15T11:00:00Z");
      expect(
        getEffectiveStatus({
          status: "PUBLISHED",
          startTime: oneHourAgo,
          endTime: null,
        })
      ).toBe("PUBLISHED");
    });
  });

  // ============================================================================
  // isEventCompleted TESTS
  // ============================================================================

  describe("isEventCompleted", () => {
    it("returns true for completed events", () => {
      freezeTime("2025-01-15T12:00:00Z");
      const pastDate = new Date("2025-01-14T12:00:00Z");
      expect(
        isEventCompleted({
          status: "PUBLISHED",
          startTime: pastDate,
          endTime: pastDate,
        })
      ).toBe(true);
    });

    it("returns false for future published events", () => {
      freezeTime("2025-01-15T12:00:00Z");
      const futureDate = new Date("2025-01-16T12:00:00Z");
      expect(
        isEventCompleted({
          status: "PUBLISHED",
          startTime: futureDate,
          endTime: futureDate,
        })
      ).toBe(false);
    });

    it("returns false for non-published events even if past", () => {
      freezeTime("2025-01-15T12:00:00Z");
      const pastDate = new Date("2025-01-14T12:00:00Z");
      expect(
        isEventCompleted({
          status: "DRAFT",
          startTime: pastDate,
          endTime: pastDate,
        })
      ).toBe(false);
    });
  });

  // ============================================================================
  // TRANSITION ACTION TESTS
  // ============================================================================

  describe("submitForApproval", () => {
    it("successfully submits DRAFT event", async () => {
      const mockEvent = {
        id: "event-123",
        title: "Test Event",
        status: "DRAFT" as EventStatus,
        eventChairId: "chair-id",
        submittedAt: null,
        approvedAt: null,
        publishedAt: null,
        canceledAt: null,
        changesRequestedAt: null,
        rejectionNotes: null,
        approvalNotes: null,
        canceledReason: null,
      };

      setupEventMocks(mockEvent, {
        ...mockEvent,
        status: "PENDING_APPROVAL",
        submittedAt: new Date(),
      });

      const result = await submitForApproval({
        eventId: "event-123",
        actor: chairActor,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.event.status).toBe("PENDING_APPROVAL");
      }
    });

    it("rejects submission from non-chair member", async () => {
      setupEventMocks({
        id: "event-123",
        title: "Test Event",
        status: "DRAFT",
        eventChairId: "other-chair-id",
        submittedAt: null,
        approvedAt: null,
        publishedAt: null,
        canceledAt: null,
        changesRequestedAt: null,
        rejectionNotes: null,
        approvalNotes: null,
        canceledReason: null,
      });

      const result = await submitForApproval({
        eventId: "event-123",
        actor: memberActor,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("approveEvent", () => {
    it("successfully approves pending event as VP", async () => {
      const mockEvent = {
        id: "event-123",
        title: "Test Event",
        status: "PENDING_APPROVAL" as EventStatus,
        eventChairId: "chair-id",
        submittedAt: new Date(),
        approvedAt: null,
        publishedAt: null,
        canceledAt: null,
        changesRequestedAt: null,
        rejectionNotes: null,
        approvalNotes: null,
        canceledReason: null,
      };

      setupEventMocks(mockEvent, {
        ...mockEvent,
        status: "APPROVED",
        approvedAt: new Date(),
      });

      const result = await approveEvent({
        eventId: "event-123",
        actor: vpActor,
        note: "Looks good!",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.event.status).toBe("APPROVED");
      }
    });

    it("rejects approval from event chair", async () => {
      setupEventMocks({
        id: "event-123",
        title: "Test Event",
        status: "PENDING_APPROVAL",
        eventChairId: "chair-id",
        submittedAt: new Date(),
        approvedAt: null,
        publishedAt: null,
        canceledAt: null,
        changesRequestedAt: null,
        rejectionNotes: null,
        approvalNotes: null,
        canceledReason: null,
      });

      const result = await approveEvent({
        eventId: "event-123",
        actor: chairActor,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("INVALID_TRANSITION");
      }
    });
  });

  describe("requestChanges", () => {
    it("requires a note/reason", async () => {
      const result = await requestChanges({
        eventId: "event-123",
        actor: vpActor,
        // No note provided
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("INVALID_TRANSITION");
        expect(result.error).toContain("reason is required");
      }
    });

    it("successfully requests changes with note", async () => {
      const mockEvent = {
        id: "event-123",
        title: "Test Event",
        status: "PENDING_APPROVAL" as EventStatus,
        eventChairId: "chair-id",
        submittedAt: new Date(),
        approvedAt: null,
        publishedAt: null,
        canceledAt: null,
        changesRequestedAt: null,
        rejectionNotes: null,
        approvalNotes: null,
        canceledReason: null,
      };

      setupEventMocks(mockEvent, {
        ...mockEvent,
        status: "CHANGES_REQUESTED",
        changesRequestedAt: new Date(),
        rejectionNotes: "Please add more details",
      });

      const result = await requestChanges({
        eventId: "event-123",
        actor: vpActor,
        note: "Please add more details",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.event.status).toBe("CHANGES_REQUESTED");
      }
    });
  });

  describe("publishEvent", () => {
    it("successfully publishes approved event", async () => {
      const mockEvent = {
        id: "event-123",
        title: "Test Event",
        status: "APPROVED" as EventStatus,
        eventChairId: "chair-id",
        submittedAt: new Date(),
        approvedAt: new Date(),
        publishedAt: null,
        canceledAt: null,
        changesRequestedAt: null,
        rejectionNotes: null,
        approvalNotes: null,
        canceledReason: null,
      };

      setupEventMocks(mockEvent, {
        ...mockEvent,
        status: "PUBLISHED",
        publishedAt: new Date(),
      });

      const result = await publishEvent({
        eventId: "event-123",
        actor: vpActor,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.event.status).toBe("PUBLISHED");
      }
    });

    it("rejects publishing from DRAFT", async () => {
      setupEventMocks({
        id: "event-123",
        title: "Test Event",
        status: "DRAFT",
        eventChairId: "chair-id",
        submittedAt: null,
        approvedAt: null,
        publishedAt: null,
        canceledAt: null,
        changesRequestedAt: null,
        rejectionNotes: null,
        approvalNotes: null,
        canceledReason: null,
      });

      const result = await publishEvent({
        eventId: "event-123",
        actor: vpActor,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("INVALID_TRANSITION");
      }
    });
  });

  describe("cancelEvent", () => {
    it("successfully cancels published event", async () => {
      const mockEvent = {
        id: "event-123",
        title: "Test Event",
        status: "PUBLISHED" as EventStatus,
        eventChairId: "chair-id",
        submittedAt: new Date(),
        approvedAt: new Date(),
        publishedAt: new Date(),
        canceledAt: null,
        changesRequestedAt: null,
        rejectionNotes: null,
        approvalNotes: null,
        canceledReason: null,
      };

      setupEventMocks(mockEvent, {
        ...mockEvent,
        status: "CANCELED",
        canceledAt: new Date(),
        canceledReason: "Weather emergency",
      });

      const result = await cancelEvent({
        eventId: "event-123",
        actor: vpActor,
        note: "Weather emergency",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.event.status).toBe("CANCELED");
      }
    });

    it("rejects cancellation by chair", async () => {
      setupEventMocks({
        id: "event-123",
        title: "Test Event",
        status: "PUBLISHED",
        eventChairId: "chair-id",
        submittedAt: new Date(),
        approvedAt: new Date(),
        publishedAt: new Date(),
        canceledAt: null,
        changesRequestedAt: null,
        rejectionNotes: null,
        approvalNotes: null,
        canceledReason: null,
      });

      const result = await cancelEvent({
        eventId: "event-123",
        actor: chairActor,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("INVALID_TRANSITION");
      }
    });
  });

  describe("NOT_FOUND handling", () => {
    it("returns NOT_FOUND for non-existent event", async () => {
      setupEventMocks(null as never);

      const result = await submitForApproval({
        eventId: "non-existent",
        actor: chairActor,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("NOT_FOUND");
      }
    });
  });

  // ============================================================================
  // ADMIN ACCESS TESTS
  // ============================================================================

  describe("Admin access", () => {
    it("admin can perform all VP transitions", async () => {
      const mockEvent = {
        id: "event-123",
        title: "Test Event",
        status: "PENDING_APPROVAL" as EventStatus,
        eventChairId: "chair-id",
        submittedAt: new Date(),
        approvedAt: null,
        publishedAt: null,
        canceledAt: null,
        changesRequestedAt: null,
        rejectionNotes: null,
        approvalNotes: null,
        canceledReason: null,
      };

      setupEventMocks(mockEvent, {
        ...mockEvent,
        status: "APPROVED",
        approvedAt: new Date(),
      });

      const result = await approveEvent({
        eventId: "event-123",
        actor: adminActor,
      });

      expect(result.ok).toBe(true);
    });
  });
});
