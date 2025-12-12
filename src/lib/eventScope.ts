import { NextResponse } from "next/server";
import {
  GlobalRole,
  canViewAllEvents,
  canEditAnyEvent,
  canPublishEvents,
  canDeleteEvents,
} from "./auth";

/**
 * Event permission types.
 */
export type EventPermission = "view" | "edit" | "publish" | "delete";

/**
 * Event scope context attached to requests.
 *
 * VP of Activities Policy:
 * - Two VPs of Activities exist as peers with mutual trust
 * - VP can view ALL events (including unpublished)
 * - VP can edit ALL events (no ownership checks)
 * - VP can publish/unpublish events
 * - VP CANNOT delete events (admin-only)
 */
export type EventScopeContext = {
  role: GlobalRole;
  canViewAll: boolean;
  canEditAll: boolean;
  canPublish: boolean;
  canDelete: boolean;
};

/**
 * Build event scope context from user's role.
 *
 * This implements the VP of Activities peer trust model:
 * - VPs bypass all ownership/committee scoping
 * - VPs have full edit access to ALL events
 * - Only delete is restricted to admin
 */
export function getEventScopeContext(role: GlobalRole): EventScopeContext {
  return {
    role,
    canViewAll: canViewAllEvents(role),
    canEditAll: canEditAnyEvent(role),
    canPublish: canPublishEvents(role),
    canDelete: canDeleteEvents(role),
  };
}

/**
 * Check if a permission is allowed for a given scope context.
 */
export function hasEventPermission(
  scope: EventScopeContext,
  permission: EventPermission
): boolean {
  switch (permission) {
    case "view":
      return scope.canViewAll;
    case "edit":
      return scope.canEditAll;
    case "publish":
      return scope.canPublish;
    case "delete":
      return scope.canDelete;
    default:
      return false;
  }
}

/**
 * Return a 403 response if the permission is not allowed.
 */
export function requireEventPermission(
  scope: EventScopeContext,
  permission: EventPermission
): NextResponse | null {
  if (hasEventPermission(scope, permission)) {
    return null; // Permission granted
  }

  const messages: Record<EventPermission, string> = {
    view: "You do not have permission to view this event",
    edit: "You do not have permission to edit events",
    publish: "You do not have permission to publish events",
    delete: "Only administrators can delete events",
  };

  return NextResponse.json(
    { error: "Forbidden", message: messages[permission] },
    { status: 403 }
  );
}

/**
 * Middleware helper to require event edit permission.
 * VP of Activities and Admin can edit any event.
 */
export function requireEventEditPermission(
  role: GlobalRole
): NextResponse | null {
  const scope = getEventScopeContext(role);
  return requireEventPermission(scope, "edit");
}

/**
 * Middleware helper to require event delete permission.
 * Only Admin can delete events.
 */
export function requireEventDeletePermission(
  role: GlobalRole
): NextResponse | null {
  const scope = getEventScopeContext(role);
  return requireEventPermission(scope, "delete");
}

/**
 * Middleware helper to require event publish permission.
 * VP of Activities and Admin can publish events.
 */
export function requireEventPublishPermission(
  role: GlobalRole
): NextResponse | null {
  const scope = getEventScopeContext(role);
  return requireEventPermission(scope, "publish");
}
