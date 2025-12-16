/**
 * Governance Flag by ID API
 *
 * GET /api/v1/officer/governance/flags/:id - Get flag
 * PATCH /api/v1/officer/governance/flags/:id - Update flag
 * DELETE /api/v1/officer/governance/flags/:id - Delete flag
 * POST /api/v1/officer/governance/flags/:id - Perform action (start_review, resolve, dismiss)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { auditMutation } from "@/lib/audit";
import {
  getGovernanceFlag,
  updateGovernanceFlag,
  deleteGovernanceFlag,
  startFlagReview,
  resolveGovernanceFlag,
  dismissGovernanceFlag,
} from "@/lib/governance/flags";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/officer/governance/flags/:id
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:motions:read");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const flag = await getGovernanceFlag(id);

    if (!flag) {
      return NextResponse.json(
        { error: "Not Found", message: "Governance flag not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ flag });
  } catch (error) {
    console.error("Error getting governance flag:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to get governance flag" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/officer/governance/flags/:id
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "governance:flags:create");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await req.json();
    const { title, description, flagType } = body;

    const flag = await updateGovernanceFlag(id, {
      title,
      description,
      flagType,
    });

    await auditMutation(req, auth.context, {
      action: "UPDATE",
      capability: "governance:flags:create",
      objectType: "GovernanceFlag",
      objectId: id,
    });

    return NextResponse.json({ flag });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found")) {
      return NextResponse.json(
        { error: "Not Found", message: "Governance flag not found" },
        { status: 404 }
      );
    }
    if (message.includes("Cannot edit")) {
      return NextResponse.json(
        { error: "Forbidden", message },
        { status: 403 }
      );
    }
    console.error("Error updating governance flag:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update governance flag" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/officer/governance/flags/:id
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "governance:flags:create");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await deleteGovernanceFlag(id);

    await auditMutation(req, auth.context, {
      action: "DELETE",
      capability: "governance:flags:create",
      objectType: "GovernanceFlag",
      objectId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found")) {
      return NextResponse.json(
        { error: "Not Found", message: "Governance flag not found" },
        { status: 404 }
      );
    }
    if (message.includes("Only open")) {
      return NextResponse.json(
        { error: "Forbidden", message },
        { status: 403 }
      );
    }
    console.error("Error deleting governance flag:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to delete governance flag" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/officer/governance/flags/:id
 * Perform action on governance flag
 *
 * Actions:
 * - start_review: Mark as in review
 * - resolve: Resolve the flag
 * - dismiss: Dismiss the flag
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { action, resolution } = body;

    switch (action) {
      case "start_review": {
        const auth = await requireCapability(req, "governance:flags:resolve");
        if (!auth.ok) return auth.response;

        const flag = await startFlagReview(id, auth.context.memberId);

        await auditMutation(req, auth.context, {
          action: "UPDATE",
          capability: "governance:flags:resolve",
          objectType: "GovernanceFlag",
          objectId: id,
          metadata: { action: "start_review", newStatus: flag.status },
        });

        return NextResponse.json({ flag });
      }

      case "resolve": {
        const auth = await requireCapability(req, "governance:flags:resolve");
        if (!auth.ok) return auth.response;

        if (!resolution) {
          return NextResponse.json(
            { error: "Bad Request", message: "resolution is required" },
            { status: 400 }
          );
        }

        const flag = await resolveGovernanceFlag(id, resolution, auth.context.memberId);

        await auditMutation(req, auth.context, {
          action: "UPDATE",
          capability: "governance:flags:resolve",
          objectType: "GovernanceFlag",
          objectId: id,
          metadata: { action: "resolve", newStatus: flag.status },
        });

        return NextResponse.json({ flag });
      }

      case "dismiss": {
        const auth = await requireCapability(req, "governance:flags:resolve");
        if (!auth.ok) return auth.response;

        if (!resolution) {
          return NextResponse.json(
            { error: "Bad Request", message: "resolution is required" },
            { status: 400 }
          );
        }

        const flag = await dismissGovernanceFlag(id, resolution, auth.context.memberId);

        await auditMutation(req, auth.context, {
          action: "UPDATE",
          capability: "governance:flags:resolve",
          objectType: "GovernanceFlag",
          objectId: id,
          metadata: { action: "dismiss", newStatus: flag.status },
        });

        return NextResponse.json({ flag });
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
        { error: "Not Found", message: "Governance flag not found" },
        { status: 404 }
      );
    }
    if (message.includes("Only") || message.includes("already")) {
      return NextResponse.json(
        { error: "Bad Request", message },
        { status: 400 }
      );
    }
    console.error("Error with governance flag action:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to process governance flag action" },
      { status: 500 }
    );
  }
}
