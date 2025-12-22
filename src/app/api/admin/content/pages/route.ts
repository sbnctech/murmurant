// Copyright (c) Santa Barbara Newcomers Club
// Page management API - List and Create

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireCapability } from "@/lib/auth";
import { createAuditLog } from "@/lib/publishing/permissions";
import { validatePageContent, createDefaultPageContent } from "@/lib/publishing/blocks";
import { detectDraftChanges } from "@/lib/publishing/contentSelection";
import type { PageContent } from "@/lib/publishing/blocks";

type PageListItem = {
  id: string;
  slug: string;
  title: string;
  status: string;
  visibility: string;
  publishedAt: string | null;
  updatedAt: string;
  hasDraftChanges: boolean;
};

// GET /api/admin/content/pages - List all pages
// Requires publishing:manage capability (webmaster has this)
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "publishing:manage");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);

  // Parse pagination
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

  // Parse filters
  const status = searchParams.get("status");
  const visibility = searchParams.get("visibility");
  const search = searchParams.get("search");

  // Build where clause
  const where: Prisma.PageWhereInput = {};

  if (status) {
    where.status = status as "DRAFT" | "PUBLISHED" | "ARCHIVED";
  }

  if (visibility) {
    where.visibility = visibility as "PUBLIC" | "MEMBERS_ONLY" | "ROLE_RESTRICTED";
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  // Get total count
  const totalItems = await prisma.page.count({ where });
  const totalPages = Math.ceil(totalItems / pageSize);
  const skip = (page - 1) * pageSize;

  // Fetch pages
  const pages = await prisma.page.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip,
    take: pageSize,
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      visibility: true,
      publishedAt: true,
      updatedAt: true,
      content: true,
      publishedContent: true,
    },
  });

  const items: PageListItem[] = pages.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    status: p.status,
    visibility: p.visibility,
    publishedAt: p.publishedAt?.toISOString() || null,
    updatedAt: p.updatedAt.toISOString(),
    hasDraftChanges: detectDraftChanges(
      p.content as PageContent | null,
      p.publishedContent as PageContent | null
    ),
  }));

  return NextResponse.json({
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
  });
}

// POST /api/admin/content/pages - Create new page
// Requires publishing:manage capability (webmaster has this)
export async function POST(req: NextRequest) {
  const auth = await requireCapability(req, "publishing:manage");
  if (!auth.ok) return auth.response;

  let body: {
    slug: string;
    title: string;
    description?: string;
    visibility?: string;
    templateId?: string;
    themeId?: string;
    content?: unknown;
    breadcrumb?: { label: string; link?: string }[] | null;
    seoTitle?: string;
    seoDescription?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate required fields
  if (!body.slug || typeof body.slug !== "string") {
    return NextResponse.json(
      { error: "Bad Request", message: "slug is required" },
      { status: 400 }
    );
  }

  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json(
      { error: "Bad Request", message: "title is required" },
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
  const existing = await prisma.page.findUnique({
    where: { slug: body.slug },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Conflict", message: "A page with this slug already exists" },
      { status: 409 }
    );
  }

  // Validate content if provided
  const content = body.content || createDefaultPageContent();
  const contentValidation = validatePageContent(content);
  if (!contentValidation.valid) {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid content", errors: contentValidation.errors },
      { status: 400 }
    );
  }

  // Create page
  const page = await prisma.page.create({
    data: {
      slug: body.slug,
      title: body.title,
      description: body.description || null,
      status: "DRAFT",
      visibility: (body.visibility as "PUBLIC" | "MEMBERS_ONLY" | "ROLE_RESTRICTED") || "PUBLIC",
      templateId: body.templateId || null,
      themeId: body.themeId || null,
      content: content as object,
      breadcrumb: body.breadcrumb ?? Prisma.DbNull,
      seoTitle: body.seoTitle || null,
      seoDescription: body.seoDescription || null,
      createdById: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
      updatedById: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    },
  });

  // Audit log
  await createAuditLog({
    action: "CREATE",
    resourceType: "page",
    resourceId: page.id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    after: { slug: page.slug, title: page.title },
  });

  return NextResponse.json({ page }, { status: 201 });
}
