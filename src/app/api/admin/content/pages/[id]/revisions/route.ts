// Copyright © 2025 Murmurant, Inc.
// Page revisions API - Get revision state for undo/redo UI
// A7: Undo/Redo functionality

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/auth";
import { getRevisionState, getRevisionHistory } from "@/lib/publishing/revisions";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/content/pages/[id]/revisions - Get revision state
// Requires publishing:manage capability
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "publishing:manage");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  // Verify page exists
  const page = await prisma.page.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!page) {
    return NextResponse.json(
      { error: "Not Found", message: "Page not found" },
      { status: 404 }
    );
  }

  // Get revision state
  const revisionState = await getRevisionState(id);

  // Optionally include history if requested
  const url = new URL(req.url);
  const includeHistory = url.searchParams.get("history") === "true";

  if (includeHistory) {
    const history = await getRevisionHistory(id);
    return NextResponse.json({
      ...revisionState,
      history,
    });
  }

  return NextResponse.json(revisionState);
}
