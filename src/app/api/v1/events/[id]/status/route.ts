/**
 * Event Status Action API
 *
 * POST /api/v1/events/:id/status - Perform workflow action on an event
 *
 * Actions:
 * - approve: Move from PENDING_APPROVAL to APPROVED (VP/Admin only)
 * - request_changes: Move from PENDING_APPROVAL to CHANGES_REQUESTED (VP/Admin only)
 * - publish: Move from APPROVED to PUBLISHED (VP/Admin only)
 * - cancel: Move any cancelable state to CANCELED (VP/Admin only)
 * - submit: Move from DRAFT/CHANGES_REQUESTED to PENDING_APPROVAL (Chair/VP/Admin)
 *
 * Charter Compliance:
 * - P1: Identity via session auth
 * - P2: Default deny authorization
 * - P3: Explicit state machine transitions
 * - P5: Approval chain enforced
 * - P7: Audit logging for all transitions
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  submitForApproval,
  approveEvent,
  requestChanges,
  publishEvent,
  cancelEvent,
  TransitionResult,
} from "@/lib/events/status";

// Validate UUID format
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ActionRequest = {
  action: "approve" | "request_changes" | "publish" | "cancel" | "submit";
  note?: string;
};

/**
 * POST /api/v1/events/:id/status
 *
 * Perform a workflow action on an event.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  // Validate UUID format
  if (!uuidRegex.test(eventId)) {
    return NextResponse.json(
      { error: "Not Found", message: "Event not found" },
      { status: 404 }
    );
  }

  // Authenticate user
  const auth = await requireAuth(req);
  if (!auth.ok) {
    return auth.response;
  }

  // Parse request body
  let body: ActionRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate action
  const validActions = ["approve", "request_changes", "publish", "cancel", "submit"];
  if (!body.action || !validActions.includes(body.action)) {
    return NextResponse.json(
      {
        error: "Bad Request",
        message: `Invalid action. Must be one of: ${validActions.join(", ")}`,
      },
      { status: 400 }
    );
  }

  // Execute the appropriate transition
  const transitionParams = {
    eventId,
    actor: auth.context,
    req,
    note: body.note,
  };

  let result: TransitionResult;

  switch (body.action) {
    case "submit":
      result = await submitForApproval(transitionParams);
      break;
    case "approve":
      result = await approveEvent(transitionParams);
      break;
    case "request_changes":
      result = await requestChanges(transitionParams);
      break;
    case "publish":
      result = await publishEvent(transitionParams);
      break;
    case "cancel":
      result = await cancelEvent(transitionParams);
      break;
    default:
      return NextResponse.json(
        { error: "Bad Request", message: "Unknown action" },
        { status: 400 }
      );
  }

  // Handle result
  if (!result.ok) {
    const statusCode =
      result.code === "NOT_FOUND"
        ? 404
        : result.code === "FORBIDDEN"
          ? 403
          : 400;

    return NextResponse.json(
      {
        error: result.code === "NOT_FOUND" ? "Not Found" :
               result.code === "FORBIDDEN" ? "Forbidden" : "Bad Request",
        message: result.error,
        code: result.code,
      },
      { status: statusCode }
    );
  }

  // Success response
  return NextResponse.json({
    success: true,
    event: {
      id: result.event.id,
      title: result.event.title,
      status: result.event.status,
      submittedAt: result.event.submittedAt?.toISOString() ?? null,
      approvedAt: result.event.approvedAt?.toISOString() ?? null,
      publishedAt: result.event.publishedAt?.toISOString() ?? null,
      canceledAt: result.event.canceledAt?.toISOString() ?? null,
      changesRequestedAt: result.event.changesRequestedAt?.toISOString() ?? null,
    },
    message: getSuccessMessage(body.action),
  });
}

/**
 * Get user-friendly success message for action
 */
function getSuccessMessage(action: ActionRequest["action"]): string {
  switch (action) {
    case "submit":
      return "Event submitted for approval";
    case "approve":
      return "Event approved";
    case "request_changes":
      return "Changes requested";
    case "publish":
      return "Event published";
    case "cancel":
      return "Event canceled";
  }
}
