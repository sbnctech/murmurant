/**
 * RBAC Module - Centralized Role-Based Access Control for ClubOS
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

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
