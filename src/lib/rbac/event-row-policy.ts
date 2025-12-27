/**
 * Event Row-Level Security Policy
 *
 * Defines row-level access rules for events based on actor context.
 * These policies are enforced at the data layer, not UI.
 *
 * Security Invariants (SI):
 * - SI-1: Members can only view PUBLISHED events
 * - SI-2: Event Chairs can view/edit their own events (any status)
 * - SI-3: VP Activities can view/edit ALL events (peer trust model)
 * - SI-4: Admin can view/edit/delete ALL events
 * - SI-5: Only Admin can delete events (VP cannot)
 * - SI-6: Content editing restricted to DRAFT/CHANGES_REQUESTED status
 * - SI-7: Public users see only PUBLISHED events with past event filtering
 *
 * Charter Compliance:
 * - P1: Identity provable (all actions tied to memberId)
 * - P2: Default deny, least privilege
 * - P3: State machine via EventStatus
 * - N1: No UI-only security
 * - N2: Capability-based, not role strings
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { EventStatus } from "@prisma/client";
import { AuthContext, GlobalRole, hasCapability } from "@/lib/auth";

// ============================================================================
// TYPES
// ============================================================================

export type EventVisibility = "public" | "members" | "officer" | "admin";

export type EventAction =
  | "view"
  | "view_details"
  | "edit_content"
  | "edit_status"
  | "delete"
  | "register"
  | "cancel_registration";

export interface EventRowContext {
  id: string;
  status: EventStatus;
  eventChairId: string | null;
  committeeId?: string | null;
  startTime: Date;
  endTime?: Date | null;
}

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
  invariant?: string;
}

// ============================================================================
// SECURITY INVARIANT CHECKS
// ============================================================================

function checkStatusVisibility(
  status: EventStatus,
  hasEventView: boolean
): PolicyDecision {
  if (hasEventView) {
    return { allowed: true, reason: "Officer access", invariant: "SI-3/SI-4" };
  }
  if (status === "PUBLISHED" || status === "COMPLETED") {
    return { allowed: true, reason: "Published event visible to all", invariant: "SI-1" };
  }
  return {
    allowed: false,
    reason: `Event in ${status} status is not visible to members`,
    invariant: "SI-1",
  };
}

function isEventChair(actor: AuthContext | null, eventChairId: string | null): boolean {
  if (!actor || !eventChairId) return false;
  return actor.memberId === eventChairId;
}

function hasVPAccess(role: GlobalRole): boolean {
  return hasCapability(role, "events:edit");
}

function hasAdminAccess(role: GlobalRole): boolean {
  return hasCapability(role, "admin:full");
}

function hasDeleteAccess(role: GlobalRole): boolean {
  return hasCapability(role, "events:delete");
}

export const EDITABLE_STATES: EventStatus[] = ["DRAFT", "CHANGES_REQUESTED"];

// ============================================================================
// ROW POLICY CHECKS
// ============================================================================

export function canViewEvent(
  actor: AuthContext | null,
  event: EventRowContext
): PolicyDecision {
  if (actor && hasAdminAccess(actor.globalRole)) {
    return { allowed: true, reason: "Admin access", invariant: "SI-4" };
  }
  if (actor && hasCapability(actor.globalRole, "events:view")) {
    return { allowed: true, reason: "Officer access (events:view)", invariant: "SI-3" };
  }
  if (isEventChair(actor, event.eventChairId)) {
    return { allowed: true, reason: "Event chair access", invariant: "SI-2" };
  }
  return checkStatusVisibility(event.status, false);
}

export function canEditEventContent(
  actor: AuthContext,
  event: EventRowContext
): PolicyDecision {
  if (!EDITABLE_STATES.includes(event.status)) {
    return {
      allowed: false,
      reason: `Content editing not allowed in ${event.status} status`,
      invariant: "SI-6",
    };
  }
  if (hasAdminAccess(actor.globalRole)) {
    return { allowed: true, reason: "Admin access", invariant: "SI-4" };
  }
  if (hasVPAccess(actor.globalRole)) {
    return { allowed: true, reason: "VP access", invariant: "SI-3" };
  }
  if (isEventChair(actor, event.eventChairId)) {
    return { allowed: true, reason: "Event chair access", invariant: "SI-2" };
  }
  return { allowed: false, reason: "No permission to edit this event", invariant: "SI-2" };
}

const VP_TRANSITIONS: Partial<Record<EventStatus, EventStatus[]>> = {
  DRAFT: ["PENDING_APPROVAL"],
  PENDING_APPROVAL: ["APPROVED", "CHANGES_REQUESTED"],
  CHANGES_REQUESTED: ["PENDING_APPROVAL"],
  APPROVED: ["PUBLISHED"],
};

const CHAIR_TRANSITIONS: Partial<Record<EventStatus, EventStatus[]>> = {
  DRAFT: ["PENDING_APPROVAL"],
  CHANGES_REQUESTED: ["PENDING_APPROVAL"],
};

const CANCELABLE_STATES: EventStatus[] = [
  "DRAFT", "PENDING_APPROVAL", "CHANGES_REQUESTED", "APPROVED", "PUBLISHED",
];

export function canEditEventStatus(
  actor: AuthContext,
  event: EventRowContext,
  targetStatus: EventStatus
): PolicyDecision {
  if (targetStatus === "COMPLETED") {
    return {
      allowed: false,
      reason: "COMPLETED is a derived status, not a transition target",
      invariant: "SI-3",
    };
  }
  if (hasAdminAccess(actor.globalRole)) {
    return { allowed: true, reason: "Admin access", invariant: "SI-4" };
  }
  if (hasVPAccess(actor.globalRole)) {
    if (targetStatus === "CANCELED") {
      if (CANCELABLE_STATES.includes(event.status)) {
        return { allowed: true, reason: "VP cancellation", invariant: "SI-3" };
      }
      return { allowed: false, reason: `Cannot cancel event in ${event.status} status`, invariant: "SI-3" };
    }
    const allowed = VP_TRANSITIONS[event.status]?.includes(targetStatus);
    if (allowed) {
      return { allowed: true, reason: "VP access", invariant: "SI-3" };
    }
    return { allowed: false, reason: `Cannot transition from ${event.status} to ${targetStatus}`, invariant: "SI-3" };
  }
  if (isEventChair(actor, event.eventChairId)) {
    const allowed = CHAIR_TRANSITIONS[event.status]?.includes(targetStatus);
    if (allowed) {
      return { allowed: true, reason: "Event chair submission", invariant: "SI-2" };
    }
    return { allowed: false, reason: `Event chairs cannot transition from ${event.status} to ${targetStatus}`, invariant: "SI-2" };
  }
  return { allowed: false, reason: "No permission to change event status", invariant: "SI-2" };
}

export function canDeleteEvent(
  actor: AuthContext,
  _event: EventRowContext
): PolicyDecision {
  if (hasDeleteAccess(actor.globalRole)) {
    return { allowed: true, reason: "Admin delete access", invariant: "SI-5" };
  }
  if (hasVPAccess(actor.globalRole)) {
    return { allowed: false, reason: "VP cannot delete events - use cancellation workflow instead", invariant: "SI-5" };
  }
  return { allowed: false, reason: "Only administrators can delete events", invariant: "SI-5" };
}

export function canRegisterForEvent(
  actor: AuthContext | null,
  event: EventRowContext
): PolicyDecision {
  if (event.status !== "PUBLISHED") {
    return { allowed: false, reason: "Registration only available for published events", invariant: "SI-1" };
  }
  const now = new Date();
  const endTime = event.endTime ?? event.startTime;
  if (now > endTime) {
    return { allowed: false, reason: "Event has already ended", invariant: "SI-7" };
  }
  if (!actor) {
    return { allowed: false, reason: "Authentication required for registration", invariant: "SI-1" };
  }
  return { allowed: true, reason: "Registration allowed" };
}

// ============================================================================
// QUERY FILTERS
// ============================================================================

export interface EventQueryFilter {
  status?: EventStatus | { in: EventStatus[] };
  eventChairId?: string;
  OR?: Array<{ status?: EventStatus | { in: EventStatus[] }; eventChairId?: string }>;
}

export function getEventQueryFilter(actor: AuthContext | null): EventQueryFilter {
  if (actor && hasAdminAccess(actor.globalRole)) {
    return {};
  }
  if (actor && hasCapability(actor.globalRole, "events:view")) {
    return {};
  }
  if (actor) {
    return {
      OR: [
        { eventChairId: actor.memberId },
        { status: { in: ["PUBLISHED", "COMPLETED"] } },
      ],
    };
  }
  return { status: { in: ["PUBLISHED", "COMPLETED"] } };
}

export function filterVisibleEvents<T extends EventRowContext>(
  events: T[],
  actor: AuthContext | null
): T[] {
  return events.filter((event) => canViewEvent(actor, event).allowed);
}

export function buildEventAuditContext(
  action: EventAction,
  actor: AuthContext,
  event: EventRowContext,
  decision: PolicyDecision
): Record<string, unknown> {
  return {
    action,
    eventId: event.id,
    eventStatus: event.status,
    actorId: actor.memberId,
    actorRole: actor.globalRole,
    isEventChair: isEventChair(actor, event.eventChairId),
    allowed: decision.allowed,
    reason: decision.reason,
    invariant: decision.invariant,
  };
}
