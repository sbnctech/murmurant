/**
 * GET /api/admin/demo/work-queue
 *
 * Demo work queue API - returns items for live demo guidance.
 * Requires admin:full capability.
 *
 * Response:
 * - 200: { upcomingEvents, recentRegistrations, pendingGovernance }
 * - 401: Not authenticated
 * - 403: Not authorized
 *
 * Charter: P1 (identity provable), P2 (default deny), P7 (audit trail)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Require admin:full for demo access
  const auth = await requireCapability(req, "admin:full");
  if (!auth.ok) return auth.response;

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Fetch upcoming events (next 30 days)
  const upcomingEvents = await prisma.event.findMany({
    where: {
      startTime: {
        gte: now,
        lte: thirtyDaysFromNow,
      },
    },
    orderBy: { startTime: "asc" },
    take: 10,
    select: {
      id: true,
      title: true,
      category: true,
      startTime: true,
      isPublished: true,
      capacity: true,
      _count: {
        select: {
          registrations: {
            where: {
              status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
            },
          },
        },
      },
    },
  });

  // Fetch recent registrations (last 7 days)
  const recentRegistrations = await prisma.eventRegistration.findMany({
    where: {
      registeredAt: {
        gte: sevenDaysAgo,
      },
    },
    orderBy: { registeredAt: "desc" },
    take: 15,
    select: {
      id: true,
      status: true,
      registeredAt: true,
      member: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  // Fetch pending governance items
  // 1. Open review flags
  const openFlags = await prisma.governanceReviewFlag.findMany({
    where: {
      status: "OPEN",
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      flagType: true,
      targetType: true,
      createdAt: true,
      dueDate: true,
    },
  });

  // 2. Draft minutes awaiting action
  const draftMinutes = await prisma.governanceMinutes.findMany({
    where: {
      status: { in: ["DRAFT", "SUBMITTED", "REVISED"] },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      status: true,
      meeting: {
        select: {
          date: true,
          type: true,
        },
      },
    },
  });

  // 3. Recent motions
  const recentMotions = await prisma.governanceMotion.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      motionNumber: true,
      motionText: true,
      result: true,
      meeting: {
        select: {
          date: true,
          type: true,
        },
      },
    },
  });

  return NextResponse.json({
    timestamp: now.toISOString(),
    upcomingEvents: upcomingEvents.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      startTime: e.startTime.toISOString(),
      isPublished: e.isPublished,
      capacity: e.capacity,
      registrationCount: e._count.registrations,
    })),
    recentRegistrations: recentRegistrations.map((r) => ({
      id: r.id,
      memberName: `${r.member.firstName} ${r.member.lastName}`,
      eventId: r.event.id,
      eventTitle: r.event.title,
      status: r.status,
      registeredAt: r.registeredAt.toISOString(),
    })),
    pendingGovernance: {
      openFlags: openFlags.map((f) => ({
        id: f.id,
        title: f.title,
        flagType: f.flagType,
        targetType: f.targetType,
        createdAt: f.createdAt.toISOString(),
        dueDate: f.dueDate?.toISOString() ?? null,
      })),
      draftMinutes: draftMinutes.map((m) => ({
        id: m.id,
        status: m.status,
        meetingDate: m.meeting.date.toISOString(),
        meetingType: m.meeting.type,
      })),
      recentMotions: recentMotions.map((m) => ({
        id: m.id,
        motionNumber: m.motionNumber,
        motionText: m.motionText.slice(0, 100) + (m.motionText.length > 100 ? "..." : ""),
        result: m.result,
        meetingDate: m.meeting.date.toISOString(),
      })),
    },
  });
}
