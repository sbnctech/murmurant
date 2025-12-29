/**
 * RBAC Module - Centralized Role-Based Access Control for Murmurant
 *
 * This module provides centralized access control for Murmurant including:
 * - Event row-level security policies
 * - Admin action guards with audit logging
 * - General-purpose RoleGate for capability checks
 *
 * Usage:
 * ```typescript
 * import { RoleGate, canViewEvent, guardEditEventContent } from "@/lib/rbac";
 *
 * // Request-level capability check
 * const gate = await RoleGate.requireCapability(req, "members:view");
 * if (!gate.allowed) return gate.response;
 *
 * // Event-specific policy check
 * const decision = canViewEvent(actor, eventContext);
 * if (!decision.allowed) return forbidden(decision.reason);
 * ```
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

// Event row-level security policies
export {
  type EventVisibility,
  type EventAction,
  type EventRowContext,
  type PolicyDecision,
  type EventQueryFilter,
  canViewEvent,
  canEditEventContent,
  canEditEventStatus,
  canDeleteEvent,
  canRegisterForEvent,
  getEventQueryFilter,
  filterVisibleEvents,
  EDITABLE_STATES,
  buildEventAuditContext,
} from "./event-row-policy";

// Admin action guards with audit logging
export {
  type GuardResult,
  type GuardContext,
  type GuardOptions,
  type EscalationAttempt,
  guardViewEvent,
  guardEditEventContent,
  guardEditEventStatus,
  guardDeleteEvent,
  guardEventRegistration,
  guardBulkStatusChange,
  canPerformAdminOverride,
  guardAdminOverride,
  logEscalationAttempt,
  detectEscalationPattern,
} from "./admin-action-guard";

// General-purpose RoleGate for capability checks
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
