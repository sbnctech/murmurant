/**
 * Event Status Lifecycle
 *
 * Implements the event approval workflow state machine.
 *
 * Status Flow:
 *   DRAFT -> PENDING_APPROVAL -> APPROVED -> PUBLISHED -> COMPLETED
 *                           \-> CHANGES_REQUESTED -> PENDING_APPROVAL
 *   Any (except COMPLETED) -> CANCELED
 *
 * Role-Based Transitions:
 * - Event Chair:
 *   - DRAFT -> PENDING_APPROVAL (submit for review)
 *   - CHANGES_REQUESTED -> PENDING_APPROVAL (resubmit)
 *
 * - VP of Activities:
 *   - PENDING_APPROVAL -> APPROVED (approve)
 *   - PENDING_APPROVAL -> CHANGES_REQUESTED (request changes)
 *   - APPROVED -> PUBLISHED (publish to members)
 *   - Any -> CANCELED (cancel event)
 *
 * - Admin:
 *   - All transitions (inherits VP permissions)
 *
 * Edit Restrictions:
 * - Event content editable only in: DRAFT, CHANGES_REQUESTED
 * - Once PENDING_APPROVAL or later, only status transitions allowed
 *
 * Charter Compliance:
 * - P1: Identity via auth context
 * - P3: Explicit state machine (no boolean flags)
 * - P5: Approval chain enforced
 * - P7: Audit logging for all transitions
 * - N2: Capability-based authorization
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { EventStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AuthContext, GlobalRole, hasCapability } from "@/lib/auth";
import { createAuditEntry } from "@/lib/audit";
import { NextRequest } from "next/server";

// ============================================================================
// TYPES
// ============================================================================

export type TransitionResult =
  | { ok: true; event: EventWithStatus }
  | { ok: false; error: string; code: "FORBIDDEN" | "INVALID_TRANSITION" | "NOT_FOUND" };

export type EventWithStatus = {
  id: string;
  title: string;
  status: EventStatus;
  eventChairId: string | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  publishedAt: Date | null;
  canceledAt: Date | null;
  changesRequestedAt: Date | null;
  rejectionNotes: string | null;
  approvalNotes: string | null;
  canceledReason: string | null;
};

export type TransitionParams = {
  eventId: string;
  actor: AuthContext;
  req?: NextRequest;
  note?: string; // Optional note (e.g., rejection reason, cancellation reason)
};

// ============================================================================
// ROLE CHECKS
// ============================================================================

/**
 * Check if role has VP-level access (can approve/publish/cancel events).
 */
function hasVPAccess(role: GlobalRole): boolean {
  return hasCapability(role, "events:edit");
}

/**
 * Check if actor is the event chair.
 */
async function isEventChair(memberId: string | null, eventId: string): Promise<boolean> {
  if (!memberId) return false;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { eventChairId: true },
  });

  return event?.eventChairId === memberId;
}

// ============================================================================
// VALID TRANSITIONS
// ============================================================================

/**
 * Valid transitions for Event Chairs.
 */
const CHAIR_TRANSITIONS: Partial<Record<EventStatus, EventStatus[]>> = {
  DRAFT: ["PENDING_APPROVAL"],
  CHANGES_REQUESTED: ["PENDING_APPROVAL"],
};

/**
 * Valid transitions for VP of Activities and Admins.
 */
const VP_TRANSITIONS: Partial<Record<EventStatus, EventStatus[]>> = {
  PENDING_APPROVAL: ["APPROVED", "CHANGES_REQUESTED"],
  APPROVED: ["PUBLISHED"],
  // Cancellation is handled separately - can cancel from any state except COMPLETED
};

/**
 * States from which cancellation is allowed.
 */
const CANCELABLE_STATES: EventStatus[] = [
  "DRAFT",
  "PENDING_APPROVAL",
  "CHANGES_REQUESTED",
  "APPROVED",
  "PUBLISHED",
];

/**
 * States where event content can be edited.
 */
export const EDITABLE_STATES: EventStatus[] = ["DRAFT", "CHANGES_REQUESTED"];

// ============================================================================
// TRANSITION VALIDATION
// ============================================================================

/**
 * Check if a transition is valid for the given role.
 */
export function isValidTransition(
  from: EventStatus,
  to: EventStatus,
  isChair: boolean,
  isVP: boolean
): boolean {
  // Handle cancellation separately
  if (to === "CANCELED") {
    return isVP && CANCELABLE_STATES.includes(from);
  }

  // COMPLETED is derived, not transitioned to
  if (to === "COMPLETED") {
    return false;
  }

  // VP/Admin transitions
  if (isVP) {
    const vpAllowed = VP_TRANSITIONS[from];
    if (vpAllowed?.includes(to)) {
      return true;
    }
    // VPs can also do chair transitions
    const chairAllowed = CHAIR_TRANSITIONS[from];
    if (chairAllowed?.includes(to)) {
      return true;
    }
  }

  // Chair transitions
  if (isChair) {
    const chairAllowed = CHAIR_TRANSITIONS[from];
    if (chairAllowed?.includes(to)) {
      return true;
    }
  }

  return false;
}

/**
 * Get list of valid next states for a given event and actor.
 */
export async function getValidNextStates(
  eventId: string,
  actor: AuthContext
): Promise<EventStatus[]> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { status: true, eventChairId: true },
  });

  if (!event) return [];

  const isVP = hasVPAccess(actor.globalRole);
  const isChair = event.eventChairId === actor.memberId;

  const validStates: EventStatus[] = [];
  const currentStatus = event.status;

  // Check all possible transitions
  const allStatuses: EventStatus[] = [
    "DRAFT",
    "PENDING_APPROVAL",
    "CHANGES_REQUESTED",
    "APPROVED",
    "PUBLISHED",
    "CANCELED",
  ];

  for (const status of allStatuses) {
    if (isValidTransition(currentStatus, status, isChair, isVP)) {
      validStates.push(status);
    }
  }

  return validStates;
}

// ============================================================================
// TRANSITION ACTIONS
// ============================================================================

// Epoch date used as placeholder for cloned events
const EPOCH_DATE = new Date(0).getTime();

/**
 * Check if a date is the placeholder epoch date (1970-01-01)
 */
function isPlaceholderDate(date: Date): boolean {
  return date.getTime() === EPOCH_DATE;
}

/**
 * Submit event for approval (Chair: DRAFT -> PENDING_APPROVAL).
 *
 * Clone safeguard: Cloned events with placeholder dates cannot be submitted.
 */
export async function submitForApproval(params: TransitionParams): Promise<TransitionResult> {
  // Check for cloned event with placeholder dates (Charter P6)
  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    select: { clonedFromId: true, startTime: true },
  });

  if (event?.clonedFromId && isPlaceholderDate(event.startTime)) {
    return {
      ok: false,
      error: "This cloned event still has placeholder dates. Set a valid start time before submitting for approval.",
      code: "INVALID_TRANSITION",
    };
  }

  return performTransition({
    ...params,
    targetStatus: "PENDING_APPROVAL",
    updateData: {
      submittedAt: new Date(),
      submittedById: params.actor.memberId,
      // Clear any previous rejection notes
      changesRequestedAt: null,
      changesRequestedById: null,
      rejectionNotes: null,
    },
    auditAction: "EVENT_SUBMITTED",
  });
}

/**
 * Approve event (VP: PENDING_APPROVAL -> APPROVED).
 */
export async function approveEvent(params: TransitionParams): Promise<TransitionResult> {
  return performTransition({
    ...params,
    targetStatus: "APPROVED",
    updateData: {
      approvedAt: new Date(),
      approvedById: params.actor.memberId,
      approvalNotes: params.note || null,
    },
    auditAction: "EVENT_APPROVED",
  });
}

/**
 * Request changes (VP: PENDING_APPROVAL -> CHANGES_REQUESTED).
 */
export async function requestChanges(params: TransitionParams): Promise<TransitionResult> {
  if (!params.note) {
    return {
      ok: false,
      error: "A reason is required when requesting changes",
      code: "INVALID_TRANSITION",
    };
  }

  return performTransition({
    ...params,
    targetStatus: "CHANGES_REQUESTED",
    updateData: {
      changesRequestedAt: new Date(),
      changesRequestedById: params.actor.memberId,
      rejectionNotes: params.note,
    },
    auditAction: "EVENT_CHANGES_REQUESTED",
  });
}

/**
 * Publish event (VP: APPROVED -> PUBLISHED).
 */
export async function publishEvent(params: TransitionParams): Promise<TransitionResult> {
  return performTransition({
    ...params,
    targetStatus: "PUBLISHED",
    updateData: {
      publishedAt: new Date(),
      publishedById: params.actor.memberId,
      // Set isPublished for backward compatibility
      isPublished: true,
    },
    auditAction: "PUBLISH",
  });
}

/**
 * Cancel event (VP: Any -> CANCELED).
 */
export async function cancelEvent(params: TransitionParams): Promise<TransitionResult> {
  return performTransition({
    ...params,
    targetStatus: "CANCELED",
    updateData: {
      canceledAt: new Date(),
      canceledById: params.actor.memberId,
      canceledReason: params.note || null,
      // Set isPublished to false for backward compatibility
      isPublished: false,
    },
    auditAction: "EVENT_CANCELED",
  });
}

// ============================================================================
// CORE TRANSITION ENGINE
// ============================================================================

type PerformTransitionParams = TransitionParams & {
  targetStatus: EventStatus;
  updateData: Prisma.EventUncheckedUpdateInput;
  auditAction: string;
};

/**
 * Core transition engine - validates and performs the status change.
 */
async function performTransition(params: PerformTransitionParams): Promise<TransitionResult> {
  const { eventId, actor, req, targetStatus, updateData, auditAction, note } = params;

  // Fetch current event state
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      status: true,
      eventChairId: true,
      submittedAt: true,
      approvedAt: true,
      publishedAt: true,
      canceledAt: true,
      changesRequestedAt: true,
      rejectionNotes: true,
      approvalNotes: true,
      canceledReason: true,
    },
  });

  if (!event) {
    return { ok: false, error: "Event not found", code: "NOT_FOUND" };
  }

  // Check authorization
  const isVP = hasVPAccess(actor.globalRole);
  const isChair = event.eventChairId === actor.memberId;

  if (!isValidTransition(event.status, targetStatus, isChair, isVP)) {
    // Determine the specific error
    if (!isChair && !isVP) {
      return {
        ok: false,
        error: "You do not have permission to change this event's status",
        code: "FORBIDDEN",
      };
    }

    return {
      ok: false,
      error: `Cannot transition from ${event.status} to ${targetStatus}`,
      code: "INVALID_TRANSITION",
    };
  }

  // Perform the transition
  const previousStatus = event.status;
  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: targetStatus,
      ...updateData,
    },
    select: {
      id: true,
      title: true,
      status: true,
      eventChairId: true,
      submittedAt: true,
      approvedAt: true,
      publishedAt: true,
      canceledAt: true,
      changesRequestedAt: true,
      rejectionNotes: true,
      approvalNotes: true,
      canceledReason: true,
    },
  });

  // Create audit log entry
  await createAuditEntry({
    action: "UPDATE",
    resourceType: "Event",
    resourceId: eventId,
    actor,
    req,
    before: { status: previousStatus },
    after: { status: targetStatus },
    metadata: {
      transition: auditAction,
      fromStatus: previousStatus,
      toStatus: targetStatus,
      note: note || undefined,
      actorRole: actor.globalRole,
    },
  });

  console.log(
    `[EVENT] ${auditAction}: ${event.title} (${eventId}) ${previousStatus} -> ${targetStatus} by ${actor.email}`
  );

  return { ok: true, event: updatedEvent };
}

// ============================================================================
// EDIT PERMISSION CHECK
// ============================================================================

/**
 * Check if event content can be edited (not just status transitions).
 * Returns true if in DRAFT or CHANGES_REQUESTED status.
 */
export async function canEditEventContent(
  eventId: string,
  actor: AuthContext
): Promise<{ allowed: boolean; reason?: string }> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { status: true, eventChairId: true },
  });

  if (!event) {
    return { allowed: false, reason: "Event not found" };
  }

  // Check if actor has permission to edit at all
  const isVP = hasVPAccess(actor.globalRole);
  const isChair = event.eventChairId === actor.memberId;

  if (!isChair && !isVP) {
    return { allowed: false, reason: "You do not have permission to edit this event" };
  }

  // Check if status allows editing
  if (!EDITABLE_STATES.includes(event.status)) {
    return {
      allowed: false,
      reason: `Event cannot be edited while in ${event.status} status. Only DRAFT and CHANGES_REQUESTED events can be modified.`,
    };
  }

  return { allowed: true };
}

// ============================================================================
// DERIVED STATUS HELPERS
// ============================================================================

/**
 * Get the effective status of an event, considering COMPLETED derivation.
 * An event is COMPLETED when:
 * - It was PUBLISHED
 * - Its endTime has passed
 */
export function getEffectiveStatus(event: {
  status: EventStatus;
  endTime: Date | null;
  startTime: Date;
}): EventStatus {
  if (event.status !== "PUBLISHED") {
    return event.status;
  }

  const now = new Date();
  const endTime = event.endTime || new Date(event.startTime.getTime() + 2 * 60 * 60 * 1000); // Default: +2 hours

  if (now > endTime) {
    return "COMPLETED";
  }

  return "PUBLISHED";
}

/**
 * Check if an event is in the past (completed).
 */
export function isEventCompleted(event: {
  status: EventStatus;
  endTime: Date | null;
  startTime: Date;
}): boolean {
  return getEffectiveStatus(event) === "COMPLETED";
}
