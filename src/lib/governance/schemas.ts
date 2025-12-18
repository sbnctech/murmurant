/**
 * Zod schemas for Governance system validation
 *
 * Copyright (c) Santa Barbara Newcomers Club
 *
 * Charter Principles:
 * - P3: Explicit state machine for minutes workflow
 * - P9: Validation before execution (fail closed)
 */

import { z } from "zod";

// ============================================================================
// Meeting Schemas
// ============================================================================

export const meetingTypeSchema = z.enum(["BOARD", "EXECUTIVE", "SPECIAL", "ANNUAL"]);

export const createMeetingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  type: meetingTypeSchema,
  title: z.string().min(1).max(200).optional(),
  location: z.string().max(200).optional(),
  attendanceCount: z.number().int().min(0).optional(),
  quorumMet: z.boolean().optional(),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  location: z.string().max(200).optional(),
  attendanceCount: z.number().int().min(0).optional(),
  quorumMet: z.boolean().optional(),
});

// ============================================================================
// Minutes Schemas
// ============================================================================

export const minutesStatusSchema = z.enum([
  "DRAFT",
  "SUBMITTED",
  "REVISED",
  "APPROVED",
  "PUBLISHED",
  "ARCHIVED",
]);

export const createMinutesSchema = z.object({
  meetingId: z.string().uuid(),
  content: z.record(z.string(), z.unknown()), // JSON content
  summary: z.string().max(2000).optional(),
});

export const updateMinutesSchema = z.object({
  content: z.record(z.string(), z.unknown()).optional(),
  summary: z.string().max(2000).optional(),
});

// Submit minutes for review (Secretary -> President)
export const submitMinutesSchema = z.object({
  minutesId: z.string().uuid(),
});

// President review actions
export const reviewMinutesSchema = z.object({
  minutesId: z.string().uuid(),
  action: z.enum(["approve", "revise"]),
  reviewNotes: z.string().max(2000).optional(),
});

// Publish approved minutes
export const publishMinutesSchema = z.object({
  minutesId: z.string().uuid(),
});

// ============================================================================
// Motion Schemas
// ============================================================================

export const motionResultSchema = z.enum(["PASSED", "FAILED", "TABLED", "WITHDRAWN"]);

export const createMotionSchema = z.object({
  meetingId: z.string().uuid(),
  motionText: z.string().min(1).max(5000),
  movedById: z.string().uuid().optional(),
  secondedById: z.string().uuid().optional(),
});

export const updateMotionSchema = z.object({
  motionText: z.string().min(1).max(5000).optional(),
  movedById: z.string().uuid().nullable().optional(),
  secondedById: z.string().uuid().nullable().optional(),
  votesYes: z.number().int().min(0).optional(),
  votesNo: z.number().int().min(0).optional(),
  votesAbstain: z.number().int().min(0).optional(),
  result: motionResultSchema.nullable().optional(),
  resultNotes: z.string().max(1000).nullable().optional(),
});

export const recordVoteSchema = z.object({
  motionId: z.string().uuid(),
  votesYes: z.number().int().min(0),
  votesNo: z.number().int().min(0),
  votesAbstain: z.number().int().min(0),
  result: motionResultSchema,
  resultNotes: z.string().max(1000).optional(),
});

// ============================================================================
// Annotation Schemas
// ============================================================================

export const annotationTargetTypeSchema = z.enum([
  "motion",
  "bylaw",
  "policy",
  "page",
  "file",
]);

export const createAnnotationSchema = z.object({
  targetType: annotationTargetTypeSchema,
  targetId: z.string().uuid(),
  motionId: z.string().uuid().optional(), // Direct relation if targeting a motion
  anchor: z.string().max(500).optional(),
  body: z.string().min(1).max(10000),
  isPublished: z.boolean().optional(),
});

export const updateAnnotationSchema = z.object({
  anchor: z.string().max(500).nullable().optional(),
  body: z.string().min(1).max(10000).optional(),
  isPublished: z.boolean().optional(),
});

// ============================================================================
// Review Flag Schemas
// ============================================================================

export const reviewFlagTypeSchema = z.enum([
  "INSURANCE_REVIEW",
  "LEGAL_REVIEW",
  "POLICY_REVIEW",
  "COMPLIANCE_CHECK",
  "GENERAL",
]);

export const reviewFlagStatusSchema = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "DISMISSED",
]);

export const flagTargetTypeSchema = z.enum([
  "page",
  "file",
  "policy",
  "event",
  "bylaw",
  "minutes",
  "motion",
]);

export const createFlagSchema = z.object({
  targetType: flagTargetTypeSchema,
  targetId: z.string().uuid(),
  flagType: reviewFlagTypeSchema,
  title: z.string().min(1).max(200),
  notes: z.string().max(5000).optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateFlagSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  notes: z.string().max(5000).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  status: reviewFlagStatusSchema.optional(),
});

export const resolveFlagSchema = z.object({
  flagId: z.string().uuid(),
  resolution: z.string().min(1).max(5000),
  status: z.enum(["RESOLVED", "DISMISSED"]),
});

// ============================================================================
// Query Schemas
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const meetingFiltersSchema = z.object({
  type: meetingTypeSchema.optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const minutesFiltersSchema = z.object({
  meetingId: z.string().uuid().optional(),
  status: minutesStatusSchema.optional(),
});

export const flagFiltersSchema = z.object({
  targetType: flagTargetTypeSchema.optional(),
  targetId: z.string().uuid().optional(),
  flagType: reviewFlagTypeSchema.optional(),
  status: reviewFlagStatusSchema.optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
export type CreateMinutesInput = z.infer<typeof createMinutesSchema>;
export type UpdateMinutesInput = z.infer<typeof updateMinutesSchema>;
export type ReviewMinutesInput = z.infer<typeof reviewMinutesSchema>;
export type CreateMotionInput = z.infer<typeof createMotionSchema>;
export type UpdateMotionInput = z.infer<typeof updateMotionSchema>;
export type RecordVoteInput = z.infer<typeof recordVoteSchema>;
export type CreateAnnotationInput = z.infer<typeof createAnnotationSchema>;
export type UpdateAnnotationInput = z.infer<typeof updateAnnotationSchema>;
export type CreateFlagInput = z.infer<typeof createFlagSchema>;
export type UpdateFlagInput = z.infer<typeof updateFlagSchema>;
export type ResolveFlagInput = z.infer<typeof resolveFlagSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
