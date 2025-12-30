/**
 * GET /api/v1/me/committees
 *
 * Returns the authenticated member's committee memberships.
 *
 * Response:
 * - 200: { committees: CommitteeMembership[] }
 * - 401: Not authenticated
 *
 * Charter Compliance:
 * - P1: Identity via session
 * - P2: Object-scoped (own committees only)
 * - P9: Fail closed on invalid auth
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthContext } from "@/lib/auth";
import { errors } from "@/lib/api";
import { prisma } from "@/lib/prisma";

interface CommitteeMembership {
  id: string;
  committeeName: string;
  roleName: string;
  isActive: boolean;
}

export async function GET(req: NextRequest) {
  // Require authenticated session
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { memberId } = auth.context as AuthContext;

  try {
    // Fetch member's committee assignments
    const assignments = await prisma.roleAssignment.findMany({
      where: {
        memberId,
      },
      include: {
        committee: {
          select: {
            id: true,
            name: true,
          },
        },
        committeeRole: {
          select: {
            name: true,
          },
        },
        term: {
          select: {
            endDate: true,
          },
        },
      },
      orderBy: {
        committee: {
          name: "asc",
        },
      },
    });

    const now = new Date();

    // Transform to response format
    const committees: CommitteeMembership[] = assignments.map((a) => ({
      id: a.committee.id,
      committeeName: a.committee.name,
      roleName: a.committeeRole.name,
      isActive: !a.endDate || a.endDate > now,
    }));

    // Filter to active memberships and deduplicate by committee
    const activeCommittees = committees.filter((c) => c.isActive);
    const uniqueCommittees = activeCommittees.reduce<CommitteeMembership[]>((acc, c) => {
      if (!acc.find((x) => x.id === c.id)) {
        acc.push(c);
      }
      return acc;
    }, []);

    return NextResponse.json({
      committees: uniqueCommittees,
    });
  } catch (error) {
    console.error("[COMMITTEES] GET error:", error);
    return errors.internal("Failed to retrieve committees");
  }
}
