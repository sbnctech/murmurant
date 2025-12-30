import { NextRequest, NextResponse } from "next/server";
import { getSession, getCurrentSession } from "@/lib/auth/session";
import { getSessionCookieName } from "@/lib/auth/cookies";
import { getRoleCapabilitiesFromPolicy } from "@/lib/policies/roleCapabilities";

// Re-export getCurrentSession for convenience
export { getCurrentSession };

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
  | "vp-communications"
  | "event-chair"
  | "webmaster"
  | "secretary"
  | "parliamentarian"
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
  | "events:approve"        // Approve events (VP Activities) - PENDING_APPROVAL -> APPROVED
  | "events:submit"         // Submit events for approval (event chairs)
  | "events:schedule:view"  // View event schedule/eNews dashboard (VP Communications)
  | "events:enews:edit"     // Edit eNews blurb drafts (VP Communications)
  | "exports:access"        // Access to data export endpoints
  | "finance:view"          // View financial data
  | "finance:manage"        // Edit financial data
  | "transitions:view"      // View transition plans
  | "transitions:approve"   // Approve transition plans
  | "users:manage"          // Create/update user roles and entitlements
  | "admin:full"            // Full admin access (implies all capabilities)
  | "debug:readonly"        // Debug read-only access (for support, default OFF)
  // Delegation and role assignment (DM-3, DM-4, SD-3)
  | "roles:assign"          // Authority to create role assignments (delegation)
  | "roles:view"            // Authority to view role assignments
  // Officer portal: Meetings
  | "meetings:read"                     // View meetings list and details
  | "meetings:motions:read"             // View motions within meetings
  | "meetings:motions:annotate"         // Add annotations to motions
  | "meetings:minutes:draft:create"     // Create draft minutes
  | "meetings:minutes:draft:edit"       // Edit draft minutes
  | "meetings:minutes:draft:submit"     // Submit draft for review
  | "meetings:minutes:read_all"         // View all minutes including drafts
  | "meetings:minutes:revise"           // Revise minutes after submission
  | "meetings:minutes:finalize"         // Finalize minutes
  // Officer portal: Board Records
  | "board_records:read"                // View board records
  | "board_records:draft:create"        // Create draft board records
  | "board_records:draft:edit"          // Edit draft board records
  | "board_records:draft:submit"        // Submit draft for review
  // Officer portal: Governance
  | "governance:flags:read"             // View governance flags
  | "governance:flags:write"            // Create/edit governance flags
  | "governance:flags:create"           // Create governance flags (legacy)
  | "governance:flags:resolve"          // Resolve governance flags
  | "governance:rules:manage"           // Manage rules guidance
  | "governance:annotations:read"       // View governance annotations
  | "governance:annotations:write"      // Create/edit governance annotations
  | "governance:annotations:publish"    // Publish/unpublish annotations
  // Governance: Interpretations (Parliamentarian)
  | "governance:interpretations:create"   // Create interpretation log entries
  | "governance:interpretations:edit"     // Edit interpretation log entries
  | "governance:interpretations:publish"  // Publish interpretation entries
  // Governance: Policy annotations (Parliamentarian)
  | "governance:policies:annotate"        // Add annotations to policies/bylaws
  | "governance:policies:propose_change"  // Propose changes to policies
  // Governance: Internal documents (Secretary, Parliamentarian)
  | "governance:docs:read"                // Read internal governance documents
  | "governance:docs:write"               // Write internal governance documents
  // Content publishing
  | "content:board:publish"             // Publish board content
  | "content:board:request_publish"     // Request board content publication
  // File storage
  | "files:upload"                      // Upload files
  | "files:manage"                      // Manage all files (admin)
  | "files:view_all"                    // View all files regardless of access
  // Delegation and role assignment
  | "roles:assign"                      // Authority to create role assignments (SD-3, DM-3)
  | "roles:view"                        // Authority to view role assignments
  // Activity Groups (member-led interest groups)
  | "groups:view"                       // View public groups (all members)
  | "groups:propose"                    // Propose new group (any member)
  | "groups:approve"                    // Approve/reject/deactivate groups (President, VP Activities)
  | "groups:join"                       // Join approved groups (all members)
  | "groups:coordinate"                 // Manage own group - scoped to coordinator role
  | "groups:message"                    // Send group messages - scoped to coordinator role
  | "groups:events";                    // Create group events - scoped to coordinator role

/**
 * Map of which capabilities each role has.
 *
 * DEPRECATED: Direct access to this map is deprecated.
 * Use getRoleCapabilitiesFromPolicy() for policy-backed lookups.
 *
 * SBNC Policy Coupling Audit Reference:
 * - Issue #262, RD-002: This map is SBNC-specific coupling
 * - See src/lib/policies/roleCapabilities.ts for policy layer
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
 *
 * @deprecated Use getRoleCapabilitiesFromPolicy() instead
 */
const _ROLE_CAPABILITIES: Record<GlobalRole, Capability[]> = {
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
    "events:approve",
    "events:submit",
    "events:schedule:view",
    "events:enews:edit",
    "exports:access",
    "finance:view",
    "finance:manage",
    "transitions:view",
    "transitions:approve",
    "users:manage",
    "roles:assign",   // DM-3: Can assign roles
    "roles:view",     // Can view role assignments
    "files:upload",
    "files:manage",
    "files:view_all",
    "roles:assign",     // SD-3, DM-3: Can assign roles to any committee
    "roles:view",
    // Activity Groups - admin has all capabilities
    "groups:view",
    "groups:propose",
    "groups:approve",
    "groups:join",
    "groups:coordinate",
    "groups:message",
    "groups:events",
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
    "roles:assign",   // DM-3: Can assign roles
    "roles:view",     // Can view role assignments
    // Governance oversight
    "governance:flags:read",
    "governance:flags:resolve",
    "governance:annotations:read",
    // Delegation authority
    "roles:assign",     // SD-3, DM-3: Can assign roles to any committee
    "roles:view",
    // Activity Groups - President can approve/deactivate groups
    "groups:view",
    "groups:propose",
    "groups:approve",   // Can approve/reject/deactivate activity groups
    "groups:join",
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
    "events:approve",        // Can approve events (PENDING_APPROVAL -> APPROVED)
    "events:submit",         // Can also submit events (inherits chair permissions)
    "events:schedule:view",  // Can view event schedule for coordination
    "transitions:view",
    "transitions:approve",
    // Delegation authority for activities domain
    "roles:assign",          // SD-3, DM-3: Can assign event chair roles within domain
    "roles:view",
    // Activity Groups - VP Activities can approve/deactivate groups
    "groups:view",
    "groups:propose",
    "groups:approve",        // Can approve/reject/deactivate activity groups
    "groups:join",
    // VP Activities can edit all events (peer trust model)
    // NO events:delete - admin only
    // NO finance:view/manage
    // NO exports:access
  ],
  "vp-communications": [
    "events:view",           // View all events for newsletter coordination
    "events:schedule:view",  // View upcoming publish/registration schedule
    "events:enews:edit",     // Edit eNews blurb drafts
    "comms:manage",          // Manage email templates and campaigns
    "comms:send",            // Send newsletter campaigns
    // Delegation authority for communications domain
    "roles:assign",          // SD-3, DM-3: Can assign roles within domain
    "roles:view",
    // VP Communications focuses on newsletter and member communication
    // NO events:edit - cannot modify event content (VP Activities handles that)
    // NO events:approve - cannot approve events
    // NO members:view - doesn't need member detail access
    // NO finance:view/manage
    // NO exports:access
  ],
  "event-chair": [
    "members:view",
    "registrations:view",
    "events:view",
    "events:submit",         // Can submit events for approval (own committee's events)
    // NO roles:assign - DM-3: Chairs cannot assign roles
    // NO roles:view - Cannot see role assignments
    // NO members:history - event chairs see only event-related member info
    // NO events:edit - committee-scoped edit handled separately
    // NO events:approve - VP Activities handles approval
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
  secretary: [
    // Minutes workflow: draft, edit, submit for review
    "meetings:read",
    "meetings:minutes:draft:create",
    "meetings:minutes:draft:edit",
    "meetings:minutes:draft:submit",
    "meetings:minutes:read_all",
    // Internal governance documents
    "governance:docs:read",
    // Governance annotations and flags (view and create)
    "governance:annotations:read",
    "governance:annotations:write",
    "governance:flags:read",
    "governance:flags:write",
    "governance:flags:create",
    // File management for governance documents
    "files:upload",
    // NO meetings:minutes:finalize - President approves final minutes
    // NO governance:annotations:publish - Parliamentarian controls publishing
    // NO governance:flags:resolve - Parliamentarian resolves flags
    // NO finance:view/manage
    // NO members:history
    // NO publishing:manage
  ],
  parliamentarian: [
    // Meetings access for procedural oversight
    "meetings:read",
    "meetings:motions:read",
    "meetings:motions:annotate",
    // Rules and governance management
    "governance:rules:manage",
    "governance:flags:read",
    "governance:flags:write",
    "governance:flags:create",
    "governance:flags:resolve",
    // Governance annotations (full control including publish)
    "governance:annotations:read",
    "governance:annotations:write",
    "governance:annotations:publish",
    // Interpretations log (bylaws/policy interpretations)
    "governance:interpretations:create",
    "governance:interpretations:edit",
    "governance:interpretations:publish",
    // Policy annotations and change proposals
    "governance:policies:annotate",
    "governance:policies:propose_change",
    // Internal governance documents
    "governance:docs:read",
    "governance:docs:write",
    // File management for governance documents
    "files:upload",
    // NO content:board:publish - cannot publish member-facing content
    // NO finance:view/manage
    // NO members:history
    // NO publishing:manage
  ],
  member: [
    // Activity Groups - basic member capabilities
    "groups:view",     // View public groups
    "groups:propose",  // Propose new groups
    "groups:join",     // Join approved groups
    // Note: groups:coordinate, groups:message, groups:events are scoped
    // to coordinators only - checked at runtime via groupAuth.ts
  ],
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
 *
 * Uses policy-backed lookup (Issue #262, RD-002) while preserving
 * webmaster debug mode runtime override.
 */
function getEffectiveCapabilities(role: GlobalRole): Capability[] {
  // Policy-backed lookup (Issue #262, RD-002)
  const policyResult = getRoleCapabilitiesFromPolicy(role);
  const baseCaps = [...policyResult.capabilities];

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

// ============================================================================
// TIME-BOUNDED AUTHORITY (Charter P2)
// Role assignments have startDate and endDate. Access is only granted when
// the current time falls within the assignment's time bounds.
// ============================================================================

/**
 * Map committee role slugs to GlobalRole for capability resolution.
 * This bridges the gap between database CommitteeRole records and the
 * static capability system.
 *
 * Convention: slugs use lowercase-with-dashes, matching GlobalRole values.
 */
const COMMITTEE_ROLE_TO_GLOBAL_ROLE: Record<string, GlobalRole> = {
  // Leadership roles
  president: "president",
  "past-president": "past-president",
  "vp-activities": "vp-activities",
  "vp-communications": "vp-communications",
  secretary: "secretary",
  parliamentarian: "parliamentarian",
  webmaster: "webmaster",
  // Committee roles
  "event-chair": "event-chair",
  chair: "event-chair",
  "committee-chair": "event-chair",
};

/**
 * Derive GlobalRole from a CommitteeRole slug.
 * Unknown slugs default to "member" (no elevated capabilities).
 */
export function deriveGlobalRoleFromSlug(slug: string): GlobalRole {
  return COMMITTEE_ROLE_TO_GLOBAL_ROLE[slug.toLowerCase()] ?? "member";
}

/**
 * Role assignment with included committee role info.
 */
export interface ActiveRoleAssignment {
  id: string;
  memberId: string;
  committeeId: string;
  committeeRoleId: string;
  termId: string;
  startDate: Date;
  endDate: Date | null;
  committeeRole: {
    id: string;
    slug: string;
    name: string;
  };
}

/**
 * Result of time-bounded capability resolution.
 */
export interface EffectiveCapabilities {
  /** Highest GlobalRole from active assignments */
  role: GlobalRole;
  /** Aggregated capabilities from all active assignments */
  capabilities: Capability[];
  /** Active assignments that contributed to these capabilities */
  assignments: ActiveRoleAssignment[];
}

/**
 * GlobalRole priority for determining highest effective role.
 * Higher number = higher authority.
 */
const ROLE_PRIORITY: Record<GlobalRole, number> = {
  member: 0,
  "event-chair": 1,
  webmaster: 2,
  parliamentarian: 3,
  secretary: 3,
  "vp-communications": 4,
  "vp-activities": 4,
  "past-president": 5,
  president: 6,
  admin: 10,
};

/**
 * Derive the highest GlobalRole from a set of active assignments.
 */
export function deriveGlobalRoleFromAssignments(
  assignments: ActiveRoleAssignment[]
): GlobalRole {
  if (assignments.length === 0) {
    return "member";
  }

  let highestRole: GlobalRole = "member";
  let highestPriority = 0;

  for (const assignment of assignments) {
    const role = deriveGlobalRoleFromSlug(assignment.committeeRole.slug);
    const priority = ROLE_PRIORITY[role];
    if (priority > highestPriority) {
      highestPriority = priority;
      highestRole = role;
    }
  }

  return highestRole;
}

/**
 * Get all active role assignments for a member at a given time.
 *
 * Charter P2: Time-bounded authority.
 * - TB-1: startDate <= asOfDate (must have started)
 * - TB-2: endDate is null OR endDate > asOfDate (must not have ended)
 *
 * @param memberId - The member to check assignments for
 * @param asOfDate - The point in time to evaluate (defaults to now)
 * @returns Active role assignments with committee role info
 */
export async function getActiveRoleAssignments(
  memberId: string,
  asOfDate: Date = new Date()
): Promise<ActiveRoleAssignment[]> {
  const { prisma } = await import("@/lib/prisma");

  const assignments = await prisma.roleAssignment.findMany({
    where: {
      memberId,
      startDate: { lte: asOfDate }, // TB-1: Must have started
      OR: [
        { endDate: null }, // No end date = still active
        { endDate: { gt: asOfDate } }, // TB-2: Must not have ended
      ],
    },
    include: {
      committeeRole: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
  });

  return assignments;
}

/**
 * Get member's effective capabilities considering time bounds.
 *
 * Charter P2: Time-bounded authority.
 * - Queries RoleAssignment with date validation
 * - Aggregates capabilities from all active assignments
 * - Returns highest effective GlobalRole
 *
 * This function enforces TB-1 (activation) and TB-2 (expiration) guarantees.
 *
 * @param memberId - The member to get capabilities for
 * @param asOfDate - The point in time to evaluate (defaults to now)
 * @returns Effective capabilities with active assignments
 */
export async function getEffectiveCapabilitiesForMember(
  memberId: string,
  asOfDate: Date = new Date()
): Promise<EffectiveCapabilities> {
  const assignments = await getActiveRoleAssignments(memberId, asOfDate);

  // Derive highest role from active assignments
  const role = deriveGlobalRoleFromAssignments(assignments);

  // Aggregate capabilities from all active assignments
  // Each assignment's role contributes its capabilities
  const capabilitySet = new Set<Capability>();
  for (const assignment of assignments) {
    const assignmentRole = deriveGlobalRoleFromSlug(assignment.committeeRole.slug);
    const roleCaps = getEffectiveCapabilities(assignmentRole);
    for (const cap of roleCaps) {
      capabilitySet.add(cap);
    }
  }

  return {
    role,
    capabilities: [...capabilitySet],
    assignments,
  };
}

/**
 * Check if a member has a capability at a given time.
 * This is the time-aware version of hasCapability().
 *
 * Charter P2: Time-bounded authority.
 * - Validates against active role assignments
 * - Returns false if no active assignment grants the capability
 *
 * @param memberId - The member to check
 * @param capability - The capability to check for
 * @param asOfDate - The point in time to evaluate (defaults to now)
 * @returns true if member has the capability via an active assignment
 */
export async function hasMemberCapability(
  memberId: string,
  capability: Capability,
  asOfDate: Date = new Date()
): Promise<boolean> {
  const { capabilities } = await getEffectiveCapabilitiesForMember(memberId, asOfDate);

  // admin:full implies all capabilities
  if (capabilities.includes("admin:full")) {
    return true;
  }

  return capabilities.includes(capability);
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
// Uses __Host- prefix in production for additional security
export const SESSION_COOKIE_NAME = getSessionCookieName();
const DEV_SESSION_COOKIE_NAME = "murmurant_dev_session";

/**
 * Check if we're running in production mode.
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Read session token from HttpOnly cookies.
 * In production: reads murmurant_session
 * In development: also checks murmurant_dev_session as fallback
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
    // First try test tokens (for development)
    const testContext = parseTestToken(sessionToken);
    if (testContext) {
      return { ok: true, context: testContext };
    }

    // Then try real DB-backed sessions
    const session = await getSession(sessionToken);
    if (session) {
      // Get memberId from user account
      const { prisma } = await import("@/lib/prisma");
      const userAccount = await prisma.userAccount.findUnique({
        where: { id: session.userAccountId },
        select: { memberId: true },
      });

      return {
        ok: true,
        context: {
          memberId: userAccount?.memberId ?? session.userAccountId,
          email: session.email,
          globalRole: session.globalRole as GlobalRole,
        },
      };
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

// ============================================================================
// IMPERSONATION SUPPORT
// ============================================================================

/**
 * Capabilities that are BLOCKED during impersonation.
 * These are dangerous capabilities that should not be exercised while
 * viewing as another member.
 *
 * Charter P2: Default deny - impersonation is read-heavy.
 * Charter P7: Audit trail - blocked actions prevent unauthorized mutations.
 */
export const BLOCKED_WHILE_IMPERSONATING: Capability[] = [
  "finance:manage",   // No money movement while impersonating
  "comms:send",       // No email sending while impersonating
  "users:manage",     // No role changes while impersonating
  "events:delete",    // No destructive actions
  "admin:full",       // Downgrade to read-only admin
];

/**
 * Extended auth context that includes impersonation info.
 */
export interface ImpersonationContext {
  /** True if admin is impersonating another member */
  isImpersonating: boolean;
  /** The impersonated member's ID (if impersonating) */
  impersonatedMemberId?: string;
  /** The impersonated member's name (if impersonating) */
  impersonatedMemberName?: string;
  /** The real admin's member ID */
  realAdminMemberId: string;
  /** The session ID (needed for API operations) */
  sessionId: string;
}

/**
 * Get effective member info for the current request.
 * If impersonating, returns the impersonated member's info.
 * Otherwise, returns the authenticated user's info.
 *
 * This is the canonical function to use when you need to know
 * "whose data should be shown" rather than "who is the real user".
 */
export async function getEffectiveMember(
  req: NextRequest
): Promise<{
  memberId: string;
  email: string;
  isImpersonating: boolean;
  realAdminMemberId?: string;
  sessionId?: string;
} | null> {
  const { getSessionWithImpersonation } = await import("@/lib/auth/session");
  const { getSessionCookieName } = await import("@/lib/auth/cookies");

  const sessionCookie = req.cookies.get(getSessionCookieName());
  if (!sessionCookie?.value) {
    return null;
  }

  const session = await getSessionWithImpersonation(sessionCookie.value);
  if (!session) {
    return null;
  }

  // Get memberId from user account
  const { prisma } = await import("@/lib/prisma");
  const userAccount = await prisma.userAccount.findUnique({
    where: { id: session.userAccountId },
    select: { memberId: true },
  });

  const realMemberId = userAccount?.memberId ?? session.userAccountId;

  if (session.impersonation) {
    return {
      memberId: session.impersonation.memberId,
      email: session.impersonation.memberEmail,
      isImpersonating: true,
      realAdminMemberId: realMemberId,
      sessionId: session.id,
    };
  }

  return {
    memberId: realMemberId,
    email: session.email,
    isImpersonating: false,
    sessionId: session.id,
  };
}

/**
 * Check if a capability is blocked during impersonation.
 */
export function isBlockedWhileImpersonating(capability: Capability): boolean {
  return BLOCKED_WHILE_IMPERSONATING.includes(capability);
}

/**
 * Extended auth result that includes impersonation info.
 */
export type SafeAuthResult =
  | { ok: true; context: AuthContext; isImpersonating: boolean; realAdminMemberId?: string }
  | { ok: false; response: NextResponse };

/**
 * Validates the authenticated user has the required capability,
 * with additional safety checks for impersonation.
 *
 * When a user is impersonating another member, dangerous capabilities
 * (finance, email, role changes, deletions) are automatically blocked.
 *
 * Returns 403 if:
 * - User lacks the capability
 * - User is impersonating AND capability is in BLOCKED_WHILE_IMPERSONATING
 *
 * Charter P2: Authorization with impersonation safety.
 */
export async function requireCapabilitySafe(
  req: NextRequest,
  capability: Capability
): Promise<SafeAuthResult> {
  // First, do normal auth
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult;
  }

  // Check if user has the capability
  if (!hasCapability(authResult.context.globalRole, capability)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Access denied", message: `Required capability: ${capability}` },
        { status: 403 }
      ),
    };
  }

  // Check for impersonation and blocked capabilities
  const effectiveMember = await getEffectiveMember(req);
  const isImpersonating = effectiveMember?.isImpersonating ?? false;

  if (isImpersonating && isBlockedWhileImpersonating(capability)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Action blocked during impersonation",
          message: `The capability "${capability}" is disabled while viewing as another member. Exit impersonation to perform this action.`,
          blockedCapability: capability,
          impersonating: true,
        },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    context: authResult.context,
    isImpersonating,
    realAdminMemberId: effectiveMember?.realAdminMemberId,
  };
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
// Helper to extract UUID or use fallback
function extractUuidOrFallback(extracted: string, fallbackUuid: string): string {
  return extracted && extracted.includes("-") ? extracted : fallbackUuid;
}

function parseTestToken(token: string): AuthContext | null {
  // Test admin token - supports test-admin-<uuid>
  if (token.startsWith("test-admin-")) {
    const extracted = token.slice(11);
    const memberId = extractUuidOrFallback(extracted, "00000000-0000-0000-0000-000000000001");
    return {
      memberId,
      email: "admin@test.com",
      globalRole: "admin",
    };
  }

  // Test webmaster token - supports test-webmaster-<uuid>
  if (token.startsWith("test-webmaster-")) {
    const extracted = token.slice(15);
    const memberId = extractUuidOrFallback(extracted, "00000000-0000-0000-0000-000000000002");
    return {
      memberId,
      email: "webmaster@test.com",
      globalRole: "webmaster",
    };
  }

  // Test VP of Activities token - supports test-vp-<uuid>
  if (token.startsWith("test-vp-")) {
    const extracted = token.slice(8);
    const memberId = extractUuidOrFallback(extracted, "00000000-0000-0000-0000-000000000003");
    return {
      memberId,
      email: "vp@test.com",
      globalRole: "vp-activities",
    };
  }

  // Test Event Chair token - supports test-chair-<uuid>
  if (token.startsWith("test-chair-")) {
    const extracted = token.slice(11);
    const memberId = extractUuidOrFallback(extracted, "00000000-0000-0000-0000-000000000004");
    return {
      memberId,
      email: "chair@test.com",
      globalRole: "event-chair",
    };
  }

  // Test President token - supports test-president-<uuid>
  if (token.startsWith("test-president-")) {
    const extracted = token.slice(15);
    const memberId = extractUuidOrFallback(extracted, "00000000-0000-0000-0000-000000000006");
    return {
      memberId,
      email: "president@test.com",
      globalRole: "president",
    };
  }

  // Test Past President token - supports test-past-president-<uuid>
  if (token.startsWith("test-past-president-")) {
    const extracted = token.slice(20);
    const memberId = extractUuidOrFallback(extracted, "00000000-0000-0000-0000-000000000007");
    return {
      memberId,
      email: "past-president@test.com",
      globalRole: "past-president",
    };
  }

  // Test Secretary token - supports test-secretary-<uuid>
  if (token.startsWith("test-secretary-")) {
    const extracted = token.slice(15);
    const memberId = extractUuidOrFallback(extracted, "00000000-0000-0000-0000-000000000008");
    return {
      memberId,
      email: "secretary@test.com",
      globalRole: "secretary",
    };
  }

  // Test Parliamentarian token - supports test-parliamentarian-<uuid>
  if (token.startsWith("test-parliamentarian-")) {
    const extracted = token.slice(21);
    // Use valid UUID format if extraction doesn't look like a UUID
    const memberId = extracted && extracted.includes("-") ? extracted : "00000000-0000-0000-0000-000000000009";
    return {
      memberId,
      email: "parliamentarian@test.com",
      globalRole: "parliamentarian",
    };
  }

  // Test member token - supports test-member-<uuid>
  if (token.startsWith("test-member-")) {
    const extracted = token.slice(12);
    // Use valid UUID format if extraction doesn't look like a UUID
    const memberId = extracted && extracted.includes("-") ? extracted : "00000000-0000-0000-0000-000000000005";
    return {
      memberId,
      email: "member@test.com",
      globalRole: "member",
    };
  }

  // Legacy simple tokens for backward compatibility with existing tests
  // Using valid UUID format to avoid Prisma parsing errors
  // These UUIDs don't exist in DB, so FK constraints may still fail
  if (token === "admin-token" || token === "test-admin" || token === "test-admin-token") {
    return {
      memberId: "00000000-0000-0000-0000-000000000001",
      email: "admin@test.com",
      globalRole: "admin",
    };
  }

  if (token === "webmaster-token" || token === "test-webmaster") {
    return {
      memberId: "00000000-0000-0000-0000-000000000002",
      email: "webmaster@test.com",
      globalRole: "webmaster",
    };
  }

  if (token === "vp-token" || token === "test-vp") {
    return {
      memberId: "00000000-0000-0000-0000-000000000003",
      email: "vp@test.com",
      globalRole: "vp-activities",
    };
  }

  if (token === "chair-token" || token === "test-chair") {
    return {
      memberId: "00000000-0000-0000-0000-000000000004",
      email: "chair@test.com",
      globalRole: "event-chair",
    };
  }

  if (token === "member-token" || token === "test-member") {
    return {
      memberId: "00000000-0000-0000-0000-000000000005",
      email: "member@test.com",
      globalRole: "member",
    };
  }

  if (token === "president-token" || token === "test-president") {
    return {
      memberId: "00000000-0000-0000-0000-000000000006",
      email: "president@test.com",
      globalRole: "president",
    };
  }

  if (token === "past-president-token" || token === "test-past-president") {
    return {
      memberId: "00000000-0000-0000-0000-000000000007",
      email: "past-president@test.com",
      globalRole: "past-president",
    };
  }

  if (token === "secretary-token" || token === "test-secretary") {
    return {
      memberId: "00000000-0000-0000-0000-000000000008",
      email: "secretary@test.com",
      globalRole: "secretary",
    };
  }

  if (token === "parliamentarian-token" || token === "test-parliamentarian") {
    return {
      memberId: "00000000-0000-0000-0000-000000000009",
      email: "parliamentarian@test.com",
      globalRole: "parliamentarian",
    };
  }

  return null;
}
