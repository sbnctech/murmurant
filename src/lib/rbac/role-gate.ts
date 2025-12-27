/**
 * RoleGate: Centralized RBAC Enforcement Module
 *
 * This module provides a unified interface for role-based access control.
 * All authorization checks should flow through this module to ensure
 * consistent enforcement of security invariants.
 *
 * Charter Principles:
 * - P1: Identity and authorization must be provable
 * - P2: Default deny, least privilege, object scope
 * - P9: Security must fail closed
 *
 * Anti-Patterns Avoided:
 * - N1: Never base security on page visibility
 * - N2: Never allow coarse roles to replace capabilities
 * - N6: Never ship without tests for permission boundaries
 */

import { NextRequest, NextResponse } from "next/server";
import {
  requireAuth,
  requireCapability,
  requireCapabilitySafe,
  hasCapability,
  GlobalRole,
  Capability,
  AuthContext,
} from "@/lib/auth";

// ============================================================================
// SECURITY INVARIANTS
// These must hold true at all times. Tests verify these.
// ============================================================================

/**
 * SI-1: Capabilities that only admin role should have.
 * Tests verify no other role has these.
 */
export const ADMIN_ONLY_CAPABILITIES: Capability[] = [
  "admin:full",
  "events:delete",
  "users:manage",
  "files:manage",
  "finance:manage",
];

/**
 * SI-2: Roles that must NEVER have finance access.
 * Tests verify these roles cannot access finance endpoints.
 */
export const FINANCE_DENIED_ROLES: GlobalRole[] = [
  "webmaster",
  "event-chair",
  "vp-communications",
  "secretary",
  "parliamentarian",
  "member",
];

/**
 * SI-3: Capabilities webmaster is explicitly denied.
 * Tests verify webmaster cannot access these.
 */
export const WEBMASTER_DENIED_CAPABILITIES: Capability[] = [
  "members:history",
  "exports:access",
  "finance:view",
  "finance:manage",
  "users:manage",
  "comms:send",
  "admin:full",
  "events:delete",
];

/**
 * SI-6: Capabilities blocked during impersonation.
 * Re-exported from auth.ts for consistency.
 */
export { BLOCKED_WHILE_IMPERSONATING } from "@/lib/auth";

// ============================================================================
// GATE RESULT TYPE
// Provides detailed information about authorization decisions.
// ============================================================================

export type GateResult =
  | {
      allowed: true;
      context: AuthContext;
      reason?: string;
    }
  | {
      allowed: false;
      reason: string;
      statusCode: 401 | 403;
      response: NextResponse;
    };

// ============================================================================
// GATE FUNCTIONS
// These wrap the auth functions with additional safety checks.
// ============================================================================

/**
 * Gate: Require authentication.
 * Returns 401 if not authenticated.
 *
 * Usage:
 * ```typescript
 * const gate = await RoleGate.requireAuth(req);
 * if (!gate.allowed) return gate.response;
 * // Use gate.context for user info
 * ```
 */
export async function gateRequireAuth(req: NextRequest): Promise<GateResult> {
  const result = await requireAuth(req);

  if (!result.ok) {
    return {
      allowed: false,
      reason: "Authentication required",
      statusCode: 401,
      response: result.response,
    };
  }

  return {
    allowed: true,
    context: result.context,
  };
}

/**
 * Gate: Require specific capability.
 * Returns 401 if not authenticated, 403 if capability missing.
 *
 * Usage:
 * ```typescript
 * const gate = await RoleGate.requireCapability(req, "members:view");
 * if (!gate.allowed) return gate.response;
 * ```
 */
export async function gateRequireCapability(
  req: NextRequest,
  capability: Capability
): Promise<GateResult> {
  const result = await requireCapability(req, capability);

  if (!result.ok) {
    // Determine if it was 401 or 403
    const status = result.response.status;
    return {
      allowed: false,
      reason: status === 401 ? "Authentication required" : `Missing capability: ${capability}`,
      statusCode: status as 401 | 403,
      response: result.response,
    };
  }

  return {
    allowed: true,
    context: result.context,
    reason: `Has capability: ${capability}`,
  };
}

/**
 * Gate: Require capability with impersonation safety.
 * Blocks dangerous capabilities during admin impersonation.
 *
 * Usage:
 * ```typescript
 * const gate = await RoleGate.requireCapabilitySafe(req, "finance:manage");
 * if (!gate.allowed) return gate.response;
 * ```
 */
export async function gateRequireCapabilitySafe(
  req: NextRequest,
  capability: Capability
): Promise<GateResult> {
  const result = await requireCapabilitySafe(req, capability);

  if (!result.ok) {
    const status = result.response.status;
    return {
      allowed: false,
      reason:
        status === 401 ? "Authentication required" : `Capability blocked: ${capability}`,
      statusCode: status as 401 | 403,
      response: result.response,
    };
  }

  return {
    allowed: true,
    context: result.context,
    reason: result.isImpersonating
      ? `Has capability ${capability} (impersonating)`
      : `Has capability: ${capability}`,
  };
}

/**
 * Gate: Require admin-only access.
 * Only allows roles with admin:full capability.
 *
 * Usage:
 * ```typescript
 * const gate = await RoleGate.requireAdmin(req);
 * if (!gate.allowed) return gate.response;
 * ```
 */
export async function gateRequireAdmin(req: NextRequest): Promise<GateResult> {
  return gateRequireCapability(req, "admin:full");
}

/**
 * Gate: Require one of multiple capabilities.
 * Returns 403 if none of the capabilities are present.
 *
 * Usage:
 * ```typescript
 * const gate = await RoleGate.requireAnyCapability(req, ["events:edit", "events:approve"]);
 * if (!gate.allowed) return gate.response;
 * ```
 */
export async function gateRequireAnyCapability(
  req: NextRequest,
  capabilities: Capability[]
): Promise<GateResult> {
  const authResult = await requireAuth(req);

  if (!authResult.ok) {
    return {
      allowed: false,
      reason: "Authentication required",
      statusCode: 401,
      response: authResult.response,
    };
  }

  const { context } = authResult;

  for (const cap of capabilities) {
    if (hasCapability(context.globalRole, cap)) {
      return {
        allowed: true,
        context,
        reason: `Has capability: ${cap}`,
      };
    }
  }

  return {
    allowed: false,
    reason: `Missing capabilities: ${capabilities.join(" OR ")}`,
    statusCode: 403,
    response: NextResponse.json(
      {
        error: "Access denied",
        message: `Required one of: ${capabilities.join(", ")}`,
      },
      { status: 403 }
    ),
  };
}

// ============================================================================
// INVARIANT VERIFICATION
// These functions verify security invariants at runtime.
// Called during tests and can be called during startup.
// ============================================================================

/**
 * Verify SI-1: Only admin has admin-only capabilities.
 * Throws if any non-admin role has these capabilities.
 */
export function verifyAdminOnlyCapabilities(): void {
  const nonAdminRoles: GlobalRole[] = [
    "president",
    "past-president",
    "vp-activities",
    "vp-communications",
    "event-chair",
    "webmaster",
    "secretary",
    "parliamentarian",
    "member",
  ];

  for (const role of nonAdminRoles) {
    for (const cap of ADMIN_ONLY_CAPABILITIES) {
      if (hasCapability(role, cap)) {
        throw new Error(
          `SECURITY INVARIANT VIOLATION (SI-1): Role "${role}" has admin-only capability "${cap}"`
        );
      }
    }
  }
}

/**
 * Verify SI-2: Finance-denied roles cannot access finance.
 * Throws if any restricted role has finance capabilities.
 */
export function verifyFinanceIsolation(): void {
  const financeCapabilities: Capability[] = ["finance:view", "finance:manage"];

  for (const role of FINANCE_DENIED_ROLES) {
    for (const cap of financeCapabilities) {
      if (hasCapability(role, cap)) {
        throw new Error(
          `SECURITY INVARIANT VIOLATION (SI-2): Role "${role}" has finance capability "${cap}"`
        );
      }
    }
  }
}

/**
 * Verify SI-3: Webmaster restrictions are enforced.
 * Throws if webmaster has any denied capability.
 */
export function verifyWebmasterRestrictions(): void {
  for (const cap of WEBMASTER_DENIED_CAPABILITIES) {
    if (hasCapability("webmaster", cap)) {
      throw new Error(
        `SECURITY INVARIANT VIOLATION (SI-3): Webmaster has denied capability "${cap}"`
      );
    }
  }
}

/**
 * Verify all security invariants.
 * Call this during test setup or application startup.
 */
export function verifyAllInvariants(): void {
  verifyAdminOnlyCapabilities();
  verifyFinanceIsolation();
  verifyWebmasterRestrictions();
}

// ============================================================================
// ROLE-GATE NAMESPACE EXPORT
// Provides a clean namespace for all gate functions.
// ============================================================================

export const RoleGate = {
  // Gate functions
  requireAuth: gateRequireAuth,
  requireCapability: gateRequireCapability,
  requireCapabilitySafe: gateRequireCapabilitySafe,
  requireAdmin: gateRequireAdmin,
  requireAnyCapability: gateRequireAnyCapability,

  // Invariant verification
  verifyAdminOnlyCapabilities,
  verifyFinanceIsolation,
  verifyWebmasterRestrictions,
  verifyAllInvariants,

  // Constants for testing
  ADMIN_ONLY_CAPABILITIES,
  FINANCE_DENIED_ROLES,
  WEBMASTER_DENIED_CAPABILITIES,
};

export default RoleGate;
