/**
 * Admin Store Product API (Individual)
 *
 * GET /api/admin/store/products/:id - Get product details
 * PATCH /api/admin/store/products/:id - Update product
 * DELETE /api/admin/store/products/:id - Delete product
 *
 * Authorization: Admin only (Charter P2)
 *
 * Charter: P2 (authorization), P7 (audit trail)
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminOnly } from "@/lib/eventAuth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ============================================================================
// GET /api/admin/store/products/:id - Get Product
// ============================================================================

export async function GET(req: NextRequest, context: RouteContext) {
  const auth = await requireAdminOnly(req);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        orderBy: { sortOrder: "asc" },
      },
      _count: {
        select: { orderItems: true },
      },
    },
  });

  if (!product) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ product });
}

// ============================================================================
// PATCH /api/admin/store/products/:id - Update Product
// ============================================================================

interface UpdateProductBody {
  name?: string;
  slug?: string;
  description?: string | null;
  type?: "PHYSICAL" | "DIGITAL";
  priceCents?: number;
  comparePriceCents?: number | null;
  imageUrl?: string | null;
  images?: string[] | null;
  sortOrder?: number;
  isActive?: boolean;
  isPublic?: boolean;
  allowsShipping?: boolean;
  allowsPickup?: boolean;
  trackInventory?: boolean;
  quantity?: number;
  lowStockThreshold?: number | null;
  digitalAssetUrl?: string | null;
  downloadLimit?: number | null;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await requireAdminOnly(req);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  // Check if product exists
  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  let body: UpdateProductBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate name if provided
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
  }

  // Validate price if provided
  if (body.priceCents !== undefined) {
    if (typeof body.priceCents !== "number" || body.priceCents < 0) {
      return NextResponse.json(
        { error: "Price must be a non-negative number" },
        { status: 400 }
      );
    }
  }

  // Check slug uniqueness if changing
  if (body.slug && body.slug !== existing.slug) {
    const slugConflict = await prisma.product.findUnique({
      where: { slug: body.slug },
      select: { id: true },
    });

    if (slugConflict) {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 409 }
      );
    }
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.slug !== undefined && { slug: body.slug.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.priceCents !== undefined && { priceCents: body.priceCents }),
        ...(body.comparePriceCents !== undefined && { comparePriceCents: body.comparePriceCents }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl?.trim() || null }),
        ...(body.images !== undefined && { images: body.images === null ? Prisma.JsonNull : body.images }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
        ...(body.allowsShipping !== undefined && { allowsShipping: body.allowsShipping }),
        ...(body.allowsPickup !== undefined && { allowsPickup: body.allowsPickup }),
        ...(body.trackInventory !== undefined && { trackInventory: body.trackInventory }),
        ...(body.quantity !== undefined && { quantity: body.quantity }),
        ...(body.lowStockThreshold !== undefined && { lowStockThreshold: body.lowStockThreshold }),
        ...(body.digitalAssetUrl !== undefined && { digitalAssetUrl: body.digitalAssetUrl?.trim() || null }),
        ...(body.downloadLimit !== undefined && { downloadLimit: body.downloadLimit }),
      },
    });

    // TODO: Audit log for product update (Charter P7)

    return NextResponse.json({ product });
  } catch (error) {
    console.error("[ADMIN STORE PRODUCTS] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/admin/store/products/:id - Delete Product
// ============================================================================

export async function DELETE(req: NextRequest, context: RouteContext) {
  const auth = await requireAdminOnly(req);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  // Check if product exists
  const existing = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      _count: { select: { orderItems: true } },
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  // Prevent deletion if product has orders
  if (existing._count.orderItems > 0) {
    return NextResponse.json(
      {
        error: "Cannot delete product with existing orders",
        message: "Deactivate the product instead",
      },
      { status: 400 }
    );
  }

  try {
    await prisma.product.delete({
      where: { id },
    });

    // TODO: Audit log for product deletion (Charter P7)

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN STORE PRODUCTS] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
