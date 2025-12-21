/**
 * DELETE /api/v1/me/payment-methods/[id]
 *
 * Revoke a payment method for the current member.
 * Soft-delete: sets status to REVOKED and revokedAt timestamp.
 *
 * Security notes:
 * - Member-scoped: can only revoke own payment methods
 * - No enumeration: 404 returned for non-existent or other member's methods
 * - Audit logged for compliance
 *
 * Charter: P1 (identity), P2 (default deny), P7 (audit logged)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/passkey";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  // Check authentication
  const session = await getCurrentSession();
  if (!session) {
    return errors.unauthorized("Not authenticated");
  }

  const { id } = await params;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return errors.notFound("PaymentMethod", id);
  }

  try {
    // Find the payment method - member-scoped query
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id,
        memberId: session.memberId,
        status: "ACTIVE",
      },
    });

    // Return 404 for non-existent or already revoked (no enumeration)
    if (!paymentMethod) {
      return errors.notFound("PaymentMethod", id);
    }

    // Soft-delete: set status to REVOKED
    const now = new Date();
    await prisma.paymentMethod.update({
      where: { id },
      data: {
        status: "REVOKED",
        revokedAt: now,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "PAYMENT_METHOD_REVOKED",
        resourceType: "PaymentMethod",
        resourceId: id,
        memberId: session.memberId,
        before: {
          type: paymentMethod.type,
          displayName: paymentMethod.displayName,
          status: "ACTIVE",
        },
        after: {
          type: paymentMethod.type,
          displayName: paymentMethod.displayName,
          status: "REVOKED",
        },
        metadata: {
          provider: paymentMethod.provider,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PAYMENT_METHODS] Revoke error:", error);
    return errors.internal("Failed to revoke payment method");
  }
}
