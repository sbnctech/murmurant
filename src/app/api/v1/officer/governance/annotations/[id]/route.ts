/**
 * Annotation by ID API
 *
 * GET /api/v1/officer/governance/annotations/:id - Get annotation
 * PATCH /api/v1/officer/governance/annotations/:id - Update annotation
 * DELETE /api/v1/officer/governance/annotations/:id - Delete annotation
 * POST /api/v1/officer/governance/annotations/:id - Perform action (resolve, reopen)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import {
  getAnnotation,
  updateAnnotation,
  deleteAnnotation,
  resolveAnnotation,
  reopenAnnotation,
} from "@/lib/governance/annotations";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/officer/governance/annotations/:id
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:motions:read");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const annotation = await getAnnotation(id);

    if (!annotation) {
      return NextResponse.json(
        { error: "Not Found", message: "Annotation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ annotation });
  } catch (error) {
    console.error("Error getting annotation:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to get annotation" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/officer/governance/annotations/:id
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:motions:annotate");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const reqBody = await req.json();
    const { body: annotationBody, severity } = reqBody;

    const annotation = await updateAnnotation(id, {
      body: annotationBody,
      severity,
    });

    return NextResponse.json({ annotation });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found")) {
      return NextResponse.json(
        { error: "Not Found", message: "Annotation not found" },
        { status: 404 }
      );
    }
    if (message.includes("Cannot edit")) {
      return NextResponse.json(
        { error: "Forbidden", message },
        { status: 403 }
      );
    }
    console.error("Error updating annotation:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update annotation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/officer/governance/annotations/:id
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:motions:annotate");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await deleteAnnotation(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found")) {
      return NextResponse.json(
        { error: "Not Found", message: "Annotation not found" },
        { status: 404 }
      );
    }
    console.error("Error deleting annotation:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to delete annotation" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/officer/governance/annotations/:id
 * Perform action on annotation
 *
 * Actions:
 * - resolve: Mark as resolved
 * - reopen: Reopen a resolved annotation
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:motions:annotate");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "resolve": {
        const annotation = await resolveAnnotation(id, auth.context.memberId);
        return NextResponse.json({ annotation });
      }

      case "reopen": {
        const annotation = await reopenAnnotation(id);
        return NextResponse.json({ annotation });
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
        { error: "Not Found", message: "Annotation not found" },
        { status: 404 }
      );
    }
    if (message.includes("already") || message.includes("is not")) {
      return NextResponse.json(
        { error: "Bad Request", message },
        { status: 400 }
      );
    }
    console.error("Error with annotation action:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to process annotation action" },
      { status: 500 }
    );
  }
}
