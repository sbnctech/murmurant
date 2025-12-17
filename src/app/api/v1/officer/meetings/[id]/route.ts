/**
 * Meeting by ID API
 *
 * GET /api/v1/officer/meetings/:id - Get meeting details
 * PATCH /api/v1/officer/meetings/:id - Update meeting
 * DELETE /api/v1/officer/meetings/:id - Delete meeting
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability, hasCapability } from "@/lib/auth";
import { auditMutation } from "@/lib/audit";
import { getMeeting, updateMeeting, deleteMeeting } from "@/lib/meetings/meetings";
import type { MeetingType } from "@/lib/governance/types";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/officer/meetings/:id
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:read");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const meeting = await getMeeting(id);

    if (!meeting) {
      return NextResponse.json(
        { error: "Not Found", message: "Meeting not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error("Error getting meeting:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to get meeting" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/officer/meetings/:id
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:read");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await req.json();
    const { title, type, description, location, startsAt, endsAt } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) {
      const validTypes: MeetingType[] = ["BOARD", "EXECUTIVE", "SPECIAL", "ANNUAL"];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: "Bad Request", message: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.type = type;
    }
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (startsAt !== undefined) updateData.startsAt = new Date(startsAt);
    if (endsAt !== undefined) updateData.endsAt = endsAt ? new Date(endsAt) : null;

    const meeting = await updateMeeting(id, updateData);

    await auditMutation(req, auth.context, {
      action: "UPDATE",
      capability: "meetings:read",
      objectType: "Meeting",
      objectId: id,
      metadata: { updates: Object.keys(updateData) },
    });

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update meeting" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/officer/meetings/:id
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:read");
  if (!auth.ok) return auth.response;

  // Only admin can delete meetings
  if (!hasCapability(auth.context.globalRole, "admin:full")) {
    return NextResponse.json(
      { error: "Forbidden", message: "Only admin can delete meetings" },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    await deleteMeeting(id);

    await auditMutation(req, auth.context, {
      action: "DELETE",
      capability: "admin:full",
      objectType: "Meeting",
      objectId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found")) {
      return NextResponse.json(
        { error: "Not Found", message: "Meeting not found" },
        { status: 404 }
      );
    }
    if (message.includes("Cannot delete")) {
      return NextResponse.json(
        { error: "Conflict", message },
        { status: 409 }
      );
    }
    console.error("Error deleting meeting:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to delete meeting" },
      { status: 500 }
    );
  }
}
