/**
 * GET /api/v1/me/profile
 * PATCH /api/v1/me/profile
 *
 * View and update the authenticated member's profile.
 *
 * GET Response:
 * - 200: { profile: ProfileResponse }
 * - 401: Not authenticated
 * - 404: Member not found
 *
 * PATCH Request Body:
 * - firstName?: string (1-100 chars)
 * - lastName?: string (1-100 chars)
 * - phone?: string | null (max 20 chars)
 *
 * PATCH Response:
 * - 200: { profile: ProfileResponse }
 * - 400: Validation error
 * - 401: Not authenticated
 * - 404: Member not found
 *
 * Security:
 * - Requires valid session cookie
 * - Members can only access/modify their own profile
 * - Field allowlist prevents mass assignment attacks
 * - All updates are audit-logged
 *
 * Charter Compliance:
 * - P1: Identity via session
 * - P2: Object-scoped (own profile only)
 * - P7: Audit logging for mutations
 * - P9: Fail closed on invalid auth
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthContext } from "@/lib/auth";
import { errors } from "@/lib/api";
import { auditUpdate } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  ProfileUpdateSchema,
  filterEditableFields,
  toProfileResponse,
} from "@/lib/profile";

// ============================================================================
// GET /api/v1/me/profile
// ============================================================================

export async function GET(req: NextRequest) {
  // Require authenticated session
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { memberId } = auth.context as AuthContext;

  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        joinedAt: true,
        updatedAt: true,
        membershipStatus: {
          select: {
            code: true,
            label: true,
          },
        },
        membershipTier: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    if (!member) {
      return errors.notFound("Member", memberId);
    }

    return NextResponse.json({
      profile: toProfileResponse(member),
    });
  } catch (error) {
    console.error("[PROFILE] GET error:", error);
    return errors.internal("Failed to retrieve profile");
  }
}

// ============================================================================
// PATCH /api/v1/me/profile
// ============================================================================

export async function PATCH(req: NextRequest) {
  // Require authenticated session
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const context = auth.context as AuthContext;
  const { memberId } = context;

  // Parse request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errors.validation("Invalid JSON body");
  }

  // Filter to only editable fields (defense-in-depth)
  const filteredInput = filterEditableFields(body as Record<string, unknown>);

  // Validate the filtered input
  const parsed = ProfileUpdateSchema.safeParse(filteredInput);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = Object.entries(fieldErrors)[0];
    const message = firstError
      ? `Invalid ${firstError[0]}: ${firstError[1]?.[0]}`
      : "Invalid request format";
    return errors.validation(message, fieldErrors as Record<string, string>);
  }

  // Check if there's anything to update
  const updateData = parsed.data;
  if (Object.keys(updateData).length === 0) {
    return errors.validation("No valid fields to update");
  }

  try {
    // Get current state for audit log
    const before = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    if (!before) {
      return errors.notFound("Member", memberId);
    }

    // Update the member
    const updated = await prisma.member.update({
      where: { id: memberId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        joinedAt: true,
        updatedAt: true,
        membershipStatus: {
          select: {
            code: true,
            label: true,
          },
        },
        membershipTier: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    // Audit log the change
    await auditUpdate(
      "Member",
      memberId,
      context,
      req,
      before,
      {
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
      }
    );

    return NextResponse.json({
      profile: toProfileResponse(updated),
    });
  } catch (error) {
    console.error("[PROFILE] PATCH error:", error);
    return errors.internal("Failed to update profile");
  }
}
