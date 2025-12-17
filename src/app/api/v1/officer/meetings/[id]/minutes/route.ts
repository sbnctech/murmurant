/**
 * Minutes API for a Meeting
 *
 * GET /api/v1/officer/meetings/:id/minutes - Get minutes for meeting
 * POST /api/v1/officer/meetings/:id/minutes - Create minutes
 * PATCH /api/v1/officer/meetings/:id/minutes - Update minutes
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability, hasCapability } from "@/lib/auth";
import {
  createMinutes,
  getMinutesByMeeting,
  updateMinutes,
  submitMinutesForReview,
  reviewMinutes,
  reviseMinutes,
  finalizeMinutes,
  requestMinutesPublish,
  publishMinutes,
} from "@/lib/meetings/minutes";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/officer/meetings/:id/minutes
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "meetings:read");
  if (!auth.ok) return auth.response;
  const { id: meetingId } = await params;
  try {
    const minutes = await getMinutesByMeeting(meetingId);

    if (!minutes) {
      return NextResponse.json(
        { error: "Not Found", message: "Minutes not found for this meeting" },
        { status: 404 }
      );
    }

    // Check if user can view all statuses
    const canViewAll = hasCapability(auth.context.globalRole, "meetings:minutes:read_all");
    if (!canViewAll && minutes.status !== "PUBLISHED") {
      // Non-privileged users can only see published minutes
      return NextResponse.json(
        { error: "Forbidden", message: "Minutes are not yet published" },
        { status: 403 }
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
 * POST /api/v1/officer/meetings/:id/minutes
 * Create or perform action on minutes
 *
 * Actions:
 * - create (default): Create new minutes draft
 * - submit: Submit for review
 * - review: Mark as reviewed (President)
 * - revise: Revise after review
 * - finalize: Mark as final
 * - request_publish: Request publish
 * - publish: Publish (Publisher role)
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const body = await req.json();
    const { id: meetingId } = await params;
    const { action = "create", ...data } = body;

    switch (action) {
      case "create": {
        const auth = await requireCapability(req, "meetings:minutes:draft:create");
        if (!auth.ok) return auth.response;
        if (!data.content) {
          return NextResponse.json(
            { error: "Bad Request", message: "content is required" },
            { status: 400 }
          );
        }

        const minutes = await createMinutes({
          meetingId,
          content: data.content,
          summary: data.summary,
          createdById: auth.context.memberId,
        });

        return NextResponse.json({ minutes }, { status: 201 });
      }

      case "submit": {
        const auth = await requireCapability(req, "meetings:minutes:draft:submit");
        if (!auth.ok) return auth.response;
        if (!data.minutesId || !data.submittedToId) {
          return NextResponse.json(
            { error: "Bad Request", message: "minutesId and submittedToId are required" },
            { status: 400 }
          );
        }

        const minutes = await submitMinutesForReview(
          data.minutesId,
          data.submittedToId,
          auth.context.memberId
        );

        return NextResponse.json({ minutes });
      }

      case "review": {
        // President reviews - need to check they're the submittedTo
        const auth = await requireCapability(req, "meetings:minutes:read_all");
        if (!auth.ok) return auth.response;
        if (!data.minutesId) {
          return NextResponse.json(
            { error: "Bad Request", message: "minutesId is required" },
            { status: 400 }
          );
        }

        const minutes = await reviewMinutes(
          data.minutesId,
          data.reviewNotes || null,
          auth.context.memberId
        );

        return NextResponse.json({ minutes });
      }

      case "revise": {
        const auth = await requireCapability(req, "meetings:minutes:revise");
        if (!auth.ok) return auth.response;
        if (!data.minutesId || !data.content) {
          return NextResponse.json(
            { error: "Bad Request", message: "minutesId and content are required" },
            { status: 400 }
          );
        }

        const minutes = await reviseMinutes(
          data.minutesId,
          data.content,
          data.summary,
          auth.context.memberId
        );

        return NextResponse.json({ minutes });
      }

      case "finalize": {
        const auth = await requireCapability(req, "meetings:minutes:finalize");
        if (!auth.ok) return auth.response;
        if (!data.minutesId) {
          return NextResponse.json(
            { error: "Bad Request", message: "minutesId is required" },
            { status: 400 }
          );
        }

        const minutes = await finalizeMinutes(data.minutesId, auth.context.memberId);

        return NextResponse.json({ minutes });
      }

      case "request_publish": {
        const auth = await requireCapability(req, "content:board:request_publish");
        if (!auth.ok) return auth.response;
        if (!data.minutesId) {
          return NextResponse.json(
            { error: "Bad Request", message: "minutesId is required" },
            { status: 400 }
          );
        }

        const minutes = await requestMinutesPublish(data.minutesId, auth.context.memberId);

        return NextResponse.json({ minutes });
      }

      case "publish": {
        const auth = await requireCapability(req, "content:board:publish");
        if (!auth.ok) return auth.response;
        if (!data.minutesId) {
          return NextResponse.json(
            { error: "Bad Request", message: "minutesId is required" },
            { status: 400 }
          );
        }

        const minutes = await publishMinutes(
          data.minutesId,
          auth.context.memberId,
          data.publishedUrl
        );

        return NextResponse.json({ minutes });
      }

      default:
        return NextResponse.json(
          { error: "Bad Request", message: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("already exist")) {
      return NextResponse.json(
        { error: "Conflict", message },
        { status: 409 }
      );
    }
    if (message.includes("Cannot") || message.includes("Only")) {
      return NextResponse.json(
        { error: "Bad Request", message },
        { status: 400 }
      );
    }
    console.error("Error with minutes:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to process minutes request" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/officer/meetings/:id/minutes
 * Update minutes content
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {  
  
  const auth = await requireCapability(req, "meetings:minutes:draft:edit");
  if (!auth.ok) return auth.response;
  await params;
  try {
    const body = await req.json();
    const { minutesId, content, summary } = body;

    if (!minutesId) {
      return NextResponse.json(
        { error: "Bad Request", message: "minutesId is required" },
        { status: 400 }
      );
    }

    const minutes = await updateMinutes(minutesId, {
      content,
      summary,
      updatedById: auth.context.memberId,
    });

    return NextResponse.json({ minutes });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("Cannot edit")) {
      return NextResponse.json(
        { error: "Forbidden", message },
        { status: 403 }
      );
    }
    console.error("Error updating minutes:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update minutes" },
      { status: 500 }
    );
  }
}
