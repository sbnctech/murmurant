/**
 * Annotations API
 *
 * GET /api/v1/officer/governance/annotations - List annotations
 * POST /api/v1/officer/governance/annotations - Create annotation
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import {
  createAnnotation,
  listAnnotations,
  getAnnotationCounts,
} from "@/lib/governance/annotations";
import type { AnnotationSeverity } from "@prisma/client";

/**
 * GET /api/v1/officer/governance/annotations
 */
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "meetings:motions:read");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const minutesId = searchParams.get("minutesId");
  const boardRecordId = searchParams.get("boardRecordId");
  const motionId = searchParams.get("motionId");
  const severity = searchParams.get("severity") as AnnotationSeverity | null;
  const resolved = searchParams.get("resolved");
  const countsOnly = searchParams.get("countsOnly") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    // Return just counts
    if (countsOnly) {
      const counts = await getAnnotationCounts({
        minutesId: minutesId || undefined,
        boardRecordId: boardRecordId || undefined,
        motionId: motionId || undefined,
      });
      return NextResponse.json({ counts });
    }

    // Full list
    const result = await listAnnotations({
      minutesId: minutesId || undefined,
      boardRecordId: boardRecordId || undefined,
      motionId: motionId || undefined,
      severity: severity || undefined,
      resolved: resolved === null ? undefined : resolved === "true",
      limit,
      offset,
    });

    return NextResponse.json({
      annotations: result.annotations,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.annotations.length < result.total,
      },
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
  const auth = await requireCapability(req, "meetings:motions:annotate");
  if (!auth.ok) return auth.response;

  try {
    const reqBody = await req.json();
    const { body: annotationBody, severity, minutesId, boardRecordId, motionId } = reqBody;

    if (!annotationBody) {
      return NextResponse.json(
        { error: "Bad Request", message: "body is required" },
        { status: 400 }
      );
    }

    if (!minutesId && !boardRecordId && !motionId) {
      return NextResponse.json(
        { error: "Bad Request", message: "Must specify minutesId, boardRecordId, or motionId" },
        { status: 400 }
      );
    }

    if (severity) {
      const validSeverities: AnnotationSeverity[] = ["INFO", "SUGGESTION", "WARNING", "ERROR"];
      if (!validSeverities.includes(severity)) {
        return NextResponse.json(
          { error: "Bad Request", message: `Invalid severity. Must be one of: ${validSeverities.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const annotation = await createAnnotation({
      body: annotationBody,
      severity,
      minutesId,
      boardRecordId,
      motionId,
      createdById: auth.context.memberId,
    });

    return NextResponse.json({ annotation }, { status: 201 });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("must be attached")) {
      return NextResponse.json(
        { error: "Bad Request", message },
        { status: 400 }
      );
    }
    console.error("Error creating annotation:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to create annotation" },
      { status: 500 }
    );
  }
}
