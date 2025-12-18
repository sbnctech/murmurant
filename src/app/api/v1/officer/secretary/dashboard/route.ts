/**
 * Secretary Dashboard API
 *
 * GET /api/v1/officer/secretary/dashboard - Get dashboard data for Secretary
 *
 * Returns:
 * - visible: boolean (whether user has secretary capabilities)
 * - upcomingMeeting: next scheduled meeting (if any)
 * - draftsInProgress: minutes in DRAFT or REVISED status
 * - awaitingReview: minutes in SUBMITTED status
 * - readyToPublish: minutes in APPROVED status
 * - recentlyPublished: minutes in PUBLISHED status (last 5)
 * - capabilities: actions the user can perform
 *
 * Charter P1: Identity provable (session-based auth)
 * Charter P2: Default deny (requireCapability check)
 * Charter P7: Audit trail via standard API logging
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability, hasCapability, type AuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MinutesStatus } from "@prisma/client";

export type SecretaryDashboardData = {
  visible: boolean;
  upcomingMeeting: {
    id: string;
    date: string;
    dateFormatted: string;
    type: string;
    title: string | null;
    hasMinutes: boolean;
  } | null;
  draftsInProgress: MinutesSummary[];
  awaitingReview: MinutesSummary[];
  readyToPublish: MinutesSummary[];
  recentlyPublished: MinutesSummary[];
  capabilities: {
    canCreateDraft: boolean;
    canEditDraft: boolean;
    canSubmit: boolean;
    canPublish: boolean;
  };
};

type MinutesSummary = {
  id: string;
  meetingId: string;
  meetingDate: string;
  meetingDateFormatted: string;
  meetingType: string;
  meetingTitle: string | null;
  status: MinutesStatus;
  statusLabel: string;
  version: number;
  updatedAt: string;
  lastEditedBy: string | null;
  auditTrailUrl: string;
};

/**
 * Format date for display (e.g., "Dec 17, 2025")
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get human-readable status label
 */
function getStatusLabel(status: MinutesStatus): string {
  const labels: Record<MinutesStatus, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Awaiting Review",
    REVISED: "Needs Revision",
    APPROVED: "Ready to Publish",
    PUBLISHED: "Published",
    ARCHIVED: "Archived",
  };
  return labels[status] || status;
}

/**
 * Transform minutes record to summary for dashboard
 */
function toMinutesSummary(minutes: {
  id: string;
  meetingId: string;
  status: MinutesStatus;
  version: number;
  updatedAt: Date;
  lastEditedBy: { firstName: string; lastName: string } | null;
  meeting: {
    date: Date;
    type: string;
    title: string | null;
  };
}): MinutesSummary {
  return {
    id: minutes.id,
    meetingId: minutes.meetingId,
    meetingDate: minutes.meeting.date.toISOString(),
    meetingDateFormatted: formatDate(minutes.meeting.date),
    meetingType: minutes.meeting.type,
    meetingTitle: minutes.meeting.title,
    status: minutes.status,
    statusLabel: getStatusLabel(minutes.status),
    version: minutes.version,
    updatedAt: minutes.updatedAt.toISOString(),
    lastEditedBy: minutes.lastEditedBy
      ? `${minutes.lastEditedBy.firstName} ${minutes.lastEditedBy.lastName}`
      : null,
    auditTrailUrl: `/admin/audit?objectType=GovernanceMinutes&objectId=${minutes.id}`,
  };
}

/**
 * Determine user capabilities based on their role
 */
function getUserCapabilities(context: AuthContext): SecretaryDashboardData["capabilities"] {
  return {
    canCreateDraft: hasCapability(context.globalRole, "meetings:minutes:draft:create"),
    canEditDraft: hasCapability(context.globalRole, "meetings:minutes:draft:edit"),
    canSubmit: hasCapability(context.globalRole, "meetings:minutes:draft:submit"),
    canPublish: hasCapability(context.globalRole, "meetings:minutes:finalize"),
  };
}

/**
 * GET /api/v1/officer/secretary/dashboard
 */
export async function GET(req: NextRequest) {
  // Check for secretary read capability (meetings:read is the base capability)
  const auth = await requireCapability(req, "meetings:read");
  if (!auth.ok) {
    // Return not visible instead of 403 for widget compatibility
    return NextResponse.json({
      visible: false,
    } as SecretaryDashboardData);
  }

  try {
    const now = new Date();

    // Fetch upcoming meeting (next meeting from today)
    const upcomingMeeting = await prisma.governanceMeeting.findFirst({
      where: {
        date: { gte: now },
      },
      orderBy: { date: "asc" },
      include: {
        minutes: {
          select: { id: true },
          take: 1,
        },
      },
    });

    // Fetch minutes by status
    const [drafts, submitted, approved, published] = await Promise.all([
      // Drafts in progress (DRAFT or REVISED)
      prisma.governanceMinutes.findMany({
        where: {
          status: { in: ["DRAFT", "REVISED"] },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          meeting: { select: { date: true, type: true, title: true } },
          lastEditedBy: { select: { firstName: true, lastName: true } },
        },
      }),

      // Awaiting President review (SUBMITTED)
      prisma.governanceMinutes.findMany({
        where: { status: "SUBMITTED" },
        orderBy: { submittedAt: "desc" },
        take: 10,
        include: {
          meeting: { select: { date: true, type: true, title: true } },
          lastEditedBy: { select: { firstName: true, lastName: true } },
        },
      }),

      // Ready to publish (APPROVED)
      prisma.governanceMinutes.findMany({
        where: { status: "APPROVED" },
        orderBy: { approvedAt: "desc" },
        take: 10,
        include: {
          meeting: { select: { date: true, type: true, title: true } },
          lastEditedBy: { select: { firstName: true, lastName: true } },
        },
      }),

      // Recently published (PUBLISHED - last 5)
      prisma.governanceMinutes.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 5,
        include: {
          meeting: { select: { date: true, type: true, title: true } },
          lastEditedBy: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    const dashboardData: SecretaryDashboardData = {
      visible: true,
      upcomingMeeting: upcomingMeeting
        ? {
            id: upcomingMeeting.id,
            date: upcomingMeeting.date.toISOString(),
            dateFormatted: formatDate(upcomingMeeting.date),
            type: upcomingMeeting.type,
            title: upcomingMeeting.title,
            hasMinutes: upcomingMeeting.minutes.length > 0,
          }
        : null,
      draftsInProgress: drafts.map(toMinutesSummary),
      awaitingReview: submitted.map(toMinutesSummary),
      readyToPublish: approved.map(toMinutesSummary),
      recentlyPublished: published.map(toMinutesSummary),
      capabilities: getUserCapabilities(auth.context),
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching secretary dashboard:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
