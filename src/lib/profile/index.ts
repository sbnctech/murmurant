/**
 * Profile Module - Member Profile Utilities
 *
 * Provides:
 * - Field allowlist for profile updates (security)
 * - Validation schemas
 * - Profile data transformation
 *
 * Charter Compliance:
 * - P2: Only allowed fields can be updated (allowlist, not blocklist)
 * - P7: All profile changes should be auditable
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { z } from "zod";

// ============================================================================
// EDITABLE FIELDS ALLOWLIST
// Only these fields can be updated by the member themselves.
// Admin-only fields like email, membershipStatusId are NOT in this list.
// ============================================================================

export const PROFILE_EDITABLE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
] as const;

export type ProfileEditableField = (typeof PROFILE_EDITABLE_FIELDS)[number];

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for profile update requests.
 * All fields are optional - members can update just what they want.
 */
export const ProfileUpdateSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be 100 characters or less")
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be 100 characters or less")
    .trim()
    .optional(),
  phone: z
    .string()
    .max(20, "Phone number must be 20 characters or less")
    .trim()
    .nullable()
    .optional(),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

// ============================================================================
// PROFILE RESPONSE TYPES
// ============================================================================

/**
 * Public profile response shape.
 * Includes read-only fields like email, joinedAt, etc.
 * Does NOT include admin-only fields like membershipStatusId.
 */
export interface ProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  joinedAt: string; // ISO date string
  memberSince: string; // Human-readable year
  membershipStatus: {
    code: string;
    label: string;
  };
  membershipTier: {
    code: string;
    name: string;
  } | null;
  updatedAt: string; // ISO date string
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Filter input to only include allowed editable fields.
 * This provides defense-in-depth against mass assignment attacks.
 */
export function filterEditableFields(
  input: Record<string, unknown>
): Partial<ProfileUpdateInput> {
  const filtered: Partial<ProfileUpdateInput> = {};

  for (const field of PROFILE_EDITABLE_FIELDS) {
    if (field in input) {
      (filtered as Record<string, unknown>)[field] = input[field];
    }
  }

  return filtered;
}

/**
 * Extract the year from a date for "Member since" display.
 */
export function getMemberSinceYear(joinedAt: Date): string {
  return joinedAt.getFullYear().toString();
}

/**
 * Transform a Prisma member record to a profile response.
 */
export function toProfileResponse(member: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  joinedAt: Date;
  updatedAt: Date;
  membershipStatus: {
    code: string;
    label: string;
  };
  membershipTier?: {
    code: string;
    name: string;
  } | null;
}): ProfileResponse {
  return {
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
    joinedAt: member.joinedAt.toISOString(),
    memberSince: getMemberSinceYear(member.joinedAt),
    membershipStatus: {
      code: member.membershipStatus.code,
      label: member.membershipStatus.label,
    },
    membershipTier: member.membershipTier
      ? {
          code: member.membershipTier.code,
          name: member.membershipTier.name,
        }
      : null,
    updatedAt: member.updatedAt.toISOString(),
  };
}
