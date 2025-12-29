// Copyright (c) Murmurant, Inc.
// Starling staging API - create staging payloads

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

/**
 * POST /api/starling/staging
 * Create a new staging payload
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const staging = await prisma.starlingStaging.create({
      data: {
        id: `stg_${nanoid(12)}`,
        userId: session.userAccountId,
        conversationId: body.conversationId,
        targetRoute: body.targetRoute,
        formData: body.formData,
        stagedFields: body.stagedFields ?? [],
        highlightSelector: body.highlightSelector ?? 'button[type="submit"]',
        toastMessage:
          body.toastMessage ??
          "Starling prepared this form. Review and confirm when ready.",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        requiresPasskey: body.requiresPasskey ?? false,
        metadata: body.metadata ?? {},
      },
    });

    // Audit log
    await prisma.starlingAudit.create({
      data: {
        id: `aud_${nanoid(12)}`,
        userId: session.userAccountId,
        conversationId: body.conversationId,
        action: "staging_created",
        stagingId: staging.id,
        targetRoute: body.targetRoute,
      },
    });

    return NextResponse.json({ stagingId: staging.id });
  } catch (error) {
    console.error("Starling staging error:", error);
    return NextResponse.json(
      { error: "Failed to create staging" },
      { status: 500 }
    );
  }
}
