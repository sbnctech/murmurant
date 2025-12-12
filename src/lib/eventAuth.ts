import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthContext, AuthResult, GlobalRole } from "@/lib/auth";

/**
 * Event Authorization Utilities
 *
 * These utilities implement access control for events:
 *
 * Role Hierarchy:
 * - Admin: Full access to all events (view, edit, delete)
 * - VP of Activities: Can view and edit ALL events, but CANNOT delete
 *   - Two VPs exist as peers with mutual trust
 *   - VPs bypass all ownership/committee scoping
 *   - VPs can override Event Chair changes
 * - Event Chair: Can view and edit events they own (eventChairId matches memberId)
 * - Member: No admin access
 *
 * Delete is ALWAYS admin-only. VP cannot delete events.
 */

export type EventAuthContext = AuthContext & {
  isEventChair: boolean;
  isVP: boolean;
};

export type EventAuthResult =
  | { ok: true; context: EventAuthContext }
  | { ok: false; response: NextResponse };

/**
 * Check if role has VP-level access (can view/edit all events).
 */
function hasVPAccess(role: GlobalRole): boolean {
  return role === "admin" || role === "vp-activities";
}

/**
 * Check if role can delete events (admin only).
 */
function canDelete(role: GlobalRole): boolean {
  return role === "admin";
}

/**
 * Check if the authenticated user is the chair of a specific event.
 * Returns true if the user's memberId matches the event's eventChairId.
 */
export async function isEventChair(
  memberId: string,
  eventId: string
): Promise<boolean> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { eventChairId: true },
  });

  if (!event) {
    return false;
  }

  return event.eventChairId === memberId;
}

/**
 * Require that the user can view an event.
 * - Admins can view all events
 * - VP of Activities can view ALL events (peer trust model)
 * - Event chairs can view events they own
 * - Returns 403 for unauthorized access
 * - Returns 404 if event doesn't exist
 */
export async function requireEventViewAccess(
  req: NextRequest,
  eventId: string
): Promise<EventAuthResult> {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult;
  }

  const { context } = authResult;

  // Admin and VP can view all events
  if (hasVPAccess(context.globalRole)) {
    return {
      ok: true,
      context: {
        ...context,
        isEventChair: false,
        isVP: context.globalRole === "vp-activities",
      },
    };
  }

  // Check if event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, eventChairId: true },
  });

  if (!event) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Not Found", message: "Event not found" },
        { status: 404 }
      ),
    };
  }

  // Check if user is the event chair
  const isChair = event.eventChairId === context.memberId;

  if (!isChair) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Forbidden",
          message: "You do not have permission to view this event",
        },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    context: { ...context, isEventChair: true, isVP: false },
  };
}

/**
 * Require that the user can edit an event.
 * - Admins can edit all events
 * - VP of Activities can edit ALL events (peer trust model, no ownership check)
 * - Event chairs can edit events they own
 * - Returns 403 for unauthorized access
 * - Returns 404 if event doesn't exist
 */
export async function requireEventEditAccess(
  req: NextRequest,
  eventId: string
): Promise<EventAuthResult> {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult;
  }

  const { context } = authResult;

  // Admin and VP can edit all events
  if (hasVPAccess(context.globalRole)) {
    return {
      ok: true,
      context: {
        ...context,
        isEventChair: false,
        isVP: context.globalRole === "vp-activities",
      },
    };
  }

  // Check if event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, eventChairId: true },
  });

  if (!event) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Not Found", message: "Event not found" },
        { status: 404 }
      ),
    };
  }

  // Check if user is the event chair
  const isChair = event.eventChairId === context.memberId;

  if (!isChair) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Forbidden",
          message: "You do not have permission to edit this event",
        },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    context: { ...context, isEventChair: true, isVP: false },
  };
}

/**
 * Require that the user can delete an event.
 * - ONLY admins can delete events
 * - VP of Activities CANNOT delete (this is the key restriction)
 * - Event chairs cannot delete
 * - Returns 403 for unauthorized access
 * - Returns 404 if event doesn't exist
 */
export async function requireEventDeleteAccess(
  req: NextRequest,
  eventId: string
): Promise<EventAuthResult> {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult;
  }

  const { context } = authResult;

  // Only admins can delete events - VP CANNOT delete
  if (!canDelete(context.globalRole)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Forbidden",
          message: "Only administrators can delete events",
        },
        { status: 403 }
      ),
    };
  }

  // Check if event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });

  if (!event) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Not Found", message: "Event not found" },
        { status: 404 }
      ),
    };
  }

  return {
    ok: true,
    context: { ...context, isEventChair: false, isVP: false },
  };
}

/**
 * Get list of event IDs that a member chairs.
 * Useful for filtering event lists to show only owned events.
 */
export async function getChairedEventIds(memberId: string): Promise<string[]> {
  const events = await prisma.event.findMany({
    where: { eventChairId: memberId },
    select: { id: true },
  });

  return events.map((e) => e.id);
}

/**
 * Require admin-only access.
 * Neither VP nor Event Chairs are allowed - only full admins.
 * Use this for sensitive admin operations like:
 * - Viewing all members
 * - Exporting data
 * - System configuration
 */
export async function requireAdminOnly(req: NextRequest): Promise<AuthResult> {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult;
  }

  if (authResult.context.globalRole !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Forbidden",
          message: "This action requires administrator privileges",
        },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Require VP-level or higher access (VP of Activities or Admin).
 * Use this for operations that VPs can perform but Event Chairs cannot.
 */
export async function requireVPOrAdmin(req: NextRequest): Promise<AuthResult> {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult;
  }

  if (!hasVPAccess(authResult.context.globalRole)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Forbidden",
          message: "This action requires VP of Activities or administrator privileges",
        },
        { status: 403 }
      ),
    };
  }

  return authResult;
}
