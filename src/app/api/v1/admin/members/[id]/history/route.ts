import { NextRequest } from "next/server";
import { errors } from "@/lib/api";
import { requireCapabilityWithScope } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/admin/members/:id/history
 *
 * Retrieves the activity history for a specific member.
 *
 * Charter P1/P2: Require members:history capability with explicit object scope.
 * Query params: limit, type
 *
 * Response: MemberHistoryResponse (see docs/api/dtos/member.md)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Charter P2: Object-scoped authorization with explicit memberId scope
  const auth = await requireCapabilityWithScope(request, "members:history", { memberId: id });
  if (!auth.ok) return auth.response;

  // TODO: Wire - Implement member history
  // 1. Access validated above via requireCapabilityWithScope
  // 2. Parse query params (limit, type)
  // 3. Query history entries for member
  // 4. Return MemberHistoryResponse

  return errors.internal(`GET /api/v1/admin/members/${id}/history not implemented`);
}
