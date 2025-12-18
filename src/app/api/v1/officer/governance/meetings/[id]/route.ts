/**
 * Governance Meeting by ID API
 *
 * GET /api/v1/officer/governance/meetings/:id - Get meeting with minutes and motions
 * PATCH /api/v1/officer/governance/meetings/:id - Update meeting details
 * DELETE /api/v1/officer/governance/meetings/:id - Delete meeting (only if no minutes/motions)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { auditMutation } from "@/lib/audit";
import {
  getMeetingById,
  updateMeeting,
  deleteMeeting,
} from "@/lib/governance/meetings";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/officer/governance/meetings/:id
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:read");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const meeting = await getMeetingById(id);

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
 * PATCH /api/v1/officer/governance/meetings/:id
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:minutes:draft:edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await req.json();
    const { title, location, attendanceCount, quorumMet } = body;

    const meeting = await updateMeeting(id, {
      title,
      location,
      attendanceCount,
      quorumMet,
    });

    await auditMutation(req, auth.context, {
      action: "UPDATE",
      capability: "meetings:minutes:draft:edit",
      objectType: "GovernanceMeeting",
      objectId: id,
    });

    return NextResponse.json({ meeting });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found") || message.includes("Record to update not found")) {
      return NextResponse.json(
        { error: "Not Found", message: "Meeting not found" },
        { status: 404 }
      );
    }
    console.error("Error updating meeting:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update meeting" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/officer/governance/meetings/:id
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "admin:full");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await deleteMeeting(id);

    await auditMutation(req, auth.context, {
      action: "DELETE",
      capability: "admin:full",
      objectType: "GovernanceMeeting",
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
