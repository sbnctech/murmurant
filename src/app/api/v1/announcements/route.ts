/**
 * GET/POST /api/v1/announcements
 *
 * Announcement management endpoints.
 * GET: List announcements (public, with optional filters)
 * POST: Create announcement (admin only, requires comms:manage)
 *
 * Charter: P2 (default deny for mutations), P7 (audit for privileged actions)
 *
 * NOTE: Requires Announcement model in Prisma schema.
 * Until the model is added, these endpoints return 501 Not Implemented.
 *
 * Expected Announcement model:
 * - id: String @id @default(uuid())
 * - title: String
 * - content: String
 * - category: String?
 * - isPublished: Boolean @default(false)
 * - publishedAt: DateTime?
 * - expiresAt: DateTime?
 * - createdById: String? @db.Uuid
 * - createdAt: DateTime @default(now())
 * - updatedAt: DateTime @updatedAt
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";

// Type definitions for announcements (until Prisma model exists)
export interface AnnouncementInput {
  title: string;
  content: string;
  category?: string;
  expiresAt?: string;
}

export interface AnnouncementResponse {
  id: string;
  title: string;
  content: string;
  category: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/v1/announcements
 *
 * List announcements. Public endpoint for published announcements.
 * Query params:
 *   - active: "true" to filter only non-expired published announcements
 *   - category: filter by category
 *   - includeUnpublished: "true" to include drafts (requires comms:manage)
 */
export async function GET(request: NextRequest) {
  // NOTE: Announcement model not yet in Prisma schema
  // Return 501 until model is added

  const { searchParams } = new URL(request.url);
  const _active = searchParams.get("active") === "true";
  const _category = searchParams.get("category");
  const includeUnpublished = searchParams.get("includeUnpublished") === "true";

  // If requesting unpublished, require auth
  if (includeUnpublished) {
    const auth = await requireCapability(request, "comms:manage");
    if (!auth.ok) return auth.response;
  }

  // TODO: Implement when Announcement model is added to Prisma schema
  // const now = new Date();
  // const where: Prisma.AnnouncementWhereInput = {};
  //
  // if (!includeUnpublished) {
  //   where.isPublished = true;
  // }
  //
  // if (active) {
  //   where.OR = [
  //     { expiresAt: null },
  //     { expiresAt: { gt: now } },
  //   ];
  // }
  //
  // if (category) {
  //   where.category = category;
  // }
  //
  // const announcements = await prisma.announcement.findMany({
  //   where,
  //   orderBy: { createdAt: "desc" },
  // });

  return NextResponse.json(
    {
      error: "Not Implemented",
      message: "Announcement model not yet in Prisma schema",
      announcements: [],
    },
    { status: 501 }
  );
}

/**
 * POST /api/v1/announcements
 *
 * Create a new announcement (draft by default).
 * Requires comms:manage capability.
 *
 * Body: { title: string, content: string, category?: string, expiresAt?: string }
 */
export async function POST(request: NextRequest) {
  // Charter P2: Require comms:manage capability
  const auth = await requireCapability(request, "comms:manage");
  if (!auth.ok) return auth.response;

  // Parse and validate body
  let body: AnnouncementInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.title || typeof body.title !== "string" || body.title.trim() === "") {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400 }
    );
  }

  if (!body.content || typeof body.content !== "string" || body.content.trim() === "") {
    return NextResponse.json(
      { error: "content is required" },
      { status: 400 }
    );
  }

  // Validate expiresAt if provided
  if (body.expiresAt) {
    const expiresDate = new Date(body.expiresAt);
    if (isNaN(expiresDate.getTime())) {
      return NextResponse.json(
        { error: "expiresAt must be a valid ISO date string" },
        { status: 400 }
      );
    }
  }

  // TODO: Implement when Announcement model is added to Prisma schema
  // const announcement = await prisma.announcement.create({
  //   data: {
  //     title: body.title.trim(),
  //     content: body.content.trim(),
  //     category: body.category?.trim() || null,
  //     expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
  //     createdById: auth.context.memberId,
  //     isPublished: false,
  //   },
  // });
  //
  // // Charter P7: Audit the creation
  // await prisma.auditLog.create({
  //   data: {
  //     action: "announcement:create",
  //     targetType: "announcement",
  //     targetId: announcement.id,
  //     actorId: auth.context.userAccountId,
  //     details: { title: announcement.title },
  //   },
  // });

  return NextResponse.json(
    {
      error: "Not Implemented",
      message: "Announcement model not yet in Prisma schema",
    },
    { status: 501 }
  );
}
