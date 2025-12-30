// Copyright © 2025 Murmurant, Inc.
// Page audit log API - Read-only access to page history

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

type AuditLogEntry = {
  id: string;
  action: string;
  timestamp: string;
  actor: {
    id: string | null;
    name: string;
  };
  summary: string;
};

// GET /api/admin/content/pages/[id]/audit - Get audit logs for a page
// Requires publishing:manage capability (webmaster has this)
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "publishing:manage");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  // Verify page exists
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) {
    return NextResponse.json(
      { error: "Not Found", message: "Page not found" },
      { status: 404 }
    );
  }

  // Parse query params
  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

  // Fetch audit logs for this page
  const logs = await prisma.auditLog.findMany({
    where: {
      resourceType: "page",
      resourceId: id,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Format entries
  const entries: AuditLogEntry[] = logs.map((log) => ({
    id: log.id,
    action: log.action,
    timestamp: log.createdAt.toISOString(),
    actor: {
      id: log.member?.id || null,
      name: log.member
        ? `${log.member.firstName || ""} ${log.member.lastName || ""}`.trim() || "Unknown"
        : "System",
    },
    summary: formatActionSummary(log.action, log.after as Record<string, unknown> | null),
  }));

  return NextResponse.json({ entries });
}

/**
 * Format a human-readable summary for an audit action
 */
function formatActionSummary(
  action: string,
  after: Record<string, unknown> | null
): string {
  switch (action) {
    case "CREATE":
      return `Created page${after?.title ? ` "${after.title}"` : ""}`;
    case "UPDATE":
      return "Updated page content";
    case "PUBLISH":
      return "Published page";
    case "UNPUBLISH":
      return "Unpublished page";
    case "ARCHIVE":
      return "Archived page";
    case "DISCARD_DRAFT":
      return "Discarded draft changes";
    case "DELETE":
      return "Deleted page";
    default:
      return action;
  }
}
