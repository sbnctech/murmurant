/**
 * GET /api/v1/committees
 *
 * Public endpoint to list active committees.
 * No authentication required.
 *
 * Response: { committees: Committee[] }
 *
 * Charter: P2 (public access for public data)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { NextResponse } from "next/server";
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
