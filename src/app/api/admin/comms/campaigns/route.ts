// Copyright (c) Santa Barbara Newcomers Club
// Message campaign management API - List and Create
// Charter: N2 compliance - capability checks, not role checks

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability, hasCapability } from "@/lib/auth";
import { createAuditLog } from "@/lib/publishing/permissions";

type CampaignListItem = {
  id: string;
  name: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  updatedAt: string;
  messageTemplate: { id: string; name: string } | null;
  mailingList: { id: string; name: string } | null;
};

// GET /api/admin/comms/campaigns - List all campaigns
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "comms:manage");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);

  // Parse pagination
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

  // Parse filters
  const status = searchParams.get("status");

  // Build where clause
  type WhereClause = {
    status?: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "CANCELLED";
  };
  const where: WhereClause = {};

  if (status) {
    where.status = status as WhereClause["status"];
  }

  // Get total count
  const totalItems = await prisma.messageCampaign.count({ where });
  const totalPages = Math.ceil(totalItems / pageSize);
  const skip = (page - 1) * pageSize;

  // Fetch campaigns
  const campaigns = await prisma.messageCampaign.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip,
    take: pageSize,
    include: {
      messageTemplate: { select: { id: true, name: true } },
      mailingList: { select: { id: true, name: true } },
    },
  });

  const items: CampaignListItem[] = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    scheduledAt: c.scheduledAt?.toISOString() || null,
    sentAt: c.sentAt?.toISOString() || null,
    updatedAt: c.updatedAt.toISOString(),
    messageTemplate: c.messageTemplate ? { id: c.messageTemplate.id, name: c.messageTemplate.name } : null,
    mailingList: c.mailingList ? { id: c.mailingList.id, name: c.mailingList.name } : null,
  }));

  return NextResponse.json({
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
  });
}

// POST /api/admin/comms/campaigns - Create new campaign
export async function POST(req: NextRequest) {
  const auth = await requireCapability(req, "comms:manage");
  if (!auth.ok) return auth.response;

  // Charter N2: Use capability check instead of inline role check
  // Campaign creation requires comms:send capability (admin has it, webmaster doesn't)
  if (!hasCapability(auth.context.globalRole, "comms:send")) {
    return NextResponse.json(
      { error: "Forbidden", message: "Required capability: comms:send" },
      { status: 403 }
    );
  }

  let body: {
    name: string;
    messageTemplateId: string;
    mailingListId?: string;
    audienceRuleId?: string;
    scheduledAt?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.name || !body.messageTemplateId) {
    return NextResponse.json(
      { error: "Bad Request", message: "name and messageTemplateId are required" },
      { status: 400 }
    );
  }

  // Validate template
  const template = await prisma.messageTemplate.findUnique({
    where: { id: body.messageTemplateId },
  });
  if (!template) {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid messageTemplateId" },
      { status: 400 }
    );
  }

  // Validate mailing list if provided
  if (body.mailingListId) {
    const mailingList = await prisma.mailingList.findUnique({
      where: { id: body.mailingListId },
    });
    if (!mailingList) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid mailingListId" },
        { status: 400 }
      );
    }
  }

  const campaign = await prisma.messageCampaign.create({
    data: {
      name: body.name,
      status: "DRAFT",
      messageTemplateId: body.messageTemplateId,
      mailingListId: body.mailingListId || null,
      audienceRuleId: body.audienceRuleId || null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      createdById: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    },
    include: {
      messageTemplate: { select: { id: true, name: true } },
      mailingList: { select: { id: true, name: true } },
    },
  });

  await createAuditLog({
    action: "CREATE",
    resourceType: "campaign",
    resourceId: campaign.id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    after: { name: campaign.name },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
