/**
 * Service History Types
 *
 * TypeScript interfaces for the service history and transition system.
 */

import { ServiceType, TransitionStatus } from "@prisma/client";

// ============================================================================
// Service History Types
// ============================================================================

export interface ServiceHistoryRecord {
  id: string;
  memberId: string;
  memberName: string;
  serviceType: ServiceType;
  roleTitle: string;
  committeeId: string | null;
  committeeName: string | null;
  eventId: string | null;
  eventTitle: string | null;
  termId: string | null;
  termName: string | null;
  startAt: string; // ISO date
  endAt: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  createdByName: string | null;
}

export interface ServiceHistoryFilters {
  memberId?: string;
  committeeId?: string;
  termId?: string;
  eventId?: string;
  serviceType?: ServiceType;
  activeOnly?: boolean;
  startAfter?: Date;
  endBefore?: Date;
}

export interface CreateServiceRecordInput {
  memberId: string;
  serviceType: ServiceType;
  roleTitle: string;
  committeeId?: string;
  committeeName?: string;
  eventId?: string;
  eventTitle?: string;
  termId?: string;
  termName?: string;
  startAt: Date;
  notes?: string;
  transitionPlanId?: string;
}

// ============================================================================
// Transition Plan Types
// ============================================================================

export interface TransitionPlanSummary {
  id: string;
  name: string;
  description: string | null;
  targetTermId: string;
  targetTermName: string;
  effectiveAt: string; // ISO date
  status: TransitionStatus;
  presidentApproved: boolean;
  presidentApprovedAt: string | null;
  presidentApprovedByName: string | null;
  vpActivitiesApproved: boolean;
  vpActivitiesApprovedAt: string | null;
  vpActivitiesApprovedByName: string | null;
  assignmentCount: number;
  createdAt: string;
}

export interface TransitionPlanDetail extends TransitionPlanSummary {
  appliedAt: string | null;
  appliedByName: string | null;
  createdByName: string | null;
  incomingAssignments: TransitionAssignmentDetail[];
  outgoingAssignments: TransitionAssignmentDetail[];
}

export interface TransitionAssignmentDetail {
  id: string;
  memberId: string;
  memberName: string;
  serviceType: ServiceType;
  roleTitle: string;
  committeeId: string | null;
  committeeName: string | null;
  isOutgoing: boolean;
  existingServiceId: string | null;
  notes: string | null;
}

export interface CreateTransitionPlanInput {
  name: string;
  description?: string;
  targetTermId: string;
  effectiveAt: Date;
}

export interface CreateAssignmentInput {
  memberId: string;
  serviceType: ServiceType;
  roleTitle: string;
  committeeId?: string;
  isOutgoing: boolean;
  existingServiceId?: string;
  notes?: string;
}

// ============================================================================
// Approval Types
// ============================================================================

export type ApproverRole = "president" | "vp-activities";

export interface ApprovalResult {
  success: boolean;
  planId: string;
  approverRole: ApproverRole;
  approvedAt: string;
  fullyApproved: boolean;
}

// ============================================================================
// Scheduler Types
// ============================================================================

export interface ApplyTransitionResult {
  success: boolean;
  planId: string;
  recordsClosed: number;
  recordsCreated: number;
  appliedAt: string;
}

export interface SchedulerResult {
  transitionsApplied: string[];
  transitionErrors: Array<{ planId: string; error: string }>;
  eventHostsClosed: number;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================================================
// Transition Widget Types
// ============================================================================

export type TransitionWidgetRole = "president" | "past-president";

export interface TransitionWidgetData {
  visible: boolean;
  nextTransitionDate: string; // ISO date
  nextTransitionDateFormatted: string; // e.g., "Feb 1, 2026"
  daysRemaining: number;
  termName: string; // e.g., "Summer 2026"
  plan: TransitionWidgetPlanStatus | null;
}

export interface TransitionWidgetPlanStatus {
  id: string;
  name: string;
  status: TransitionStatus;
  presidentApproved: boolean;
  vpActivitiesApproved: boolean;
}

export interface TransitionWidgetContext {
  memberId: string;
  widgetRole: TransitionWidgetRole;
  isPresident: boolean;
  isPastPresident: boolean;
}

export interface TermBoundaries {
  currentTermStart: Date;
  currentTermEnd: Date;
  nextTermStart: Date;
  nextTermEnd: Date;
}
