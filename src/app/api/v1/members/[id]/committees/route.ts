import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, errors } from "@/lib/api";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/members/:id/committees
 *
 * Get a member's committee assignments.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) {
    return errors.notFound("Member", id);
  }

  const roleAssignments = await prisma.roleAssignment.findMany({
    where: {
      memberId: id,
      committeeId: { not: undefined },
    },
    include: {
      committee: true,
      committeeRole: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess({
    data: roleAssignments.map((ra) => ({
      id: ra.id,
      role: ra.committeeRole?.name ?? "Member",
      assignedAt: ra.createdAt.toISOString(),
      committee: ra.committee
        ? {
            id: ra.committee.id,
            name: ra.committee.name,
            description: ra.committee.description,
          }
        : null,
    })),
  });
}
