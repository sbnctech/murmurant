import { NextRequest } from "next/server";
import { errors } from "@/lib/api";
import { requireCapabilityWithScope } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/admin/registrations/:id
 *
 * Retrieves detailed information about a specific registration.
 *
 * Charter P1/P2: Require registrations:view capability with explicit object scope.
 * Response: RegistrationDetailResponse (see docs/api/dtos/registration.md)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Charter P2: Object-scoped authorization with explicit registrationId scope
  const auth = await requireCapabilityWithScope(request, "registrations:view", { registrationId: id });
  if (!auth.ok) return auth.response;

  // TODO: Wire - Implement registration detail
  // 1. Access validated above via requireCapabilityWithScope
  // 2. Query registration by ID with member and event details
  // 3. Query registration history
  // 4. Return RegistrationDetailResponse

  return errors.internal(`GET /api/v1/admin/registrations/${id} not implemented`);
}

/**
 * DELETE /api/v1/admin/registrations/:id
 *
 * Cancels a registration.
 *
 * Charter P1/P2: Require registrations:view capability with explicit object scope.
 * Request body: CancelRegistrationRequest
 * {
 *   "reason": "Member requested cancellation",
 *   "notify": true,
 *   "refund": false
 * }
 *
 * Response: CancelRegistrationResponse (see docs/api/dtos/registration.md)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Charter P2: Object-scoped authorization with explicit registrationId scope
  // TODO: Consider adding registrations:manage capability for cancellations
  const auth = await requireCapabilityWithScope(request, "registrations:view", { registrationId: id });
  if (!auth.ok) return auth.response;

  // TODO: Wire - Implement registration cancellation
  // 1. Access validated above via requireCapabilityWithScope
  // 2. Query registration by ID
  // 3. Validate registration is not already CANCELLED
  // 4. Update registration status to CANCELLED
  // 5. If was REGISTERED: increment event spotsAvailable
  // 6. If notify: send notification to member
  // 7. If refund and paymentStatus === 'paid': initiate refund
  // 8. NO automatic waitlist promotion (v1 manual only)
  // 9. Return CancelRegistrationResponse

  return errors.internal(`DELETE /api/v1/admin/registrations/${id} not implemented`);
}
