/**
 * Governance Minutes by ID API
 *
 * GET /api/v1/officer/governance/minutes/:id - Get minutes
 * PATCH /api/v1/officer/governance/minutes/:id - Update minutes content
 * DELETE /api/v1/officer/governance/minutes/:id - Delete draft minutes
 * POST /api/v1/officer/governance/minutes/:id - Perform workflow action
 *
 * Workflow Actions:
 * - submit: DRAFT -> SUBMITTED (Secretary submits for review)
 * - approve: SUBMITTED -> APPROVED (President approves)
 * - revise: SUBMITTED -> REVISED (President requests revision)
 * - publish: APPROVED -> PUBLISHED (Secretary publishes)
 * - archive: PUBLISHED -> ARCHIVED (Archival)
 * - create_revision: PUBLISHED -> new DRAFT version
 *
 * Charter P3: Explicit state machine for minutes workflow
 * Charter P5: Published minutes immutable (versioning)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { auditMutation } from "@/lib/audit";
import {
  getMinutesById,
  updateMinutes,
  deleteMinutes,
  submitMinutes,
  approveMinutes,
  requestRevision,
  publishMinutes,
  archiveMinutes,
  createMinutesRevision,
  SECRETARY_EDITABLE_STATUSES,
} from "@/lib/governance/minutes";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/officer/governance/minutes/:id
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:read");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const minutes = await getMinutesById(id);

    if (!minutes) {
      return NextResponse.json(
        { error: "Not Found", message: "Minutes not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ minutes });
  } catch (error) {
    console.error("Error getting minutes:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to get minutes" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/officer/governance/minutes/:id
 * Update minutes content (only in editable states)
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:minutes:draft:edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await req.json();
    const { content, summary } = body;

    // Verify minutes exist and are in editable state
    const existing = await getMinutesById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Not Found", message: "Minutes not found" },
        { status: 404 }
      );
    }

    if (!SECRETARY_EDITABLE_STATUSES.includes(existing.status)) {
      return NextResponse.json(
        { error: "Forbidden", message: `Cannot edit minutes in ${existing.status} status` },
        { status: 403 }
      );
    }

    const minutes = await updateMinutes(id, {
      content,
      summary,
    }, auth.context.memberId);

    await auditMutation(req, auth.context, {
      action: "UPDATE",
      capability: "meetings:minutes:draft:edit",
      objectType: "GovernanceMinutes",
      objectId: id,
    });

    return NextResponse.json({ minutes });
  } catch (error) {
    console.error("Error updating minutes:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update minutes" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/officer/governance/minutes/:id
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:minutes:draft:edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await deleteMinutes(id);

    await auditMutation(req, auth.context, {
      action: "DELETE",
      capability: "meetings:minutes:draft:edit",
      objectType: "GovernanceMinutes",
      objectId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found")) {
      return NextResponse.json(
        { error: "Not Found", message: "Minutes not found" },
        { status: 404 }
      );
    }
    if (message.includes("Cannot delete")) {
      return NextResponse.json(
        { error: "Forbidden", message },
        { status: 403 }
      );
    }
    console.error("Error deleting minutes:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to delete minutes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/officer/governance/minutes/:id
 * Perform workflow actions on minutes
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { action, notes } = body;

    switch (action) {
      case "submit": {
        // Secretary submits for presidential review
        const auth = await requireCapability(req, "meetings:minutes:draft:submit");
        if (!auth.ok) return auth.response;

        const minutes = await submitMinutes(id, auth.context.memberId);

        await auditMutation(req, auth.context, {
          action: "UPDATE",
          capability: "meetings:minutes:draft:submit",
          objectType: "GovernanceMinutes",
          objectId: id,
          metadata: { action: "submit", newStatus: minutes.status },
        });

        return NextResponse.json({ minutes });
      }

      case "approve": {
        // President approves minutes
        const auth = await requireCapability(req, "meetings:minutes:finalize");
        if (!auth.ok) return auth.response;

        const minutes = await approveMinutes(id, auth.context.memberId);

        await auditMutation(req, auth.context, {
          action: "UPDATE",
          capability: "meetings:minutes:finalize",
          objectType: "GovernanceMinutes",
          objectId: id,
          metadata: { action: "approve", newStatus: minutes.status },
        });

        return NextResponse.json({ minutes });
      }

      case "revise": {
        // President requests revision
        const auth = await requireCapability(req, "meetings:minutes:revise");
        if (!auth.ok) return auth.response;

        if (!notes) {
          return NextResponse.json(
            { error: "Bad Request", message: "notes are required when requesting revision" },
            { status: 400 }
          );
        }

        const minutes = await requestRevision(id, auth.context.memberId, notes);

        await auditMutation(req, auth.context, {
          action: "UPDATE",
          capability: "meetings:minutes:revise",
          objectType: "GovernanceMinutes",
          objectId: id,
          metadata: { action: "revise", newStatus: minutes.status, notes },
        });

        return NextResponse.json({ minutes });
      }

      case "publish": {
        // Secretary publishes approved minutes
        const auth = await requireCapability(req, "meetings:minutes:finalize");
        if (!auth.ok) return auth.response;

        const minutes = await publishMinutes(id, auth.context.memberId);

        await auditMutation(req, auth.context, {
          action: "UPDATE",
          capability: "meetings:minutes:finalize",
          objectType: "GovernanceMinutes",
          objectId: id,
          metadata: { action: "publish", newStatus: minutes.status },
        });

        return NextResponse.json({ minutes });
      }

      case "archive": {
        const auth = await requireCapability(req, "admin:full");
        if (!auth.ok) return auth.response;

        const minutes = await archiveMinutes(id);

        await auditMutation(req, auth.context, {
          action: "UPDATE",
          capability: "admin:full",
          objectType: "GovernanceMinutes",
          objectId: id,
          metadata: { action: "archive", newStatus: minutes.status },
        });

        return NextResponse.json({ minutes });
      }

      case "create_revision": {
        // Create a new version from published minutes (for corrections)
        const auth = await requireCapability(req, "meetings:minutes:draft:create");
        if (!auth.ok) return auth.response;

        const minutes = await createMinutesRevision(id, auth.context.memberId);

        await auditMutation(req, auth.context, {
          action: "CREATE",
          capability: "meetings:minutes:draft:create",
          objectType: "GovernanceMinutes",
          objectId: minutes.id,
          metadata: { action: "create_revision", previousVersion: id, newVersion: minutes.version },
        });

        return NextResponse.json({ minutes });
      }

      default:
        return NextResponse.json(
          { error: "Bad Request", message: `Unknown action: ${action}. Valid actions: submit, approve, revise, publish, archive, create_revision` },
          { status: 400 }
        );
    }
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found") || message.includes("Minutes not found")) {
      return NextResponse.json(
        { error: "Not Found", message: "Minutes not found" },
        { status: 404 }
      );
    }
    if (message.includes("Invalid transition") || message.includes("Cannot")) {
      return NextResponse.json(
        { error: "Bad Request", message },
        { status: 400 }
      );
    }
    console.error("Error with minutes action:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to process minutes action" },
      { status: 500 }
    );
  }
}
