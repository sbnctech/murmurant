/**
 * Admin Events API
 *
 * GET /api/admin/events - List all events with pagination
 * POST /api/admin/events - Create a new event
 *
 * Authorization: VP of Activities or Admin
 *
 * Charter: P2 (authorization), P4 (audit trail)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVPOrAdmin } from "@/lib/eventAuth";
import { inferCategory } from "@/lib/events";

type AdminEventListItem = {
  id: string;
  title: string;
  category: string | null;
  startTime: string;
  registrationCount: number;
  waitlistedCount: number;
  eventChairId: string | null;
};

// ============================================================================
// POST /api/admin/events - Create Event
// ============================================================================

interface CreateEventBody {
  title: string;
  description?: string;
  category?: string;
  location?: string;
  startTime: string;
  endTime?: string;
  capacity?: number;
  isPublished?: boolean;
  eventChairId?: string;
}

export async function POST(req: NextRequest) {
  const auth = await requireVPOrAdmin(req);
  if (!auth.ok) return auth.response;

  let body: CreateEventBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  if (!body.title || typeof body.title !== "string" || body.title.trim() === "") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!body.startTime) {
    return NextResponse.json({ error: "Start time is required" }, { status: 400 });
  }

  // Parse dates
  const startTime = new Date(body.startTime);
  if (isNaN(startTime.getTime())) {
    return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
  }

  let endTime: Date | null = null;
  if (body.endTime) {
    endTime = new Date(body.endTime);
    if (isNaN(endTime.getTime())) {
      return NextResponse.json({ error: "Invalid end time" }, { status: 400 });
    }
    if (endTime < startTime) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }
  }

  // Validate capacity
  let capacity: number | null = null;
  if (body.capacity !== undefined) {
    if (typeof body.capacity !== "number" || body.capacity < 0) {
      return NextResponse.json({ error: "Capacity must be a non-negative number" }, { status: 400 });
    }
    capacity = body.capacity;
  }

  // Smart category inference if not provided
  const category = body.category?.trim() || inferCategory(body.title.trim()) || null;

  try {
    const event = await prisma.event.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim() || null,
        category,
        location: body.location?.trim() || null,
        startTime,
        endTime,
        capacity,
        isPublished: body.isPublished ?? false,
        eventChairId: body.eventChairId || null,
      },
    });

    // TODO: Audit log for event creation (P4)

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN EVENTS] Create error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

// ============================================================================
// GET /api/admin/events - List Events
// ============================================================================

export async function GET(req: NextRequest) {
  // VP of Activities and Admin can view all events
  const auth = await requireVPOrAdmin(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);

  // Parse pagination params with defaults
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");
  const query = searchParams.get("query")?.trim() || null;

  let page = 1;
  let pageSize = 20;

  if (pageParam !== null) {
    const parsed = parseInt(pageParam, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      page = parsed;
    }
  }

  if (pageSizeParam !== null) {
    const parsed = parseInt(pageSizeParam, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      pageSize = Math.min(parsed, 100);
    }
  }

  // Build where clause for optional query filter
  const whereClause = query
    ? {
        OR: [
          { title: { contains: query, mode: "insensitive" as const } },
          { category: { contains: query, mode: "insensitive" as const } },
          { id: query }, // Exact match on ID
        ],
      }
    : {};

  // Get total count for pagination
  const totalItems = await prisma.event.count({ where: whereClause });

  const totalPages = Math.ceil(totalItems / pageSize);
  const skip = (page - 1) * pageSize;

  // Fetch events with registration counts
  const events = await prisma.event.findMany({
    where: whereClause,
    include: {
      _count: {
        select: {
          registrations: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
    skip,
    take: pageSize,
  });

  // Get waitlisted counts for these events
  const eventIds = events.map((e) => e.id);
  const waitlistedCounts = await prisma.eventRegistration.groupBy({
    by: ["eventId"],
    where: {
      eventId: { in: eventIds },
      status: "WAITLISTED",
    },
    _count: true,
  });

  const waitlistedMap = new Map(
    waitlistedCounts.map((w) => [w.eventId, w._count])
  );

  const items: AdminEventListItem[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    startTime: e.startTime.toISOString(),
    registrationCount: e._count.registrations,
    waitlistedCount: waitlistedMap.get(e.id) ?? 0,
    eventChairId: e.eventChairId,
  }));

  return NextResponse.json({
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
  });
}
