/**
 * Governance System Library
 *
 * Copyright (c) Santa Barbara Newcomers Club
 *
 * This module provides CRUD operations and workflow management for:
 * - Board meetings
 * - Meeting minutes with approval workflow
 * - Motions and voting records
 * - Annotations on governance documents
 * - Review flags for compliance tracking
 *
 * Charter Principles:
 * - P1: Identity provable (all actions tracked by actor)
 * - P3: Explicit state machine for minutes workflow
 * - P5: Published minutes immutable (versioning)
 * - P7: Full audit trail
 */

// Schemas and types
export * from "./schemas";
export * from "./types";

// Meetings
export {
  createMeeting,
  getMeetingById,
  listMeetings,
  updateMeeting,
  deleteMeeting,
  meetingExists,
} from "./meetings";

// Minutes (with status machine)
export {
  // Status machine helpers
  MINUTES_STATUS_TRANSITIONS,
  SECRETARY_EDITABLE_STATUSES,
  isValidStatusTransition,
  getStatusDescription,
  // CRUD
  createMinutes,
  getMinutesById,
  listMinutes,
  updateMinutes,
  deleteMinutes,
  // Workflow actions
  submitMinutes,
  approveMinutes,
  requestRevision,
  publishMinutes,
  archiveMinutes,
  createMinutesRevision,
} from "./minutes";

// Motions
export {
  createMotion,
  getMotionById,
  listMotionsByMeeting,
  listMotions,
  updateMotion,
  recordVote,
  deleteMotion,
  getMeetingMotionStats,
} from "./motions";

// Annotations
export {
  createAnnotation,
  getAnnotationById,
  listAnnotationsByTarget,
  listAnnotationsByMotion,
  listAnnotations,
  updateAnnotation,
  publishAnnotation,
  unpublishAnnotation,
  deleteAnnotation,
  annotationExists,
  getAnnotationCounts,
} from "./annotations";
export type { AnnotationTargetType } from "./annotations";

// Review Flags
export {
  createFlag,
  getFlagById,
  listFlagsByTarget,
  listFlags,
  getOpenFlagsCounts,
  getOverdueFlags,
  updateFlag,
  startFlag,
  resolveFlag,
  reopenFlag,
  deleteFlag,
  // Compatibility aliases for existing routes
  createGovernanceFlag,
  listGovernanceFlags,
} from "./flags";
export type { FlagTargetType } from "./flags";
