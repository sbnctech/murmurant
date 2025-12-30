/**
 * Support Cases API
 *
 * GET /api/v1/support/cases - List support cases
 * POST /api/v1/support/cases - Create a new support case
 *
 * Access Control:
 * - Tech Lead / Admin: Full access
 * - Regular members: No access
 *
 * Charter Compliance:
 * - P1: Identity via session auth
 * - P2: Default deny authorization
 * - P7: Audit logging
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SupportCaseStatus, SupportCaseCategory, SupportCaseChannel } from "@prisma/client";

// Case list response type
type CaseSummary = {
  id: string;
  caseNumber: number;
  submitterName: string;
  submitterEmail: string | null;
  channel: SupportCaseChannel;
  status: SupportCaseStatus;
  category: SupportCaseCategory;
  description: string;
  receivedAt: string;
  createdAt: string;
  owner: { id: string; name: string } | null;
};

/**
 * GET /api/v1/support/cases
 */
export async function GET(req: NextRequest) {
  // Require admin capability for support case access
  const auth = await requireCapability(req, "admin:full");
  if (!auth.ok) {
    return auth.response;
  }

  // Parse query params
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  // Build where clause
  const where: Record<string, unknown> = {};
  if (statusFilter && statusFilter !== "all") {
    where.status = statusFilter;
  }

  // Fetch cases with owner info
  const [cases, total] = await Promise.all([
    prisma.supportCase.findMany({
      where,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { receivedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.supportCase.count({ where }),
  ]);

  const response: CaseSummary[] = cases.map((c) => ({
    id: c.id,
    caseNumber: c.caseNumber,
    submitterName: c.submitterName,
    submitterEmail: c.submitterEmail,
    channel: c.channel,
    status: c.status,
    category: c.category,
    description: c.description,
    receivedAt: c.receivedAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
    owner: c.owner
      ? { id: c.owner.id, name: c.owner.firstName + " " + c.owner.lastName }
      : null,
  }));

  return NextResponse.json({
    cases: response,
    total,
    limit,
    offset,
  });
}

/**
 * POST /api/v1/support/cases
 */
export async function POST(req: NextRequest) {
  // Require admin capability for support case creation
  const auth = await requireCapability(req, "admin:full");
  if (!auth.ok) {
    return auth.response;
  }

  // Parse body
  const body = await req.json();

  // Validate required fields
  if (!body.submitterName || typeof body.submitterName !== "string") {
    return NextResponse.json(
      { error: "Bad Request", message: "submitterName is required" },
      { status: 400 }
    );
  }

  if (!body.description || typeof body.description !== "string") {
    return NextResponse.json(
      { error: "Bad Request", message: "description is required" },
      { status: 400 }
    );
  }

  if (!body.channel) {
    return NextResponse.json(
      { error: "Bad Request", message: "channel is required" },
      { status: 400 }
    );
  }

  // Create case
  const supportCase = await prisma.supportCase.create({
    data: {
      submitterName: body.submitterName,
      submitterEmail: body.submitterEmail || null,
      submitterId: body.submitterId || null,
      channel: body.channel,
      description: body.description,
      context: body.context || null,
      category: body.category || "UNKNOWN",
      initialCategory: body.category || null,
      status: "OPEN",
      ownerId: auth.context.memberId,
    },
    select: { id: true, caseNumber: true, status: true },
  });

  return NextResponse.json(
    {
      id: supportCase.id,
      caseNumber: supportCase.caseNumber,
      status: supportCase.status,
      message: "Support case created",
    },
    { status: 201 }
  );
}
