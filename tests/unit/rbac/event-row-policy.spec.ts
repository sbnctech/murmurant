/**
 * Event Row-Level Policy Tests
 *
 * Tests for security invariants SI-1 through SI-7.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { describe, it, expect } from "vitest";
import {
  canViewEvent,
  canEditEventContent,
  canEditEventStatus,
  canDeleteEvent,
  canRegisterForEvent,
  getEventQueryFilter,
  filterVisibleEvents,
  EDITABLE_STATES,
  EventRowContext,
} from "@/lib/rbac/event-row-policy";
import { AuthContext, GlobalRole } from "@/lib/auth";
import { EventStatus } from "@prisma/client";

// ============================================================================
// TEST FIXTURES
// ============================================================================

function makeActor(role: GlobalRole, memberId = "actor-id"): AuthContext {
  return {
    memberId,
    email: `${role}@test.com`,
    globalRole: role,
  };
}

function makeEvent(
  status: EventStatus,
  eventChairId: string | null = null
): EventRowContext {
  return {
    id: "event-id",
    status,
    eventChairId,
    startTime: new Date(Date.now() + 86400000), // Tomorrow
    endTime: new Date(Date.now() + 90000000),
  };
}

// ============================================================================
// SI-1: Members see only PUBLISHED events
// ============================================================================

describe("SI-1: Members see only PUBLISHED events", () => {
  const member = makeActor("member");

  it("allows member to view PUBLISHED event", () => {
    const event = makeEvent("PUBLISHED");
    const result = canViewEvent(member, event);
    expect(result.allowed).toBe(true);
    expect(result.invariant).toBe("SI-1");
  });

  it("allows member to view COMPLETED event", () => {
    const event = makeEvent("COMPLETED");
    const result = canViewEvent(member, event);
    expect(result.allowed).toBe(true);
  });

  it("denies member viewing DRAFT event", () => {
    const event = makeEvent("DRAFT");
    const result = canViewEvent(member, event);
    expect(result.allowed).toBe(false);
    expect(result.invariant).toBe("SI-1");
  });

  it("denies member viewing PENDING_APPROVAL event", () => {
    const event = makeEvent("PENDING_APPROVAL");
    const result = canViewEvent(member, event);
    expect(result.allowed).toBe(false);
  });

  it("denies member viewing APPROVED event", () => {
    const event = makeEvent("APPROVED");
    const result = canViewEvent(member, event);
    expect(result.allowed).toBe(false);
  });

  it("denies member viewing CHANGES_REQUESTED event", () => {
    const event = makeEvent("CHANGES_REQUESTED");
    const result = canViewEvent(member, event);
    expect(result.allowed).toBe(false);
  });

  it("denies member viewing CANCELED event", () => {
    const event = makeEvent("CANCELED");
    const result = canViewEvent(member, event);
    expect(result.allowed).toBe(false);
  });
});

// ============================================================================
// SI-2: Event Chairs can view/edit their own events
// ============================================================================

describe("SI-2: Event Chairs can view/edit their own events", () => {
  const chairId = "chair-member-id";
  const chair = makeActor("event-chair", chairId);

  it("allows chair to view their DRAFT event", () => {
    const event = makeEvent("DRAFT", chairId);
    const result = canViewEvent(chair, event);
    expect(result.allowed).toBe(true);
    // Event chair role has events:view capability, so uses SI-3 (officer access)
    expect(result.invariant).toBe("SI-3");
  });

  it("allows chair to view their PENDING_APPROVAL event", () => {
    const event = makeEvent("PENDING_APPROVAL", chairId);
    const result = canViewEvent(chair, event);
    expect(result.allowed).toBe(true);
  });

  it("allows chair to edit their DRAFT event content", () => {
    const event = makeEvent("DRAFT", chairId);
    const result = canEditEventContent(chair, event);
    expect(result.allowed).toBe(true);
    expect(result.invariant).toBe("SI-2");
  });

  it("allows chair to edit their CHANGES_REQUESTED event", () => {
    const event = makeEvent("CHANGES_REQUESTED", chairId);
    const result = canEditEventContent(chair, event);
    expect(result.allowed).toBe(true);
  });

  it("denies chair editing another chair's event", () => {
    const event = makeEvent("DRAFT", "other-chair-id");
    const result = canEditEventContent(chair, event);
    expect(result.allowed).toBe(false);
  });

  it("allows chair to submit their event for approval", () => {
    const event = makeEvent("DRAFT", chairId);
    const result = canEditEventStatus(chair, event, "PENDING_APPROVAL");
    expect(result.allowed).toBe(true);
    expect(result.invariant).toBe("SI-2");
  });

  it("allows chair to resubmit after changes requested", () => {
    const event = makeEvent("CHANGES_REQUESTED", chairId);
    const result = canEditEventStatus(chair, event, "PENDING_APPROVAL");
    expect(result.allowed).toBe(true);
  });

  it("denies chair approving their own event", () => {
    const event = makeEvent("PENDING_APPROVAL", chairId);
    const result = canEditEventStatus(chair, event, "APPROVED");
    expect(result.allowed).toBe(false);
  });

  it("denies chair publishing their own event", () => {
    const event = makeEvent("APPROVED", chairId);
    const result = canEditEventStatus(chair, event, "PUBLISHED");
    expect(result.allowed).toBe(false);
  });

  it("denies chair canceling their own event", () => {
    const event = makeEvent("DRAFT", chairId);
    const result = canEditEventStatus(chair, event, "CANCELED");
    expect(result.allowed).toBe(false);
  });
});

// ============================================================================
// SI-3: VP Activities can view/edit ALL events
// ============================================================================

describe("SI-3: VP Activities can view/edit ALL events", () => {
  const vp = makeActor("vp-activities");

  it("allows VP to view any DRAFT event", () => {
    const event = makeEvent("DRAFT", "other-chair");
    const result = canViewEvent(vp, event);
    expect(result.allowed).toBe(true);
    expect(result.invariant).toBe("SI-3");
  });

  it("allows VP to view any PENDING_APPROVAL event", () => {
    const event = makeEvent("PENDING_APPROVAL", "other-chair");
    const result = canViewEvent(vp, event);
    expect(result.allowed).toBe(true);
  });

  it("allows VP to edit any DRAFT event", () => {
    const event = makeEvent("DRAFT", "other-chair");
    const result = canEditEventContent(vp, event);
    expect(result.allowed).toBe(true);
    expect(result.invariant).toBe("SI-3");
  });

  it("allows VP to approve pending events", () => {
    const event = makeEvent("PENDING_APPROVAL");
    const result = canEditEventStatus(vp, event, "APPROVED");
    expect(result.allowed).toBe(true);
    expect(result.invariant).toBe("SI-3");
  });

  it("allows VP to request changes", () => {
    const event = makeEvent("PENDING_APPROVAL");
    const result = canEditEventStatus(vp, event, "CHANGES_REQUESTED");
    expect(result.allowed).toBe(true);
  });

  it("allows VP to publish approved events", () => {
    const event = makeEvent("APPROVED");
    const result = canEditEventStatus(vp, event, "PUBLISHED");
    expect(result.allowed).toBe(true);
  });

  it("allows VP to cancel any event", () => {
    const event = makeEvent("PUBLISHED");
    const result = canEditEventStatus(vp, event, "CANCELED");
    expect(result.allowed).toBe(true);
  });
});

// ============================================================================
// SI-4: Admin can view/edit/delete ALL events
// ============================================================================

describe("SI-4: Admin can view/edit/delete ALL events", () => {
  const admin = makeActor("admin");

  it("allows admin to view any event in any status", () => {
    const statuses: EventStatus[] = [
      "DRAFT",
      "PENDING_APPROVAL",
      "CHANGES_REQUESTED",
      "APPROVED",
      "PUBLISHED",
      "CANCELED",
      "COMPLETED",
    ];

    for (const status of statuses) {
      const event = makeEvent(status);
      const result = canViewEvent(admin, event);
      expect(result.allowed).toBe(true);
      expect(result.invariant).toBe("SI-4");
    }
  });

  it("allows admin to edit any DRAFT event", () => {
    const event = makeEvent("DRAFT", "any-chair");
    const result = canEditEventContent(admin, event);
    expect(result.allowed).toBe(true);
    expect(result.invariant).toBe("SI-4");
  });

  it("allows admin to perform any status transition", () => {
    const event = makeEvent("DRAFT");
    const result = canEditEventStatus(admin, event, "PUBLISHED");
    expect(result.allowed).toBe(true);
    expect(result.invariant).toBe("SI-4");
  });

  it("allows admin to delete events", () => {
    const event = makeEvent("DRAFT");
    const result = canDeleteEvent(admin, event);
    expect(result.allowed).toBe(true);
    expect(result.invariant).toBe("SI-5");
  });
});

// ============================================================================
// SI-5: Only Admin can delete events (VP cannot)
// ============================================================================

describe("SI-5: Only Admin can delete events", () => {
  it("allows admin to delete", () => {
    const admin = makeActor("admin");
    const event = makeEvent("DRAFT");
    const result = canDeleteEvent(admin, event);
    expect(result.allowed).toBe(true);
    expect(result.invariant).toBe("SI-5");
  });

  it("denies VP from deleting", () => {
    const vp = makeActor("vp-activities");
    const event = makeEvent("DRAFT");
    const result = canDeleteEvent(vp, event);
    expect(result.allowed).toBe(false);
    expect(result.invariant).toBe("SI-5");
    expect(result.reason).toContain("cancellation workflow");
  });

  it("denies event chair from deleting", () => {
    const chair = makeActor("event-chair", "chair-id");
    const event = makeEvent("DRAFT", "chair-id");
    const result = canDeleteEvent(chair, event);
    expect(result.allowed).toBe(false);
    expect(result.invariant).toBe("SI-5");
  });

  it("denies member from deleting", () => {
    const member = makeActor("member");
    const event = makeEvent("PUBLISHED");
    const result = canDeleteEvent(member, event);
    expect(result.allowed).toBe(false);
  });

  it("denies president from deleting", () => {
    const president = makeActor("president");
    const event = makeEvent("DRAFT");
    const result = canDeleteEvent(president, event);
    expect(result.allowed).toBe(false);
  });
});

// ============================================================================
// SI-6: Content editing restricted to DRAFT/CHANGES_REQUESTED
// ============================================================================

describe("SI-6: Content editing restricted to editable states", () => {
  const admin = makeActor("admin");
  const vp = makeActor("vp-activities");

  it("defines correct editable states", () => {
    expect(EDITABLE_STATES).toEqual(["DRAFT", "CHANGES_REQUESTED"]);
  });

  it("allows editing in DRAFT status", () => {
    const event = makeEvent("DRAFT");
    const result = canEditEventContent(admin, event);
    expect(result.allowed).toBe(true);
  });

  it("allows editing in CHANGES_REQUESTED status", () => {
    const event = makeEvent("CHANGES_REQUESTED");
    const result = canEditEventContent(admin, event);
    expect(result.allowed).toBe(true);
  });

  it("denies editing in PENDING_APPROVAL status", () => {
    const event = makeEvent("PENDING_APPROVAL");
    const result = canEditEventContent(admin, event);
    expect(result.allowed).toBe(false);
    expect(result.invariant).toBe("SI-6");
  });

  it("denies editing in APPROVED status", () => {
    const event = makeEvent("APPROVED");
    const result = canEditEventContent(admin, event);
    expect(result.allowed).toBe(false);
    expect(result.invariant).toBe("SI-6");
  });

  it("denies editing in PUBLISHED status", () => {
    const event = makeEvent("PUBLISHED");
    const result = canEditEventContent(admin, event);
    expect(result.allowed).toBe(false);
    expect(result.invariant).toBe("SI-6");
  });

  it("denies editing in CANCELED status", () => {
    const event = makeEvent("CANCELED");
    const result = canEditEventContent(vp, event);
    expect(result.allowed).toBe(false);
    expect(result.invariant).toBe("SI-6");
  });

  it("denies editing in COMPLETED status", () => {
    const event = makeEvent("COMPLETED");
    const result = canEditEventContent(vp, event);
    expect(result.allowed).toBe(false);
    expect(result.invariant).toBe("SI-6");
  });
});

// ============================================================================
// SI-7: Public/anonymous users
// ============================================================================

describe("SI-7: Public/anonymous users", () => {
  it("allows null actor to view PUBLISHED event", () => {
    const event = makeEvent("PUBLISHED");
    const result = canViewEvent(null, event);
    expect(result.allowed).toBe(true);
    expect(result.invariant).toBe("SI-1");
  });

  it("denies null actor viewing DRAFT event", () => {
    const event = makeEvent("DRAFT");
    const result = canViewEvent(null, event);
    expect(result.allowed).toBe(false);
  });

  it("denies null actor registration", () => {
    const event = makeEvent("PUBLISHED");
    const result = canRegisterForEvent(null, event);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Authentication");
  });
});

// ============================================================================
// Query Filters
// ============================================================================

describe("getEventQueryFilter", () => {
  it("returns empty filter for admin", () => {
    const admin = makeActor("admin");
    const filter = getEventQueryFilter(admin);
    expect(filter).toEqual({});
  });

  it("returns empty filter for VP", () => {
    const vp = makeActor("vp-activities");
    const filter = getEventQueryFilter(vp);
    expect(filter).toEqual({});
  });

  it("returns empty filter for event chair (has events:view)", () => {
    const chair = makeActor("event-chair", "chair-id");
    const filter = getEventQueryFilter(chair);
    // Event chair role has events:view capability, so sees all events
    expect(filter).toEqual({});
  });

  it("returns OR filter for member", () => {
    const member = makeActor("member", "member-id");
    const filter = getEventQueryFilter(member);
    expect(filter.OR).toBeDefined();
    expect(filter.OR).toContainEqual({ eventChairId: "member-id" });
    expect(filter.OR).toContainEqual({
      status: { in: ["PUBLISHED", "COMPLETED"] },
    });
  });

  it("returns published-only filter for null actor", () => {
    const filter = getEventQueryFilter(null);
    expect(filter).toEqual({
      status: { in: ["PUBLISHED", "COMPLETED"] },
    });
  });
});

// ============================================================================
// filterVisibleEvents
// ============================================================================

describe("filterVisibleEvents", () => {
  it("filters events based on actor permissions", () => {
    const member = makeActor("member");
    const events: EventRowContext[] = [
      makeEvent("PUBLISHED"),
      makeEvent("DRAFT"),
      makeEvent("APPROVED"),
      makeEvent("COMPLETED"),
    ];

    const visible = filterVisibleEvents(events, member);
    expect(visible).toHaveLength(2);
    expect(visible.every((e) => ["PUBLISHED", "COMPLETED"].includes(e.status))).toBe(
      true
    );
  });

  it("returns all events for admin", () => {
    const admin = makeActor("admin");
    const events: EventRowContext[] = [
      makeEvent("PUBLISHED"),
      makeEvent("DRAFT"),
      makeEvent("APPROVED"),
      makeEvent("CANCELED"),
    ];

    const visible = filterVisibleEvents(events, admin);
    expect(visible).toHaveLength(4);
  });

  it("event chair with events:view sees all events", () => {
    const chair = makeActor("event-chair", "chair-id");
    const events: EventRowContext[] = [
      { ...makeEvent("DRAFT", "chair-id"), id: "chair-draft" },
      { ...makeEvent("PENDING_APPROVAL", "chair-id"), id: "chair-pending" },
      { ...makeEvent("DRAFT", "other-chair"), id: "other-draft" },
      { ...makeEvent("PUBLISHED", "other-chair"), id: "other-published" },
    ];

    const visible = filterVisibleEvents(events, chair);
    // Event chair role has events:view capability, so sees ALL events
    expect(visible).toHaveLength(4);
  });
});

// ============================================================================
// Registration
// ============================================================================

describe("canRegisterForEvent", () => {
  const member = makeActor("member");

  it("allows registration for published event", () => {
    const event = makeEvent("PUBLISHED");
    const result = canRegisterForEvent(member, event);
    expect(result.allowed).toBe(true);
  });

  it("denies registration for draft event", () => {
    const event = makeEvent("DRAFT");
    const result = canRegisterForEvent(member, event);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("published");
  });

  it("denies registration for past event", () => {
    const event: EventRowContext = {
      id: "past-event",
      status: "PUBLISHED",
      eventChairId: null,
      startTime: new Date(Date.now() - 86400000), // Yesterday
      endTime: new Date(Date.now() - 82800000),
    };
    const result = canRegisterForEvent(member, event);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("ended");
  });

  it("requires authentication", () => {
    const event = makeEvent("PUBLISHED");
    const result = canRegisterForEvent(null, event);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Authentication");
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Edge cases", () => {
  it("handles null eventChairId", () => {
    const chair = makeActor("event-chair", "chair-id");
    const event = makeEvent("DRAFT", null);
    const result = canEditEventContent(chair, event);
    expect(result.allowed).toBe(false);
  });

  it("handles COMPLETED status correctly for transitions", () => {
    const vp = makeActor("vp-activities");
    const event = makeEvent("DRAFT");
    const result = canEditEventStatus(vp, event, "COMPLETED");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("derived");
  });

  it("president cannot delete events", () => {
    const president = makeActor("president");
    const event = makeEvent("DRAFT");
    const result = canDeleteEvent(president, event);
    expect(result.allowed).toBe(false);
  });

  it("webmaster has no event access", () => {
    const webmaster = makeActor("webmaster");
    const event = makeEvent("DRAFT");
    const viewResult = canViewEvent(webmaster, event);
    expect(viewResult.allowed).toBe(false);
  });
});
