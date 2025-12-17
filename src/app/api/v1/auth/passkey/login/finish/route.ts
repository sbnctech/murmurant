/**
 * POST /api/v1/auth/passkey/login/finish
 *
 * Finish passkey authentication ceremony.
 * Verifies the authenticator response and creates a session.
 *
 * Request body:
 * {
 *   challengeId: string,
 *   response: AuthenticationResponseJSON
 * }
 *
 * Response:
 * - 200: { success: true, email: string } + Sets session cookie
 * - 400: Invalid request or verification failed
 * - 429: Rate limited
 * - 500: Server error
 *
 * Security:
 * - Response is verified against expected origin and rpID
 * - Signature counter is validated (cloned authenticator detection)
 * - Session cookie is set as HttpOnly, Secure, SameSite=Lax
 * - Event is audit-logged
 */

import { NextRequest, NextResponse } from "next/server";
import {
  finishAuthentication,
  createSession,
  setSessionCookie,
} from "@/lib/passkey";
import { errors } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createAuditEntry } from "@/lib/audit";
import type { GlobalRole } from "@/lib/auth";
import { z } from "zod";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";

const RequestSchema = z.object({
  challengeId: z.string().uuid(),
  response: z.object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      clientDataJSON: z.string(),
      authenticatorData: z.string(),
      signature: z.string(),
      userHandle: z.string().optional(),
    }),
    type: z.literal("public-key"),
    clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
    authenticatorAttachment: z.string().optional(),
  }),
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
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = Object.entries(fieldErrors)[0];
    const message = firstError
      ? `Invalid ${firstError[0]}: ${firstError[1]?.[0]}`
      : "Invalid request format";
    return errors.validation(message);
  }

  const { challengeId, response } = parsed.data;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers.get("user-agent") ?? undefined;

  try {
    const result = await finishAuthentication(
      challengeId,
      response as AuthenticationResponseJSON
    );

    // Get member info for role lookup
    const userAccount = await prisma.userAccount.findUnique({
      where: { id: result.userAccountId },
      include: {
        member: {
          include: {
            roleAssignments: {
              include: {
                committeeRole: true,
              },
            },
          },
        },
      },
    });

    if (!userAccount) {
      return errors.internal("User account not found after authentication");
    }

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
    const memberRoleSlugs = userAccount.member.roleAssignments.map(
      (ra) => ra.committeeRole.slug
    );
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
      action: "PASSKEY_USED",
      resourceType: "PasskeyCredential",
      resourceId: result.credentialId,
      actor: {
        memberId: result.memberId,
        email: result.email,
        globalRole,
      },
      req,
      metadata: {
        loginMethod: "passkey",
      },
    });

    return NextResponse.json({
      success: true,
      email: result.email,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PASSKEY] Authentication finish error:", message);

    // Audit log failed attempt (but don't reveal details)
    try {
      await createAuditEntry({
        action: "PASSKEY_LOGIN_FAILED",
        resourceType: "AuthChallenge",
        resourceId: challengeId,
        actor: {
          memberId: "unknown",
          email: "unknown",
          globalRole: "member",
        },
        req,
        metadata: {
          reason: message.includes("Challenge") ? "challenge_error" : "verification_error",
        },
      });
    } catch {
      // Ignore audit errors
    }

    // Return generic error to prevent information leakage
    if (message.includes("revoked")) {
      return errors.validation("This passkey has been revoked. Please use another method to sign in.");
    }

    if (message.includes("disabled")) {
      return errors.validation("Your account has been disabled. Please contact support.");
    }

    if (message.includes("Challenge")) {
      return errors.validation("Login session expired. Please try again.");
    }

    return errors.validation("Authentication failed. Please try again.");
  }
}
