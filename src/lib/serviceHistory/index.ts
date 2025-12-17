/**
 * Service History Module
 *
 * Public exports for the service history and transition management system.
 */

// Types
export type {
  ServiceHistoryRecord,
  ServiceHistoryFilters,
  CreateServiceRecordInput,
  TransitionPlanSummary,
  TransitionPlanDetail,
  TransitionAssignmentDetail,
  CreateTransitionPlanInput,
  CreateAssignmentInput,
  ApproverRole,
  ApprovalResult,
  ApplyTransitionResult,
  SchedulerResult,
  PaginationParams,
  PaginatedResult,
  TransitionWidgetRole,
  TransitionWidgetData,
  TransitionWidgetPlanStatus,
  TransitionWidgetContext,
  TermBoundaries,
} from "./types";

// Service History Operations
export {
  getServiceHistory,
  getMemberServiceHistory,
  getActiveRoles,
  getServiceHistoryById,
  createServiceRecord,
  closeServiceRecord,
  hasActiveService,
  getServiceCounts,
} from "./serviceHistory";

// Transition Operations
export {
  createTransitionPlan,
  getTransitionPlan,
  listTransitionPlans,
  updateTransitionPlan,
  deleteTransitionPlan,
  addAssignment,
  removeAssignment,
  detectOutgoingAssignments,
  submitForApproval,
  cancelTransitionPlan,
  applyTransition,
  getDueTransitions,
} from "./transitions";

// Approval Workflow
export {
  canApprove,
  recordApproval,
  isFullyApproved,
  getApprovalStatus,
  revokeApproval,
} from "./approvals";

// Event Host Service
export {
  createEventHostService,
  closeCompletedEventHostServices,
  getActiveEventHostServices,
  closeEventHostService,
} from "./eventHostService";

// Scheduler
export {
  processScheduledOperations,
  getUpcomingTransitionDates,
  isTransitionDate,
  getNextTransitionDate,
  validateTransitionDate,
} from "./scheduler";

// Validation Schemas
export {
  serviceHistoryFiltersSchema,
  createServiceRecordSchema,
  closeServiceRecordSchema,
  transitionFiltersSchema,
  createTransitionPlanSchema,
  updateTransitionPlanSchema,
  createAssignmentSchema,
  approvalSchema,
  paginationSchema,
} from "./validation";

// Transition Widget
export {
  getTransitionLeadDays,
  getTransitionWidgetContext,
  getTransitionWidgetData,
  getTransitionWidgetDataWithContext,
  calculateShowAtDate,
  calculateDaysRemaining,
  getTermNameForTransition,
  isWidgetVisible,
  getTermBoundaries,
  isWithinLeadWindow,
} from "./transitionWidget";
