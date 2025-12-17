/**
 * Service History Validation Schemas
 *
 * Zod schemas for validating API request data.
 */

import { z } from "zod";
import { ServiceType, TransitionStatus } from "@prisma/client";

// ============================================================================
// Service History Schemas
// ============================================================================

export const serviceHistoryFiltersSchema = z.object({
  memberId: z.string().uuid().optional(),
  committeeId: z.string().uuid().optional(),
  termId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  serviceType: z.nativeEnum(ServiceType).optional(),
  activeOnly: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  startAfter: z
    .string()
    .datetime()
    .transform((v) => new Date(v))
    .optional(),
  endBefore: z
    .string()
    .datetime()
    .transform((v) => new Date(v))
    .optional(),
});

export const createServiceRecordSchema = z.object({
  memberId: z.string().uuid(),
  serviceType: z.nativeEnum(ServiceType),
  roleTitle: z.string().min(1).max(100),
  committeeId: z.string().uuid().optional(),
  committeeName: z.string().max(100).optional(),
  eventId: z.string().uuid().optional(),
  eventTitle: z.string().max(200).optional(),
  termId: z.string().uuid().optional(),
  termName: z.string().max(100).optional(),
  startAt: z
    .string()
    .datetime()
    .transform((v) => new Date(v)),
  notes: z.string().max(1000).optional(),
  transitionPlanId: z.string().uuid().optional(),
});

export const closeServiceRecordSchema = z.object({
  endAt: z
    .string()
    .datetime()
    .transform((v) => new Date(v)),
});

// ============================================================================
// Transition Plan Schemas
// ============================================================================

export const transitionFiltersSchema = z.object({
  status: z.nativeEnum(TransitionStatus).optional(),
  targetTermId: z.string().uuid().optional(),
});

export const createTransitionPlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  targetTermId: z.string().uuid(),
  effectiveAt: z
    .string()
    .datetime()
    .transform((v) => new Date(v)),
});

export const updateTransitionPlanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  targetTermId: z.string().uuid().optional(),
  effectiveAt: z
    .string()
    .datetime()
    .transform((v) => new Date(v))
    .optional(),
});

export const createAssignmentSchema = z.object({
  memberId: z.string().uuid(),
  serviceType: z.nativeEnum(ServiceType),
  roleTitle: z.string().min(1).max(100),
  committeeId: z.string().uuid().optional(),
  isOutgoing: z.boolean(),
  existingServiceId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export const approvalSchema = z.object({
  role: z.enum(["president", "vp-activities"]),
});

// ============================================================================
// Pagination Schema
// ============================================================================

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(100)),
});

// ============================================================================
// Type Exports
// ============================================================================

export type ServiceHistoryFiltersInput = z.input<
  typeof serviceHistoryFiltersSchema
>;
export type CreateServiceRecordInput = z.infer<
  typeof createServiceRecordSchema
>;
export type CloseServiceRecordInput = z.infer<typeof closeServiceRecordSchema>;

export type TransitionFiltersInput = z.input<typeof transitionFiltersSchema>;
export type CreateTransitionPlanInput = z.infer<
  typeof createTransitionPlanSchema
>;
export type UpdateTransitionPlanInput = z.infer<
  typeof updateTransitionPlanSchema
>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type ApprovalInput = z.infer<typeof approvalSchema>;

export type PaginationInput = z.input<typeof paginationSchema>;
