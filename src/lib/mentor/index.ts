/**
 * Mentor System - Public Exports
 *
 * Charter P7: Observability is a product feature
 *
 * Makes mentor activity visible without surveillance.
 * Enables leadership to answer: "Is mentorship actually working?"
 */

export {
  // Assignment functions
  assignMentor,
  endMentorAssignment,
  // Signal recording
  recordCoRegistration,
  recordCoAttendance,
  recordFirstContact,
  // Dashboard queries
  getMentorDashboardMetrics,
  getRecentSignals,
  getAssignmentsNeedingAttention,
} from "./signals";

export type {
  MentorAssignmentInput,
  SignalSummary,
  MentorDashboardMetrics,
} from "./signals";
