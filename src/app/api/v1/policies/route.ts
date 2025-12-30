/**
 * Policy Registry API
 *
 * GET /api/v1/policies - List all policies (officer+ access)
 *
 * Charter Principles:
 * - P1: Identity provable - requires authentication
 * - P2: Default deny - requires officer role or higher
 * - N5: No hidden rules - policies are visible and documented
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getPolicies,
  getPolicyCategories,
  getPolicyMetadata,
  type PolicyCategory,
  type PolicyStatus,
} from "@/lib/policies";

export async function GET(request: NextRequest) {
  // Require authentication - any authenticated member can view policies
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as PolicyCategory | null;
  const status = searchParams.get("status") as PolicyStatus | null;
  const search = searchParams.get("search");

  try {
    // Get filtered policies
    const policies = getPolicies({
      category: category || undefined,
      status: status || undefined,
      search: search || undefined,
    });

    // Get metadata and categories for UI
    const metadata = getPolicyMetadata();
    const categories = getPolicyCategories();

    return NextResponse.json({
      policies,
      categories,
      metadata,
      filters: {
        category,
        status,
        search,
      },
    });
  } catch (error) {
    console.error("Error loading policies:", error);
    return NextResponse.json(
      { error: "Failed to load policy registry" },
      { status: 500 }
    );
  }
}
