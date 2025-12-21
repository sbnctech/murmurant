/**
 * GET /api/v1/admin/communications/enews-week
 *
 * Returns events for the VP Communications eNews dashboard:
 * - Events announcing this week (publishAt within the week)
 * - Events with registration opening this week
 *
 * Authorization: Requires events:schedule:view capability
 *
 * Response:
 * {
 *   week: { start: string, end: string },
 *   announcing: EventSummary[],
 *   opening: EventSummary[]
 * }
 *
 * Charter: P1 (identity), P2 (default deny), P7 (audit for sensitive access)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getEnewsWeekRange,
  getEventOperationalStatus,
  getOperationalStatusLabel,
  formatRegistrationOpensMessage,
  SBNC_TIMEZONE,
} from "@/lib/events";

interface EventSummary {
  id: string;
  title: string;
  category: string | null;
  committeeId: string | null;
  committeeName: string | null;
  publishAt: string | null;
  publishedAt: string | null;
  registrationOpensAt: string | null;
  registrationDeadline: string | null;
  startTime: string;
  endTime: string | null;
  requiresRegistration: boolean;
  enewsBlurbDraft: string | null;
  operationalStatus: string;
  operationalStatusLabel: string;
  registrationOpensMessage: string | null;
  eventChairName: string | null;
}

export async function GET(req: NextRequest) {
  // Require events:schedule:view capability
  const auth = await requireCapability(req, "events:schedule:view");
  if (!auth.ok) return auth.response;

  const now = new Date();
  const { start, end } = getEnewsWeekRange(now);

  try {
    // Fetch events that are approved/published with relevant dates in this week
    const events = await prisma.event.findMany({
      where: {
        status: {
          in: ["APPROVED", "PUBLISHED"],
        },
        OR: [
          // Announcing this week
          {
            publishAt: {
              gte: start,
              lte: end,
            },
          },
          // Already published this week
          {
            publishedAt: {
              gte: start,
              lte: end,
            },
          },
          // Registration opening this week
          {
            registrationOpensAt: {
              gte: start,
              lte: end,
            },
          },
        ],
      },
      include: {
        committee: {
          select: { id: true, name: true },
        },
        eventChair: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: [
        { publishAt: "asc" },
        { startTime: "asc" },
      ],
    });

    // Transform events into summaries
    const eventSummaries: EventSummary[] = events.map((event) => {
      const opStatus = getEventOperationalStatus({
        status: event.status,
        requiresRegistration: event.requiresRegistration,
        publishAt: event.publishAt,
        publishedAt: event.publishedAt,
        registrationOpensAt: event.registrationOpensAt,
        registrationDeadline: event.registrationDeadline,
        startTime: event.startTime,
        endTime: event.endTime,
        approvedAt: event.approvedAt,
      }, now);

      return {
        id: event.id,
        title: event.title,
        category: event.category,
        committeeId: event.committeeId,
        committeeName: event.committee?.name ?? null,
        publishAt: event.publishAt?.toISOString() ?? null,
        publishedAt: event.publishedAt?.toISOString() ?? null,
        registrationOpensAt: event.registrationOpensAt?.toISOString() ?? null,
        registrationDeadline: event.registrationDeadline?.toISOString() ?? null,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime?.toISOString() ?? null,
        requiresRegistration: event.requiresRegistration,
        enewsBlurbDraft: event.enewsBlurbDraft,
        operationalStatus: opStatus,
        operationalStatusLabel: getOperationalStatusLabel(opStatus),
        registrationOpensMessage: formatRegistrationOpensMessage({
          requiresRegistration: event.requiresRegistration,
          registrationOpensAt: event.registrationOpensAt,
          status: event.status,
          startTime: event.startTime,
        }),
        eventChairName: event.eventChair
          ? `${event.eventChair.firstName} ${event.eventChair.lastName}`
          : null,
      };
    });

    // Separate into announcing and opening buckets
    const announcing = eventSummaries.filter((e) => {
      const publishDate = e.publishAt ? new Date(e.publishAt) : (e.publishedAt ? new Date(e.publishedAt) : null);
      return publishDate && publishDate >= start && publishDate <= end;
    });

    const opening = eventSummaries.filter((e) => {
      if (!e.requiresRegistration || !e.registrationOpensAt) return false;
      const openDate = new Date(e.registrationOpensAt);
      return openDate >= start && openDate <= end;
    });

    // Format week range for display using Intl.DateTimeFormat
    const dateFormatter = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: SBNC_TIMEZONE,
    });
    const formatDate = (date: Date) => dateFormatter.format(date);

    return NextResponse.json({
      week: {
        start: start.toISOString(),
        end: end.toISOString(),
        displayStart: formatDate(start),
        displayEnd: formatDate(end),
      },
      announcing,
      opening,
      // Summary counts
      counts: {
        announcing: announcing.length,
        opening: opening.length,
      },
    });
  } catch (error) {
    console.error("[ENEWS_WEEK] Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch eNews week data" },
      { status: 500 }
    );
  }
}
