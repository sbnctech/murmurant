// Copyright (c) Santa Barbara Newcomers Club
// Mailing list management API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/publishing/permissions";
import { getAudienceCount, AudienceRules } from "@/lib/publishing/audience";

// GET /api/admin/comms/lists - List all mailing lists
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const lists = await prisma.mailingList.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isActive: true,
      audienceRuleId: true,
      updatedAt: true,
    },
  });

  // Get subscriber counts for each list
  const listsWithCounts = await Promise.all(
    lists.map(async (list) => {
      let subscriberCount = 0;
      let audienceRule: { id: string; name: string } | null = null;
      if (list.audienceRuleId) {
        const rule = await prisma.audienceRule.findUnique({
          where: { id: list.audienceRuleId },
          select: { id: true, name: true, rules: true },
        });
        if (rule) {
          audienceRule = { id: rule.id, name: rule.name };
          subscriberCount = await getAudienceCount(rule.rules as AudienceRules);
        }
      }
      return { ...list, subscriberCount, audienceRule };
    })
  );

  return NextResponse.json({ lists: listsWithCounts });
}

// POST /api/admin/comms/lists - Create new mailing list
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can create mailing lists" },
      { status: 403 }
    );
  }

  let body: {
    name: string;
    slug: string;
    description?: string;
    audienceRuleId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.name || !body.slug) {
    return NextResponse.json(
      { error: "Bad Request", message: "name and slug are required" },
      { status: 400 }
    );
  }

  // Validate slug format
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(body.slug)) {
    return NextResponse.json(
      { error: "Bad Request", message: "slug must contain only lowercase letters, numbers, and hyphens" },
      { status: 400 }
    );
  }

  // Check for duplicate slug
  const existing = await prisma.mailingList.findUnique({
    where: { slug: body.slug },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Conflict", message: "A mailing list with this slug already exists" },
      { status: 409 }
    );
  }

  // Validate audience rule if provided
  if (body.audienceRuleId) {
    const audienceRule = await prisma.audienceRule.findUnique({
      where: { id: body.audienceRuleId },
    });
    if (!audienceRule) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid audienceRuleId" },
        { status: 400 }
      );
    }
  }

  const list = await prisma.mailingList.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      audienceRuleId: body.audienceRuleId || null,
      isActive: true,
    },
  });

  await createAuditLog({
    action: "CREATE",
    resourceType: "mailing_list",
    resourceId: list.id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    after: { name: list.name, slug: list.slug },
  });

  return NextResponse.json({ list }, { status: 201 });
}

// PUT /api/admin/comms/lists - Update mailing list (expects ?id=xxx in query)
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can edit mailing lists" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Bad Request", message: "id query parameter is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.mailingList.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Not Found", message: "Mailing list not found" },
      { status: 404 }
    );
  }

  let body: {
    name?: string;
    description?: string | null;
    audienceRuleId?: string | null;
    isActive?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate audience rule if provided
  if (body.audienceRuleId) {
    const audienceRule = await prisma.audienceRule.findUnique({
      where: { id: body.audienceRuleId },
    });
    if (!audienceRule) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid audienceRuleId" },
        { status: 400 }
      );
    }
  }

  const list = await prisma.mailingList.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      description: body.description !== undefined ? body.description : existing.description,
      audienceRuleId: body.audienceRuleId !== undefined ? body.audienceRuleId : existing.audienceRuleId,
      isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
    },
  });

  await createAuditLog({
    action: "UPDATE",
    resourceType: "mailing_list",
    resourceId: list.id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    before: { name: existing.name },
    after: { name: list.name },
  });

  return NextResponse.json({ list });
}

// DELETE /api/admin/comms/lists - Delete mailing list (expects ?id=xxx in query)
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can delete mailing lists" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Bad Request", message: "id query parameter is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.mailingList.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Not Found", message: "Mailing list not found" },
      { status: 404 }
    );
  }

  // Check if list is in use by campaigns
  const campaignsUsingList = await prisma.messageCampaign.count({ where: { mailingListId: id } });
  if (campaignsUsingList > 0) {
    return NextResponse.json(
      { error: "Conflict", message: `Cannot delete mailing list - ${campaignsUsingList} campaign(s) are using it` },
      { status: 409 }
    );
  }

  await prisma.mailingList.delete({ where: { id } });

  await createAuditLog({
    action: "DELETE",
    resourceType: "mailing_list",
    resourceId: id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    before: { name: existing.name, slug: existing.slug },
  });

  return NextResponse.json({ success: true });
}
