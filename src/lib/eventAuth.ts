import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthContext, AuthResult } from "@/lib/auth";

/**
 * Event Chair Authorization Utilities
 *
 * These utilities implement row-level access control for events:
 * - Event Chairs can view and edit events they own (where eventChairId matches their memberId)
 * - Admins have full access to all events
 * - Regular members cannot access admin event endpoints
 *
 * RBAC Design Principle:
 * RBAC determines who you are (role). Row-level permissions are enforced
 * separately via data relationships (event ownership via eventChairId).
 *
 * ## Future Row-Level Enforcement Notes
 *
 * Current implementation validates access at the API route level using helper
 * functions (requireEventViewAccess, requireEventEditAccess, etc.). This works
 * well for our current scale but has some limitations:
 *
 * ### Scaling Considerations:
 *
 * 1. **Prisma Middleware/Extension**: For more centralized enforcement, consider
 *    using Prisma client extensions to automatically filter queries based on
 *    the authenticated user's permissions. This prevents accidental data leaks
 *    if a route forgets to call the auth helper.
 *
 * 2. **Row-Level Security (RLS) in PostgreSQL**: For maximum security, PostgreSQL
 *    RLS policies can enforce access control at the database level. This requires:
 *    - Setting a session variable (e.g., SET app.current_user_id = '...')
 *    - Creating RLS policies like:
 *      CREATE POLICY event_chair_access ON "Event"
 *      USING (
 *        "eventChairId" = current_setting('app.current_user_id')::uuid
 *        OR current_setting('app.user_role') = 'admin'
 *      );
 *    - Trade-off: Adds complexity and requires careful connection pooling management.
 *
 * 3. **Query Scoping Pattern**: Instead of checking access after fetching,
 *    always scope queries to include ownership:
 *    ```
 *    prisma.event.findMany({
 *      where: {
 *        OR: [
 *          { eventChairId: currentUserId },
 *          // Include if admin (handled by separate logic)
 *        ]
 *      }
 *    })
 *    ```
 *
 * ### Additional Access Patterns to Consider:
 *
 * - **Committee-based access**: Event Chairs of a committee should see all
 *   events under that committee (requires Event-Committee relationship).
 *
 * - **Delegated access**: Allow Event Chairs to delegate view/edit access
 *   to assistants (requires EventAccessGrant table).
 *
 * - **Time-based access**: Chairs might only have access to edit events
 *   before they start, or for a period after they end.
 *
 * - **Audit logging**: Track who accessed/modified events for compliance.
 */

export type EventAuthContext = AuthContext & {
  isEventChair: boolean;
};

export type EventAuthResult =
  | { ok: true; context: EventAuthContext }
  | { ok: false; response: NextResponse };

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

  // Admins can view all events
  if (context.globalRole === "admin") {
    return {
      ok: true,
      context: { ...context, isEventChair: false },
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
    context: { ...context, isEventChair: true },
  };
}

/**
 * Require that the user can edit an event.
 * - Admins can edit all events
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

  // Admins can edit all events
  if (context.globalRole === "admin") {
    return {
      ok: true,
      context: { ...context, isEventChair: false },
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
    context: { ...context, isEventChair: true },
  };
}

/**
 * Require that the user can delete an event.
 * - Only admins can delete events (event chairs cannot delete)
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

  // Only admins can delete events
  if (context.globalRole !== "admin") {
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
    context: { ...context, isEventChair: false },
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
 * Event chairs are NOT allowed - only full admins.
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
