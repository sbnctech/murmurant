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
  createFlag,
  listFlags,
  getOpenFlagsCounts,
  getOverdueFlags,
} from "@/lib/governance/flags";
import { ReviewFlagType, ReviewFlagStatus } from "@prisma/client";
import type { FlagTargetType } from "@/lib/governance/types";

/**
 * GET /api/v1/officer/governance/flags
 */
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "governance:flags:read");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get("targetType") as FlagTargetType | null;
  const targetId = searchParams.get("targetId");
  const status = searchParams.get("status") as ReviewFlagStatus | null;
  const flagType = searchParams.get("flagType") as ReviewFlagType | null;
  const overdue = searchParams.get("overdue") === "true";
  const countsOnly = searchParams.get("countsOnly") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  try {
    // Return just counts grouped by type
    if (countsOnly) {
      const counts = await getOpenFlagsCounts();
      return NextResponse.json({ counts });
    }

    // Return overdue flags
    if (overdue) {
      const result = await getOverdueFlags({ page, limit });
      return NextResponse.json({
        flags: result.items,
        pagination: result.pagination,
      });
    }

    // Full list with filters
    const result = await listFlags(
      {
        targetType: targetType || undefined,
        targetId: targetId || undefined,
        flagType: flagType || undefined,
        status: status || undefined,
      },
      { page, limit }
    );

    return NextResponse.json({
      flags: result.items,
      pagination: result.pagination,
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
    const { targetType, targetId, flagType, title, notes, dueDate } = body;

    if (!targetType || !targetId || !flagType || !title) {
      return NextResponse.json(
        { error: "Bad Request", message: "targetType, targetId, flagType, and title are required" },
        { status: 400 }
      );
    }

    const validTargetTypes: FlagTargetType[] = ["page", "file", "policy", "event", "bylaw", "minutes", "motion"];
    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json(
        { error: "Bad Request", message: `Invalid targetType. Must be one of: ${validTargetTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const validFlagTypes: ReviewFlagType[] = [
      "INSURANCE_REVIEW",
      "LEGAL_REVIEW",
      "POLICY_REVIEW",
      "COMPLIANCE_CHECK",
      "GENERAL",
    ];
    if (!validFlagTypes.includes(flagType)) {
      return NextResponse.json(
        { error: "Bad Request", message: `Invalid flagType. Must be one of: ${validFlagTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const flag = await createFlag(
      {
        targetType,
        targetId,
        flagType,
        title,
        notes,
        dueDate,
      },
      auth.context.memberId
    );

    await auditMutation(req, auth.context, {
      action: "CREATE",
      capability: "governance:flags:create",
      objectType: "GovernanceReviewFlag",
      objectId: flag.id,
      metadata: { flagType: flag.flagType, title: flag.title, targetType, targetId },
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
