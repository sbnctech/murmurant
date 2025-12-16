/**
 * Rules Guidance by ID API
 *
 * GET /api/v1/officer/governance/rules-guidance/:id - Get guidance
 * PATCH /api/v1/officer/governance/rules-guidance/:id - Update guidance
 * DELETE /api/v1/officer/governance/rules-guidance/:id - Delete guidance
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import {
  getRulesGuidance,
  updateRulesGuidance,
  deleteRulesGuidance,
} from "@/lib/governance/rulesGuidance";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/officer/governance/rules-guidance/:id
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:motions:read");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const guidance = await getRulesGuidance(id);

    if (!guidance) {
      return NextResponse.json(
        { error: "Not Found", message: "Rules guidance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ guidance });
  } catch (error) {
    console.error("Error getting rules guidance:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to get rules guidance" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/officer/governance/rules-guidance/:id
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "governance:rules:manage");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await req.json();
    const { title, category, content, tags, isPublished } = body;

    const guidance = await updateRulesGuidance(id, {
      title,
      category,
      content,
      tags,
      isPublished,
      updatedById: auth.context.memberId,
    });

    return NextResponse.json({ guidance });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found")) {
      return NextResponse.json(
        { error: "Not Found", message: "Rules guidance not found" },
        { status: 404 }
      );
    }
    console.error("Error updating rules guidance:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update rules guidance" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/officer/governance/rules-guidance/:id
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "governance:rules:manage");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await deleteRulesGuidance(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found")) {
      return NextResponse.json(
        { error: "Not Found", message: "Rules guidance not found" },
        { status: 404 }
      );
    }
    console.error("Error deleting rules guidance:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to delete rules guidance" },
      { status: 500 }
    );
  }
}
