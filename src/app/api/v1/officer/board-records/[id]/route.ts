/**
 * Board Record by ID API
 *
 * GET /api/v1/officer/board-records/:id - Get board record
 * PATCH /api/v1/officer/board-records/:id - Update board record
 * DELETE /api/v1/officer/board-records/:id - Delete board record
 * POST /api/v1/officer/board-records/:id - Perform action (submit, approve, publish)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability, hasCapability } from "@/lib/auth";
import { auditMutation } from "@/lib/audit";
import {
  getBoardRecord,
  updateBoardRecord,
  deleteBoardRecord,
  submitBoardRecord,
  approveBoardRecord,
  publishBoardRecord,
} from "@/lib/governance/boardRecords";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/officer/board-records/:id
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "board_records:read");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const record = await getBoardRecord(id);

    if (!record) {
      return NextResponse.json(
        { error: "Not Found", message: "Board record not found" },
        { status: 404 }
      );
    }

    // Non-privileged users can only see published records
    const canViewAll = hasCapability(auth.context.globalRole, "meetings:minutes:read_all");
    if (!canViewAll && record.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Forbidden", message: "Board record is not yet published" },
        { status: 403 }
      );
    }

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Error getting board record:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to get board record" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/officer/board-records/:id
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "board_records:draft:edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await req.json();
    const { title, body: recordBody, tags, meetingId, directedByPresident } = body;

    const updateData: Record<string, unknown> = {
      updatedById: auth.context.memberId,
    };
    if (title !== undefined) updateData.title = title;
    if (recordBody !== undefined) updateData.body = recordBody;
    if (tags !== undefined) updateData.tags = tags;
    if (meetingId !== undefined) updateData.meetingId = meetingId;
    if (directedByPresident !== undefined) updateData.directedByPresident = directedByPresident;

    const record = await updateBoardRecord(id, updateData as Parameters<typeof updateBoardRecord>[1]);

    await auditMutation(req, auth.context, {
      action: "UPDATE",
      capability: "board_records:draft:edit",
      objectType: "BoardRecord",
      objectId: id,
      metadata: { updates: Object.keys(updateData) },
    });

    return NextResponse.json({ record });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found")) {
      return NextResponse.json(
        { error: "Not Found", message: "Board record not found" },
        { status: 404 }
      );
    }
    if (message.includes("Cannot edit")) {
      return NextResponse.json(
        { error: "Forbidden", message },
        { status: 403 }
      );
    }
    console.error("Error updating board record:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update board record" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/officer/board-records/:id
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "board_records:draft:edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await deleteBoardRecord(id);

    await auditMutation(req, auth.context, {
      action: "DELETE",
      capability: "board_records:draft:edit",
      objectType: "BoardRecord",
      objectId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found")) {
      return NextResponse.json(
        { error: "Not Found", message: "Board record not found" },
        { status: 404 }
      );
    }
    if (message.includes("Only draft")) {
      return NextResponse.json(
        { error: "Forbidden", message },
        { status: 403 }
      );
    }
    console.error("Error deleting board record:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to delete board record" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/officer/board-records/:id
 * Perform action on board record
 *
 * Actions:
 * - submit: Submit for approval
 * - approve: Approve (President)
 * - publish: Publish (Publisher role)
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { action, reviewNotes } = body;

    switch (action) {
      case "submit": {
        const auth = await requireCapability(req, "board_records:draft:submit");
        if (!auth.ok) return auth.response;

        const record = await submitBoardRecord(id, auth.context.memberId);

        await auditMutation(req, auth.context, {
          action: "UPDATE",
          capability: "board_records:draft:submit",
          objectType: "BoardRecord",
          objectId: id,
          metadata: { action: "submit", newStatus: record.status },
        });

        return NextResponse.json({ record });
      }

      case "approve": {
        // President approves
        const auth = await requireCapability(req, "governance:flags:resolve");
        if (!auth.ok) return auth.response;

        const record = await approveBoardRecord(id, reviewNotes || null, auth.context.memberId);

        await auditMutation(req, auth.context, {
          action: "UPDATE",
          capability: "governance:flags:resolve",
          objectType: "BoardRecord",
          objectId: id,
          metadata: { action: "approve", newStatus: record.status },
        });

        return NextResponse.json({ record });
      }

      case "publish": {
        const auth = await requireCapability(req, "content:board:publish");
        if (!auth.ok) return auth.response;

        const record = await publishBoardRecord(id, auth.context.memberId);

        await auditMutation(req, auth.context, {
          action: "PUBLISH",
          capability: "content:board:publish",
          objectType: "BoardRecord",
          objectId: id,
          metadata: { newStatus: record.status },
        });

        return NextResponse.json({ record });
      }

      default:
        return NextResponse.json(
          { error: "Bad Request", message: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found")) {
      return NextResponse.json(
        { error: "Not Found", message: "Board record not found" },
        { status: 404 }
      );
    }
    if (message.includes("Only")) {
      return NextResponse.json(
        { error: "Bad Request", message },
        { status: 400 }
      );
    }
    console.error("Error with board record action:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to process board record action" },
      { status: 500 }
    );
  }
}
