import { NextRequest } from "next/server";
import { requireAuth, requireCapability } from "@/lib/auth";
import { apiSuccess, errors } from "@/lib/api";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/members/:id
 *
 * Get a single member by ID.
 * Requires authentication.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      membershipStatus: true,
      membershipTier: true,
    },
  });

  if (!member) {
    return errors.notFound("Member", id);
  }

  return apiSuccess({
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
    joinedAt: member.joinedAt.toISOString(),
    status: member.membershipStatus.label,
    tier: member.membershipTier?.name ?? null,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  });
}

/**
 * PATCH /api/v1/members/:id
 *
 * Update a member.
 * Requires members:view capability (admin access).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(request, "members:view");
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  const existing = await prisma.member.findUnique({ where: { id } });
  if (!existing) {
    return errors.notFound("Member", id);
  }

  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, membershipStatusId, membershipTierId } = body;

    // Check for duplicate email if changing
    if (email && email !== existing.email) {
      const emailExists = await prisma.member.findUnique({ where: { email } });
      if (emailExists) {
        return errors.conflict("A member with this email already exists");
      }
    }

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(membershipStatusId && { membershipStatusId }),
        ...(membershipTierId !== undefined && { membershipTierId }),
      },
      include: {
        membershipStatus: true,
        membershipTier: true,
      },
    });

    return apiSuccess({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      joinedAt: member.joinedAt.toISOString(),
      status: member.membershipStatus.label,
      tier: member.membershipTier?.name ?? null,
      updatedAt: member.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error updating member:", error);
    return errors.internal("Failed to update member");
  }
}

/**
 * DELETE /api/v1/members/:id
 *
 * Soft delete a member (sets status to inactive).
 * Requires members:view capability (admin access).
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(request, "members:view");
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  const existing = await prisma.member.findUnique({ where: { id } });
  if (!existing) {
    return errors.notFound("Member", id);
  }

  try {
    // Find inactive status
    const inactiveStatus = await prisma.membershipStatus.findFirst({
      where: { code: { in: ["inactive", "Inactive", "INACTIVE"] } },
    });

    if (!inactiveStatus) {
      return errors.internal("Inactive status not configured");
    }

    await prisma.member.update({
      where: { id },
      data: { membershipStatusId: inactiveStatus.id },
    });

    return apiSuccess({ message: "Member deactivated successfully" });
  } catch (error) {
    console.error("Error deleting member:", error);
    return errors.internal("Failed to delete member");
  }
}
