import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiSuccess } from "@/lib/api";
import { evaluateTicketTypeEligibility } from "@/server/eligibility";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/tickets/:id/eligibility
 *
 * Returns eligibility status for a specific ticket type.
 * Requires authentication.
 *
 * Response:
 * {
 *   ticketTypeId: string,
 *   memberId: string | null,
 *   eligibility: {
 *     allowed: boolean,
 *     reasonCode: string,
 *     reasonDetail?: string
 *   }
 * }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: ticketTypeId } = await params;

  // Authenticate request
  const authResult = await requireAuth(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const { memberId } = authResult.context;

  const result = await evaluateTicketTypeEligibility(memberId, ticketTypeId);

  return apiSuccess(result);
}
