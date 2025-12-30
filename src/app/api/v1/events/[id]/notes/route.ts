/**
 * Event Notes API
 *
 * GET /api/v1/events/:id/notes - Get notes for event
 * POST /api/v1/events/:id/notes - Create a new note
 *
 * Note Types:
 * - PLANNING: Pre-event planning notes
 * - VENUE: Venue-specific information
 * - WRAP_UP: Post-event summary
 * - LESSON: Lessons learned for future
 * - HANDOFF: Notes for next chair when cloning
 *
 * Access Control:
 * - Event Chair: Can create/view notes for their events
 * - VP Activities: Can view all notes
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
import { EventNoteType } from "@prisma/client";
import { createAuditEntry } from "@/lib/audit";

// UUID validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Note response type
type NoteResponse = {
  id: string;
  eventId: string;
  noteType: EventNoteType;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
  };
};

/**
 * Check if user has VP-level access
 */
function hasVPAccess(role: GlobalRole): boolean {
  return hasCapability(role, "events:edit");
}

/**
 * GET /api/v1/events/:id/notes
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  if (!uuidRegex.test(eventId)) {
    return NextResponse.json(
      { error: "Not Found", message: "Event not found" },
      { status: 404 }
    );
  }

  const auth = await requireAuth(req);
  if (!auth.ok) {
    return auth.response;
  }

  // Check event exists and get chair info
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, eventChairId: true },
  });

  if (!event) {
    return NextResponse.json(
      { error: "Not Found", message: "Event not found" },
      { status: 404 }
    );
  }

  const isChair = event.eventChairId === auth.context.memberId;
  const isVP = hasVPAccess(auth.context.globalRole);

  // Only chair or VP can view notes
  if (!isChair && !isVP) {
    return NextResponse.json(
      { error: "Forbidden", message: "You cannot view notes for this event" },
      { status: 403 }
    );
  }

  // Fetch notes
  const notes = await prisma.eventNote.findMany({
    where: { eventId },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter private notes if not chair/VP
  const filteredNotes = notes.filter((note) => {
    if (isVP) return true;
    if (isChair) return true;
    return !note.isPrivate;
  });

  const response: NoteResponse[] = filteredNotes.map((note) => ({
    id: note.id,
    eventId: note.eventId,
    noteType: note.noteType,
    content: note.content,
    isPrivate: note.isPrivate,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    author: {
      id: note.author.id,
      name: note.author.firstName + " " + note.author.lastName,
    },
  }));

  return NextResponse.json({ notes: response });
}

/**
 * POST /api/v1/events/:id/notes
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  if (!uuidRegex.test(eventId)) {
    return NextResponse.json(
      { error: "Not Found", message: "Event not found" },
      { status: 404 }
    );
  }

  const auth = await requireAuth(req);
  if (!auth.ok) {
    return auth.response;
  }

  // Check event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, eventChairId: true, title: true },
  });

  if (!event) {
    return NextResponse.json(
      { error: "Not Found", message: "Event not found" },
      { status: 404 }
    );
  }

  const isChair = event.eventChairId === auth.context.memberId;
  const isVP = hasVPAccess(auth.context.globalRole);

  // Only chair or VP can create notes
  if (!isChair && !isVP) {
    return NextResponse.json(
      { error: "Forbidden", message: "You cannot add notes to this event" },
      { status: 403 }
    );
  }

  // Parse body
  const body = await req.json();

  // Validate noteType
  const validTypes: EventNoteType[] = ["PLANNING", "VENUE", "WRAP_UP", "LESSON", "HANDOFF"];
  if (!body.noteType || !validTypes.includes(body.noteType)) {
    return NextResponse.json(
      {
        error: "Bad Request",
        message: "Invalid noteType. Must be one of: PLANNING, VENUE, WRAP_UP, LESSON, HANDOFF",
      },
      { status: 400 }
    );
  }

  // Validate content
  if (!body.content || typeof body.content !== "string" || body.content.trim() === "") {
    return NextResponse.json(
      { error: "Bad Request", message: "Content is required" },
      { status: 400 }
    );
  }

  // Create note
  const note = await prisma.eventNote.create({
    data: {
      eventId,
      authorId: auth.context.memberId!,
      noteType: body.noteType,
      content: body.content.trim(),
      isPrivate: body.isPrivate === true,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // Audit log
  await createAuditEntry({
    action: "CREATE",
    resourceType: "EventNote",
    resourceId: note.id,
    actor: auth.context,
    req,
    metadata: {
      eventId,
      eventTitle: event.title,
      noteType: body.noteType,
    },
  });

  const response: NoteResponse = {
    id: note.id,
    eventId: note.eventId,
    noteType: note.noteType,
    content: note.content,
    isPrivate: note.isPrivate,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    author: {
      id: note.author.id,
      name: note.author.firstName + " " + note.author.lastName,
    },
  };

  return NextResponse.json(response, { status: 201 });
}
