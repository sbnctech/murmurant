/**
 * POST /api/v1/auth/magic-link/verify
 *
 * Verify a magic link token and create a session.
 *
 * Request body:
 * {
 *   token: string
 * }
 *
 * Response:
 * - 200: { success: true, email: string } + Sets session cookie
 * - 400: Invalid or expired token
 *
 * Security:
 * - Token is single-use (marked used on verification)
 * - Token expires after 15 minutes
 * - Session cookie is set as HttpOnly, Secure, SameSite=Lax
 * - Event is audit-logged
 */

import { NextRequest, NextResponse } from "next/server";
import {
  verifyMagicLink,
  createSession,
  setSessionCookie,
} from "@/lib/passkey";
import { errors } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createAuditEntry } from "@/lib/audit";
import type { GlobalRole } from "@/lib/auth";
import { z } from "zod";

const RequestSchema = z.object({
  token: z.string().min(1),
});

function getClientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") ?? undefined;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errors.validation("Invalid JSON body");
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return errors.validation("Token is required");
  }

  const { token } = parsed.data;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers.get("user-agent") ?? undefined;

  try {
    const result = await verifyMagicLink(token);

    if (!result.userAccountId || !result.memberId) {
      // User doesn't have an account - they need to register first
      // For now, return an error. In production, you might auto-create.
      return errors.validation("No account found. Please register first.");
    }

    // Look up member's role assignments to determine global role
    const member = await prisma.member.findUnique({
      where: { id: result.memberId },
      include: {
        roleAssignments: {
          include: {
            committeeRole: true,
          },
        },
      },
    });

    // Determine global role from role assignments
    // Priority: admin > president > vp-activities > event-chair > webmaster > secretary > parliamentarian > member
    const roleSlugPriority: GlobalRole[] = [
      "admin",
      "president",
      "past-president",
      "vp-activities",
      "event-chair",
      "webmaster",
      "secretary",
      "parliamentarian",
    ];
    const memberRoleSlugs =
      member?.roleAssignments.map((ra) => ra.committeeRole.slug) || [];
    const globalRole: GlobalRole =
      roleSlugPriority.find((r) => memberRoleSlugs.includes(r)) || "member";

    // Create session
    const sessionId = createSession(
      {
        memberId: result.memberId,
        userAccountId: result.userAccountId,
        email: result.email,
        globalRole,
      },
      ipAddress,
      userAgent
    );

    // Set session cookie
    await setSessionCookie(sessionId);

    // Audit log the successful login
    await createAuditEntry({
      action: "EMAIL_LINK_USED",
      resourceType: "UserAccount",
      resourceId: result.userAccountId,
      actor: {
        memberId: result.memberId,
        email: result.email,
        globalRole,
      },
      req,
      metadata: {
        loginMethod: "magic_link",
      },
    });

    return NextResponse.json({
      success: true,
      email: result.email,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[MAGIC_LINK] Verify error:", message);

    // Return user-friendly error messages
    if (message.includes("expired")) {
      return errors.validation("This link has expired. Please request a new one.");
    }

    if (message.includes("already been used")) {
      return errors.validation("This link has already been used. Please request a new one.");
    }

    return errors.validation("Invalid link. Please request a new one.");
  }
}
