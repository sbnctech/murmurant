/**
 * Committee API
 * GET /api/v1/committees - List all committees (public)
 * POST /api/v1/committees - Create committee (admin only)
 *
 * Charter: P2 (public access for public data), P1 (audit for mutations)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapabilitySafe } from "@/lib/auth";
import { apiCreated, errors } from "@/lib/api";
import { prisma } from "@/lib/prisma";

interface CommitteeSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export async function GET() {
  try {
    const committees = await prisma.committee.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
      orderBy: { name: "asc" },
    });

    const result: CommitteeSummary[] = committees.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
    }));

    return NextResponse.json({ committees: result });
  } catch (error) {
    console.error("Error fetching committees:", error);
    return NextResponse.json(
      { error: "Failed to fetch committees" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCapabilitySafe(request, "admin:full");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { name, slug, description, isActive = true } = body;

    if (!name || !slug) {
      return errors.validation("Name and slug are required");
    }

    const existing = await prisma.committee.findUnique({ where: { slug } });
    if (existing) {
      return errors.conflict("Committee with this slug already exists");
    }

    const committee = await prisma.committee.create({
      data: { name, slug, description, isActive },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        resourceType: "Committee",
        resourceId: committee.id,
        memberId: auth.context.memberId,
        after: { name, slug, description, isActive },
      },
    });

    return apiCreated({
      id: committee.id,
      name: committee.name,
      slug: committee.slug,
      description: committee.description,
      isActive: committee.isActive,
      createdAt: committee.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error creating committee:", error);
    return errors.internal("Failed to create committee");
  }
}
