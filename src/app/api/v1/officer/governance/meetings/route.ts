/**
 * Governance Meetings API
 *
 * GET /api/v1/officer/governance/meetings - List meetings
 * POST /api/v1/officer/governance/meetings - Create meeting
 *
 * Charter P1: Identity provable (createdBy tracked)
 * Charter P7: Full audit trail
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { auditMutation } from "@/lib/audit";
import {
  createMeeting,
  listMeetings,
  meetingExists,
} from "@/lib/governance/meetings";
import { GovernanceMeetingType } from "@prisma/client";

/**
 * GET /api/v1/officer/governance/meetings
 */
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "meetings:read");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as GovernanceMeetingType | null;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

  try {
    const result = await listMeetings(
      {
        type: type || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      { page, limit }
    );

    return NextResponse.json({
      meetings: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error listing meetings:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to list meetings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/officer/governance/meetings
 */
export async function POST(req: NextRequest) {
  const auth = await requireCapability(req, "meetings:minutes:draft:create");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { date, type, title, location, attendanceCount, quorumMet } = body;

    if (!date || !type) {
      return NextResponse.json(
        { error: "Bad Request", message: "date and type are required" },
        { status: 400 }
      );
    }

    const validTypes: GovernanceMeetingType[] = ["BOARD", "EXECUTIVE", "SPECIAL", "ANNUAL"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Bad Request", message: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if meeting already exists for this date and type
    const exists = await meetingExists(date, type);
    if (exists) {
      return NextResponse.json(
        { error: "Conflict", message: `A ${type} meeting already exists for ${date}` },
        { status: 409 }
      );
    }

    const meeting = await createMeeting(
      {
        date,
        type,
        title,
        location,
        attendanceCount,
        quorumMet,
      },
      auth.context.memberId
    );

    await auditMutation(req, auth.context, {
      action: "CREATE",
      capability: "meetings:minutes:draft:create",
      objectType: "GovernanceMeeting",
      objectId: meeting.id,
      metadata: { date: meeting.date, type: meeting.type },
    });

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to create meeting" },
      { status: 500 }
    );
  }
}
