import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireCapabilitySafe } from "@/lib/auth";
import { apiSuccess, apiCreated, errors } from "@/lib/api";
import { prisma } from "@/lib/prisma";

interface RouteParams { params: Promise<{ id: string }>; }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: committeeId } = await params;
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const committee = await prisma.committee.findUnique({ where: { id: committeeId }, select: { id: true, name: true } });
  if (!committee) return errors.notFound("Committee", committeeId);

  const now = new Date();
  const assignments = await prisma.roleAssignment.findMany({
    where: { committeeId, startDate: { lte: now }, OR: [{ endDate: null }, { endDate: { gt: now } }] },
    include: { member: { select: { id: true, firstName: true, lastName: true, email: true } }, committeeRole: { select: { id: true, name: true, slug: true } }, term: { select: { id: true, name: true } } },
    orderBy: [{ committeeRole: { sortOrder: "asc" } }, { member: { lastName: "asc" } }],
  });

  return apiSuccess({
    committeeId, committeeName: committee.name,
    members: assignments.map((a) => ({ assignmentId: a.id, memberId: a.member.id, name: `${a.member.firstName} ${a.member.lastName}`, email: a.member.email, role: { id: a.committeeRole.id, name: a.committeeRole.name, slug: a.committeeRole.slug }, term: a.term ? { id: a.term.id, name: a.term.name } : null, startDate: a.startDate.toISOString(), endDate: a.endDate?.toISOString() ?? null })),
    total: assignments.length,
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: committeeId } = await params;
  const auth = await requireCapabilitySafe(request, "admin:full");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { memberId, committeeRoleId, termId, startDate, endDate } = body;
    if (!memberId || !committeeRoleId || !termId || !startDate) return errors.validation("memberId, committeeRoleId, termId, and startDate are required");

    const committee = await prisma.committee.findUnique({ where: { id: committeeId } });
    if (!committee) return errors.notFound("Committee", committeeId);

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) return errors.notFound("Member", memberId);

    const role = await prisma.committeeRole.findFirst({ where: { id: committeeRoleId, committeeId } });
    if (!role) return errors.validation("Role does not belong to this committee");

    const term = await prisma.term.findUnique({ where: { id: termId } });
    if (!term) return errors.notFound("Term", termId);

    const assignment = await prisma.roleAssignment.create({
      data: { memberId, committeeId, committeeRoleId, termId, startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null },
      include: { member: { select: { firstName: true, lastName: true } }, committeeRole: { select: { name: true } } },
    });

    await prisma.auditLog.create({ data: { action: "CREATE", resourceType: "RoleAssignment", resourceId: assignment.id, memberId: auth.context.memberId, after: { committeeId, committeeName: committee.name, memberId, memberName: `${assignment.member.firstName} ${assignment.member.lastName}`, roleName: assignment.committeeRole.name } } });

    return apiCreated({ id: assignment.id, memberId: assignment.memberId, memberName: `${assignment.member.firstName} ${assignment.member.lastName}`, role: assignment.committeeRole.name, startDate: assignment.startDate.toISOString(), endDate: assignment.endDate?.toISOString() ?? null });
  } catch (error) {
    console.error("Error adding committee member:", error);
    return errors.internal("Failed to add committee member");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id: committeeId } = await params;
  const auth = await requireCapabilitySafe(request, "admin:full");
  if (!auth.ok) return auth.response;

  try {
    const assignmentId = request.nextUrl.searchParams.get("assignmentId");
    if (!assignmentId) return errors.validation("assignmentId query parameter is required");

    const assignment = await prisma.roleAssignment.findFirst({ where: { id: assignmentId, committeeId }, include: { member: { select: { firstName: true, lastName: true } }, committee: { select: { name: true } }, committeeRole: { select: { name: true } } } });
    if (!assignment) return errors.notFound("Role assignment", assignmentId);

    await prisma.roleAssignment.update({ where: { id: assignmentId }, data: { endDate: new Date() } });

    await prisma.auditLog.create({ data: { action: "DELETE", resourceType: "RoleAssignment", resourceId: assignmentId, memberId: auth.context.memberId, before: { committeeId, committeeName: assignment.committee.name, memberId: assignment.memberId, memberName: `${assignment.member.firstName} ${assignment.member.lastName}`, roleName: assignment.committeeRole.name }, metadata: { softDelete: true } } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error removing committee member:", error);
    return errors.internal("Failed to remove committee member");
  }
}
