/**
 * VP Activities Dashboard API
 *
 * GET /api/v1/officer/vp-activities/dashboard - Get dashboard data for VP of Activities
 *
 * Returns:
 * - visible: boolean (whether user has VP Activities capabilities)
 * - pendingApproval: events awaiting VP review
 * - changesRequested: events returned for revision
 * - readyToPublish: approved events awaiting publication
 * - recentlyPublished: recently published events
 * - upcomingEvents: published events happening soon
 * - stats: summary statistics
 * - capabilities: actions the user can perform
 *
 * Charter P1: Identity provable (session-based auth)
 * Charter P2: Default deny (requireCapability check)
 * Charter P5: Approval chain enforced (event workflow)
 * Charter P7: Audit trail via standard API logging
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability, hasCapability, type AuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatClubDate } from "@/lib/timezone";
import { EventStatus } from "@prisma/client";

export type VPActivitiesDashboardData = {
  visible: boolean;
  pendingApproval: EventSummary[];
  changesRequested: EventSummary[];
  readyToPublish: EventSummary[];
  recentlyPublished: EventSummary[];
  upcomingEvents: EventSummary[];
  stats: {
    pendingCount: number;
    approvedCount: number;
    publishedThisMonth: number;
    upcomingCount: number;
  };
  capabilities: {
    canApprove: boolean;
    canRequestChanges: boolean;
    canPublish: boolean;
    canCancel: boolean;
    canViewAll: boolean;
  };
};

type EventSummary = {
  id: string;
  title: string;
  status: EventStatus;
  statusLabel: string;
  startTime: string;
  startTimeFormatted: string;
  endTime: string | null;
  location: string | null;
  category: string | null;
  eventChair: string | null;
  eventChairId: string | null;
  submittedAt: string | null;
  submittedBy: string | null;
  approvedAt: string | null;
  changesRequestedAt: string | null;
  rejectionNotes: string | null;
  registrationCount: number;
  capacity: number | null;
  auditTrailUrl: string;
};

/**
 * Get human-readable status label
 */
function getStatusLabel(status: EventStatus): string {
  const labels: Record<EventStatus, string> = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending Approval",
    CHANGES_REQUESTED: "Changes Requested",
    APPROVED: "Approved",
    PUBLISHED: "Published",
    CANCELED: "Canceled",
    COMPLETED: "Completed",
  };
  return labels[status] || status;
}

/**
 * Calculate total capacity from ticket tiers
 */
function calculateCapacity(
  tiers: Array<{ capacity: number | null; isActive: boolean }>
): number | null {
  const activeTiers = tiers.filter((t) => t.isActive);
  if (activeTiers.length === 0) return null;

  const hasUnlimited = activeTiers.some((t) => t.capacity === null);
  if (hasUnlimited) return null;

  return activeTiers.reduce((sum, t) => sum + (t.capacity ?? 0), 0);
}

/**
 * Transform event record to summary for dashboard
 */
function toEventSummary(event: {
  id: string;
  title: string;
  status: EventStatus;
  startTime: Date;
  endTime: Date | null;
  location: string | null;
  category: string | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  changesRequestedAt: Date | null;
  rejectionNotes: string | null;
  eventChair: { id: string; firstName: string; lastName: string } | null;
  submittedBy: { firstName: string; lastName: string } | null;
  ticketTiers: Array<{ capacity: number | null; isActive: boolean }>;
  _count: { registrations: number };
}): EventSummary {
  return {
    id: event.id,
    title: event.title,
    status: event.status,
    statusLabel: getStatusLabel(event.status),
    startTime: event.startTime.toISOString(),
    startTimeFormatted: formatClubDate(event.startTime),
    endTime: event.endTime?.toISOString() ?? null,
    location: event.location,
    category: event.category,
    eventChair: event.eventChair
      ? `${event.eventChair.firstName} ${event.eventChair.lastName}`
      : null,
    eventChairId: event.eventChair?.id ?? null,
    submittedAt: event.submittedAt?.toISOString() ?? null,
    submittedBy: event.submittedBy
      ? `${event.submittedBy.firstName} ${event.submittedBy.lastName}`
      : null,
    approvedAt: event.approvedAt?.toISOString() ?? null,
    changesRequestedAt: event.changesRequestedAt?.toISOString() ?? null,
    rejectionNotes: event.rejectionNotes,
    registrationCount: event._count.registrations,
    capacity: calculateCapacity(event.ticketTiers),
    auditTrailUrl: `/admin/audit?objectType=Event&objectId=${event.id}`,
  };
}

/**
 * Determine user capabilities based on their role
 */
function getUserCapabilities(
  context: AuthContext
): VPActivitiesDashboardData["capabilities"] {
  return {
    canApprove: hasCapability(context.globalRole, "events:edit"),
    canRequestChanges: hasCapability(context.globalRole, "events:edit"),
    canPublish: hasCapability(context.globalRole, "events:edit"),
    canCancel: hasCapability(context.globalRole, "events:edit"),
    canViewAll: hasCapability(context.globalRole, "events:view"),
  };
}

// Common include for event queries
const eventInclude = {
  eventChair: { select: { id: true, firstName: true, lastName: true } },
  submittedBy: { select: { firstName: true, lastName: true } },
  ticketTiers: { select: { capacity: true, isActive: true } },
  _count: { select: { registrations: true } },
} as const;

/**
 * GET /api/v1/officer/vp-activities/dashboard
 */
export async function GET(req: NextRequest) {
  // Check for events:edit capability (VP Activities capability)
  const auth = await requireCapability(req, "events:edit");
  if (!auth.ok) {
    // Return not visible instead of 403 for widget compatibility
    return NextResponse.json({
      visible: false,
    } as VPActivitiesDashboardData);
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch events by status in parallel
    const [
      pendingApproval,
      changesRequested,
      readyToPublish,
      recentlyPublished,
      upcomingEvents,
      publishedThisMonthCount,
    ] = await Promise.all([
      // Pending approval
      prisma.event.findMany({
        where: { status: "PENDING_APPROVAL" },
        orderBy: { submittedAt: "desc" },
        take: 20,
        include: eventInclude,
      }),

      // Changes requested (awaiting chair revision)
      prisma.event.findMany({
        where: { status: "CHANGES_REQUESTED" },
        orderBy: { changesRequestedAt: "desc" },
        take: 10,
        include: eventInclude,
      }),

      // Approved, ready to publish
      prisma.event.findMany({
        where: { status: "APPROVED" },
        orderBy: { approvedAt: "desc" },
        take: 10,
        include: eventInclude,
      }),

      // Recently published (last 10)
      prisma.event.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 10,
        include: eventInclude,
      }),

      // Upcoming published events (next 30 days)
      prisma.event.findMany({
        where: {
          status: "PUBLISHED",
          startTime: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { startTime: "asc" },
        take: 10,
        include: eventInclude,
      }),

      // Count of events published this month
      prisma.event.count({
        where: {
          status: "PUBLISHED",
          publishedAt: { gte: startOfMonth },
        },
      }),
    ]);

    const dashboardData: VPActivitiesDashboardData = {
      visible: true,
      pendingApproval: pendingApproval.map(toEventSummary),
      changesRequested: changesRequested.map(toEventSummary),
      readyToPublish: readyToPublish.map(toEventSummary),
      recentlyPublished: recentlyPublished.map(toEventSummary),
      upcomingEvents: upcomingEvents.map(toEventSummary),
      stats: {
        pendingCount: pendingApproval.length,
        approvedCount: readyToPublish.length,
        publishedThisMonth: publishedThisMonthCount,
        upcomingCount: upcomingEvents.length,
      },
      capabilities: getUserCapabilities(auth.context),
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching VP Activities dashboard:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
