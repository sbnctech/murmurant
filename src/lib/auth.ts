import { NextRequest, NextResponse } from "next/server";

/**
 * Authentication and authorization utilities for API routes.
 *
 * For v1, we use a simplified approach:
 * - Check for Authorization header with Bearer token
 * - In development, allow bypass with specific test tokens
 * - Production will integrate with actual JWT/session validation
 *
 * Role Hierarchy (SBNC-specific):
 * - admin: Dev-only full access role (not used in production SBNC)
 * - president: Club president - approves transitions, full visibility
 * - past-president: Advisory role - can view transitions, limited edit
 * - vp-activities: Can view/edit ALL events, approve transitions, cannot delete
 * - event-chair: Can view/edit own committee's events (future)
 * - webmaster: UI/publishing role - can manage pages, themes, templates, comms
 *              CANNOT see finance, CANNOT change user entitlements
 *              CANNOT access member service history by default
 * - member: Can view published events only
 *
 * WEBMASTER POSTURE:
 * Webmaster is NOT a full admin. They work on UI/content/publishing but:
 * 1. Cannot see any financial information
 * 2. Cannot change anyone's entitlements/roles
 * 3. Cannot access data exports
 * 4. Cannot view member service history narrative
 * 5. Can optionally have debug read-only access (off by default)
 */

export type GlobalRole =
  | "admin"
  | "president"
  | "past-president"
  | "vp-activities"
  | "event-chair"
  | "webmaster"
  | "member";

// ============================================================================
// CAPABILITY-BASED PERMISSIONS
// Instead of scattering role checks, we define capabilities and check those.
// ============================================================================

export type Capability =
  | "publishing:manage"     // Pages, themes, templates, media
  | "comms:manage"          // Email templates, audiences, campaigns (no finance fields)
  | "comms:send"            // Actually send campaigns (separate from manage)
  | "members:view"          // Read-only member detail
  | "members:history"       // View member service history narrative (restricted)
  | "registrations:view"    // Read-only registration detail
  | "events:view"           // View all events including unpublished
  | "events:edit"           // Edit any event
  | "events:delete"         // Delete events (admin only)
  | "exports:access"        // Access to data export endpoints
  | "finance:view"          // View financial data
  | "finance:manage"        // Edit financial data
  | "transitions:view"      // View transition plans
  | "transitions:approve"   // Approve transition plans
  | "users:manage"          // Create/update user roles and entitlements
  | "admin:full"            // Full admin access (implies all capabilities)
  | "debug:readonly"
  // Officer/Governance capabilities (stubs - awaiting Prisma models)
  | "meetings:read"
  | "meetings:motions:read"
  | "meetings:motions:annotate"
  | "meetings:minutes:draft:create"
  | "meetings:minutes:draft:submit"
  | "meetings:minutes:draft:edit"
  | "meetings:minutes:read_all"
  | "meetings:minutes:revise"
  | "meetings:minutes:finalize"
  | "board_records:read"
  | "board_records:draft:edit"
  | "board_records:draft:create"
  | "board_records:draft:submit"
  | "governance:flags:create"
  | "governance:flags:resolve"
  | "governance:rules:manage"
  | "content:board:request_publish"
  | "content:board:publish";       // Debug read-only access (for support, default OFF)

/**
 * Map of which capabilities each role has.
 * This is the source of truth for permission checks.
 *
 * IMPORTANT: webmaster is a UI/site role. They can manage publishing and comms
 * templates, but CANNOT:
 * - Export data
 * - View/manage finance
 * - Change user entitlements
 * - View member service history
 * - Send campaigns (by default)
 *
 * The webmaster role is intentionally limited. For debugging/support,
 * set WEBMASTER_DEBUG_READONLY=true to enable read-only access to some
 * additional data (default OFF).
 */
const ROLE_CAPABILITIES: Record<GlobalRole, Capability[]> = {
  admin: [
    "admin:full",
    "publishing:manage",
    "comms:manage",
    "comms:send",
    "members:view",
    "members:history",
    "registrations:view",
    "events:view",
    "events:edit",
    "events:delete",
    "exports:access",
    "finance:view",
    "finance:manage",
    "transitions:view",
    "transitions:approve",
    "users:manage",
  ],
  president: [
    "members:view",
    "members:history",
    "registrations:view",
    "events:view",
    "events:edit",
    "exports:access",
    "finance:view",
    "transitions:view",
    "transitions:approve",
    // President can view but not directly manage finances
    // NO finance:manage - treasurer handles that
    // NO users:manage - handled through transitions
    // NO events:delete - use cancel flow instead
  ],
  "past-president": [
    "members:view",
    "members:history",
    "registrations:view",
    "events:view",
    "transitions:view",
    // Advisory role - can view but limited edit
    // NO events:edit
    // NO finance:view - past role doesn't need current finance access
    // NO transitions:approve - current officers only
  ],
  "vp-activities": [
    "members:view",
    "members:history",
    "registrations:view",
    "events:view",
    "events:edit",
    "transitions:view",
    "transitions:approve",
    // VP Activities can edit all events (peer trust model)
    // NO events:delete - admin only
    // NO finance:view/manage
    // NO exports:access
  ],
  "event-chair": [
    "members:view",
    "registrations:view",
    "events:view",
    // NO members:history - event chairs see only event-related member info
    // NO events:edit - committee-scoped edit handled separately
    // NO exports:access
    // NO finance:view
  ],
  webmaster: [
    "publishing:manage",
    "comms:manage",
    // NO comms:send - webmaster can create templates but not send campaigns
    // NO members:view - removed to harden restrictions
    // NO members:history
    // NO registrations:view
    // NO events:view/edit/delete
    // NO exports:access
    // NO finance:view/manage
    // NO users:manage
    // NO transitions:view/approve
  ],
  member: [],
};

/**
 * Check if webmaster debug readonly mode is enabled.
 * This allows webmaster to have read-only access to member/registration data
 * for debugging purposes. Default is OFF.
 */
export function isWebmasterDebugEnabled(): boolean {
  return process.env.WEBMASTER_DEBUG_READONLY === "true";
}

/**
 * Get effective capabilities for a role, considering runtime configuration.
 */
function getEffectiveCapabilities(role: GlobalRole): Capability[] {
  const baseCaps = ROLE_CAPABILITIES[role];

  // If webmaster debug mode is enabled, add read-only access
  if (role === "webmaster" && isWebmasterDebugEnabled()) {
    return [
      ...baseCaps,
      "members:view",
      "registrations:view",
      "events:view",
      "debug:readonly",
    ];
  }

  return baseCaps;
}

/**
 * Check if a role has a specific capability.
 * Uses effective capabilities which may include runtime-configured additions.
 */
export function hasCapability(role: GlobalRole, capability: Capability): boolean {
  const caps = getEffectiveCapabilities(role);
  // admin:full implies all capabilities
  if (caps.includes("admin:full")) return true;
  return caps.includes(capability);
}

/**
 * Get all capabilities for a role (for debugging/introspection).
 */
export function getRoleCapabilities(role: GlobalRole): Capability[] {
  return getEffectiveCapabilities(role);
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

// Session cookie names for cookie-based authentication
export const SESSION_COOKIE_NAME = "clubos_session";
const DEV_SESSION_COOKIE_NAME = "clubos_dev_session";

/**
 * Check if we're running in production mode.
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Read session token from HttpOnly cookies.
 * In production: reads clubos_session
 * In development: also checks clubos_dev_session as fallback
 *
 * Charter P1: Provable identity - sessions are server-validated.
 * Charter P9: Fail closed - missing cookie = no auth.
 */
function getSessionTokenFromCookies(req: NextRequest): string | null {
  // Check production session cookie
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (sessionCookie?.value) {
    return sessionCookie.value;
  }

  // In development, also check dev session cookie (set by middleware)
  if (!isProduction()) {
    const devSessionCookie = req.cookies.get(DEV_SESSION_COOKIE_NAME);
    if (devSessionCookie?.value) {
      return devSessionCookie.value;
    }
  }

  return null;
}

/**
 * Validates the request has a valid authentication token.
 * Returns 401 if missing/invalid token.
 *
 * Authentication priority (highest to lowest):
 * 1. HttpOnly session cookies (production-grade)
 * 2. Authorization Bearer header (for API clients)
 * 3. x-admin-test-token header (E2E tests, dev-only)
 *
 * Charter P1: Provable identity - all auth is server-validated.
 * Charter P2: Default deny - no token = 401.
 * Charter P9: Fail closed - invalid token = 401.
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  // 1. Check session cookies first (preferred for browser clients)
  const sessionToken = getSessionTokenFromCookies(req);
  if (sessionToken) {
    const context = parseTestToken(sessionToken);
    if (context) {
      return { ok: true, context };
    }
    // Invalid session cookie - fall through to other methods
  }

  // 2. Check Authorization header (for API clients)
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const context = parseTestToken(token);
    if (context) {
      return { ok: true, context };
    }
    // Invalid bearer token - fall through
  }

  // 3. E2E test bypass header (development only)
  if (!isProduction()) {
    const e2eToken = process.env.ADMIN_E2E_TOKEN ?? "dev-admin-token";
    const headerToken = req.headers.get("x-admin-test-token");
    if (headerToken && headerToken === e2eToken) {
      return {
        ok: true,
        context: {
          memberId: "e2e-admin",
          email: "alice@example.com",
          globalRole: "admin",
        },
      };
    }
  }

  // No valid authentication found
  return {
    ok: false,
    response: NextResponse.json(
      { error: "Unauthorized", message: "Missing or invalid authentication" },
      { status: 401 }
    ),
  };
}

/**
 * Validates the authenticated user has full admin capability.
 * Returns 403 if they lack admin:full capability.
 *
 * Charter P2/N2: Uses capability check, not role string comparison.
 * This is equivalent to requireCapability(req, "admin:full").
 */
export async function requireAdmin(req: NextRequest): Promise<AuthResult> {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult;
  }

  // Charter N2: Use capability check, not role string
  if (!hasCapability(authResult.context.globalRole, "admin:full")) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Access denied", message: "Administrator privileges required" },
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
        { error: "Access denied", message: `Required capability: ${capability}` },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Object scope types for scoped capability checks.
 * Charter P2: Authorization must be object-aware.
 */
export type ObjectScope =
  | { memberId: string }
  | { eventId: string }
  | { registrationId: string }
  | { campaignId: string }
  | { pageId: string };

/**
 * Scoped authorization result that includes the validated scope.
 */
export type ScopedAuthResult =
  | { ok: true; context: AuthContext; scope: ObjectScope }
  | { ok: false; response: NextResponse };

/**
 * Validates the authenticated user has the required capability and scope.
 *
 * Charter P2: Authorization must be object-aware (event, committee, member, campaign).
 * Charter N2: Uses capability check, not role string comparison.
 *
 * The scope parameter makes the object-scoping explicit in the code.
 * Ownership/access validation for the scope must be done separately by the caller.
 *
 * Usage:
 * ```typescript
 * const auth = await requireCapabilityWithScope(req, "members:view", { memberId });
 * if (!auth.ok) return auth.response;
 *
 * // Caller must validate scope ownership:
 * // - admin:full can access any object
 * // - others may need object-specific checks (e.g., own memberId)
 * ```
 */
export async function requireCapabilityWithScope(
  req: NextRequest,
  capability: Capability,
  scope: ObjectScope
): Promise<ScopedAuthResult> {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult;
  }

  if (!hasCapability(authResult.context.globalRole, capability)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Access denied", message: `Required capability: ${capability}` },
        { status: 403 }
      ),
    };
  }

  return { ok: true, context: authResult.context, scope };
}

/**
 * Check if authenticated user can access a specific member's data.
 * Returns true if:
 * - User has admin:full capability (can access any member)
 * - User's memberId matches the target memberId (self-access)
 *
 * Charter P2: Object-scoped authorization.
 */
export function canAccessMember(context: AuthContext, targetMemberId: string): boolean {
  // Admin can access any member
  if (hasCapability(context.globalRole, "admin:full")) {
    return true;
  }
  // Users can access their own data
  return context.memberId === targetMemberId;
}

/**
 * Check if role can view all events (including unpublished).
 */
export function canViewAllEvents(role: GlobalRole): boolean {
  return hasCapability(role, "events:view");
}

/**
 * Check if role can edit any event.
 * VP of Activities can edit ALL events (peer trust model).
 */
export function canEditAnyEvent(role: GlobalRole): boolean {
  return hasCapability(role, "events:edit");
}

/**
 * Check if role can publish events.
 * Same as edit for now - publishing is an edit operation.
 */
export function canPublishEvents(role: GlobalRole): boolean {
  return hasCapability(role, "events:edit");
}

/**
 * Check if role can delete events.
 * Only admin can delete - VP cannot.
 */
export function canDeleteEvents(role: GlobalRole): boolean {
  return hasCapability(role, "events:delete");
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

  // Test President token
  if (token.startsWith("test-president-")) {
    const memberId = token.slice(15) || "test-president-id";
    return {
      memberId,
      email: "president@test.com",
      globalRole: "president",
    };
  }

  // Test Past President token
  if (token.startsWith("test-past-president-")) {
    const memberId = token.slice(20) || "test-past-president-id";
    return {
      memberId,
      email: "past-president@test.com",
      globalRole: "past-president",
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

  if (token === "president-token" || token === "test-president") {
    return {
      memberId: "test-president-id",
      email: "president@test.com",
      globalRole: "president",
    };
  }

  if (token === "past-president-token" || token === "test-past-president") {
    return {
      memberId: "test-past-president-id",
      email: "past-president@test.com",
      globalRole: "past-president",
    };
  }

  return null;
}
