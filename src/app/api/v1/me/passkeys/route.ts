/**
 * GET /api/v1/me/passkeys
 * DELETE /api/v1/me/passkeys (body: { passkeyId: string })
 *
 * List and manage the authenticated user's passkeys.
 *
 * GET Response:
 * - 200: { passkeys: PasskeyInfo[] }
 * - 401: Not authenticated
 *
 * DELETE Response:
 * - 204: Passkey revoked
 * - 400: Invalid request
 * - 401: Not authenticated
 * - 404: Passkey not found
 *
 * Security:
 * - Requires valid session cookie
 * - Users can only manage their own passkeys
 * - Revocation is audit-logged
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthContext } from "@/lib/auth";
import { listPasskeys, revokePasskey } from "@/lib/passkey";
import { errors } from "@/lib/api";
import { auditMutation } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const DeleteSchema = z.object({
  passkeyId: z.string().uuid(),
  reason: z.string().max(200).optional(),
});

export async function GET(req: NextRequest) {
  // Require authenticated session
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { email } = auth.context as AuthContext;

  try {
    // Get user account ID
    const userAccount = await prisma.userAccount.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!userAccount) {
      return NextResponse.json({ passkeys: [] });
    }

    const passkeys = await listPasskeys(userAccount.id);

    return NextResponse.json({
      passkeys: passkeys.map((p) => ({
        id: p.id,
        deviceName: p.deviceName,
        createdAt: p.createdAt.toISOString(),
        lastUsedAt: p.lastUsedAt?.toISOString() ?? null,
        isRevoked: p.isRevoked,
      })),
    });
  } catch (error) {
    console.error("[PASSKEY] List error:", error);
    return errors.internal("Failed to list passkeys");
  }
}

export async function DELETE(req: NextRequest) {
  // Require authenticated session
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const context = auth.context as AuthContext;
  const { memberId, email } = context;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errors.validation("Invalid JSON body");
  }

  const parsed = DeleteSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = Object.entries(fieldErrors)[0];
    const message = firstError
      ? `Invalid ${firstError[0]}: ${firstError[1]?.[0]}`
      : "Invalid request format";
    return errors.validation(message);
  }

  const { passkeyId, reason } = parsed.data;

  try {
    // Get user account ID
    const userAccount = await prisma.userAccount.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!userAccount) {
      return errors.notFound("UserAccount", email);
    }

    await revokePasskey(passkeyId, userAccount.id, memberId, reason ?? "User requested removal");

    // Audit log the revocation
    await auditMutation(req, context, {
      action: "PASSKEY_REVOKED",
      capability: "self",
      objectType: "PasskeyCredential",
      objectId: passkeyId,
      metadata: {
        reason: reason ?? "User requested removal",
        revokedBySelf: true,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PASSKEY] Revoke error:", message);

    if (message.includes("not found")) {
      return errors.notFound("Passkey", passkeyId);
    }

    if (message.includes("does not belong")) {
      return errors.forbidden("self", "You can only remove your own passkeys");
    }

    if (message.includes("already revoked")) {
      return errors.conflict("This passkey has already been revoked");
    }

    return errors.internal("Failed to revoke passkey");
  }
}
