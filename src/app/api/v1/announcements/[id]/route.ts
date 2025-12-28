/**
 * GET/PATCH/DELETE /api/v1/announcements/[id]
 *
 * Single announcement operations.
 * GET: Get announcement by ID (public for published, comms:manage for drafts)
 * PATCH: Update announcement (admin only, requires comms:manage)
 * DELETE: Delete announcement (admin only, requires comms:manage)
 *
 * Charter: P2 (default deny for mutations), P5 (reversible via soft delete)
 *
 * NOTE: Requires Announcement model in Prisma schema.
 * Until the model is added, these endpoints return 501 Not Implemented.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";

// Type definitions for announcement updates
export interface AnnouncementUpdateInput {
  title?: string;
  content?: string;
  category?: string | null;
  expiresAt?: string | null;
}

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/announcements/[id]
 *
 * Get a single announcement by ID.
 * Published announcements are public.
 * Draft announcements require comms:manage capability.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Invalid announcement ID" },
      { status: 400 }
    );
  }

  // TODO: Implement when Announcement model is added to Prisma schema
  // const announcement = await prisma.announcement.findUnique({
  //   where: { id },
  // });
  //
  // if (!announcement) {
  //   return NextResponse.json(
  //     { error: "Announcement not found" },
  //     { status: 404 }
  //   );
  // }
  //
  // // If not published, require comms:manage
  // if (!announcement.isPublished) {
  //   const auth = await requireCapability(request, "comms:manage");
  //   if (!auth.ok) {
  //     return NextResponse.json(
  //       { error: "Announcement not found" },
  //       { status: 404 }
  //     );
  //   }
  // }
  //
  // return NextResponse.json({ announcement });

  return NextResponse.json(
    {
      error: "Not Implemented",
      message: "Announcement model not yet in Prisma schema",
      id,
    },
    { status: 501 }
  );
}

/**
 * PATCH /api/v1/announcements/[id]
 *
 * Update an announcement.
 * Requires comms:manage capability.
 *
 * Body: { title?: string, content?: string, category?: string | null, expiresAt?: string | null }
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  // Charter P2: Require comms:manage capability
  const auth = await requireCapability(request, "comms:manage");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Invalid announcement ID" },
      { status: 400 }
    );
  }

  // Parse and validate body
  let body: AnnouncementUpdateInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate title if provided
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim() === "") {
      return NextResponse.json(
        { error: "title cannot be empty" },
        { status: 400 }
      );
    }
  }

  // Validate content if provided
  if (body.content !== undefined) {
    if (typeof body.content !== "string" || body.content.trim() === "") {
      return NextResponse.json(
        { error: "content cannot be empty" },
        { status: 400 }
      );
    }
  }

  // Validate expiresAt if provided
  if (body.expiresAt !== undefined && body.expiresAt !== null) {
    const expiresDate = new Date(body.expiresAt);
    if (isNaN(expiresDate.getTime())) {
      return NextResponse.json(
        { error: "expiresAt must be a valid ISO date string" },
        { status: 400 }
      );
    }
  }

  // TODO: Implement when Announcement model is added to Prisma schema
  // const existing = await prisma.announcement.findUnique({
  //   where: { id },
  // });
  //
  // if (!existing) {
  //   return NextResponse.json(
  //     { error: "Announcement not found" },
  //     { status: 404 }
  //   );
  // }
  //
  // const updateData: Prisma.AnnouncementUpdateInput = {};
  // if (body.title !== undefined) updateData.title = body.title.trim();
  // if (body.content !== undefined) updateData.content = body.content.trim();
  // if (body.category !== undefined) updateData.category = body.category?.trim() || null;
  // if (body.expiresAt !== undefined) {
  //   updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  // }
  //
  // const announcement = await prisma.announcement.update({
  //   where: { id },
  //   data: updateData,
  // });
  //
  // // Charter P7: Audit the update
  // await prisma.auditLog.create({
  //   data: {
  //     action: "announcement:update",
  //     targetType: "announcement",
  //     targetId: announcement.id,
  //     actorId: auth.context.userAccountId,
  //     details: { updatedFields: Object.keys(body) },
  //   },
  // });
  //
  // return NextResponse.json({ announcement });

  return NextResponse.json(
    {
      error: "Not Implemented",
      message: "Announcement model not yet in Prisma schema",
      id,
    },
    { status: 501 }
  );
}

/**
 * DELETE /api/v1/announcements/[id]
 *
 * Delete an announcement.
 * Requires comms:manage capability.
 *
 * Charter P5: Consider soft delete for reversibility
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  // Charter P2: Require comms:manage capability
  const auth = await requireCapability(request, "comms:manage");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Invalid announcement ID" },
      { status: 400 }
    );
  }

  // TODO: Implement when Announcement model is added to Prisma schema
  // const existing = await prisma.announcement.findUnique({
  //   where: { id },
  // });
  //
  // if (!existing) {
  //   return NextResponse.json(
  //     { error: "Announcement not found" },
  //     { status: 404 }
  //   );
  // }
  //
  // // Charter P7: Audit before deletion
  // await prisma.auditLog.create({
  //   data: {
  //     action: "announcement:delete",
  //     targetType: "announcement",
  //     targetId: id,
  //     actorId: auth.context.userAccountId,
  //     details: { title: existing.title },
  //   },
  // });
  //
  // await prisma.announcement.delete({
  //   where: { id },
  // });
  //
  // return NextResponse.json({ success: true });

  return NextResponse.json(
    {
      error: "Not Implemented",
      message: "Announcement model not yet in Prisma schema",
      id,
    },
    { status: 501 }
  );
}
