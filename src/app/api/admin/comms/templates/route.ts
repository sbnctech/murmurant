// Copyright (c) Santa Barbara Newcomers Club
// Message template management API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/publishing/permissions";

// GET /api/admin/comms/templates - List all message templates
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const templates = await prisma.messageTemplate.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      subject: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ templates });
}

// POST /api/admin/comms/templates - Create new message template
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can create message templates" },
      { status: 403 }
    );
  }

  let body: {
    name: string;
    slug: string;
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    tokens?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.name || !body.slug || !body.subject || !body.bodyHtml) {
    return NextResponse.json(
      { error: "Bad Request", message: "name, slug, subject, and bodyHtml are required" },
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
  const existing = await prisma.messageTemplate.findUnique({
    where: { slug: body.slug },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Conflict", message: "A template with this slug already exists" },
      { status: 409 }
    );
  }

  const template = await prisma.messageTemplate.create({
    data: {
      name: body.name,
      slug: body.slug,
      subject: body.subject,
      bodyHtml: body.bodyHtml,
      bodyText: body.bodyText || null,
      tokens: body.tokens ? (body.tokens as object) : undefined,
      isActive: true,
    },
  });

  await createAuditLog({
    action: "CREATE",
    resourceType: "message_template",
    resourceId: template.id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    after: { name: template.name, slug: template.slug },
  });

  return NextResponse.json({ template }, { status: 201 });
}

// PUT /api/admin/comms/templates - Update template (expects ?id=xxx in query)
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can edit message templates" },
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

  const existing = await prisma.messageTemplate.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Not Found", message: "Template not found" },
      { status: 404 }
    );
  }

  let body: {
    name?: string;
    subject?: string;
    bodyHtml?: string;
    bodyText?: string | null;
    tokens?: unknown;
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

  const template = await prisma.messageTemplate.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      subject: body.subject ?? existing.subject,
      bodyHtml: body.bodyHtml ?? existing.bodyHtml,
      bodyText: body.bodyText !== undefined ? body.bodyText : existing.bodyText,
      tokens: body.tokens ? (body.tokens as object) : undefined,
      isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
    },
  });

  await createAuditLog({
    action: "UPDATE",
    resourceType: "message_template",
    resourceId: template.id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    before: { name: existing.name },
    after: { name: template.name },
  });

  return NextResponse.json({ template });
}

// DELETE /api/admin/comms/templates - Delete template (expects ?id=xxx in query)
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can delete message templates" },
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

  const existing = await prisma.messageTemplate.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Not Found", message: "Template not found" },
      { status: 404 }
    );
  }

  // Check if template is in use by campaigns
  const campaignsUsingTemplate = await prisma.messageCampaign.count({ where: { messageTemplateId: id } });
  if (campaignsUsingTemplate > 0) {
    return NextResponse.json(
      { error: "Conflict", message: `Cannot delete template - ${campaignsUsingTemplate} campaign(s) are using it` },
      { status: 409 }
    );
  }

  await prisma.messageTemplate.delete({ where: { id } });

  await createAuditLog({
    action: "DELETE",
    resourceType: "message_template",
    resourceId: id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    before: { name: existing.name, slug: existing.slug },
  });

  return NextResponse.json({ success: true });
}
