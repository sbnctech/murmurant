import { NextRequest } from "next/server";
import { requireAuth, requireCapabilitySafe } from "@/lib/auth";
import { apiSuccess, apiNoContent, errors } from "@/lib/api";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const committee = await prisma.committee.findUnique({
    where: { id },
    include: {
      committeeRoles: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, slug: true, description: true, sortOrder: true } },
      _count: { select: { roleAssignments: { where: { startDate: { lte: new Date() }, OR: [{ endDate: null }, { endDate: { gt: new Date() } }] } } } },
    },
  });

  if (!committee) return errors.notFound("Committee", id);

  return apiSuccess({
    id: committee.id, name: committee.name, slug: committee.slug, description: committee.description, isActive: committee.isActive,
    memberCount: committee._count.roleAssignments, roles: committee.committeeRoles,
    createdAt: committee.createdAt.toISOString(), updatedAt: committee.updatedAt.toISOString(),
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await requireCapabilitySafe(request, "admin:full");
  if (!auth.ok) return auth.response;

  try {
    const existing = await prisma.committee.findUnique({ where: { id } });
    if (!existing) return errors.notFound("Committee", id);

    const body = await request.json();
    const { name, slug, description, isActive } = body;

    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.committee.findUnique({ where: { slug } });
      if (slugExists) return errors.conflict("Committee with this slug already exists");
    }

    const committee = await prisma.committee.update({
      where: { id },
      data: { ...(name !== undefined && { name }), ...(slug !== undefined && { slug }), ...(description !== undefined && { description }), ...(isActive !== undefined && { isActive }) },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE", resourceType: "Committee", resourceId: committee.id, memberId: auth.context.memberId,
        before: { name: existing.name, slug: existing.slug, description: existing.description, isActive: existing.isActive },
        after: { name: committee.name, slug: committee.slug, description: committee.description, isActive: committee.isActive },
      },
    });

    return apiSuccess({ id: committee.id, name: committee.name, slug: committee.slug, description: committee.description, isActive: committee.isActive, updatedAt: committee.updatedAt.toISOString() });
  } catch (error) {
    console.error("Error updating committee:", error);
    return errors.internal("Failed to update committee");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await requireCapabilitySafe(request, "admin:full");
  if (!auth.ok) return auth.response;

  try {
    const existing = await prisma.committee.findUnique({ where: { id } });
    if (!existing) return errors.notFound("Committee", id);

    await prisma.committee.update({ where: { id }, data: { isActive: false } });

    await prisma.auditLog.create({
      data: { action: "DELETE", resourceType: "Committee", resourceId: id, memberId: auth.context.memberId, before: { name: existing.name, slug: existing.slug, isActive: existing.isActive }, metadata: { softDelete: true } },
    });

    return apiNoContent();
  } catch (error) {
    console.error("Error deleting committee:", error);
    return errors.internal("Failed to delete committee");
  }
}
