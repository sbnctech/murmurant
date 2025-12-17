/**
 * Audit Logging Helper
 *
 * Charter Principles:
 * - P1: Identity and authorization must be provable
 * - N5: Never let automation mutate data without audit logs
 *
 * All privileged mutations must call createAuditEntry.
 */

import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";
import { AuthContext } from "@/lib/auth";
import { NextRequest } from "next/server";

export type AuditEntryParams = {
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  actor: AuthContext;
  req?: NextRequest;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

/**
 * Generate a unique request ID for tracing.
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Extract client IP from request headers.
 */
function getClientIp(req?: NextRequest): string | null {
  if (!req) return null;

  // Check common headers for proxied requests
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return null;
}

/**
 * Create an audit log entry for a privileged action.
 *
 * Usage:
 * ```typescript
 * await createAuditEntry({
 *   action: "CREATE",
 *   resourceType: "page",
 *   resourceId: page.id,
 *   actor: auth.context,
 *   req: request,
 *   after: { title: page.title, status: page.status },
 * });
 * ```
 */
export async function createAuditEntry({
  action,
  resourceType,
  resourceId,
  actor,
  req,
  before,
  after,
  metadata,
}: AuditEntryParams): Promise<void> {
  try {
    const requestId = generateRequestId();

    await prisma.auditLog.create({
      data: {
        action,
        resourceType,
        resourceId,
        memberId: actor.memberId !== "e2e-admin" ? actor.memberId : null,
        before: before ? JSON.parse(JSON.stringify(before)) : null,
        after: after ? JSON.parse(JSON.stringify(after)) : null,
        metadata: metadata
          ? JSON.parse(JSON.stringify({ ...metadata, requestId }))
          : { requestId },
        ipAddress: getClientIp(req),
        userAgent: req?.headers.get("user-agent") ?? null,
      },
    });

    // Log for observability (Charter P7)
    console.log(
      `[AUDIT] ${action} ${resourceType}/${resourceId} by ${actor.email} (${actor.globalRole})`
    );
  } catch (error) {
    // Log but don't fail the request - audit failure shouldn't block operations
    console.error("[AUDIT] Failed to create audit entry:", error);
  }
}

/**
 * Convenience function for CREATE actions.
 */
export async function auditCreate(
  resourceType: string,
  resourceId: string,
  actor: AuthContext,
  req?: NextRequest,
  after?: Record<string, unknown>
): Promise<void> {
  await createAuditEntry({
    action: "CREATE",
    resourceType,
    resourceId,
    actor,
    req,
    after,
  });
}

/**
 * Convenience function for UPDATE actions.
 */
export async function auditUpdate(
  resourceType: string,
  resourceId: string,
  actor: AuthContext,
  req?: NextRequest,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>
): Promise<void> {
  await createAuditEntry({
    action: "UPDATE",
    resourceType,
    resourceId,
    actor,
    req,
    before,
    after,
  });
}

/**
 * Convenience function for DELETE actions.
 */
export async function auditDelete(
  resourceType: string,
  resourceId: string,
  actor: AuthContext,
  req?: NextRequest,
  before?: Record<string, unknown>
): Promise<void> {
  await createAuditEntry({
    action: "DELETE",
    resourceType,
    resourceId,
    actor,
    req,
    before,
  });
}

/**
 * Convenience function for PUBLISH actions.
 */
export async function auditPublish(
  resourceType: string,
  resourceId: string,
  actor: AuthContext,
  req?: NextRequest,
  metadata?: Record<string, unknown>
): Promise<void> {
  await createAuditEntry({
    action: "PUBLISH",
    resourceType,
    resourceId,
    actor,
    req,
    metadata,
  });
}

/**
 * Convenience function for SEND actions (e.g., email campaigns).
 */
export async function auditSend(
  resourceType: string,
  resourceId: string,
  actor: AuthContext,
  req?: NextRequest,
  metadata?: Record<string, unknown>
): Promise<void> {
  await createAuditEntry({
    action: "SEND",
    resourceType,
    resourceId,
    actor,
    req,
    metadata,
  });
}

// ============================================================================
// CANONICAL MUTATION AUDIT HELPER
// ============================================================================

/**
 * Parameters for the canonical auditMutation helper.
 *
 * This is the single preferred entry point for audit logging from API routes.
 */
export type AuditMutationParams = {
  /** The action being performed (CREATE, UPDATE, DELETE, PUBLISH, etc.) */
  action: AuditAction;
  /** The capability that authorized this action (e.g., "users:manage") */
  capability: string;
  /** The type of object being mutated (e.g., "TransitionPlan", "Meeting") */
  objectType: string;
  /** The unique ID of the object being mutated */
  objectId: string;
  /** Optional metadata (keep minimal, no PII or secrets) */
  metadata?: Record<string, unknown>;
};

/**
 * Canonical audit logging helper for privileged mutation endpoints.
 *
 * This is the single, preferred way to add audit logging to API routes.
 * It implements deny-path-safe behavior: if logging fails, it will NOT
 * throw an error that breaks the request, but WILL log a server error.
 *
 * Charter Principles:
 * - P1: Identity and authorization must be provable
 * - P7: Observability is a product feature
 * - N5: Never let automation mutate data without audit logs
 *
 * Usage:
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const auth = await requireCapability(req, "users:manage");
 *   if (!auth.ok) return auth.response;
 *
 *   // ... perform mutation ...
 *
 *   await auditMutation(req, auth.context, {
 *     action: "CREATE",
 *     capability: "users:manage",
 *     objectType: "TransitionPlan",
 *     objectId: plan.id,
 *     metadata: { targetTermId: plan.targetTermId },
 *   });
 *
 *   return NextResponse.json({ plan }, { status: 201 });
 * }
 * ```
 *
 * @param req - The NextRequest object (for IP, user-agent extraction)
 * @param auth - The authenticated AuthContext
 * @param params - Audit mutation parameters
 */
export async function auditMutation(
  req: NextRequest,
  auth: AuthContext,
  params: AuditMutationParams
): Promise<void> {
  const { action, capability, objectType, objectId, metadata } = params;

  await createAuditEntry({
    action,
    resourceType: objectType,
    resourceId: objectId,
    actor: auth,
    req,
    metadata: {
      ...metadata,
      capability,
      actorRole: auth.globalRole,
    },
  });
}
