/**
 * Public Store Product Detail API
 *
 * GET /api/store/products/:slug - Get product details with variants
 *
 * Authorization: None (public API)
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

type PublicVariant = {
  id: string;
  name: string;
  sku: string | null;
  priceCents: number;
  attributes: Record<string, string> | null;
  imageUrl: string | null;
  inStock: boolean;
  quantity: number;
};

type PublicProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: "PHYSICAL" | "DIGITAL";
  priceCents: number;
  comparePriceCents: number | null;
  imageUrl: string | null;
  images: string[] | null;
  allowsShipping: boolean;
  allowsPickup: boolean;
  inStock: boolean;
  variants: PublicVariant[];
};

// ============================================================================
// GET /api/store/products/:slug - Get Product Detail
// ============================================================================

export async function GET(_req: NextRequest, context: RouteContext) {
  const { slug } = await context.params;

  const product = await prisma.product.findUnique({
    where: {
      slug,
      isActive: true,
      isPublic: true,
    },
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          sku: true,
          priceCents: true,
          attributes: true,
          imageUrl: true,
          quantity: true,
        },
      },
    },
  });

  if (!product) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  // Calculate stock status
  const hasVariants = product.variants.length > 0;
  let totalStock: number;

  if (hasVariants) {
    totalStock = product.variants.reduce((sum, v) => sum + v.quantity, 0);
  } else {
    totalStock = product.quantity;
  }

  const inStock = product.type === "DIGITAL" || !product.trackInventory || totalStock > 0;

  // Map variants with stock info
  const variants: PublicVariant[] = product.variants.map((v) => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    priceCents: v.priceCents ?? product.priceCents,
    attributes: v.attributes as Record<string, string> | null,
    imageUrl: v.imageUrl,
    inStock: product.type === "DIGITAL" || !product.trackInventory || v.quantity > 0,
    quantity: product.type === "DIGITAL" || !product.trackInventory ? 999 : v.quantity,
  }));

  const detail: PublicProductDetail = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    type: product.type,
    priceCents: product.priceCents,
    comparePriceCents: product.comparePriceCents,
    imageUrl: product.imageUrl,
    images: product.images as string[] | null,
    allowsShipping: product.allowsShipping,
    allowsPickup: product.allowsPickup,
    inStock,
    variants,
  };

  return NextResponse.json({ product: detail });
}
