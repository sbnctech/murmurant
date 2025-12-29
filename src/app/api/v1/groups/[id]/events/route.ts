/**
 * Activity Group Events API
 * GET /api/v1/groups/:id/events - List group events
 * POST /api/v1/groups/:id/events - Create event (coordinator only, bypasses approval)
 *
 * Charter: P2 (scoped access), P1 (audit), P3 (state machine)
 *
 * Note: Activity group events bypass the normal approval workflow.
 * Coordinators can publish events directly.
 *
 * Copyright (c) Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiCreated, errors } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canCreateGroupEvent, isGroupMember } from "@/lib/groups";

interface GroupEventSummary {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string;
  endTime: string | null;
  status: string;
  registrationCount: number;
}

// Type for Prisma query result
interface EventWithRegistrations {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: Date;
  endTime: Date | null;
  status: string;
  _count: {
    registrations: number;
  };
}

/**
 * GET /api/v1/groups/:id/events
 * List events for a group
 * Query params:
 *   - status: filter by status (PUBLISHED, DRAFT, etc.)
 *   - includePast: include past events (default false)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  try {
    const group = await prisma.activityGroup.findUnique({
      where: { id },
    });

    if (!group) {
      return errors.notFound("ActivityGroup", id);
    }

    // Check if user can see events
    const isMember = await isGroupMember(auth.context.memberId, id);
    const canManage = await canCreateGroupEvent(auth.context, id);

    // Non-members can only see published events for public groups
    if (!isMember && !canManage && !group.isPublic) {
      return errors.forbidden("Not authorized to view group events");
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const includePast = searchParams.get("includePast") === "true";

    const now = new Date();
    const events = await prisma.event.findMany({
      where: {
        activityGroupId: id,
        ...(status ? { status: status as "PUBLISHED" | "DRAFT" } : {}),
        // Non-members/non-managers only see published events
        ...(!isMember && !canManage ? { status: "PUBLISHED" } : {}),
        // Optionally exclude past events
        ...(includePast ? {} : { startTime: { gte: now } }),
      },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startTime: true,
        endTime: true,
        status: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    const result: GroupEventSummary[] = (
      events as EventWithRegistrations[]
    ).map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime?.toISOString() ?? null,
      status: e.status,
      registrationCount: e._count.registrations,
    }));

    return NextResponse.json({
      groupId: id,
      groupName: group.name,
      eventCount: result.length,
      events: result,
      canCreateEvents: canManage,
    });
  } catch (error) {
    console.error("Error fetching group events:", error);
    return errors.internal("Failed to fetch group events");
  }
}

/**
 * POST /api/v1/groups/:id/events
 * Create a new event for the group (coordinator only)
 *
 * Note: Group events bypass approval workflow - coordinators can publish directly
 *
 * Body: {
 *   title: string,
 *   description?: string,
 *   location?: string,
 *   startTime: string (ISO),
 *   endTime?: string (ISO),
 *   publish?: boolean (if true, publish immediately)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  try {
    // Check if user can create events for this group
    if (!(await canCreateGroupEvent(auth.context, id))) {
      return errors.forbidden("Not authorized to create group events");
    }

    const group = await prisma.activityGroup.findUnique({
      where: { id },
    });

    if (!group) {
      return errors.notFound("ActivityGroup", id);
    }

    if (group.status !== "APPROVED") {
      return errors.validation("Cannot create events for non-approved groups");
    }

    const body = await request.json();
    const { title, description, location, startTime, endTime, publish } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return errors.validation("title is required");
    }

    if (!startTime) {
      return errors.validation("startTime is required");
    }

    const parsedStartTime = new Date(startTime);
    if (isNaN(parsedStartTime.getTime())) {
      return errors.validation("startTime must be a valid ISO date");
    }

    if (parsedStartTime < new Date()) {
      return errors.validation("startTime must be in the future");
    }

    let parsedEndTime: Date | null = null;
    if (endTime) {
      parsedEndTime = new Date(endTime);
      if (isNaN(parsedEndTime.getTime())) {
        return errors.validation("endTime must be a valid ISO date");
      }
      if (parsedEndTime <= parsedStartTime) {
        return errors.validation("endTime must be after startTime");
      }
    }

    // Group events bypass approval - can go directly to PUBLISHED
    const status = publish === true ? "PUBLISHED" : "DRAFT";

    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        location: location?.trim() || null,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        activityGroupId: id,
        submittedById: auth.context.memberId,
        status,
        // For published events, set approval metadata
        ...(status === "PUBLISHED"
          ? {
              approvedById: auth.context.memberId,
              approvedAt: new Date(),
            }
          : {}),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        resourceType: "Event",
        resourceId: event.id,
        memberId: auth.context.memberId,
        after: {
          activityGroupId: id,
          title: event.title,
          status: event.status,
          startTime: event.startTime.toISOString(),
        },
      },
    });

    return apiCreated({
      id: event.id,
      groupId: id,
      groupName: group.name,
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime?.toISOString() ?? null,
      status: event.status,
      message:
        status === "PUBLISHED"
          ? "Event created and published"
          : "Event created as draft",
    });
  } catch (error) {
    console.error("Error creating group event:", error);
    return errors.internal("Failed to create group event");
  }
}
