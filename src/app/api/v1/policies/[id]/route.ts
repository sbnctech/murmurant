/**
 * Policy Detail API
 *
 * GET /api/v1/policies/[id] - Get a single policy by ID
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
import { getPolicyById } from "@/lib/policies";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // Require authentication
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  try {
    const policy = getPolicyById(id);

    if (!policy) {
      return NextResponse.json(
        { error: `Policy not found: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ policy });
  } catch (error) {
    console.error("Error loading policy:", error);
    return NextResponse.json(
      { error: "Failed to load policy" },
      { status: 500 }
    );
  }
}
