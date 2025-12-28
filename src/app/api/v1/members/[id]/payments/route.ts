import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  apiSuccess,
  errors,
  parsePaginationParams,
  createPagination,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/members/:id/payments
 *
 * Get a member's payment history.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  const { memberId, globalRole } = auth.context;

  const isAdmin = globalRole === "admin";
  if (memberId !== id && !isAdmin) {
    return errors.forbidden();
  }

  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) {
    return errors.notFound("Member", id);
  }

  const searchParams = request.nextUrl.searchParams;
  const { page, limit } = parsePaginationParams(searchParams);
  const status = searchParams.get("status");

  const registrations = await prisma.eventRegistration.findMany({
    where: { memberId: id },
    select: { id: true },
  });

  const registrationIds = registrations.map((r) => r.id);

  const where: Prisma.PaymentIntentWhereInput = {
    registrationId: { in: registrationIds },
  };

  if (status) {
    where.status = status as Prisma.EnumPaymentIntentStatusFilter;
  }

  const [payments, totalItems] = await Promise.all([
    prisma.paymentIntent.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.paymentIntent.count({ where }),
  ]);

  return apiSuccess({
    data: payments.map((p) => ({
      id: p.id,
      status: p.status,
      description: p.description,
      createdAt: p.createdAt.toISOString(),
    })),
    pagination: createPagination(page, limit, totalItems),
  });
}
