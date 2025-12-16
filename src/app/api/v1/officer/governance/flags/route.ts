/**
 * Governance Flags API
 *
 * GET /api/v1/officer/governance/flags - List flags
 * POST /api/v1/officer/governance/flags - Create flag
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { auditMutation } from "@/lib/audit";
import {
  createGovernanceFlag,
  listGovernanceFlags,
} from "@/lib/governance/flags";
import type { GovernanceFlagType, GovernanceFlagStatus } from "@prisma/client";

/**
 * GET /api/v1/officer/governance/flags
 */
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "meetings:motions:read");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as GovernanceFlagStatus | null;
  const flagType = searchParams.get("flagType") as GovernanceFlagType | null;
  const minutesId = searchParams.get("minutesId");
  const boardRecordId = searchParams.get("boardRecordId");
  const motionId = searchParams.get("motionId");
  const search = searchParams.get("search");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const result = await listGovernanceFlags({
      status: status || undefined,
      flagType: flagType || undefined,
      minutesId: minutesId || undefined,
      boardRecordId: boardRecordId || undefined,
      motionId: motionId || undefined,
      search: search || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      flags: result.flags,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.flags.length < result.total,
      },
    });
  } catch (error) {
    console.error("Error listing governance flags:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to list governance flags" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/officer/governance/flags
 */
export async function POST(req: NextRequest) {
  const auth = await requireCapability(req, "governance:flags:create");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { flagType, title, description, minutesId, boardRecordId, motionId } = body;

    if (!flagType || !title || !description) {
      return NextResponse.json(
        { error: "Bad Request", message: "flagType, title, and description are required" },
        { status: 400 }
      );
    }

    const validTypes: GovernanceFlagType[] = [
      "RULES_QUESTION",
      "BYLAWS_CHECK",
      "INSURANCE_REVIEW",
      "LEGAL_REVIEW",
      "OTHER",
    ];
    if (!validTypes.includes(flagType)) {
      return NextResponse.json(
        { error: "Bad Request", message: `Invalid flagType. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const flag = await createGovernanceFlag({
      flagType,
      title,
      description,
      minutesId,
      boardRecordId,
      motionId,
      createdById: auth.context.memberId,
    });

    await auditMutation(req, auth.context, {
      action: "CREATE",
      capability: "governance:flags:create",
      objectType: "GovernanceFlag",
      objectId: flag.id,
      metadata: { flagType: flag.flagType, title: flag.title },
    });

    return NextResponse.json({ flag }, { status: 201 });
  } catch (error) {
    console.error("Error creating governance flag:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to create governance flag" },
      { status: 500 }
    );
  }
}
