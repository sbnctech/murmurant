// Copyright (c) Murmurant, Inc.
// Starling staging API - retrieve staging payload

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/starling/staging/[id]
 * Retrieve a staging payload
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const staging = await prisma.starlingStaging.findUnique({
      where: { id },
    });

    if (!staging) {
      return NextResponse.json(
        { error: "Staging not found" },
        { status: 404 }
      );
    }

    // Security: Only the user who created it can retrieve it
    if (staging.userId !== session.userAccountId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check expiration
    if (staging.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Staging expired" },
        { status: 410 }
      );
    }

    return NextResponse.json(staging);
  } catch (error) {
    console.error("Starling staging retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve staging" },
      { status: 500 }
    );
  }
}
