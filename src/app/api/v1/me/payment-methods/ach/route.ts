/**
 * POST /api/v1/me/payment-methods/ach
 *
 * Create a demo ACH payment method for the current member.
 * This is a DEMO implementation - does NOT connect to real banks.
 *
 * Request body:
 * {
 *   nickname: string,    // e.g., "My Bank Account"
 *   last4: string        // Last 4 digits for display (validated as 4 numeric digits)
 * }
 *
 * Response:
 * {
 *   paymentMethod: {
 *     id: string,
 *     type: "ACH",
 *     displayName: string,  // "Bank Account (ACH) ending in XXXX"
 *     createdAt: string
 *   }
 * }
 *
 * Security notes:
 * - Does NOT store any real bank account information
 * - last4 is purely for display purposes
 * - providerRef is a random UUID (demo token)
 *
 * Charter: P1 (identity), P2 (default deny), P7 (audit logged)
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/passkey";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/api";
import { isAchEnabled } from "@/lib/config/featureFlags";
import { randomUUID } from "crypto";

interface CreateAchBody {
  nickname?: string;
  last4: string;
}

export async function POST(req: NextRequest) {
  // Check if ACH is enabled
  if (!isAchEnabled()) {
    return errors.forbidden("ACH payment option is not enabled");
  }

  // Check authentication
  const session = await getCurrentSession();
  if (!session) {
    return errors.unauthorized("Not authenticated");
  }

  // Parse request body
  let body: CreateAchBody;
  try {
    body = await req.json();
  } catch {
    return errors.validation("Invalid JSON body");
  }

  // Validate last4 - must be exactly 4 numeric digits
  const { last4, nickname } = body;
  if (!last4 || !/^\d{4}$/.test(last4)) {
    return errors.validation("last4 must be exactly 4 numeric digits", {
      last4: "Must be exactly 4 numeric digits",
    });
  }

  // Build display name
  const displayName = nickname
    ? `${nickname} (ACH) ending in ${last4}`
    : `Bank Account (ACH) ending in ${last4}`;

  // Generate demo provider reference
  const providerRef = `demo_ach_${randomUUID()}`;

  try {
    // Create payment method
    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        memberId: session.memberId,
        type: "ACH",
        status: "ACTIVE",
        displayName,
        provider: "DEMO_ACH",
        providerRef,
        isDefault: false,
      },
      select: {
        id: true,
        type: true,
        displayName: true,
        isDefault: true,
        createdAt: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "PAYMENT_METHOD_ADDED",
        resourceType: "PaymentMethod",
        resourceId: paymentMethod.id,
        memberId: session.memberId,
        after: {
          type: "ACH",
          displayName,
          provider: "DEMO_ACH",
        },
        metadata: {
          note: "Demo ACH authorization - no real bank integration",
        },
      },
    });

    return NextResponse.json({ paymentMethod }, { status: 201 });
  } catch (error) {
    console.error("[PAYMENT_METHODS] ACH creation error:", error);
    return errors.internal("Failed to create ACH payment method");
  }
}
