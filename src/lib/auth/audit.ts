/**
 * Auth Audit Logging
 *
 * Specialized audit logging for authentication events.
 * Integrates with the main audit system but provides
 * auth-specific helpers.
 *
 * Charter Compliance:
 * - P1: Identity and authorization must be provable
 * - P7: Observability is a product feature
 * - N5: Never let automation mutate data without audit logs
 */

import { prisma } from "@/lib/prisma";
import { Prisma, type AuditAction } from "@prisma/client";

export type AuthAuditEvent =
  | "LOGIN"
  | "LOGOUT"
  | "SESSION_REVOKED"
  | "EMAIL_LINK_SENT"
  | "EMAIL_LINK_USED";

interface AuthAuditParams {
  event: AuthAuditEvent;
  email: string;
  userAccountId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Generate a unique request ID for tracing.
 */
function generateRequestId(): string {
  return `auth_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Map auth events to AuditAction enum values.
 */
function mapEventToAction(event: AuthAuditEvent): AuditAction {
  const mapping: Record<AuthAuditEvent, AuditAction> = {
    LOGIN: "LOGIN",
    LOGOUT: "LOGOUT",
    SESSION_REVOKED: "SESSION_REVOKED",
    EMAIL_LINK_SENT: "EMAIL_LINK_SENT",
    EMAIL_LINK_USED: "EMAIL_LINK_USED",
  };
  return mapping[event];
}

/**
 * Create an audit log entry for an authentication event.
 *
 * @param params - Auth audit parameters
 */
export async function auditAuthEvent(params: AuthAuditParams): Promise<void> {
  const {
    event,
    email,
    userAccountId,
    sessionId,
    ipAddress,
    userAgent,
    metadata,
  } = params;

  try {
    const requestId = generateRequestId();

    await prisma.auditLog.create({
      data: {
        action: mapEventToAction(event),
        resourceType: "auth",
        resourceId: sessionId ?? userAccountId ?? email,
        // Note: memberId is optional for auth events (user may not exist yet)
        memberId: null,
        before: Prisma.JsonNull,
        after: {
          email,
          userAccountId,
          sessionId,
        },
        metadata: {
          ...metadata,
          requestId,
          event,
        },
        ipAddress,
        userAgent,
      },
    });

    // Log for observability
    console.log(
      `[AUTH] ${event} for ${email}${sessionId ? ` (session: ${sessionId.slice(0, 8)}...)` : ""}`
    );
  } catch (error) {
    // Log but don't fail the request - audit failure shouldn't block auth
    console.error("[AUTH AUDIT] Failed to create audit entry:", error);
  }
}

/**
 * Convenience functions for specific auth events.
 */

export async function auditLogin(
  email: string,
  userAccountId: string,
  sessionId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await auditAuthEvent({
    event: "LOGIN",
    email,
    userAccountId,
    sessionId,
    ipAddress,
    userAgent,
    metadata: { method: "magic_link" },
  });
}

export async function auditLogout(
  email: string,
  sessionId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await auditAuthEvent({
    event: "LOGOUT",
    email,
    sessionId,
    ipAddress,
    userAgent,
  });
}

export async function auditSessionRevoked(
  email: string,
  sessionId: string,
  revokedBy: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await auditAuthEvent({
    event: "SESSION_REVOKED",
    email,
    sessionId,
    ipAddress,
    userAgent,
    metadata: { revokedBy, reason },
  });
}

export async function auditMagicLinkSent(
  email: string,
  linkId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await auditAuthEvent({
    event: "EMAIL_LINK_SENT",
    email,
    ipAddress,
    userAgent,
    metadata: { linkId },
  });
}

export async function auditMagicLinkUsed(
  email: string,
  linkId: string,
  userAccountId: string | null,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await auditAuthEvent({
    event: "EMAIL_LINK_USED",
    email,
    userAccountId: userAccountId ?? undefined,
    ipAddress,
    userAgent,
    metadata: { linkId },
  });
}
