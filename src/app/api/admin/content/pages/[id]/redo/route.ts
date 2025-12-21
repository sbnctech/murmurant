// Copyright (c) Santa Barbara Newcomers Club
// Page redo API - Apply redo to restore next content state
// A7: Undo/Redo functionality

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/auth";
import { createAuditLog } from "@/lib/publishing/permissions";
import { applyRedo, getRevisionState } from "@/lib/publishing/revisions";
import { PageContent } from "@/lib/publishing/blocks";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST /api/admin/content/pages/[id]/redo - Apply redo
// Requires publishing:manage capability
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "publishing:manage");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  // Get the page
  const page = await prisma.page.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      status: true,
      content: true,
    },
  });

  if (!page) {
    return NextResponse.json(
      { error: "Not Found", message: "Page not found" },
      { status: 404 }
    );
  }

  // Cannot redo on archived pages
  if (page.status === "ARCHIVED") {
    return NextResponse.json(
      { error: "Forbidden", message: "Cannot redo changes on archived pages" },
      { status: 403 }
    );
  }

  // Apply redo
  const currentContent = page.content as PageContent;
  const result = await applyRedo(id, currentContent);

  if (!result.success) {
    return NextResponse.json(
      { error: "Bad Request", message: result.error || "Nothing to redo" },
      { status: 400 }
    );
  }

  // Update the page content
  await prisma.page.update({
    where: { id },
    data: {
      content: result.content as object,
      updatedById: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    },
  });

  // Create audit log entry
  await createAuditLog({
    action: "REDO",
    resourceType: "page",
    resourceId: id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    before: { contentHash: hashContent(currentContent) },
    after: { contentHash: hashContent(result.content!), actionSummary: result.actionSummary },
    metadata: { actionSummary: result.actionSummary },
  });

  // Get updated revision state
  const revisionState = await getRevisionState(id);

  return NextResponse.json({
    success: true,
    content: result.content,
    actionSummary: result.actionSummary,
    revisionState,
  });
}

/**
 * Simple hash for content comparison in audit logs
 */
function hashContent(content: PageContent): string {
  const str = JSON.stringify(content);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}
