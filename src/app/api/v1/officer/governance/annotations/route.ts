/**
 * Annotations API
 *
 * GET /api/v1/officer/governance/annotations - List annotations
 * POST /api/v1/officer/governance/annotations - Create annotation
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { auditMutation } from "@/lib/audit";
import {
  createAnnotation,
  listAnnotations,
  listAnnotationsByMotion,
  getAnnotationCounts,
} from "@/lib/governance/annotations";
import type { AnnotationTargetType } from "@/lib/governance/types";

/**
 * GET /api/v1/officer/governance/annotations
 */
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "governance:annotations:read");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get("targetType") as AnnotationTargetType | null;
  const targetId = searchParams.get("targetId");
  const motionId = searchParams.get("motionId");
  const isPublished = searchParams.get("isPublished");
  const countsOnly = searchParams.get("countsOnly") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  try {
    // Return just counts
    if (countsOnly) {
      const counts = await getAnnotationCounts({
        targetType: targetType || undefined,
        targetId: targetId || undefined,
        motionId: motionId || undefined,
      });
      return NextResponse.json({ counts });
    }

    // If filtering by motion specifically
    if (motionId && !targetType) {
      const result = await listAnnotationsByMotion(motionId, {
        includeUnpublished: true,
        pagination: { page, limit },
      });
      return NextResponse.json({
        annotations: result.items,
        pagination: result.pagination,
      });
    }

    // Full list with filters
    const result = await listAnnotations(
      {
        targetType: targetType || undefined,
        targetId: targetId || undefined,
        motionId: motionId || undefined,
        isPublished: isPublished === null ? undefined : isPublished === "true",
      },
      { page, limit }
    );

    return NextResponse.json({
      annotations: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error listing annotations:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to list annotations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/officer/governance/annotations
 */
export async function POST(req: NextRequest) {
  const auth = await requireCapability(req, "governance:annotations:write");
  if (!auth.ok) return auth.response;

  try {
    const reqBody = await req.json();
    const { body: annotationBody, targetType, targetId, motionId, anchor, isPublished } = reqBody;

    if (!annotationBody) {
      return NextResponse.json(
        { error: "Bad Request", message: "body is required" },
        { status: 400 }
      );
    }

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: "Bad Request", message: "targetType and targetId are required" },
        { status: 400 }
      );
    }

    const validTargetTypes: AnnotationTargetType[] = ["motion", "bylaw", "policy", "page", "file", "minutes"];
    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json(
        { error: "Bad Request", message: `Invalid targetType. Must be one of: ${validTargetTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const annotation = await createAnnotation(
      {
        targetType,
        targetId,
        motionId,
        anchor,
        body: annotationBody,
        isPublished: isPublished ?? false,
      },
      auth.context.memberId
    );

    await auditMutation(req, auth.context, {
      action: "CREATE",
      capability: "governance:annotations:write",
      objectType: "GovernanceAnnotation",
      objectId: annotation.id,
      metadata: { targetType, targetId },
    });

    return NextResponse.json({ annotation }, { status: 201 });
  } catch (error) {
    console.error("Error creating annotation:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to create annotation" },
      { status: 500 }
    );
  }
}
