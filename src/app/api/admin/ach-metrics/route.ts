/**
 * GET /api/admin/ach-metrics
 *
 * Returns ACH adoption and fee savings metrics for admin dashboard.
 *
 * Response:
 * {
 *   achEnabled: boolean,
 *   metrics: {
 *     totalMembers: number,
 *     membersWithAch: number,
 *     achAdoptionPercent: number,
 *     totalPaymentMethods: number,
 *     achPaymentMethods: number,
 *     cardPaymentMethods: number,
 *     estimatedFeeSavings: {
 *       description: string,
 *       note: string
 *     }
 *   }
 * }
 *
 * Authorization: Requires finance:view capability
 *
 * Charter: P1 (identity), P2 (default deny), P7 (audit logged for sensitive access)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAchEnabled } from "@/lib/config/featureFlags";

export async function GET(req: NextRequest) {
  // Require finance:view capability for fee savings data
  const auth = await requireCapability(req, "finance:view");
  if (!auth.ok) return auth.response;

  const achEnabled = isAchEnabled();

  // If ACH is not enabled, return minimal response
  if (!achEnabled) {
    return NextResponse.json({
      achEnabled: false,
      metrics: null,
    });
  }

  try {
    // Get active member count (members with an active membership status)
    const totalMembers = await prisma.member.count({
      where: {
        membershipStatus: {
          isActive: true,
        },
      },
    });

    // Get payment method counts
    const paymentMethodCounts = await prisma.paymentMethod.groupBy({
      by: ["type"],
      where: { status: "ACTIVE" },
      _count: { id: true },
    });

    const achCount =
      paymentMethodCounts.find((c) => c.type === "ACH")?._count.id || 0;
    const cardCount =
      paymentMethodCounts.find((c) => c.type === "CARD")?._count.id || 0;
    const totalPaymentMethods = achCount + cardCount;

    // Get unique members with ACH
    const membersWithAch = await prisma.paymentMethod.groupBy({
      by: ["memberId"],
      where: {
        type: "ACH",
        status: "ACTIVE",
      },
    });
    const membersWithAchCount = membersWithAch.length;

    // Calculate adoption percentage
    const achAdoptionPercent =
      totalMembers > 0
        ? Math.round((membersWithAchCount / totalMembers) * 100)
        : 0;

    return NextResponse.json({
      achEnabled: true,
      metrics: {
        totalMembers,
        membersWithAch: membersWithAchCount,
        achAdoptionPercent,
        totalPaymentMethods,
        achPaymentMethods: achCount,
        cardPaymentMethods: cardCount,
        estimatedFeeSavings: {
          description:
            "ACH transactions typically cost $0.25-0.50 vs 2.9% + $0.30 for cards",
          note: "Actual savings depend on transaction volumes and amounts. A $50 event with ACH saves approximately $1.20 per registration.",
        },
      },
    });
  } catch (error) {
    console.error("[ACH_METRICS] Error fetching metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch ACH metrics" },
      { status: 500 }
    );
  }
}
