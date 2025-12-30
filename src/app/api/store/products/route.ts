/**
 * Public Store Products API
 *
 * GET /api/store/products - List active public products
 *
 * Authorization: None (public API)
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PublicProductListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: "PHYSICAL" | "DIGITAL";
  priceCents: number;
  comparePriceCents: number | null;
  imageUrl: string | null;
  allowsShipping: boolean;
  allowsPickup: boolean;
  inStock: boolean;
  hasVariants: boolean;
};

// ============================================================================
// GET /api/store/products - List Public Products
// ============================================================================

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Parse pagination params with defaults
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");
  const query = searchParams.get("query")?.trim() || null;
  const typeFilter = searchParams.get("type"); // "PHYSICAL" or "DIGITAL"

  let page = 1;
  let pageSize = 20;

  if (pageParam !== null) {
    const parsed = parseInt(pageParam, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      page = parsed;
    }
  }

  if (pageSizeParam !== null) {
    const parsed = parseInt(pageSizeParam, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      pageSize = Math.min(parsed, 50);
    }
  }

  // Build where clause - only active and public products
  interface WhereClause {
    isActive: boolean;
    isPublic: boolean;
    type?: "PHYSICAL" | "DIGITAL";
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" };
      description?: { contains: string; mode: "insensitive" };
    }>;
  }

  const whereClause: WhereClause = {
    isActive: true,
    isPublic: true,
  };

  if (typeFilter === "PHYSICAL" || typeFilter === "DIGITAL") {
    whereClause.type = typeFilter;
  }

  if (query) {
    whereClause.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  // Get total count for pagination
  const totalItems = await prisma.product.count({ where: whereClause });

  const totalPages = Math.ceil(totalItems / pageSize);
  const skip = (page - 1) * pageSize;

  // Fetch products with variant info for stock calculation
  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      variants: {
        where: { isActive: true },
        select: { quantity: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    skip,
    take: pageSize,
  });

  const items: PublicProductListItem[] = products.map((p) => {
    // Calculate total stock
    const hasVariants = p.variants.length > 0;
    let totalStock: number;

    if (hasVariants) {
      totalStock = p.variants.reduce((sum, v) => sum + v.quantity, 0);
    } else {
      totalStock = p.quantity;
    }

    // Digital products are always "in stock"
    const inStock = p.type === "DIGITAL" || !p.trackInventory || totalStock > 0;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      type: p.type,
      priceCents: p.priceCents,
      comparePriceCents: p.comparePriceCents,
      imageUrl: p.imageUrl,
      allowsShipping: p.allowsShipping,
      allowsPickup: p.allowsPickup,
      inStock,
      hasVariants,
    };
  });

  return NextResponse.json({
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
  });
}
