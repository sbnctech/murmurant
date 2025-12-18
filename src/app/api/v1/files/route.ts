/**
 * File Storage API
 *
 * POST /api/v1/files - Upload a file
 * GET /api/v1/files - List files user can access
 *
 * Charter Principles:
 * - P1: Identity provable (requireAuth)
 * - P2: Default deny (capability checks)
 * - P7: Full audit trail
 * - P9: Fail closed
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasCapability } from "@/lib/auth";
import { auditCreate } from "@/lib/audit";
import { buildFileAccessFilter } from "@/lib/fileAuth";
import {
  generateStorageKey,
  calculateChecksum,
  storeFile,
  validateFile,
  sanitizeFilename,
} from "@/lib/fileStorage";
import { FilePrincipalType, FilePermission } from "@prisma/client";

/**
 * POST /api/v1/files
 *
 * Upload a new file. Requires files:upload capability.
 *
 * Body: multipart/form-data with:
 * - file: The file to upload
 * - description: Optional description
 * - isPublic: Optional, "true" to make public (requires files:manage)
 * - tags: Optional comma-separated tags
 * - grantRoles: Optional comma-separated roles to grant READ access
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  // Check capability
  if (!hasCapability(auth.context.globalRole, "files:upload")) {
    return NextResponse.json(
      { error: "Forbidden", message: "files:upload capability required" },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Bad Request", message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file
    const validationError = validateFile(file.type, file.size);
    if (validationError) {
      return NextResponse.json(
        { error: "Bad Request", message: validationError },
        { status: 400 }
      );
    }

    // Read file data
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate storage key and checksum
    const sanitizedName = sanitizeFilename(file.name);
    const storageKey = generateStorageKey(sanitizedName);
    const checksum = calculateChecksum(buffer);

    // Store file
    await storeFile(storageKey, buffer);

    // Parse options
    const description = formData.get("description") as string | null;
    const isPublicStr = formData.get("isPublic") as string | null;
    const tagsStr = formData.get("tags") as string | null;
    const grantRolesStr = formData.get("grantRoles") as string | null;

    // Only admins can make files public
    let isPublic = false;
    if (isPublicStr === "true") {
      if (!hasCapability(auth.context.globalRole, "files:manage")) {
        return NextResponse.json(
          { error: "Forbidden", message: "files:manage required to create public files" },
          { status: 403 }
        );
      }
      isPublic = true;
    }

    // Create file record
    const fileObject = await prisma.fileObject.create({
      data: {
        name: sanitizedName,
        mimeType: file.type,
        size: file.size,
        checksum,
        storageKey,
        description: description || null,
        isPublic,
        uploadedById: auth.context.memberId,
      },
    });

    // Add tags if provided
    if (tagsStr) {
      const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);
      for (const tag of tags) {
        await prisma.fileTag.create({
          data: { fileId: fileObject.id, tag },
        });
      }
    }

    // Grant role access if provided
    if (grantRolesStr) {
      const roles = grantRolesStr.split(",").map((r) => r.trim()).filter(Boolean);
      for (const role of roles) {
        await prisma.fileAccess.create({
          data: {
            fileId: fileObject.id,
            principalType: FilePrincipalType.ROLE,
            principalId: role,
            permission: FilePermission.READ,
            grantedById: auth.context.memberId,
          },
        });
      }
    }

    // Audit log
    await auditCreate("FileObject", fileObject.id, auth.context, req, {
      name: fileObject.name,
      mimeType: fileObject.mimeType,
      size: fileObject.size,
      isPublic: fileObject.isPublic,
    });

    // Return file metadata (without storageKey for security)
    return NextResponse.json(
      {
        file: {
          id: fileObject.id,
          name: fileObject.name,
          mimeType: fileObject.mimeType,
          size: fileObject.size,
          description: fileObject.description,
          isPublic: fileObject.isPublic,
          createdAt: fileObject.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[FILES] Upload error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to upload file" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/files
 *
 * List files the user can access.
 *
 * Query params:
 * - page: Page number (default 1)
 * - pageSize: Items per page (default 20, max 100)
 * - tag: Filter by tag
 * - search: Search by filename
 * - mimeType: Filter by MIME type prefix (e.g., "image/")
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const mimeTypeFilter = searchParams.get("mimeType");

    // Build access filter
    const accessFilter = buildFileAccessFilter(auth.context);

    // Build additional filters
    const filters: object[] = [accessFilter];

    if (tag) {
      filters.push({
        tags: {
          some: { tag },
        },
      });
    }

    if (search) {
      filters.push({
        name: {
          contains: search,
          mode: "insensitive",
        },
      });
    }

    if (mimeTypeFilter) {
      filters.push({
        mimeType: {
          startsWith: mimeTypeFilter,
        },
      });
    }

    const where = filters.length > 1 ? { AND: filters } : accessFilter;

    // Get total count
    const total = await prisma.fileObject.count({ where });

    // Get files with pagination
    const files = await prisma.fileObject.findMany({
      where,
      include: {
        tags: true,
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      files: files.map((f) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size,
        description: f.description,
        isPublic: f.isPublic,
        tags: f.tags.map((t) => t.tag),
        uploadedBy: f.uploadedBy
          ? {
              id: f.uploadedBy.id,
              name: `${f.uploadedBy.firstName} ${f.uploadedBy.lastName}`,
            }
          : null,
        createdAt: f.createdAt,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("[FILES] List error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to list files" },
      { status: 500 }
    );
  }
}
