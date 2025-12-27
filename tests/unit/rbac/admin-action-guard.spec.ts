/**
 * Admin Action Guard Tests
 *
 * Tests for action guards, audit logging, and escalation detection.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  guardViewEvent,
  guardEditEventContent,
  guardEditEventStatus,
  guardDeleteEvent,
  guardEventRegistration,
  guardBulkStatusChange,
  guardAdminOverride,
  canPerformAdminOverride,
  detectEscalationPattern,
  GuardContext,
} from "@/lib/rbac/admin-action-guard";
import { EventRowContext } from "@/lib/rbac/event-row-policy";
import { AuthContext, GlobalRole } from "@/lib/auth";
import { EventStatus } from "@prisma/client";

// Mock the audit module
vi.mock("@/lib/audit", () => ({
  createAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

import { createAuditEntry } from "@/lib/audit";

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
    startTime: new Date(Date.now() + 86400000),
    endTime: new Date(Date.now() + 90000000),
  };
}

function makeGuardContext(
  role: GlobalRole,
  status: EventStatus,
  eventChairId: string | null = null,
  actorMemberId = "actor-id"
): GuardContext {
  return {
    actor: makeActor(role, actorMemberId),
    event: makeEvent(status, eventChairId),
  };
}

// ============================================================================
// GUARD TESTS
// ============================================================================

describe("guardViewEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin to view any event", async () => {
    const ctx = makeGuardContext("admin", "DRAFT");
    const result = await guardViewEvent(ctx, { skipAudit: true });
    expect(result.ok).toBe(true);
  });

  it("allows VP to view any event", async () => {
    const ctx = makeGuardContext("vp-activities", "DRAFT");
    const result = await guardViewEvent(ctx, { skipAudit: true });
    expect(result.ok).toBe(true);
  });

  it("denies member viewing DRAFT event", async () => {
    const ctx = makeGuardContext("member", "DRAFT");
    const result = await guardViewEvent(ctx, { skipAudit: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("FORBIDDEN");
    }
  });

  it("creates audit entry on view", async () => {
    const ctx = makeGuardContext("admin", "DRAFT");
    await guardViewEvent(ctx);
    expect(createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceType: "Event",
        resourceId: "event-id",
        metadata: expect.objectContaining({
          guardAction: "view",
          decision: "ALLOWED",
        }),
      })
    );
  });

  it("creates audit entry on denied view", async () => {
    const ctx = makeGuardContext("member", "DRAFT");
    await guardViewEvent(ctx);
    expect(createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          guardAction: "view",
          decision: "DENIED",
        }),
      })
    );
  });
});

describe("guardEditEventContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin to edit DRAFT event", async () => {
    const ctx = makeGuardContext("admin", "DRAFT");
    const result = await guardEditEventContent(ctx, { skipAudit: true });
    expect(result.ok).toBe(true);
  });

  it("allows chair to edit their DRAFT event", async () => {
    const ctx = makeGuardContext("event-chair", "DRAFT", "actor-id", "actor-id");
    const result = await guardEditEventContent(ctx, { skipAudit: true });
    expect(result.ok).toBe(true);
  });

  it("denies edit in PUBLISHED status", async () => {
    const ctx = makeGuardContext("admin", "PUBLISHED");
    const result = await guardEditEventContent(ctx, { skipAudit: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_STATE");
    }
  });

  it("denies chair editing another's event", async () => {
    const ctx = makeGuardContext("event-chair", "DRAFT", "other-chair", "actor-id");
    const result = await guardEditEventContent(ctx, { skipAudit: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("FORBIDDEN");
    }
  });

  it("creates audit entry with edit action", async () => {
    const ctx = makeGuardContext("admin", "DRAFT");
    await guardEditEventContent(ctx);
    expect(createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          guardAction: "edit_content",
        }),
      })
    );
  });
});

describe("guardEditEventStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows VP to approve pending event", async () => {
    const ctx = makeGuardContext("vp-activities", "PENDING_APPROVAL");
    const result = await guardEditEventStatus(ctx, "APPROVED", { skipAudit: true });
    expect(result.ok).toBe(true);
  });

  it("allows chair to submit for approval", async () => {
    const ctx = makeGuardContext("event-chair", "DRAFT", "actor-id", "actor-id");
    const result = await guardEditEventStatus(ctx, "PENDING_APPROVAL", {
      skipAudit: true,
    });
    expect(result.ok).toBe(true);
  });

  it("denies chair approving their own event", async () => {
    const ctx = makeGuardContext("event-chair", "PENDING_APPROVAL", "actor-id", "actor-id");
    const result = await guardEditEventStatus(ctx, "APPROVED", { skipAudit: true });
    expect(result.ok).toBe(false);
  });

  it("creates audit entry with before/after state", async () => {
    const ctx = makeGuardContext("vp-activities", "PENDING_APPROVAL");
    await guardEditEventStatus(ctx, "APPROVED");
    expect(createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        before: { status: "PENDING_APPROVAL" },
        after: { status: "APPROVED" },
        metadata: expect.objectContaining({
          transition: "PENDING_APPROVAL -> APPROVED",
        }),
      })
    );
  });
});

describe("guardDeleteEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin to delete", async () => {
    const ctx = makeGuardContext("admin", "DRAFT");
    const result = await guardDeleteEvent(ctx, { skipAudit: true });
    expect(result.ok).toBe(true);
  });

  it("denies VP from deleting", async () => {
    const ctx = makeGuardContext("vp-activities", "DRAFT");
    const result = await guardDeleteEvent(ctx, { skipAudit: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("FORBIDDEN");
      expect(result.error).toContain("cancellation");
    }
  });

  it("denies chair from deleting", async () => {
    const ctx = makeGuardContext("event-chair", "DRAFT", "actor-id", "actor-id");
    const result = await guardDeleteEvent(ctx, { skipAudit: true });
    expect(result.ok).toBe(false);
  });

  it("creates audit entry on delete attempt", async () => {
    const ctx = makeGuardContext("vp-activities", "DRAFT");
    await guardDeleteEvent(ctx);
    expect(createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          guardAction: "delete",
          decision: "DENIED",
        }),
      })
    );
  });
});

describe("guardEventRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows member to register for published event", async () => {
    const ctx = makeGuardContext("member", "PUBLISHED");
    const result = await guardEventRegistration(ctx, { skipAudit: true });
    expect(result.ok).toBe(true);
  });

  it("denies registration for draft event", async () => {
    const ctx = makeGuardContext("member", "DRAFT");
    const result = await guardEventRegistration(ctx, { skipAudit: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("FORBIDDEN");
    }
  });

  it("creates audit entry for registration", async () => {
    const ctx = makeGuardContext("member", "PUBLISHED");
    await guardEventRegistration(ctx);
    expect(createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          guardAction: "register",
        }),
      })
    );
  });
});

// ============================================================================
// BULK OPERATIONS
// ============================================================================

describe("guardBulkStatusChange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("separates allowed and denied events", async () => {
    const vp = makeActor("vp-activities");
    const events: EventRowContext[] = [
      makeEvent("PENDING_APPROVAL"),
      makeEvent("DRAFT"), // VP cannot transition DRAFT -> APPROVED
      makeEvent("APPROVED"), // VP cannot transition APPROVED -> APPROVED
    ];

    const result = await guardBulkStatusChange(vp, events, "APPROVED");
    expect(result.allowed).toHaveLength(1);
    expect(result.denied).toHaveLength(2);
  });

  it("audits each event individually", async () => {
    const vp = makeActor("vp-activities");
    const events: EventRowContext[] = [
      { ...makeEvent("PENDING_APPROVAL"), id: "event-1" },
      { ...makeEvent("PENDING_APPROVAL"), id: "event-2" },
    ];

    await guardBulkStatusChange(vp, events, "APPROVED");
    expect(createAuditEntry).toHaveBeenCalledTimes(2);
    expect(createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ resourceId: "event-1" })
    );
    expect(createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ resourceId: "event-2" })
    );
  });
});

// ============================================================================
// ADMIN OVERRIDE
// ============================================================================

describe("canPerformAdminOverride", () => {
  it("returns true for admin", () => {
    const admin = makeActor("admin");
    expect(canPerformAdminOverride(admin)).toBe(true);
  });

  it("returns false for VP", () => {
    const vp = makeActor("vp-activities");
    expect(canPerformAdminOverride(vp)).toBe(false);
  });

  it("returns false for president", () => {
    const president = makeActor("president");
    expect(canPerformAdminOverride(president)).toBe(false);
  });
});

describe("guardAdminOverride", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin override with justification", async () => {
    const ctx = makeGuardContext("admin", "PUBLISHED");
    const result = await guardAdminOverride("edit_content", ctx, "Emergency fix");
    expect(result.ok).toBe(true);
  });

  it("denies non-admin override", async () => {
    const ctx = makeGuardContext("vp-activities", "PUBLISHED");
    const result = await guardAdminOverride("edit_content", ctx, "Attempted bypass");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("FORBIDDEN");
    }
  });

  it("audits successful override with justification", async () => {
    const ctx = makeGuardContext("admin", "PUBLISHED");
    await guardAdminOverride("edit_content", ctx, "Emergency fix");
    expect(createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          override: "APPROVED",
          justification: "Emergency fix",
        }),
      })
    );
  });

  it("audits failed override attempt", async () => {
    const ctx = makeGuardContext("vp-activities", "PUBLISHED");
    await guardAdminOverride("edit_content", ctx, "Attempted bypass");
    expect(createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          override: "ATTEMPTED",
          decision: "DENIED",
        }),
      })
    );
  });
});

// ============================================================================
// ESCALATION DETECTION
// ============================================================================

describe("detectEscalationPattern", () => {
  it("detects role_bypass for member editing", () => {
    const member = makeActor("member");
    const event = makeEvent("DRAFT");
    const result = detectEscalationPattern(
      "edit_content",
      member,
      event,
      "No permission"
    );
    expect(result).not.toBeNull();
    expect(result?.type).toBe("role_bypass");
  });

  it("detects capability_bypass for non-admin delete", () => {
    const vp = makeActor("vp-activities");
    const event = makeEvent("DRAFT");
    const result = detectEscalationPattern("delete", vp, event, "VP cannot delete");
    expect(result).not.toBeNull();
    expect(result?.type).toBe("capability_bypass");
  });

  it("detects ownership_bypass for chair editing other's event", () => {
    const chair = makeActor("event-chair", "chair-id");
    const event = makeEvent("DRAFT", "other-chair-id");
    const result = detectEscalationPattern(
      "edit_content",
      chair,
      event,
      "Not owner"
    );
    expect(result).not.toBeNull();
    expect(result?.type).toBe("ownership_bypass");
  });

  it("detects status_bypass for editing non-editable event", () => {
    const vp = makeActor("vp-activities");
    const event = makeEvent("PUBLISHED");
    const result = detectEscalationPattern(
      "edit_content",
      vp,
      event,
      "Status not editable"
    );
    expect(result).not.toBeNull();
    expect(result?.type).toBe("status_bypass");
  });

  it("returns null for legitimate actions", () => {
    const admin = makeActor("admin");
    const event = makeEvent("DRAFT");
    const result = detectEscalationPattern(
      "edit_content",
      admin,
      event,
      "Admin access"
    );
    expect(result).toBeNull();
  });
});

// ============================================================================
// AUDIT GUARD INVARIANTS
// ============================================================================

describe("AG-1: All guarded actions produce audit entries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("guardViewEvent creates audit", async () => {
    const ctx = makeGuardContext("admin", "DRAFT");
    await guardViewEvent(ctx);
    expect(createAuditEntry).toHaveBeenCalled();
  });

  it("guardEditEventContent creates audit", async () => {
    const ctx = makeGuardContext("admin", "DRAFT");
    await guardEditEventContent(ctx);
    expect(createAuditEntry).toHaveBeenCalled();
  });

  it("guardEditEventStatus creates audit", async () => {
    const ctx = makeGuardContext("admin", "DRAFT");
    await guardEditEventStatus(ctx, "PENDING_APPROVAL");
    expect(createAuditEntry).toHaveBeenCalled();
  });

  it("guardDeleteEvent creates audit", async () => {
    const ctx = makeGuardContext("admin", "DRAFT");
    await guardDeleteEvent(ctx);
    expect(createAuditEntry).toHaveBeenCalled();
  });

  it("guardEventRegistration creates audit", async () => {
    const ctx = makeGuardContext("member", "PUBLISHED");
    await guardEventRegistration(ctx);
    expect(createAuditEntry).toHaveBeenCalled();
  });
});

describe("AG-2: Denied actions are logged with denial reason", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes denial reason in audit", async () => {
    const ctx = makeGuardContext("member", "DRAFT");
    await guardViewEvent(ctx);
    expect(createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          decision: "DENIED",
          reason: expect.any(String),
        }),
      })
    );
  });
});

describe("AG-3: Actor identity is always captured", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes actor in audit entry", async () => {
    const ctx = makeGuardContext("admin", "DRAFT");
    await guardViewEvent(ctx);
    expect(createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: expect.objectContaining({
          memberId: "actor-id",
          globalRole: "admin",
        }),
      })
    );
  });
});

describe("AG-4: Before/after state captured for mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures status transition state", async () => {
    const ctx = makeGuardContext("vp-activities", "DRAFT");
    await guardEditEventStatus(ctx, "PENDING_APPROVAL");
    expect(createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        before: { status: "DRAFT" },
        after: { status: "PENDING_APPROVAL" },
      })
    );
  });
});

// ============================================================================
// SKIP AUDIT OPTION
// ============================================================================

describe("skipAudit option", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips audit when option is set", async () => {
    const ctx = makeGuardContext("admin", "DRAFT");
    await guardViewEvent(ctx, { skipAudit: true });
    expect(createAuditEntry).not.toHaveBeenCalled();
  });

  it("creates audit when option is not set", async () => {
    const ctx = makeGuardContext("admin", "DRAFT");
    await guardViewEvent(ctx);
    expect(createAuditEntry).toHaveBeenCalled();
  });
});
