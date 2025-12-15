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
 * - webmaster: UI/publishing role - can manage pages, themes, templates, comms
 *              CANNOT see finance, CANNOT change user entitlements
 * - vp-activities: Can view/edit ALL events, cannot delete
 * - event-chair: Can view/edit own committee's events (future)
 * - member: Can view published events only
 */

export type GlobalRole = "admin" | "webmaster" | "vp-activities" | "event-chair" | "member";

// ============================================================================
// CAPABILITY-BASED PERMISSIONS
// Instead of scattering role checks, we define capabilities and check those.
// ============================================================================

export type Capability =
  | "publishing:manage"     // Pages, themes, templates, media
  | "comms:manage"          // Email templates, audiences, campaigns (no finance fields)
  | "members:view"          // Read-only member detail
  | "registrations:view"    // Read-only registration detail
  | "exports:access"        // Access to data export endpoints
  | "finance:view"          // View financial data
  | "finance:manage"        // Edit financial data
  | "users:manage"          // Create/update user roles and entitlements
  | "admin:full";           // Full admin access (implies all capabilities)

/**
 * Map of which capabilities each role has.
 * This is the source of truth for permission checks.
 *
 * IMPORTANT: webmaster is a UI/site role. They can manage publishing and comms,
 * and view member/registration data for support purposes, but CANNOT:
 * - Export data
 * - View/manage finance
 * - Change user entitlements
 */
const ROLE_CAPABILITIES: Record<GlobalRole, Capability[]> = {
  admin: [
    "admin:full",
    "publishing:manage",
    "comms:manage",
    "members:view",
    "registrations:view",
    "exports:access",
    "finance:view",
    "finance:manage",
    "users:manage",
  ],
  webmaster: [
    "publishing:manage",
    "comms:manage",
    "members:view",
    "registrations:view",
    // NO exports:access
    // NO finance:view/manage
    // NO users:manage
  ],
  "vp-activities": [
    "members:view",
    "registrations:view",
    // Event-specific permissions are handled separately
  ],
  "event-chair": [
    "members:view",
    "registrations:view",
  ],
  member: [],
};

/**
 * Check if a role has a specific capability.
 */
export function hasCapability(role: GlobalRole, capability: Capability): boolean {
  const caps = ROLE_CAPABILITIES[role];
  // admin:full implies all capabilities
  if (caps.includes("admin:full")) return true;
  return caps.includes(capability);
}

/**
 * Check if a role has any of the specified capabilities.
 */
export function hasAnyCapability(role: GlobalRole, capabilities: Capability[]): boolean {
  return capabilities.some((cap) => hasCapability(role, cap));
}

/**
 * Check if a role is a full admin (has admin:full capability).
 */
export function isFullAdmin(role: GlobalRole): boolean {
  return hasCapability(role, "admin:full");
}

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
    const e2eToken = process.env.ADMIN_E2E_TOKEN ?? "dev-admin-token";
  const headerToken = req.headers.get("x-admin-test-token");
  if (process.env.NODE_ENV !== "production" && headerToken && headerToken === e2eToken) {
    return {
      ok: true,
      context: {
        memberId: "e2e-admin",
        email: "alice@example.com",
        globalRole: "admin",
      },
    };
  }

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
 * Validates the authenticated user has the required capability.
 * Returns 403 if they lack the capability.
 */
export async function requireCapability(
  req: NextRequest,
  capability: Capability
): Promise<AuthResult> {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult;
  }

  if (!hasCapability(authResult.context.globalRole, capability)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden", message: `Required capability: ${capability}` },
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

  // Test webmaster token
  if (token.startsWith("test-webmaster-")) {
    const memberId = token.slice(15) || "test-webmaster-id";
    return {
      memberId,
      email: "webmaster@test.com",
      globalRole: "webmaster",
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

  if (token === "webmaster-token" || token === "test-webmaster") {
    return {
      memberId: "test-webmaster-id",
      email: "webmaster@test.com",
      globalRole: "webmaster",
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
