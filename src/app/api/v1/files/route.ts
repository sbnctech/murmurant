import { NextRequest } from "next/server";
import { errors, apiSuccess, parsePaginationParams, createPagination } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { authorizeFileList, getVisibilityFilter, FileObjectType } from "@/lib/files/authorization";

/**
 * FileSummary - minimal metadata for file picker UI
 */
interface FileSummary {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  visibility: string;
  createdAt: string;
}

/**
 * GET /api/v1/files
 *
 * Returns paginated list of files the user has access to.
 * Filters by visibility based on user's role.
 *
 * Charter P2: Default-deny, object-scoped authorization
 * Charter P9: Fail closed - no auth = 401
 *
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 20, max: 100)
 *   - objectType: Filter by object type (optional)
 *   - objectId: Filter by object ID (optional, requires objectType)
 *   - mimeType: Filter by MIME type prefix, e.g., "image/" (optional)
 *
 * Response: { files: FileSummary[], pagination: PaginationMeta }
 */
export async function GET(request: NextRequest) {
  try {
    // Authorize - requires authentication
    const authResult = await authorizeFileList(request);

    if (!authResult.authorized) {
      if (authResult.status === 401) {
        return errors.unauthorized(authResult.reason);
      }
      return errors.forbidden();
    }

    const { context } = authResult;
    const { searchParams } = new URL(request.url);

    // Parse pagination
    const { page, limit } = parsePaginationParams(searchParams);
    const skip = (page - 1) * limit;

    // Parse optional filters
    const objectTypeParam = searchParams.get("objectType");
    const objectId = searchParams.get("objectId");
    const mimeType = searchParams.get("mimeType");

    // Build where clause with visibility filter
    const visibilityFilter = getVisibilityFilter(context.globalRole);

    // Start with base conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      deletedAt: null,
      ...visibilityFilter,
    };

    // Add object type filter if valid
    if (objectTypeParam) {
      const validObjectTypes = Object.values(FileObjectType);
      if (validObjectTypes.includes(objectTypeParam as FileObjectType)) {
        where.objectType = objectTypeParam as FileObjectType;
      }
    }

    // Add object ID filter (only if objectType is also specified)
    if (objectId && objectTypeParam) {
      where.objectId = objectId;
    }

    // Add MIME type prefix filter
    if (mimeType) {
      where.mimeType = { startsWith: mimeType };
    }

    // Get total count for pagination
    const totalItems = await prisma.file.count({ where });

    // Get files
    const files = await prisma.file.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        filename: true,
        mimeType: true,
        size: true,
        visibility: true,
        createdAt: true,
      },
    });

    // Transform to FileSummary shape
    const fileSummaries: FileSummary[] = files.map((file) => ({
      id: file.id,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size,
      visibility: file.visibility,
      createdAt: file.createdAt.toISOString(),
    }));

    // Build pagination metadata
    const pagination = createPagination(page, limit, totalItems);

    return apiSuccess({
      files: fileSummaries,
      pagination,
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    return errors.internal("Failed to fetch files");
  }
}
