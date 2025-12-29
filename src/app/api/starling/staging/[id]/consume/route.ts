// Copyright (c) Murmurant, Inc.
// Starling staging API - mark staging as consumed

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

/**
 * POST /api/starling/staging/[id]/consume
 * Mark a staging payload as consumed (user navigated to the form)
 */
export async function POST(
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

    // Security: Only the user who created it can consume it
    if (staging.userId !== session.userAccountId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mark as consumed
    await prisma.starlingStaging.update({
      where: { id },
      data: {
        consumed: true,
        consumedAt: new Date(),
      },
    });

    // Audit log
    await prisma.starlingAudit.create({
      data: {
        id: `aud_${nanoid(12)}`,
        userId: session.userAccountId,
        conversationId: staging.conversationId,
        action: "staging_consumed",
        stagingId: id,
        targetRoute: staging.targetRoute,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Starling staging consume error:", error);
    return NextResponse.json(
      { error: "Failed to mark staging as consumed" },
      { status: 500 }
    );
  }
}
