/**
 * Annotation by ID API
 *
 * GET /api/v1/officer/governance/annotations/:id - Get annotation
 * PATCH /api/v1/officer/governance/annotations/:id - Update annotation
 * DELETE /api/v1/officer/governance/annotations/:id - Delete annotation
 * POST /api/v1/officer/governance/annotations/:id - Perform action (publish, unpublish)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import {
  getAnnotationById,
  updateAnnotation,
  deleteAnnotation,
  publishAnnotation,
  unpublishAnnotation,
} from "@/lib/governance/annotations";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/officer/governance/annotations/:id
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "governance:annotations:read");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const annotation = await getAnnotationById(id);

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
  const auth = await requireCapability(req, "governance:annotations:write");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const reqBody = await req.json();
    const { body: annotationBody, anchor, isPublished } = reqBody;

    const annotation = await updateAnnotation(id, {
      body: annotationBody,
      anchor,
      isPublished,
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
  const auth = await requireCapability(req, "governance:annotations:write");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await deleteAnnotation(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found") || message.includes("Record to delete does not exist")) {
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
 * - publish: Make annotation visible to non-governance users
 * - unpublish: Hide annotation from non-governance users
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "governance:annotations:publish");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "publish": {
        const annotation = await publishAnnotation(id);
        return NextResponse.json({ annotation });
      }

      case "unpublish": {
        const annotation = await unpublishAnnotation(id);
        return NextResponse.json({ annotation });
      }

      default:
        return NextResponse.json(
          { error: "Bad Request", message: `Unknown action: ${action}. Valid actions: publish, unpublish` },
          { status: 400 }
        );
    }
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found") || message.includes("Record to update not found")) {
      return NextResponse.json(
        { error: "Not Found", message: "Annotation not found" },
        { status: 404 }
      );
    }
    console.error("Error with annotation action:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to process annotation action" },
      { status: 500 }
    );
  }
}
