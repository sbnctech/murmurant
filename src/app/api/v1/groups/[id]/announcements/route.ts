/**
 * Activity Group Announcements API
 * GET /api/v1/groups/:id/announcements - List announcements
 * POST /api/v1/groups/:id/announcements - Create announcement (coordinator only)
 *
 * Charter: P2 (scoped access), P1 (audit)
 *
 * Copyright (c) Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiCreated, errors } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canManageGroup, isGroupMember } from "@/lib/groups";

interface AnnouncementSummary {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  publishedAt: string;
  expiresAt: string | null;
  createdBy: {
    id: string;
    name: string;
  };
}

// Type for Prisma query result
interface AnnouncementWithCreator {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  publishedAt: Date;
  expiresAt: Date | null;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * GET /api/v1/groups/:id/announcements
 * List announcements for a group (members only)
 * Query params:
 *   - includeExpired: include expired announcements (default false)
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

    // Check if user can see announcements (must be member or manager)
    const isMember = await isGroupMember(auth.context.memberId, id);
    const canManage = await canManageGroup(auth.context, id);

    if (!isMember && !canManage) {
      return errors.forbidden("Not authorized to view group announcements");
    }

    const { searchParams } = new URL(request.url);
    const includeExpired = searchParams.get("includeExpired") === "true";

    const now = new Date();
    const announcements = await prisma.activityGroupAnnouncement.findMany({
      where: {
        groupId: id,
        ...(includeExpired
          ? {}
          : {
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { isPinned: "desc" }, // Pinned first
        { publishedAt: "desc" }, // Then by newest
      ],
    });

    const result: AnnouncementSummary[] = (
      announcements as AnnouncementWithCreator[]
    ).map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      isPinned: a.isPinned,
      publishedAt: a.publishedAt.toISOString(),
      expiresAt: a.expiresAt?.toISOString() ?? null,
      createdBy: {
        id: a.createdBy.id,
        name: `${a.createdBy.firstName} ${a.createdBy.lastName}`,
      },
    }));

    return NextResponse.json({
      groupId: id,
      groupName: group.name,
      announcementCount: result.length,
      announcements: result,
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return errors.internal("Failed to fetch announcements");
  }
}

/**
 * POST /api/v1/groups/:id/announcements
 * Create a new announcement (coordinator only)
 * Body: { title: string, content: string, isPinned?: boolean, expiresAt?: string }
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
    // Check if user can manage this group
    if (!(await canManageGroup(auth.context, id))) {
      return errors.forbidden("Not authorized to create announcements");
    }

    const group = await prisma.activityGroup.findUnique({
      where: { id },
    });

    if (!group) {
      return errors.notFound("ActivityGroup", id);
    }

    if (group.status !== "APPROVED") {
      return errors.validation(
        "Cannot create announcements for non-approved groups"
      );
    }

    const body = await request.json();
    const { title, content, isPinned, expiresAt } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return errors.validation("title is required");
    }

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return errors.validation("content is required");
    }

    const announcement = await prisma.activityGroupAnnouncement.create({
      data: {
        groupId: id,
        title: title.trim(),
        content: content.trim(),
        isPinned: isPinned === true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: auth.context.memberId,
        publishedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "GROUP_ANNOUNCEMENT_CREATE",
        resourceType: "ActivityGroupAnnouncement",
        resourceId: announcement.id,
        memberId: auth.context.memberId,
        after: {
          groupId: id,
          title: announcement.title,
          isPinned: announcement.isPinned,
        },
      },
    });

    return apiCreated({
      id: announcement.id,
      groupId: id,
      groupName: group.name,
      title: announcement.title,
      content: announcement.content,
      isPinned: announcement.isPinned,
      publishedAt: announcement.publishedAt.toISOString(),
      expiresAt: announcement.expiresAt?.toISOString() ?? null,
      message: "Announcement created",
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return errors.internal("Failed to create announcement");
  }
}
