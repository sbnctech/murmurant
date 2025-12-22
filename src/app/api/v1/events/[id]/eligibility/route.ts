import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiSuccess } from "@/lib/api";
import { evaluateEventEligibility } from "@/server/eligibility";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/events/:id/eligibility
 *
 * Returns eligibility status for all ticket types for an event.
 * Requires authentication.
 *
 * Response:
 * {
 *   eventId: string,
 *   memberId: string | null,
 *   ticketTypes: Array<{
 *     id: string,
 *     code: string,
 *     name: string,
 *     eligibility: {
 *       allowed: boolean,
 *       reasonCode: string,
 *       reasonDetail?: string
 *     }
 *   }>
 * }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: eventId } = await params;

  // Authenticate request
  const authResult = await requireAuth(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const { memberId } = authResult.context;

  const result = await evaluateEventEligibility(memberId, eventId);

  return apiSuccess(result);
}
