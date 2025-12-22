// Copyright (c) Santa Barbara Newcomers Club
// Page management API - Get, Update, Delete, Publish
// A4: Lifecycle state machine for Draft/Published management

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireCapability, isFullAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/publishing/permissions";
import { validatePageContent, PageContent } from "@/lib/publishing/blocks";
import { clearRevisions } from "@/lib/publishing/revisions";
import {
  isValidTransition,
  hasDraftChanges,
  getLifecycleMessage,
  LifecycleAction,
  PageStatus,
} from "@/lib/publishing/pageLifecycle";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/content/pages/[id] - Get page by ID
// Requires publishing:manage capability (webmaster has this)
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "publishing:manage");
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
// Requires publishing:manage capability (webmaster has this)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "publishing:manage");
  if (!auth.ok) return auth.response;

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
    breadcrumb?: { label: string; link?: string }[] | null;
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
      breadcrumb: body.breadcrumb !== undefined
        ? (body.breadcrumb === null ? Prisma.DbNull : body.breadcrumb)
        : undefined,
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
// Requires publishing:manage capability
// NOTE: Deleting PUBLISHED pages requires admin:full (webmaster cannot)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "publishing:manage");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Not Found", message: "Page not found" },
      { status: 404 }
    );
  }

  // Published pages can only be deleted by full admins
  if (existing.status === "PUBLISHED" && !isFullAdmin(auth.context.globalRole)) {
    return NextResponse.json(
      { error: "Forbidden", message: "Only full administrators can delete published pages" },
      { status: 403 }
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

// POST /api/admin/content/pages/[id] - Lifecycle actions (publish, unpublish, archive, discardDraft)
// Requires publishing:manage capability (webmaster has this)
// A4: Uses lifecycle state machine for validation
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "publishing:manage");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") as LifecycleAction | null;

  // Validate action parameter
  const validActions: LifecycleAction[] = ["publish", "unpublish", "archive", "discardDraft"];
  if (!action || !validActions.includes(action)) {
    return NextResponse.json(
      {
        error: "Bad Request",
        message: "Invalid action. Use ?action=publish, ?action=unpublish, ?action=archive, or ?action=discardDraft",
      },
      { status: 400 }
    );
  }

  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Not Found", message: "Page not found" },
      { status: 404 }
    );
  }

  // Calculate draft changes for validation
  const content = existing.content as PageContent | null;
  const publishedContent = existing.publishedContent as PageContent | null;
  const hasChanges = hasDraftChanges(content, publishedContent);

  // Validate state transition
  const currentStatus = existing.status as PageStatus;
  const validation = isValidTransition(currentStatus, action, hasChanges);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Bad Request", message: validation.error },
      { status: 400 }
    );
  }

  const memberId = auth.context.memberId === "e2e-admin" ? null : auth.context.memberId;

  if (action === "publish") {
    // Publish: copy content to publishedContent, update status and timestamp
    const page = await prisma.page.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        publishedContent: existing.content as object, // Freeze current content as published snapshot
        updatedById: memberId,
      },
    });

    // Clear revision history on publish (A7: no undo across publish boundaries)
    await clearRevisions(id);

    await createAuditLog({
      action: "PUBLISH",
      resourceType: "page",
      resourceId: page.id,
      memberId,
      before: { status: currentStatus },
      after: { status: "PUBLISHED", publishedAt: page.publishedAt },
    });

    return NextResponse.json({ page, message: getLifecycleMessage(action) });
  }

  if (action === "unpublish") {
    // Unpublish: set status to DRAFT (keep publishedContent for reference)
    const page = await prisma.page.update({
      where: { id },
      data: {
        status: "DRAFT",
        updatedById: memberId,
      },
    });

    await createAuditLog({
      action: "UNPUBLISH",
      resourceType: "page",
      resourceId: page.id,
      memberId,
      before: { status: currentStatus },
      after: { status: "DRAFT" },
    });

    return NextResponse.json({ page, message: getLifecycleMessage(action) });
  }

  if (action === "archive") {
    // Archive: set status to ARCHIVED
    const page = await prisma.page.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        updatedById: memberId,
      },
    });

    await createAuditLog({
      action: "ARCHIVE",
      resourceType: "page",
      resourceId: page.id,
      memberId,
      before: { status: currentStatus },
      after: { status: "ARCHIVED" },
    });

    return NextResponse.json({ page, message: getLifecycleMessage(action) });
  }

  if (action === "discardDraft") {
    // Discard draft: copy publishedContent back to content
    const page = await prisma.page.update({
      where: { id },
      data: {
        content: existing.publishedContent!, // Restore from published snapshot
        updatedById: memberId,
      },
    });

    // Clear revision history on discard (A7: no undo across publish boundaries)
    await clearRevisions(id);

    await createAuditLog({
      action: "DISCARD_DRAFT",
      resourceType: "page",
      resourceId: page.id,
      memberId,
      before: { hasDraftChanges: true },
      after: { hasDraftChanges: false },
    });

    return NextResponse.json({ page, message: getLifecycleMessage(action) });
  }

  // This should never be reached due to early validation
  return NextResponse.json(
    { error: "Bad Request", message: "Invalid action" },
    { status: 400 }
  );
}
