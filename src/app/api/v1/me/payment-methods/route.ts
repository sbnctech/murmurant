/**
 * GET /api/v1/me/payment-methods
 *
 * Returns the current member's saved payment methods.
 *
 * Response:
 * {
 *   paymentMethods: [
 *     {
 *       id: string,
 *       type: "CARD" | "ACH",
 *       status: "ACTIVE" | "REVOKED",
 *       displayName: string,
 *       isDefault: boolean,
 *       createdAt: string
 *     }
 *   ],
 *   achEnabled: boolean  // Whether ACH option is available
 * }
 *
 * Charter: P1 (identity provable), P2 (default deny)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/passkey";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/api";
import { isAchEnabled } from "@/lib/config/featureFlags";

export async function GET() {
  // Check authentication
  const session = await getCurrentSession();
  if (!session) {
    return errors.unauthorized("Not authenticated");
  }

  // Fetch active payment methods
  const paymentMethods = await prisma.paymentMethod.findMany({
    where: {
      memberId: session.memberId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      type: true,
      status: true,
      displayName: true,
      isDefault: true,
      createdAt: true,
    },
    orderBy: [
      { isDefault: "desc" },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json({
    paymentMethods,
    achEnabled: isAchEnabled(),
  });
}
