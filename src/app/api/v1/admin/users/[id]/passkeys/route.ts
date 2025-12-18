/**
 * GET /api/v1/admin/users/:id/passkeys
 * DELETE /api/v1/admin/users/:id/passkeys (body: { passkeyId: string, reason: string })
 *
 * Admin management of user passkeys.
 * Requires admin:full or users:manage capability.
 *
 * GET Response:
 * - 200: { passkeys: PasskeyInfo[], user: { email: string } }
 * - 401: Not authenticated
 * - 403: Not authorized
 * - 404: User not found
 *
 * DELETE Response:
 * - 204: Passkey revoked
 * - 400: Invalid request
 * - 401: Not authenticated
 * - 403: Not authorized
 * - 404: User or passkey not found
 *
 * Security:
 * - Requires admin:full or users:manage capability
 * - Reason is required for admin revocation (audit trail)
 * - All actions are audit-logged
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability, AuthContext } from "@/lib/auth";
import { listPasskeys, adminRevokePasskey } from "@/lib/passkey";
import { errors } from "@/lib/api";
import { auditMutation } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const DeleteSchema = z.object({
  passkeyId: z.string().uuid(),
  reason: z.string().min(10).max(500), // Require meaningful reason for admin actions
});

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id: userAccountId } = await params;

  // Require users:manage capability
  const auth = await requireCapability(req, "users:manage");
  if (!auth.ok) return auth.response;

  try {
    // Get user account
    const userAccount = await prisma.userAccount.findUnique({
      where: { id: userAccountId },
      select: {
        id: true,
        email: true,
        member: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!userAccount) {
      return errors.notFound("UserAccount", userAccountId);
    }

    const passkeys = await listPasskeys(userAccountId);

    return NextResponse.json({
      user: {
        id: userAccount.id,
        email: userAccount.email,
        name: `${userAccount.member.firstName} ${userAccount.member.lastName}`,
      },
      passkeys: passkeys.map((p) => ({
        id: p.id,
        credentialId: p.credentialId.slice(0, 16) + "...", // Truncate for display
        deviceName: p.deviceName,
        createdAt: p.createdAt.toISOString(),
        lastUsedAt: p.lastUsedAt?.toISOString() ?? null,
        isRevoked: p.isRevoked,
      })),
    });
  } catch (error) {
    console.error("[ADMIN_PASSKEY] List error:", error);
    return errors.internal("Failed to list user passkeys");
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id: userAccountId } = await params;

  // Require users:manage capability
  const auth = await requireCapability(req, "users:manage");
  if (!auth.ok) return auth.response;

  const context = auth.context as AuthContext;

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
    let message = "Invalid request format";
    if (firstError) {
      if (firstError[0] === "reason") {
        message = "Reason must be at least 10 characters";
      } else {
        message = `Invalid ${firstError[0]}: ${firstError[1]?.[0]}`;
      }
    }
    return errors.validation(message);
  }

  const { passkeyId, reason } = parsed.data;

  try {
    // Verify the passkey belongs to the specified user
    const passkey = await prisma.passkeyCredential.findUnique({
      where: { id: passkeyId },
      select: { userAccountId: true },
    });

    if (!passkey) {
      return errors.notFound("Passkey", passkeyId);
    }

    if (passkey.userAccountId !== userAccountId) {
      return errors.validation("Passkey does not belong to this user");
    }

    const result = await adminRevokePasskey(passkeyId, context.memberId, reason);

    // Audit log the admin revocation
    await auditMutation(req, context, {
      action: "PASSKEY_REVOKED",
      capability: "users:manage",
      objectType: "PasskeyCredential",
      objectId: passkeyId,
      metadata: {
        reason,
        revokedBySelf: false,
        targetUserEmail: result.email,
        targetUserAccountId: result.userAccountId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ADMIN_PASSKEY] Revoke error:", message);

    if (message.includes("not found")) {
      return errors.notFound("Passkey", passkeyId);
    }

    if (message.includes("already revoked")) {
      return errors.conflict("This passkey has already been revoked");
    }

    return errors.internal("Failed to revoke passkey");
  }
}
