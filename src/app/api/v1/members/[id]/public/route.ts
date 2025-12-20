/**
 * GET /api/v1/members/:id/public
 *
 * Returns a member's public profile as seen by other members.
 * Requires authentication - only logged-in members can view other members.
 *
 * Response:
 * - 200: { member: PublicMemberProfile }
 * - 401: Not authenticated
 * - 404: Member not found
 *
 * Security:
 * - Requires valid session cookie
 * - Only returns member-safe fields (no email, phone, admin data)
 * - Redacts internal IDs and sensitive information
 *
 * Charter Compliance:
 * - P1: Identity via session
 * - P2: Member-to-member access (authenticated members only)
 * - P9: Fail closed on invalid auth
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { errors } from "@/lib/api";
import { prisma } from "@/lib/prisma";

// ============================================================================
// PUBLIC MEMBER PROFILE TYPE
// Only fields safe to show to other members
// ============================================================================

export interface PublicMemberProfile {
  id: string;
  firstName: string;
  lastName: string;
  memberSince: string; // Year only for privacy
  membershipStatus: {
    label: string;
  };
  membershipTier: {
    name: string;
  } | null;
  committees: Array<{
    name: string;
    role: string;
  }>;
  // Future: interests, about, etc.
}

// ============================================================================
// FIELDS EXPLICITLY NOT INCLUDED (documented for clarity)
// ============================================================================
// - email: Private, requires explicit sharing
// - phone: Private
// - joinedAt (exact date): Only year exposed as memberSince
// - waMembershipLevelRaw: Internal migration data
// - Internal IDs: Only member ID exposed
// - Audit logs: Admin only
// - Payment/billing: Admin only
// - Internal notes: Admin only

// ============================================================================
// GET /api/v1/members/:id/public
// ============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require authenticated session - members only
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        membershipStatus: {
          select: {
            label: true,
            isActive: true,
          },
        },
        membershipTier: {
          select: {
            name: true,
          },
        },
        // Get current committee assignments (endDate is null = active)
        roleAssignments: {
          where: {
            endDate: null,
          },
          include: {
            committee: {
              select: {
                name: true,
              },
            },
            committeeRole: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!member) {
      return errors.notFound("Member", id);
    }

    // Only show profiles of active members
    if (!member.membershipStatus.isActive) {
      return errors.notFound("Member", id);
    }

    // Transform to public profile
    const publicProfile: PublicMemberProfile = {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      memberSince: member.joinedAt.getFullYear().toString(),
      membershipStatus: {
        label: member.membershipStatus.label,
      },
      membershipTier: member.membershipTier
        ? { name: member.membershipTier.name }
        : null,
      committees: member.roleAssignments.map((ra) => ({
        name: ra.committee.name,
        role: ra.committeeRole.name,
      })),
    };

    return NextResponse.json({ member: publicProfile });
  } catch (error) {
    console.error("[MEMBERS] GET public profile error:", error);
    return errors.internal("Failed to retrieve member profile");
  }
}
