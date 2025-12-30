// Copyright © 2025 Murmurant, Inc.
// Theme management API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/auth";
import { createAuditLog } from "@/lib/publishing/permissions";
import { validateThemeTokens, DEFAULT_THEME_TOKENS } from "@/lib/publishing/theme";

// GET /api/admin/content/themes - List all themes
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "publishing:manage");
  if (!auth.ok) return auth.response;

  const themes = await prisma.theme.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      status: true,
      isDefault: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ themes });
}

// POST /api/admin/content/themes - Create new theme
export async function POST(req: NextRequest) {
  const auth = await requireCapability(req, "publishing:manage");
  if (!auth.ok) return auth.response;

  // Only full admins can create themes (webmaster can view/use existing ones)
  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can create themes" },
      { status: 403 }
    );
  }

  let body: {
    name: string;
    slug: string;
    description?: string;
    tokens?: unknown;
    cssText?: string;
    isDefault?: boolean;
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
  const existing = await prisma.theme.findUnique({
    where: { slug: body.slug },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Conflict", message: "A theme with this slug already exists" },
      { status: 409 }
    );
  }

  // Validate tokens if provided
  const tokens = body.tokens || DEFAULT_THEME_TOKENS;
  const tokenValidation = validateThemeTokens(tokens);
  if (!tokenValidation.valid) {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid tokens", errors: tokenValidation.errors },
      { status: 400 }
    );
  }

  // If setting as default, unset other defaults
  if (body.isDefault) {
    await prisma.theme.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  const theme = await prisma.theme.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      status: "DRAFT",
      tokens: tokens as object,
      cssText: body.cssText || null,
      isDefault: body.isDefault || false,
    },
  });

  await createAuditLog({
    action: "CREATE",
    resourceType: "theme",
    resourceId: theme.id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    after: { name: theme.name, slug: theme.slug },
  });

  return NextResponse.json({ theme }, { status: 201 });
}

// PUT /api/admin/content/themes - Update theme (expects ?id=xxx in query)
export async function PUT(req: NextRequest) {
  const auth = await requireCapability(req, "publishing:manage");
  if (!auth.ok) return auth.response;

  // Only full admins can edit themes (webmaster can only view)
  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can edit themes" },
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

  const existing = await prisma.theme.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Not Found", message: "Theme not found" },
      { status: 404 }
    );
  }

  let body: {
    name?: string;
    description?: string;
    status?: string;
    tokens?: unknown;
    cssText?: string | null;
    isDefault?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate tokens if provided
  if (body.tokens) {
    const tokenValidation = validateThemeTokens(body.tokens);
    if (!tokenValidation.valid) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid tokens", errors: tokenValidation.errors },
        { status: 400 }
      );
    }
  }

  // If setting as default, unset other defaults
  if (body.isDefault && !existing.isDefault) {
    await prisma.theme.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const theme = await prisma.theme.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      description: body.description !== undefined ? body.description : existing.description,
      status: body.status ? (body.status as "DRAFT" | "ACTIVE" | "ARCHIVED") : existing.status,
      tokens: body.tokens ? (body.tokens as object) : undefined,
      cssText: body.cssText !== undefined ? body.cssText : existing.cssText,
      isDefault: body.isDefault !== undefined ? body.isDefault : existing.isDefault,
    },
  });

  await createAuditLog({
    action: "UPDATE",
    resourceType: "theme",
    resourceId: theme.id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    before: { name: existing.name, status: existing.status },
    after: { name: theme.name, status: theme.status },
  });

  return NextResponse.json({ theme });
}

// DELETE /api/admin/content/themes - Delete theme (expects ?id=xxx in query)
export async function DELETE(req: NextRequest) {
  const auth = await requireCapability(req, "publishing:manage");
  if (!auth.ok) return auth.response;

  // Only full admins can delete themes
  if (auth.context.globalRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only administrators can delete themes" },
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

  const existing = await prisma.theme.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Not Found", message: "Theme not found" },
      { status: 404 }
    );
  }

  // Cannot delete default theme
  if (existing.isDefault) {
    return NextResponse.json(
      { error: "Bad Request", message: "Cannot delete the default theme" },
      { status: 400 }
    );
  }

  // Check if theme is in use
  const pagesUsingTheme = await prisma.page.count({ where: { themeId: id } });
  if (pagesUsingTheme > 0) {
    return NextResponse.json(
      { error: "Conflict", message: `Cannot delete theme - ${pagesUsingTheme} page(s) are using it` },
      { status: 409 }
    );
  }

  await prisma.theme.delete({ where: { id } });

  await createAuditLog({
    action: "DELETE",
    resourceType: "theme",
    resourceId: id,
    memberId: auth.context.memberId === "e2e-admin" ? null : auth.context.memberId,
    before: { name: existing.name, slug: existing.slug },
  });

  return NextResponse.json({ success: true });
}
