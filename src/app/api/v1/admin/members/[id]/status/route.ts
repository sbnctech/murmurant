import { NextRequest } from "next/server";
import { errors } from "@/lib/api";
import { requireCapabilityWithScope } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/v1/admin/members/:id/status
 *
 * Updates a member's status (ACTIVE, INACTIVE, SUSPENDED, PENDING).
 *
 * Charter P1/P2: Require members:view capability with explicit object scope.
 * Request body: MemberStatusUpdateRequest
 * {
 *   "status": "INACTIVE",
 *   "reason": "Membership lapsed",
 *   "notify": true
 * }
 *
 * Response: MemberStatusUpdateResponse (see docs/api/dtos/member.md)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Charter P2: Object-scoped authorization with explicit memberId scope
  // TODO: Consider adding members:manage capability for status updates
  const auth = await requireCapabilityWithScope(request, "members:view", { memberId: id });
  if (!auth.ok) return auth.response;

  // TODO: Wire - Implement member status update
  // 1. Access validated above via requireCapabilityWithScope
  // 2. Parse and validate request body (status, reason, notify)
  // 3. Check for CONFLICT if member already has requested status
  // 4. Update member status
  // 5. Record in history
  // 6. Send notification if notify === true
  // 7. Return MemberStatusUpdateResponse

  return errors.internal(`PATCH /api/v1/admin/members/${id}/status not implemented`);
}
