/**
 * RBAC Module - Role-Based Access Control
 *
 * This module provides centralized access control for ClubOS.
 *
 * Usage:
 * ```typescript
 * import { RoleGate } from "@/lib/rbac";
 *
 * export async function GET(req: NextRequest) {
 *   const gate = await RoleGate.requireCapability(req, "members:view");
 *   if (!gate.allowed) return gate.response;
 *
 *   // Authorized - proceed with request
 *   const { context } = gate;
 *   // ...
 * }
 * ```
 */

export {
  RoleGate,
  gateRequireAuth,
  gateRequireCapability,
  gateRequireCapabilitySafe,
  gateRequireAdmin,
  gateRequireAnyCapability,
  verifyAdminOnlyCapabilities,
  verifyFinanceIsolation,
  verifyWebmasterRestrictions,
  verifyAllInvariants,
  ADMIN_ONLY_CAPABILITIES,
  FINANCE_DENIED_ROLES,
  WEBMASTER_DENIED_CAPABILITIES,
  type GateResult,
} from "./role-gate";

export { default } from "./role-gate";
