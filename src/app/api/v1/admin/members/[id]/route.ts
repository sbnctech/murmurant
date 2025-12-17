import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/api";
import { requireCapabilityWithScope } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

type MemberDetailResponse = {
  member: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    joinedAt: string;
    status: string;
  };
  registrations: Array<{
    id: string;
    eventId: string;
    eventTitle: string;
    status: string;
    registeredAt: string;
  }>;
};

/**
 * GET /api/v1/admin/members/:id
 *
 * Admin endpoint to retrieve full member details.
 *
 * Charter P1/P2: Require members:view capability with explicit object scope.
 * Response: Member details with registration history
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Charter P2: Object-scoped authorization with explicit memberId scope
  const auth = await requireCapabilityWithScope(request, "members:view", { memberId: id });
  if (!auth.ok) return auth.response;

  // Validate UUID format to avoid Prisma errors
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      membershipStatus: true,
      eventRegistrations: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          registeredAt: "desc",
        },
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const response: MemberDetailResponse = {
    member: {
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      email: member.email,
      phone: member.phone,
      joinedAt: member.joinedAt.toISOString(),
      status: member.membershipStatus.code,
    },
    registrations: member.eventRegistrations.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      eventTitle: r.event.title,
      status: r.status,
      registeredAt: r.registeredAt.toISOString(),
    })),
  };

  return NextResponse.json(response);
}

/**
 * PATCH /api/v1/admin/members/:id
 *
 * Admin endpoint to update member information.
 *
 * Charter P1/P2: Require members:view capability with explicit object scope.
 * Request body: Partial member fields
 * Response: Updated MemberDetail
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Charter P2: Object-scoped authorization with explicit memberId scope
  const auth = await requireCapabilityWithScope(request, "members:view", { memberId: id });
  if (!auth.ok) return auth.response;

  // TODO: Wire - Implement member update
  // 1. Access validated above via requireCapabilityWithScope
  // 2. Parse and validate request body
  // 3. Update member record
  // 4. Return updated member

  return errors.internal(`PATCH /api/v1/admin/members/${id} not implemented`);
}
