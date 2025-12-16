/**
 * Meetings API
 *
 * GET /api/v1/officer/meetings - List meetings
 * POST /api/v1/officer/meetings - Create meeting
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { auditMutation } from "@/lib/audit";
import { createMeeting, listMeetings, getMeetingsNeedingMinutes } from "@/lib/meetings/meetings";
import type { MeetingType } from "@prisma/client";

/**
 * GET /api/v1/officer/meetings
 */
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "meetings:read");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as MeetingType | null;
  const needsMinutes = searchParams.get("needsMinutes") === "true";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    if (needsMinutes) {
      const meetings = await getMeetingsNeedingMinutes();
      return NextResponse.json({ meetings, total: meetings.length });
    }

    const result = await listMeetings({
      type: type || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      meetings: result.meetings,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.meetings.length < result.total,
      },
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
 * POST /api/v1/officer/meetings
 */
export async function POST(req: NextRequest) {
  const auth = await requireCapability(req, "meetings:read");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { title, type, description, location, startsAt, endsAt } = body;

    if (!title || !type || !startsAt) {
      return NextResponse.json(
        { error: "Bad Request", message: "title, type, and startsAt are required" },
        { status: 400 }
      );
    }

    const validTypes: MeetingType[] = ["BOARD", "EXECUTIVE", "SPECIAL", "ANNUAL"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Bad Request", message: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const meeting = await createMeeting({
      title,
      type,
      description,
      location,
      startsAt: new Date(startsAt),
      endsAt: endsAt ? new Date(endsAt) : undefined,
      createdById: auth.context.memberId,
    });

    await auditMutation(req, auth.context, {
      action: "CREATE",
      capability: "meetings:read",
      objectType: "Meeting",
      objectId: meeting.id,
      metadata: { title: meeting.title, type: meeting.type },
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
