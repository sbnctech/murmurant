/**
 * GET /api/v1/officer/events/my-events
 *
 * Committee Chair Dashboard - shows events the current user can manage.
 *
 * Returns events where:
 * - User is the event chair (eventChairId === memberId)
 * - Event belongs to a committee where user has a role assignment
 *
 * Query params:
 * - filter: "incomplete_postmortem" - show only past events needing postmortem
 *
 * Charter: P1 (identity required), P2 (filtered by committee membership)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { NextRequest } from "next/server";
import { apiSuccess, errors } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventStatus, PostmortemStatus } from "@prisma/client";
import {
  derivePostmortemStatus,
  getPostmortemStatusLabel,
  getPostmortemCTAText,
  POSTMORTEM_STATUS_FIELDS,
  type PostmortemCompletionStatus,
} from "@/lib/events/postmortem";

/** Event summary with chair-relevant details */
interface ChairEventSummary {
  id: string;
  title: string;
  category: string | null;
  startTime: string;
  endTime: string | null;
  status: EventStatus;
  location: string | null;

  // Committee info
  committeeId: string | null;
  committeeName: string | null;

  // Chair info
  isMyEvent: boolean; // true if user is the event chair
  eventChairId: string | null;
  eventChairName: string | null;

  // Capacity and registration
  registeredCount: number;
  capacity: number | null;
  spotsRemaining: number | null;

  // Postmortem tracking (server-derived)
  postmortemCompletionStatus: PostmortemCompletionStatus;
  postmortemStatusLabel: string;
  postmortemCTAText: string;
  postmortemDbStatus: PostmortemStatus | null; // The DB workflow status (DRAFT/SUBMITTED/APPROVED)

  // Cloning info
  clonedFromId: string | null;
  cloneCount: number;
}

/** Committee Chair Dashboard response */
interface ChairDashboard {
  /** Events where user is the chair */
  myChairEvents: ChairEventSummary[];

  /** Events in user's committees (not chairing) */
  committeeEvents: ChairEventSummary[];

  /** Completed events needing wrap-up (user is chair, postmortem not complete) */
  needingWrapUp: ChairEventSummary[];

  /** User's committee memberships */
  myCommittees: {
    id: string;
    name: string;
    roleName: string;
  }[];

  /** Quick stats */
  stats: {
    totalChairingUpcoming: number;
    pendingApproval: number;
    /** Post-mortems needing attention (NOT_STARTED or IN_PROGRESS) */
    postmortemsNeedingAttention: number;
  };
}

export async function GET(request: NextRequest) {
  // Require authentication
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const memberId = auth.context.memberId;

  // Parse query params
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter");

  try {
    const now = new Date();

    // 1. Get user's committee assignments
    const roleAssignments = await prisma.roleAssignment.findMany({
      where: {
        memberId,
        endDate: null, // Active assignments only
      },
      include: {
        committee: { select: { id: true, name: true } },
        committeeRole: { select: { name: true } },
      },
    });

    const myCommitteeIds = roleAssignments.map((ra) => ra.committeeId);
    const myCommittees = roleAssignments.map((ra) => ({
      id: ra.committee.id,
      name: ra.committee.name,
      roleName: ra.committeeRole.name,
    }));

    // Postmortem select for status derivation
    const postmortemSelect = {
      id: true,
      status: true,
      ...POSTMORTEM_STATUS_FIELDS,
    };

    // 2. Get events where user is the chair
    const myChairEvents = await prisma.event.findMany({
      where: {
        eventChairId: memberId,
        status: { not: EventStatus.CANCELED },
      },
      orderBy: { startTime: "asc" },
      include: {
        committee: { select: { id: true, name: true } },
        eventChair: { select: { id: true, firstName: true, lastName: true } },
        postmortem: { select: postmortemSelect },
        _count: {
          select: {
            registrations: {
              where: { status: { in: ["CONFIRMED", "PENDING", "PENDING_PAYMENT"] } },
            },
            clones: true,
          },
        },
      },
    });

    // 3. Get events in user's committees (where user is NOT the chair)
    const committeeEvents = await prisma.event.findMany({
      where: {
        committeeId: { in: myCommitteeIds },
        eventChairId: { not: memberId },
        status: { not: EventStatus.CANCELED },
        startTime: { gte: now }, // Upcoming only for committee view
      },
      orderBy: { startTime: "asc" },
      take: 20,
      include: {
        committee: { select: { id: true, name: true } },
        eventChair: { select: { id: true, firstName: true, lastName: true } },
        postmortem: { select: postmortemSelect },
        _count: {
          select: {
            registrations: {
              where: { status: { in: ["CONFIRMED", "PENDING", "PENDING_PAYMENT"] } },
            },
            clones: true,
          },
        },
      },
    });

    // Transform function
    const transformEvent = (
      event: (typeof myChairEvents)[number],
      isMyEvent: boolean
    ): ChairEventSummary => {
      const registeredCount = event._count.registrations;
      const hasCapacity = event.capacity !== null;
      const spotsRemaining = hasCapacity
        ? Math.max(0, (event.capacity ?? 0) - registeredCount)
        : null;

      // Derive postmortem completion status
      const postmortemCompletionStatus = derivePostmortemStatus(event.postmortem);

      return {
        id: event.id,
        title: event.title,
        category: event.category,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime?.toISOString() ?? null,
        status: event.status,
        location: event.location,
        committeeId: event.committee?.id ?? null,
        committeeName: event.committee?.name ?? null,
        isMyEvent,
        eventChairId: event.eventChair?.id ?? null,
        eventChairName: event.eventChair
          ? `${event.eventChair.firstName} ${event.eventChair.lastName}`
          : null,
        registeredCount,
        capacity: event.capacity,
        spotsRemaining,
        postmortemCompletionStatus,
        postmortemStatusLabel: getPostmortemStatusLabel(postmortemCompletionStatus),
        postmortemCTAText: getPostmortemCTAText(postmortemCompletionStatus),
        postmortemDbStatus: event.postmortem?.status ?? null,
        clonedFromId: event.clonedFromId,
        cloneCount: event._count.clones,
      };
    };

    // Transform all events
    const transformedMyChairEvents = myChairEvents.map((e) => transformEvent(e, true));
    const transformedCommitteeEvents = committeeEvents.map((e) => transformEvent(e, false));

    // 4. Filter for needing wrap-up: completed events where postmortem is not complete
    const needingWrapUp = transformedMyChairEvents.filter(
      (e) =>
        e.status === EventStatus.COMPLETED &&
        e.postmortemCompletionStatus !== "COMPLETE"
    );

    // Sort by startTime descending (most recent first)
    needingWrapUp.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    // 5. If filter is set, apply additional filtering
    let filteredMyChairEvents = transformedMyChairEvents;
    if (filter === "incomplete_postmortem") {
      // Show only past events with incomplete postmortems
      filteredMyChairEvents = transformedMyChairEvents.filter(
        (e) =>
          new Date(e.startTime) < now &&
          e.postmortemCompletionStatus !== "COMPLETE"
      );
    }

    // Calculate stats
    const upcomingChairEvents = transformedMyChairEvents.filter(
      (e) => new Date(e.startTime) >= now && e.status !== EventStatus.COMPLETED
    );
    const pendingApprovalEvents = transformedMyChairEvents.filter(
      (e) => e.status === EventStatus.PENDING_APPROVAL
    );

    // Count postmortems needing attention (past events where chair, not complete)
    const postmortemsNeedingAttention = transformedMyChairEvents.filter(
      (e) =>
        new Date(e.startTime) < now &&
        e.postmortemCompletionStatus !== "COMPLETE"
    ).length;

    const response: ChairDashboard = {
      myChairEvents: filteredMyChairEvents,
      committeeEvents: transformedCommitteeEvents,
      needingWrapUp,
      myCommittees,
      stats: {
        totalChairingUpcoming: upcomingChairEvents.length,
        pendingApproval: pendingApprovalEvents.length,
        postmortemsNeedingAttention,
      },
    };

    return apiSuccess(response);
  } catch (error) {
    console.error("Error fetching Chair dashboard:", error);
    return errors.internal("Failed to fetch dashboard data");
  }
}
