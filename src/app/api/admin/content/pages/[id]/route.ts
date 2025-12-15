// Copyright (c) Santa Barbara Newcomers Club
// Page management API - Get, Update, Delete, Publish

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/publishing/permissions";
import { validatePageContent } from "@/lib/publishing/blocks";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/content/pages/[id] - Get page by ID
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const page = await prisma.page.findUnique({
    where: { id },
    include: {
      template: { select: { id: true, name: true, slug: true } },
      theme: { select: { id: true, name: true, slug: true } },
      audienceRule: { select: { id: true, name: true, rules: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      updatedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!page) {
    return NextResponse.json(
      { error: "Not Found", message: "Page not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ page });
}

// PUT /api/admin/content/pages/[id] - Update page
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can edit pages" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Not Found", message: "Page not found" },
      { status: 404 }
    );
  }

  let body: {
    title?: string;
    slug?: string;
    description?: string;
    visibility?: string;
    templateId?: string | null;
    themeId?: string | null;
    audienceRuleId?: string | null;
    content?: unknown;
    seoTitle?: string | null;
    seoDescription?: string | null;
    seoImage?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate slug if changing
  if (body.slug && body.slug !== existing.slug) {
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(body.slug)) {
      return NextResponse.json(
        { error: "Bad Request", message: "slug must contain only lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    const duplicate = await prisma.page.findUnique({
      where: { slug: body.slug },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "Conflict", message: "A page with this slug already exists" },
        { status: 409 }
      );
    }
  }

  // Validate content if provided
  if (body.content) {
    const contentValidation = validatePageContent(body.content);
    if (!contentValidation.valid) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid content", errors: contentValidation.errors },
        { status: 400 }
      );
    }
  }

  const beforeState = {
    title: existing.title,
    slug: existing.slug,
    status: existing.status,
    visibility: existing.visibility,
  };

  // Update page
  const page = await prisma.page.update({
    where: { id },
    data: {
      title: body.title ?? existing.title,
      slug: body.slug ?? existing.slug,
      description: body.description !== undefined ? body.description : existing.description,
      visibility: body.visibility
        ? (body.visibility as "PUBLIC" | "MEMBERS_ONLY" | "ROLE_RESTRICTED")
        : existing.visibility,
      templateId: body.templateId !== undefined ? body.templateId : existing.templateId,
      themeId: body.themeId !== undefined ? body.themeId : existing.themeId,
      audienceRuleId: body.audienceRuleId !== undefined ? body.audienceRuleId : existing.audienceRuleId,
      content: body.content ? (body.content as object) : undefined,
      seoTitle: body.seoTitle !== undefined ? body.seoTitle : existing.seoTitle,
      seoDescription: body.seoDescription !== undefined ? body.seoDescription : existing.seoDescription,
      seoImage: body.seoImage !== undefined ? body.seoImage : existing.seoImage,
      updatedById: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    },
    include: {
      template: { select: { id: true, name: true, slug: true } },
      theme: { select: { id: true, name: true, slug: true } },
    },
  });

  // Audit log
  await createAuditLog({
    action: "UPDATE",
    resourceType: "page",
    resourceId: page.id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    before: beforeState,
    after: { title: page.title, slug: page.slug, status: page.status, visibility: page.visibility },
  });

  return NextResponse.json({ page });
}

// DELETE /api/admin/content/pages/[id] - Delete page
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can delete pages" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Not Found", message: "Page not found" },
      { status: 404 }
    );
  }

  await prisma.page.delete({ where: { id } });

  // Audit log
  await createAuditLog({
    action: "DELETE",
    resourceType: "page",
    resourceId: id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    before: { slug: existing.slug, title: existing.title },
  });

  return NextResponse.json({ success: true });
}

// POST /api/admin/content/pages/[id] - Publish or unpublish page
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can publish pages" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Not Found", message: "Page not found" },
      { status: 404 }
    );
  }

  if (action === "publish") {
    // Publish page
    const page = await prisma.page.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        updatedById: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
      },
    });

    await createAuditLog({
      action: "PUBLISH",
      resourceType: "page",
      resourceId: page.id,
      memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
      after: { status: "PUBLISHED", publishedAt: page.publishedAt },
    });

    return NextResponse.json({ page, message: "Page published" });
  }

  if (action === "unpublish") {
    // Unpublish page
    const page = await prisma.page.update({
      where: { id },
      data: {
        status: "DRAFT",
        updatedById: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
      },
    });

    await createAuditLog({
      action: "UNPUBLISH",
      resourceType: "page",
      resourceId: page.id,
      memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
      after: { status: "DRAFT" },
    });

    return NextResponse.json({ page, message: "Page unpublished" });
  }

  if (action === "archive") {
    // Archive page
    const page = await prisma.page.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        updatedById: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
      },
    });

    await createAuditLog({
      action: "ARCHIVE",
      resourceType: "page",
      resourceId: page.id,
      memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
      after: { status: "ARCHIVED" },
    });

    return NextResponse.json({ page, message: "Page archived" });
  }

  return NextResponse.json(
    { error: "Bad Request", message: "Invalid action. Use ?action=publish, ?action=unpublish, or ?action=archive" },
    { status: 400 }
  );
}
