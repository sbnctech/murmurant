/**
 * Event Postmortem API
 *
 * GET /api/v1/events/:id/postmortem - Get postmortem for event
 * POST /api/v1/events/:id/postmortem - Create postmortem for event
 * PATCH /api/v1/events/:id/postmortem - Update postmortem
 *
 * Access Control:
 * - Event Chair: Can create/edit own postmortems (DRAFT/UNLOCKED status only)
 * - VP Activities: Can view all, can approve/return/unlock
 * - Admin: Full access
 *
 * Charter Compliance:
 * - P1: Identity via session auth
 * - P2: Default deny authorization
 * - P7: Audit logging for status changes
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasCapability, type GlobalRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PostmortemStatus, EventStatus } from "@prisma/client";
import { createAuditEntry } from "@/lib/audit";

// UUID validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Postmortem response type
type PostmortemResponse = {
  id: string;
  eventId: string;
  status: PostmortemStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string } | null;
  approver: { id: string; name: string } | null;
  approvedAt: string | null;
  // Author contact info (captured at submission)
  submittedAt: string | null;
  submittedByName: string | null;
  submittedByEmail: string | null;
  submittedByPhone: string | null;
  // Content fields
  setupNotes: string | null;
  contactsUsed: string | null;
  timelineNotes: string | null;
  attendanceRating: number | null;
  logisticsRating: number | null;
  satisfactionRating: number | null;
  whatWorked: string | null;
  whatDidNot: string | null;
  whatToChangeNextTime: string | null;
  internalOnly: boolean;
  capabilities: {
    canEdit: boolean;
    canSubmit: boolean;
    canApprove: boolean;
    canReturn: boolean;
    canUnlock: boolean;
  };
};

/**
 * Check if user has VP-level access
 */
function hasVPAccess(role: GlobalRole): boolean {
  return hasCapability(role, "events:edit");
}

/**
 * Check if user can view this postmortem
 */
function canView(
  isChair: boolean,
  isVP: boolean,
  postmortem: { internalOnly: boolean }
): boolean {
  if (isVP) return true;
  if (isChair) return true;
  // Regular members can view if not internal only
  return !postmortem.internalOnly;
}

/**
 * Check if user can edit this postmortem
 */
function canEdit(
  isChair: boolean,
  isVP: boolean,
  status: PostmortemStatus
): boolean {
  // VP/Admin can always edit (for corrections)
  if (isVP) return true;
  // Chair can only edit in DRAFT or UNLOCKED status
  if (isChair && (status === "DRAFT" || status === "UNLOCKED")) return true;
  return false;
}

/**
 * GET /api/v1/events/:id/postmortem
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
    select: { id: true, status: true, eventChairId: true, title: true },
  });

  if (!event) {
    return NextResponse.json(
      { error: "Not Found", message: "Event not found" },
      { status: 404 }
    );
  }

  const isChair = event.eventChairId === auth.context.memberId;
  const isVP = hasVPAccess(auth.context.globalRole);

  // Fetch postmortem
  const postmortem = await prisma.eventPostmortem.findUnique({
    where: { eventId },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      approver: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!postmortem) {
    // Return 404 with capability to create
    return NextResponse.json(
      {
        error: "Not Found",
        message: "No postmortem exists for this event",
        canCreate: isChair || isVP,
      },
      { status: 404 }
    );
  }

  // Check view permission
  if (!canView(isChair, isVP, postmortem)) {
    return NextResponse.json(
      { error: "Forbidden", message: "You cannot view this postmortem" },
      { status: 403 }
    );
  }

  const response: PostmortemResponse = {
    id: postmortem.id,
    eventId: postmortem.eventId,
    status: postmortem.status,
    createdAt: postmortem.createdAt.toISOString(),
    updatedAt: postmortem.updatedAt.toISOString(),
    createdBy: postmortem.createdBy
      ? {
          id: postmortem.createdBy.id,
          name: `${postmortem.createdBy.firstName} ${postmortem.createdBy.lastName}`,
        }
      : null,
    approver: postmortem.approver
      ? {
          id: postmortem.approver.id,
          name: `${postmortem.approver.firstName} ${postmortem.approver.lastName}`,
        }
      : null,
    approvedAt: postmortem.approvedAt?.toISOString() ?? null,
    submittedAt: postmortem.submittedAt?.toISOString() ?? null,
    submittedByName: postmortem.submittedByName,
    submittedByEmail: postmortem.submittedByEmail,
    submittedByPhone: postmortem.submittedByPhone,
    setupNotes: postmortem.setupNotes,
    contactsUsed: postmortem.contactsUsed,
    timelineNotes: postmortem.timelineNotes,
    attendanceRating: postmortem.attendanceRating,
    logisticsRating: postmortem.logisticsRating,
    satisfactionRating: postmortem.satisfactionRating,
    whatWorked: postmortem.whatWorked,
    whatDidNot: postmortem.whatDidNot,
    whatToChangeNextTime: postmortem.whatToChangeNextTime,
    internalOnly: postmortem.internalOnly,
    capabilities: {
      canEdit: canEdit(isChair, isVP, postmortem.status),
      canSubmit:
        isChair && postmortem.status === "DRAFT",
      canApprove: isVP && postmortem.status === "SUBMITTED",
      canReturn: isVP && postmortem.status === "SUBMITTED",
      canUnlock: isVP && postmortem.status === "APPROVED",
    },
  };

  return NextResponse.json(response);
}

/**
 * POST /api/v1/events/:id/postmortem
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
    select: { id: true, status: true, eventChairId: true, title: true },
  });

  if (!event) {
    return NextResponse.json(
      { error: "Not Found", message: "Event not found" },
      { status: 404 }
    );
  }

  const isChair = event.eventChairId === auth.context.memberId;
  const isVP = hasVPAccess(auth.context.globalRole);

  // Only chair or VP can create postmortem
  if (!isChair && !isVP) {
    return NextResponse.json(
      { error: "Forbidden", message: "Only the event chair can create a postmortem" },
      { status: 403 }
    );
  }

  // Event must be completed or canceled
  const validStatuses: EventStatus[] = ["COMPLETED", "CANCELED", "PUBLISHED"];
  if (!validStatuses.includes(event.status)) {
    return NextResponse.json(
      {
        error: "Bad Request",
        message: "Postmortem can only be created for completed or canceled events",
      },
      { status: 400 }
    );
  }

  // Check if postmortem already exists
  const existing = await prisma.eventPostmortem.findUnique({
    where: { eventId },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Conflict", message: "Postmortem already exists for this event" },
      { status: 409 }
    );
  }

  // Parse body
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is OK
  }

  // Create postmortem
  const postmortem = await prisma.eventPostmortem.create({
    data: {
      eventId,
      createdById: auth.context.memberId,
      status: "DRAFT",
      setupNotes: typeof body.setupNotes === "string" ? body.setupNotes : null,
      contactsUsed: typeof body.contactsUsed === "string" ? body.contactsUsed : null,
      timelineNotes: typeof body.timelineNotes === "string" ? body.timelineNotes : null,
      attendanceRating: typeof body.attendanceRating === "number" ? body.attendanceRating : null,
      logisticsRating: typeof body.logisticsRating === "number" ? body.logisticsRating : null,
      satisfactionRating: typeof body.satisfactionRating === "number" ? body.satisfactionRating : null,
      whatWorked: typeof body.whatWorked === "string" ? body.whatWorked : null,
      whatDidNot: typeof body.whatDidNot === "string" ? body.whatDidNot : null,
      whatToChangeNextTime: typeof body.whatToChangeNextTime === "string" ? body.whatToChangeNextTime : null,
      internalOnly: body.internalOnly === false ? false : true,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // Audit log
  await createAuditEntry({
    action: "CREATE",
    resourceType: "EventPostmortem",
    resourceId: postmortem.id,
    actor: auth.context,
    req,
    metadata: {
      eventId,
      eventTitle: event.title,
    },
  });

  return NextResponse.json(
    {
      id: postmortem.id,
      eventId: postmortem.eventId,
      status: postmortem.status,
      message: "Postmortem created",
    },
    { status: 201 }
  );
}

/**
 * PATCH /api/v1/events/:id/postmortem
 */
export async function PATCH(
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

  // Fetch postmortem
  const postmortem = await prisma.eventPostmortem.findUnique({
    where: { eventId },
  });

  if (!postmortem) {
    return NextResponse.json(
      { error: "Not Found", message: "Postmortem not found" },
      { status: 404 }
    );
  }

  const isChair = event.eventChairId === auth.context.memberId;
  const isVP = hasVPAccess(auth.context.globalRole);

  // Check edit permission
  if (!canEdit(isChair, isVP, postmortem.status)) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: `Cannot edit postmortem in ${postmortem.status} status`,
      },
      { status: 403 }
    );
  }

  // Parse body
  const body = await req.json();

  // Allowed fields
  const allowedFields = [
    "setupNotes",
    "contactsUsed",
    "timelineNotes",
    "attendanceRating",
    "logisticsRating",
    "satisfactionRating",
    "whatWorked",
    "whatDidNot",
    "whatToChangeNextTime",
    "internalOnly",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  // Validate ratings (1-5)
  const ratingFields = ["attendanceRating", "logisticsRating", "satisfactionRating"];
  for (const field of ratingFields) {
    if (field in updateData) {
      const value = updateData[field];
      if (value !== null && (typeof value !== "number" || value < 1 || value > 5)) {
        return NextResponse.json(
          { error: "Bad Request", message: `${field} must be between 1 and 5` },
          { status: 400 }
        );
      }
    }
  }

  // Update postmortem
  const updated = await prisma.eventPostmortem.update({
    where: { eventId },
    data: updateData,
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    updatedAt: updated.updatedAt.toISOString(),
    message: "Postmortem updated",
  });
}
