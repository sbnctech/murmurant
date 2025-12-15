// Copyright (c) Santa Barbara Newcomers Club
// Template management API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/publishing/permissions";

// GET /api/admin/content/templates - List all templates
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // PAGE or EMAIL

  const where: Prisma.TemplateWhereInput = {};
  if (type) {
    where.type = type as "PAGE" | "EMAIL";
  }

  const templates = await prisma.template.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      description: true,
      schemaVersion: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ templates });
}

// POST /api/admin/content/templates - Create new template
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can create templates" },
      { status: 403 }
    );
  }

  let body: {
    name: string;
    slug: string;
    type: string;
    description?: string;
    content: unknown;
    themeId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.name || !body.slug || !body.type) {
    return NextResponse.json(
      { error: "Bad Request", message: "name, slug, and type are required" },
      { status: 400 }
    );
  }

  if (body.type !== "PAGE" && body.type !== "EMAIL") {
    return NextResponse.json(
      { error: "Bad Request", message: "type must be PAGE or EMAIL" },
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
  const existing = await prisma.template.findUnique({
    where: { slug: body.slug },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Conflict", message: "A template with this slug already exists" },
      { status: 409 }
    );
  }

  if (!body.content || typeof body.content !== "object") {
    return NextResponse.json(
      { error: "Bad Request", message: "content must be an object" },
      { status: 400 }
    );
  }

  const template = await prisma.template.create({
    data: {
      name: body.name,
      slug: body.slug,
      type: body.type as "PAGE" | "EMAIL",
      description: body.description || null,
      content: body.content as object,
      themeId: body.themeId || null,
      schemaVersion: 1,
      isActive: true,
    },
  });

  await createAuditLog({
    action: "CREATE",
    resourceType: "template",
    resourceId: template.id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    after: { name: template.name, slug: template.slug, type: template.type },
  });

  return NextResponse.json({ template }, { status: 201 });
}

// PUT /api/admin/content/templates - Update template (expects ?id=xxx in query)
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can edit templates" },
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

  const existing = await prisma.template.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Not Found", message: "Template not found" },
      { status: 404 }
    );
  }

  let body: {
    name?: string;
    description?: string;
    content?: unknown;
    themeId?: string | null;
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

  const template = await prisma.template.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      description: body.description !== undefined ? body.description : existing.description,
      content: body.content ? (body.content as object) : undefined,
      themeId: body.themeId !== undefined ? body.themeId : existing.themeId,
      isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
    },
  });

  await createAuditLog({
    action: "UPDATE",
    resourceType: "template",
    resourceId: template.id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    before: { name: existing.name },
    after: { name: template.name },
  });

  return NextResponse.json({ template });
}

// DELETE /api/admin/content/templates - Delete template (expects ?id=xxx in query)
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can delete templates" },
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

  const existing = await prisma.template.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Not Found", message: "Template not found" },
      { status: 404 }
    );
  }

  // Check if template is in use
  const pagesUsingTemplate = await prisma.page.count({ where: { templateId: id } });
  if (pagesUsingTemplate > 0) {
    return NextResponse.json(
      { error: "Conflict", message: `Cannot delete template - ${pagesUsingTemplate} page(s) are using it` },
      { status: 409 }
    );
  }

  await prisma.template.delete({ where: { id } });

  await createAuditLog({
    action: "DELETE",
    resourceType: "template",
    resourceId: id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    before: { name: existing.name, slug: existing.slug },
  });

  return NextResponse.json({ success: true });
}
