import { NextRequest } from "next/server";
import { requireAuth, requireCapability } from "@/lib/auth";
import {
  apiSuccess,
  errors,
  parsePaginationParams,
  createPagination,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * GET /api/v1/members
 *
 * List members with pagination, search, and filters.
 * Requires authentication.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const searchParams = request.nextUrl.searchParams;
  const { page, limit } = parsePaginationParams(searchParams);
  const search = searchParams.get("search");
  const status = searchParams.get("status");

  const where: Prisma.MemberWhereInput = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.membershipStatus = { code: status };
  }

  const [members, totalItems] = await Promise.all([
    prisma.member.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { lastName: "asc" },
      include: {
        membershipStatus: true,
        membershipTier: true,
      },
    }),
    prisma.member.count({ where }),
  ]);

  return apiSuccess({
    data: members.map((m) => ({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      phone: m.phone,
      joinedAt: m.joinedAt.toISOString(),
      status: m.membershipStatus.label,
      tier: m.membershipTier?.name ?? null,
    })),
    pagination: createPagination(page, limit, totalItems),
  });
}

/**
 * POST /api/v1/members
 *
 * Create a new member. Requires members:view capability.
 */
export async function POST(request: NextRequest) {
  const auth = await requireCapability(request, "members:view");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, membershipStatusId, membershipTierId } = body;

    if (!firstName || !lastName || !email || !membershipStatusId) {
      return errors.validation("Missing required fields");
    }

    const existing = await prisma.member.findUnique({ where: { email } });
    if (existing) {
      return errors.conflict("Email already exists");
    }

    const member = await prisma.member.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        joinedAt: new Date(),
        membershipStatusId,
        membershipTierId,
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
      status: member.membershipStatus.label,
    }, 201);
  } catch (error) {
    console.error("Error creating member:", error);
    return errors.internal("Failed to create member");
  }
}
