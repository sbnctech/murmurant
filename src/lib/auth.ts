import { NextRequest, NextResponse } from "next/server";

/**
 * Authentication and authorization utilities for API routes.
 *
 * For v1, we use a simplified approach:
 * - Check for Authorization header with Bearer token
 * - In development, allow bypass with specific test tokens
 * - Production will integrate with actual JWT/session validation
 *
 * Role Hierarchy:
 * - admin: Full access to everything
 * - vp-activities: Can view/edit ALL events, cannot delete
 * - event-chair: Can view/edit own committee's events (future)
 * - member: Can view published events only
 */

export type GlobalRole = "admin" | "vp-activities" | "event-chair" | "member";

export type AuthContext = {
  memberId: string;
  email: string;
  globalRole: GlobalRole;
};

export type AuthResult =
  | { ok: true; context: AuthContext }
  | { ok: false; response: NextResponse };

/**
 * Validates the request has a valid authentication token.
 * Returns 401 if missing/invalid token.
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized", message: "Missing or invalid authorization header" },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  // For development/testing, accept specific test tokens
  // In production, this would validate JWT or session
  const context = parseTestToken(token);
  if (!context) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized", message: "Invalid or expired token" },
        { status: 401 }
      ),
    };
  }

  return { ok: true, context };
}

/**
 * Validates the authenticated user has admin role.
 * Returns 403 if not an admin.
 */
export async function requireAdmin(req: NextRequest): Promise<AuthResult> {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult;
  }

  if (authResult.context.globalRole !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Validates the authenticated user has one of the required roles.
 */
export async function requireRole(
  req: NextRequest,
  roles: GlobalRole[]
): Promise<AuthResult> {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult;
  }

  if (!roles.includes(authResult.context.globalRole)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden", message: `Required role: ${roles.join(" or ")}` },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Check if role can view all events (including unpublished).
 */
export function canViewAllEvents(role: GlobalRole): boolean {
  return role === "admin" || role === "vp-activities";
}

/**
 * Check if role can edit any event.
 * VP of Activities can edit ALL events (peer trust model).
 */
export function canEditAnyEvent(role: GlobalRole): boolean {
  return role === "admin" || role === "vp-activities";
}

/**
 * Check if role can publish events.
 */
export function canPublishEvents(role: GlobalRole): boolean {
  return role === "admin" || role === "vp-activities";
}

/**
 * Check if role can delete events.
 * Only admin can delete - VP cannot.
 */
export function canDeleteEvents(role: GlobalRole): boolean {
  return role === "admin";
}

/**
 * Parse test tokens for development/testing.
 * Format: "test-{role}-{memberId}" where role is admin, vp, chair, or member
 *
 * In production, this would be replaced with JWT validation.
 */
function parseTestToken(token: string): AuthContext | null {
  // Test admin token
  if (token.startsWith("test-admin-")) {
    const memberId = token.slice(11) || "test-admin-id";
    return {
      memberId,
      email: "admin@test.com",
      globalRole: "admin",
    };
  }

  // Test VP of Activities token
  if (token.startsWith("test-vp-")) {
    const memberId = token.slice(8) || "test-vp-id";
    return {
      memberId,
      email: "vp@test.com",
      globalRole: "vp-activities",
    };
  }

  // Test Event Chair token
  if (token.startsWith("test-chair-")) {
    const memberId = token.slice(11) || "test-chair-id";
    return {
      memberId,
      email: "chair@test.com",
      globalRole: "event-chair",
    };
  }

  // Test member token
  if (token.startsWith("test-member-")) {
    const memberId = token.slice(12) || "test-member-id";
    return {
      memberId,
      email: "member@test.com",
      globalRole: "member",
    };
  }

  // Legacy simple tokens for backward compatibility with existing tests
  if (token === "admin-token" || token === "test-admin" || token === "test-admin-token") {
    return {
      memberId: "test-admin-id",
      email: "admin@test.com",
      globalRole: "admin",
    };
  }

  if (token === "vp-token" || token === "test-vp") {
    return {
      memberId: "test-vp-id",
      email: "vp@test.com",
      globalRole: "vp-activities",
    };
  }

  if (token === "chair-token" || token === "test-chair") {
    return {
      memberId: "test-chair-id",
      email: "chair@test.com",
      globalRole: "event-chair",
    };
  }

  if (token === "member-token" || token === "test-member") {
    return {
      memberId: "test-member-id",
      email: "member@test.com",
      globalRole: "member",
    };
  }

  return null;
}
