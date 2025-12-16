/**
 * Board Records API
 *
 * GET /api/v1/officer/board-records - List board records
 * POST /api/v1/officer/board-records - Create board record
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability, hasCapability } from "@/lib/auth";
import { auditMutation } from "@/lib/audit";
import {
  createBoardRecord,
  listBoardRecords,
} from "@/lib/governance/boardRecords";
import type { BoardRecordStatus } from "@prisma/client";

/**
 * GET /api/v1/officer/board-records
 */
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "board_records:read");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as BoardRecordStatus | null;
  const meetingId = searchParams.get("meetingId");
  const tags = searchParams.get("tags")?.split(",").filter(Boolean);
  const search = searchParams.get("search");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    // Non-privileged users can only see published records
    const canViewAll = hasCapability(auth.context.globalRole, "meetings:minutes:read_all");
    const effectiveStatus = canViewAll
      ? status || undefined
      : "PUBLISHED";

    const result = await listBoardRecords({
      status: effectiveStatus,
      meetingId: meetingId || undefined,
      tags,
      search: search || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      records: result.records,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.records.length < result.total,
      },
    });
  } catch (error) {
    console.error("Error listing board records:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to list board records" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/officer/board-records
 */
export async function POST(req: NextRequest) {
  const auth = await requireCapability(req, "board_records:draft:create");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { title, body: recordBody, tags, meetingId, directedByPresident } = body;

    if (!title || !recordBody) {
      return NextResponse.json(
        { error: "Bad Request", message: "title and body are required" },
        { status: 400 }
      );
    }

    const record = await createBoardRecord({
      title,
      body: recordBody,
      tags: tags || [],
      meetingId,
      directedByPresident: directedByPresident || false,
      createdById: auth.context.memberId,
    });

    await auditMutation(req, auth.context, {
      action: "CREATE",
      capability: "board_records:draft:create",
      objectType: "BoardRecord",
      objectId: record.id,
      metadata: { title: record.title, meetingId },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error("Error creating board record:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to create board record" },
      { status: 500 }
    );
  }
}
