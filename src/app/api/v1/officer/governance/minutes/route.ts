/**
 * Governance Minutes API
 *
 * GET /api/v1/officer/governance/minutes - List minutes
 * POST /api/v1/officer/governance/minutes - Create minutes for a meeting
 *
 * Charter P3: Explicit state machine for minutes workflow
 * Charter P5: Published minutes immutable (versioning)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { auditMutation } from "@/lib/audit";
import {
  createMinutes,
  listMinutes,
} from "@/lib/governance/minutes";
import { MinutesStatus } from "@prisma/client";

/**
 * GET /api/v1/officer/governance/minutes
 */
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "meetings:minutes:read_all");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const meetingId = searchParams.get("meetingId");
  const status = searchParams.get("status") as MinutesStatus | null;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

  try {
    const result = await listMinutes(
      {
        meetingId: meetingId || undefined,
        status: status || undefined,
      },
      { page, limit }
    );

    return NextResponse.json({
      minutes: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error listing minutes:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to list minutes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/officer/governance/minutes
 */
export async function POST(req: NextRequest) {
  const auth = await requireCapability(req, "meetings:minutes:draft:create");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { meetingId, content, summary } = body;

    if (!meetingId) {
      return NextResponse.json(
        { error: "Bad Request", message: "meetingId is required" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "object") {
      return NextResponse.json(
        { error: "Bad Request", message: "content is required and must be an object" },
        { status: 400 }
      );
    }

    const minutes = await createMinutes(
      {
        meetingId,
        content,
        summary,
      },
      auth.context.memberId
    );

    await auditMutation(req, auth.context, {
      action: "CREATE",
      capability: "meetings:minutes:draft:create",
      objectType: "GovernanceMinutes",
      objectId: minutes.id,
      metadata: { meetingId, status: minutes.status },
    });

    return NextResponse.json({ minutes }, { status: 201 });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("Meeting") && message.includes("already has minutes")) {
      return NextResponse.json(
        { error: "Conflict", message },
        { status: 409 }
      );
    }
    console.error("Error creating minutes:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to create minutes" },
      { status: 500 }
    );
  }
}
