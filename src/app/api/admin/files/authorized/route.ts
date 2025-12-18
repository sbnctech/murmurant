/**
 * Authorized Files API
 *
 * GET /api/admin/files/authorized - Get files the current user can access
 *
 * Charter Principles:
 * - P2: Default deny (only shows files with explicit access grants)
 * - P9: Fail closed (no guessing, only returns authorized files)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getAuthorizedFileIds,
  getAuthorizedFiles,
  fileFiltersSchema,
  paginationSchema,
} from "@/lib/files";

/**
 * GET /api/admin/files/authorized
 * Returns only files the authenticated user can access.
 *
 * Query parameters:
 * - tag: Filter by tag
 * - mimeType: Filter by MIME type
 * - uploadedById: Filter by uploader (UUID)
 * - isPublic: Filter by public status (true/false)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);

  // Parse filters
  const filtersResult = fileFiltersSchema.safeParse({
    tag: searchParams.get("tag") || undefined,
    mimeType: searchParams.get("mimeType") || undefined,
    uploadedById: searchParams.get("uploadedById") || undefined,
    isPublic: searchParams.has("isPublic")
      ? searchParams.get("isPublic") === "true"
      : undefined,
  });

  if (!filtersResult.success) {
    return NextResponse.json(
      { error: "Validation Error", message: filtersResult.error.message },
      { status: 400 }
    );
  }

  // Parse pagination
  const paginationResult = paginationSchema.safeParse({
    page: searchParams.get("page") || undefined,
    limit: searchParams.get("limit") || undefined,
  });

  if (!paginationResult.success) {
    return NextResponse.json(
      { error: "Validation Error", message: paginationResult.error.message },
      { status: 400 }
    );
  }

  try {
    // Get authorized file IDs for this user
    const authorizedIds = await getAuthorizedFileIds(
      auth.context.memberId,
      auth.context.globalRole
    );

    if (authorizedIds.length === 0) {
      return NextResponse.json({
        files: [],
        pagination: {
          page: paginationResult.data.page,
          limit: paginationResult.data.limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Get files with filters and pagination
    const result = await getAuthorizedFiles(
      authorizedIds,
      filtersResult.data,
      paginationResult.data
    );

    return NextResponse.json({
      files: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error listing authorized files:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to list files" },
      { status: 500 }
    );
  }
}
