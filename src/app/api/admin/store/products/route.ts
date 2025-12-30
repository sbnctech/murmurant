/**
 * Admin Store Products API
 *
 * GET /api/admin/store/products - List all products with pagination
 * POST /api/admin/store/products - Create a new product
 *
 * Authorization: Admin only (Charter P2)
 *
 * Charter: P2 (authorization), P7 (audit trail)
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOnly } from "@/lib/eventAuth";

type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  type: "PHYSICAL" | "DIGITAL";
  priceCents: number;
  quantity: number;
  isActive: boolean;
  variantCount: number;
};

// ============================================================================
// POST /api/admin/store/products - Create Product
// ============================================================================

interface CreateProductBody {
  name: string;
  slug?: string;
  description?: string;
  type?: "PHYSICAL" | "DIGITAL";
  priceCents: number;
  comparePriceCents?: number;
  imageUrl?: string;
  isActive?: boolean;
  isPublic?: boolean;
  allowsShipping?: boolean;
  allowsPickup?: boolean;
  trackInventory?: boolean;
  quantity?: number;
  lowStockThreshold?: number;
  digitalAssetUrl?: string;
  downloadLimit?: number;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminOnly(req);
  if (!auth.ok) return auth.response;

  let body: CreateProductBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (typeof body.priceCents !== "number" || body.priceCents < 0) {
    return NextResponse.json(
      { error: "Price must be a non-negative number" },
      { status: 400 }
    );
  }

  // Generate or validate slug
  const slug = body.slug?.trim() || generateSlug(body.name);

  // Check for duplicate slug
  const existingProduct = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingProduct) {
    return NextResponse.json(
      { error: "A product with this slug already exists" },
      { status: 409 }
    );
  }

  try {
    const product = await prisma.product.create({
      data: {
        name: body.name.trim(),
        slug,
        description: body.description?.trim() || null,
        type: body.type || "PHYSICAL",
        priceCents: body.priceCents,
        comparePriceCents: body.comparePriceCents || null,
        imageUrl: body.imageUrl?.trim() || null,
        isActive: body.isActive ?? true,
        isPublic: body.isPublic ?? true,
        allowsShipping: body.allowsShipping ?? true,
        allowsPickup: body.allowsPickup ?? false,
        trackInventory: body.trackInventory ?? true,
        quantity: body.quantity ?? 0,
        lowStockThreshold: body.lowStockThreshold || null,
        digitalAssetUrl: body.digitalAssetUrl?.trim() || null,
        downloadLimit: body.downloadLimit || null,
      },
    });

    // TODO: Audit log for product creation (Charter P7)

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN STORE PRODUCTS] Create error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/admin/store/products - List Products
// ============================================================================

export async function GET(req: NextRequest) {
  const auth = await requireAdminOnly(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);

  // Parse pagination params with defaults
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");
  const query = searchParams.get("query")?.trim() || null;
  const activeOnly = searchParams.get("activeOnly") === "true";

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
      pageSize = Math.min(parsed, 100);
    }
  }

  // Build where clause
  interface WhereClause {
    isActive?: boolean;
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" };
      slug?: { contains: string; mode: "insensitive" };
      id?: string;
    }>;
  }

  const whereClause: WhereClause = {};

  if (activeOnly) {
    whereClause.isActive = true;
  }

  if (query) {
    whereClause.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { slug: { contains: query, mode: "insensitive" } },
      { id: query }, // Exact match on ID
    ];
  }

  // Get total count for pagination
  const totalItems = await prisma.product.count({ where: whereClause });

  const totalPages = Math.ceil(totalItems / pageSize);
  const skip = (page - 1) * pageSize;

  // Fetch products with variant counts
  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      _count: {
        select: {
          variants: true,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    skip,
    take: pageSize,
  });

  const items: AdminProductListItem[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    type: p.type,
    priceCents: p.priceCents,
    quantity: p.quantity,
    isActive: p.isActive,
    variantCount: p._count.variants,
  }));

  return NextResponse.json({
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
  });
}
