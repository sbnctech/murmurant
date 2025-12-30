/**
 * GET /api/v1/members/directory
 *
 * Returns a list of active members for the member directory.
 * Requires authentication - only logged-in members can view the directory.
 *
 * Query params:
 *   - search: Optional search query (filters by name)
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 20, max: 100)
 *
 * Response:
 * - 200: { members: DirectoryMember[], pagination: PaginationMeta }
 * - 401: Not authenticated
 *
 * Security:
 * - Requires valid session cookie
 * - Only returns active members
 * - Only returns public-safe fields
 *
 * Charter Compliance:
 * - P1: Identity via session
 * - P2: Member-to-member access (authenticated members only)
 * - P9: Fail closed on invalid auth
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { errors, parsePaginationParams, createPagination } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ============================================================================
// DIRECTORY MEMBER TYPE
// Minimal info for directory listing
// ============================================================================

export interface DirectoryMember {
  id: string;
  firstName: string;
  lastName: string;
  memberSince: string;
  membershipTier: {
    name: string;
  } | null;
}

// ============================================================================
// GET /api/v1/members/directory
// ============================================================================

export async function GET(req: NextRequest) {
  // Require authenticated session - members only
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const { page, limit } = parsePaginationParams(searchParams);
  const search = searchParams.get("search");

  try {
    // Build where clause - only active members
    const where: Prisma.MemberWhereInput = {
      membershipStatus: {
        isActive: true,
      },
    };

    // Add search filter if provided
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const totalItems = await prisma.member.count({ where });

    // Get members
    const members = await prisma.member.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        membershipTier: {
          select: {
            name: true,
          },
        },
      },
    });

    // Transform to directory format
    const directoryMembers: DirectoryMember[] = members.map((m) => ({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      memberSince: m.joinedAt.getFullYear().toString(),
      membershipTier: m.membershipTier
        ? { name: m.membershipTier.name }
        : null,
    }));

    const pagination = createPagination(page, limit, totalItems);

    return NextResponse.json({
      members: directoryMembers,
      pagination,
    });
  } catch (error) {
    console.error("[MEMBERS] GET directory error:", error);
    return errors.internal("Failed to retrieve member directory");
  }
}
