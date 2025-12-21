/**
 * GET /api/v1/officer/events/dashboard
 *
 * VP Activities Dashboard - provides event oversight data.
 *
 * Returns:
 * - Events by status (counts)
 * - Pending approvals (events awaiting VP review)
 * - Recently published events (last 7 days)
 * - Completed events missing postmortems (using derived completion status)
 *
 * Response: VpActivitiesDashboard
 *
 * Charter: P1 (identity required), P2 (VP Activities or admin only)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { NextRequest } from "next/server";
import { apiSuccess, errors } from "@/lib/api";
import { requireRole, type GlobalRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventStatus, PostmortemStatus } from "@prisma/client";
import {
  derivePostmortemStatus,
  getPostmortemStatusLabel,
  getPostmortemCTAText,
  POSTMORTEM_STATUS_FIELDS,
  type PostmortemCompletionStatus,
} from "@/lib/events/postmortem";

/** Event summary for dashboard display */
interface EventSummary {
  id: string;
  title: string;
  category: string | null;
  startTime: string;
  status: EventStatus;
  committeeId: string | null;
  committeeName: string | null;
  eventChairId: string | null;
  eventChairName: string | null;
  submittedAt: string | null;
  registeredCount: number;
}

/** Event summary with postmortem tracking */
interface EventSummaryWithPostmortem extends EventSummary {
  postmortemCompletionStatus: PostmortemCompletionStatus;
  postmortemStatusLabel: string;
  postmortemCTAText: string;
  postmortemDbStatus: PostmortemStatus | null;
}

/** VP Activities Dashboard response */
interface VpActivitiesDashboard {
  /** Event counts by status */
  statusCounts: Record<EventStatus, number>;

  /** Events pending VP approval (PENDING_APPROVAL status) */
  pendingApprovals: EventSummary[];

  /** Events published in last 7 days */
  recentlyPublished: EventSummary[];

  /** Completed events with incomplete postmortems (using derived status) */
  needingPostmortem: EventSummaryWithPostmortem[];

  /** Events needing chair assignment (upcoming, no chair) */
  needingChairs: EventSummary[];

  /** Summary stats */
  stats: {
    postmortemsNeedingAttention: number;
  };
}

// Roles that can access VP Activities dashboard
const ALLOWED_ROLES: GlobalRole[] = ["admin", "president", "vp-activities"];

export async function GET(request: NextRequest) {
  // Require VP Activities, President, or Admin role
  const auth = await requireRole(request, ALLOWED_ROLES);
  if (!auth.ok) return auth.response;

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    // Postmortem select for status derivation
    const postmortemSelect = {
      id: true,
      status: true,
      ...POSTMORTEM_STATUS_FIELDS,
    };

    // 1. Get event counts by status
    const statusCountsRaw = await prisma.event.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    // Initialize all statuses to 0, then fill from query
    const statusCounts = Object.values(EventStatus).reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<EventStatus, number>
    );

    for (const row of statusCountsRaw) {
      statusCounts[row.status] = row._count.id;
    }

    // 2. Get pending approvals (PENDING_APPROVAL status)
    const pendingApprovals = await prisma.event.findMany({
      where: { status: EventStatus.PENDING_APPROVAL },
      orderBy: { submittedAt: "asc" }, // Oldest first (FIFO review)
      take: 20,
      include: {
        committee: { select: { id: true, name: true } },
        eventChair: { select: { id: true, firstName: true, lastName: true } },
        _count: {
          select: {
            registrations: {
              where: { status: { in: ["CONFIRMED", "PENDING", "PENDING_PAYMENT"] } },
            },
          },
        },
      },
    });

    // 3. Get recently published events (last 7 days)
    const recentlyPublished = await prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        approvedAt: { gte: sevenDaysAgo },
      },
      orderBy: { approvedAt: "desc" },
      take: 10,
      include: {
        committee: { select: { id: true, name: true } },
        eventChair: { select: { id: true, firstName: true, lastName: true } },
        _count: {
          select: {
            registrations: {
              where: { status: { in: ["CONFIRMED", "PENDING", "PENDING_PAYMENT"] } },
            },
          },
        },
      },
    });

    // 4. Get ALL completed events with postmortem data for filtering
    const completedEvents = await prisma.event.findMany({
      where: {
        status: EventStatus.COMPLETED,
      },
      orderBy: { endTime: "desc" },
      include: {
        committee: { select: { id: true, name: true } },
        eventChair: { select: { id: true, firstName: true, lastName: true } },
        postmortem: { select: postmortemSelect },
        _count: {
          select: {
            registrations: {
              where: { status: { in: ["CONFIRMED", "PENDING", "PENDING_PAYMENT"] } },
            },
          },
        },
      },
    });

    // Filter using derived postmortem status
    const needingPostmortemEvents = completedEvents.filter((event) => {
      const completionStatus = derivePostmortemStatus(event.postmortem);
      return completionStatus !== "COMPLETE";
    });

    // 5. Get upcoming events needing chair assignment
    const needingChairs = await prisma.event.findMany({
      where: {
        status: { in: [EventStatus.DRAFT, EventStatus.APPROVED, EventStatus.PUBLISHED] },
        startTime: { gte: now, lte: sixtyDaysFromNow },
        eventChairId: null,
      },
      orderBy: { startTime: "asc" },
      take: 10,
      include: {
        committee: { select: { id: true, name: true } },
        _count: {
          select: {
            registrations: {
              where: { status: { in: ["CONFIRMED", "PENDING", "PENDING_PAYMENT"] } },
            },
          },
        },
      },
    });

    // Transform to response shape (basic, without postmortem)
    const transformEvent = (
      event: typeof pendingApprovals[number] | typeof needingChairs[number]
    ): EventSummary => ({
      id: event.id,
      title: event.title,
      category: event.category,
      startTime: event.startTime.toISOString(),
      status: event.status,
      committeeId: event.committee?.id ?? null,
      committeeName: event.committee?.name ?? null,
      eventChairId: "eventChair" in event && event.eventChair ? event.eventChair.id : null,
      eventChairName:
        "eventChair" in event && event.eventChair
          ? `${event.eventChair.firstName} ${event.eventChair.lastName}`
          : null,
      submittedAt: event.submittedAt?.toISOString() ?? null,
      registeredCount: event._count.registrations,
    });

    // Transform with postmortem status
    const transformEventWithPostmortem = (
      event: typeof completedEvents[number]
    ): EventSummaryWithPostmortem => {
      const completionStatus = derivePostmortemStatus(event.postmortem);
      return {
        ...transformEvent(event),
        postmortemCompletionStatus: completionStatus,
        postmortemStatusLabel: getPostmortemStatusLabel(completionStatus),
        postmortemCTAText: getPostmortemCTAText(completionStatus),
        postmortemDbStatus: event.postmortem?.status ?? null,
      };
    };

    const response: VpActivitiesDashboard = {
      statusCounts,
      pendingApprovals: pendingApprovals.map(transformEvent),
      recentlyPublished: recentlyPublished.map(transformEvent),
      needingPostmortem: needingPostmortemEvents.slice(0, 20).map(transformEventWithPostmortem),
      needingChairs: needingChairs.map(transformEvent),
      stats: {
        postmortemsNeedingAttention: needingPostmortemEvents.length,
      },
    };

    return apiSuccess(response);
  } catch (error) {
    console.error("Error fetching VP Activities dashboard:", error);
    return errors.internal("Failed to fetch dashboard data");
  }
}
