/**
 * Event Note Detail API
 *
 * PATCH /api/v1/events/:id/notes/:noteId - Update a note
 * DELETE /api/v1/events/:id/notes/:noteId - Delete a note
 *
 * Access Control:
 * - Author: Can edit/delete own notes
 * - VP Activities: Can edit/delete any note
 * - Admin: Full access
 *
 * Charter Compliance:
 * - P1: Identity via session auth
 * - P2: Default deny authorization
 * - P7: Audit logging
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasCapability, type GlobalRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditEntry } from "@/lib/audit";

// UUID validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if user has VP-level access
 */
function hasVPAccess(role: GlobalRole): boolean {
  return hasCapability(role, "events:edit");
}

/**
 * PATCH /api/v1/events/:id/notes/:noteId
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const { id: eventId, noteId } = await params;

  if (!uuidRegex.test(eventId) || !uuidRegex.test(noteId)) {
    return NextResponse.json(
      { error: "Not Found", message: "Resource not found" },
      { status: 404 }
    );
  }

  const auth = await requireAuth(req);
  if (!auth.ok) {
    return auth.response;
  }

  // Fetch note
  const note = await prisma.eventNote.findUnique({
    where: { id: noteId },
    include: {
      event: { select: { id: true, title: true } },
    },
  });

  if (!note || note.eventId !== eventId) {
    return NextResponse.json(
      { error: "Not Found", message: "Note not found" },
      { status: 404 }
    );
  }

  const isAuthor = note.authorId === auth.context.memberId;
  const isVP = hasVPAccess(auth.context.globalRole);

  // Only author or VP can edit
  if (!isAuthor && !isVP) {
    return NextResponse.json(
      { error: "Forbidden", message: "You cannot edit this note" },
      { status: 403 }
    );
  }

  // Parse body
  const body = await req.json();

  // Build update data
  const updateData: Record<string, unknown> = {};

  if (typeof body.content === "string") {
    if (body.content.trim() === "") {
      return NextResponse.json(
        { error: "Bad Request", message: "Content cannot be empty" },
        { status: 400 }
      );
    }
    updateData.content = body.content.trim();
  }

  if (typeof body.isPrivate === "boolean") {
    updateData.isPrivate = body.isPrivate;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "Bad Request", message: "No valid fields to update" },
      { status: 400 }
    );
  }

  // Update note
  const updated = await prisma.eventNote.update({
    where: { id: noteId },
    data: updateData,
  });

  // Audit log
  await createAuditEntry({
    action: "UPDATE",
    resourceType: "EventNote",
    resourceId: noteId,
    actor: auth.context,
    req,
    metadata: {
      eventId,
      eventTitle: note.event.title,
      noteType: note.noteType,
    },
  });

  return NextResponse.json({
    id: updated.id,
    content: updated.content,
    isPrivate: updated.isPrivate,
    updatedAt: updated.updatedAt.toISOString(),
    message: "Note updated",
  });
}

/**
 * DELETE /api/v1/events/:id/notes/:noteId
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const { id: eventId, noteId } = await params;

  if (!uuidRegex.test(eventId) || !uuidRegex.test(noteId)) {
    return NextResponse.json(
      { error: "Not Found", message: "Resource not found" },
      { status: 404 }
    );
  }

  const auth = await requireAuth(req);
  if (!auth.ok) {
    return auth.response;
  }

  // Fetch note
  const note = await prisma.eventNote.findUnique({
    where: { id: noteId },
    include: {
      event: { select: { id: true, title: true } },
    },
  });

  if (!note || note.eventId !== eventId) {
    return NextResponse.json(
      { error: "Not Found", message: "Note not found" },
      { status: 404 }
    );
  }

  const isAuthor = note.authorId === auth.context.memberId;
  const isVP = hasVPAccess(auth.context.globalRole);

  // Only author or VP can delete
  if (!isAuthor && !isVP) {
    return NextResponse.json(
      { error: "Forbidden", message: "You cannot delete this note" },
      { status: 403 }
    );
  }

  // Delete note
  await prisma.eventNote.delete({
    where: { id: noteId },
  });

  // Audit log
  await createAuditEntry({
    action: "DELETE",
    resourceType: "EventNote",
    resourceId: noteId,
    actor: auth.context,
    req,
    metadata: {
      eventId,
      eventTitle: note.event.title,
      noteType: note.noteType,
    },
  });

  return new NextResponse(null, { status: 204 });
}
