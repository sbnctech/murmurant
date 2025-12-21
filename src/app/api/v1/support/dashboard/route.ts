/**
 * Support Dashboard API
 *
 * GET /api/v1/support/dashboard - Get support case statistics and recent cases
 *
 * Returns:
 * - visible: boolean (whether user has tech lead access)
 * - stats: case counts by status
 * - recentCases: latest open cases
 * - avgResolutionDays: average time to close
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SupportDashboardData = {
  visible: boolean;
  stats: {
    open: number;
    awaitingInfo: number;
    inProgress: number;
    escalated: number;
    resolved: number;
    closedThisWeek: number;
    totalOpen: number;
  };
  avgResolutionDays: number | null;
  recentCases: Array<{
    id: string;
    caseNumber: number;
    submitterName: string;
    channel: string;
    status: string;
    category: string;
    description: string;
    receivedAt: string;
    ageHours: number;
  }>;
};

/**
 * GET /api/v1/support/dashboard
 */
export async function GET(req: NextRequest) {
  // Check for admin capability
  const auth = await requireCapability(req, "admin:full");
  if (!auth.ok) {
    // Return not visible instead of 403 for widget compatibility
    return NextResponse.json({
      visible: false,
    } as SupportDashboardData);
  }

  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch stats in parallel
    const [
      openCount,
      awaitingInfoCount,
      inProgressCount,
      escalatedCount,
      resolvedCount,
      closedThisWeekCount,
      avgResolution,
      recentCases,
    ] = await Promise.all([
      prisma.supportCase.count({ where: { status: "OPEN" } }),
      prisma.supportCase.count({ where: { status: "AWAITING_INFO" } }),
      prisma.supportCase.count({ where: { status: "IN_PROGRESS" } }),
      prisma.supportCase.count({ where: { status: "ESCALATED" } }),
      prisma.supportCase.count({ where: { status: "RESOLVED" } }),
      prisma.supportCase.count({
        where: {
          status: "CLOSED",
          closedAt: { gte: oneWeekAgo },
        },
      }),
      prisma.$queryRaw<[{ avg_days: number | null }]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("closedAt" - "receivedAt")) / 86400) as avg_days
        FROM "SupportCase"
        WHERE status = 'CLOSED'
        AND "closedAt" IS NOT NULL
        AND "closedAt" > NOW() - INTERVAL '30 days'
      `,
      prisma.supportCase.findMany({
        where: {
          status: { notIn: ["CLOSED"] },
        },
        select: {
          id: true,
          caseNumber: true,
          submitterName: true,
          channel: true,
          status: true,
          category: true,
          description: true,
          receivedAt: true,
        },
        orderBy: { receivedAt: "desc" },
        take: 10,
      }),
    ]);

    const totalOpen = openCount + awaitingInfoCount + inProgressCount + escalatedCount + resolvedCount;

    const dashboardData: SupportDashboardData = {
      visible: true,
      stats: {
        open: openCount,
        awaitingInfo: awaitingInfoCount,
        inProgress: inProgressCount,
        escalated: escalatedCount,
        resolved: resolvedCount,
        closedThisWeek: closedThisWeekCount,
        totalOpen,
      },
      avgResolutionDays: avgResolution[0]?.avg_days
        ? Math.round(avgResolution[0].avg_days * 10) / 10
        : null,
      recentCases: recentCases.map((c) => ({
        id: c.id,
        caseNumber: c.caseNumber,
        submitterName: c.submitterName,
        channel: c.channel,
        status: c.status,
        category: c.category,
        description: c.description.slice(0, 200) + (c.description.length > 200 ? "..." : ""),
        receivedAt: c.receivedAt.toISOString(),
        ageHours: Math.round((now.getTime() - c.receivedAt.getTime()) / (1000 * 60 * 60)),
      })),
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching support dashboard:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
