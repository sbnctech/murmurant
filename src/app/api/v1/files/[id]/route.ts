/**
 * File Detail API
 *
 * GET /api/v1/files/[id] - Get file metadata
 * PATCH /api/v1/files/[id] - Update file metadata
 * DELETE /api/v1/files/[id] - Delete file
 *
 * Charter Principles:
 * - P2: Default deny (permission checks)
 * - P7: Full audit trail
 * - P9: Fail closed
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasCapability } from "@/lib/auth";
import { auditUpdate, auditDelete } from "@/lib/audit";
import { canReadFile, canWriteFile, canAdminFile } from "@/lib/fileAuth";
import { deleteFile as deleteFileFromStorage } from "@/lib/fileStorage";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/files/[id]
 *
 * Get file metadata. Requires read access to the file.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  // Check read access
  const hasAccess = await canReadFile(auth.context, id);
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Not Found", message: "File not found or access denied" },
      { status: 404 }
    );
  }

  const file = await prisma.fileObject.findUnique({
    where: { id },
    include: {
      tags: true,
      uploadedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      accessList: hasCapability(auth.context.globalRole, "files:manage")
        ? {
            include: {
              grantedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          }
        : false,
    },
  });

  if (!file) {
    return NextResponse.json(
      { error: "Not Found", message: "File not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    file: {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      description: file.description,
      isPublic: file.isPublic,
      tags: file.tags.map((t) => t.tag),
      uploadedBy: file.uploadedBy
        ? {
            id: file.uploadedBy.id,
            name: `${file.uploadedBy.firstName} ${file.uploadedBy.lastName}`,
          }
        : null,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      // Only include access list for admins
      accessList: file.accessList
        ? file.accessList.map((a) => {
            const access = a as typeof a & {
              grantedBy?: { id: string; firstName: string; lastName: string } | null;
            };
            return {
              id: access.id,
              principalType: access.principalType,
              principalId: access.principalId,
              permission: access.permission,
              expiresAt: access.expiresAt,
              grantedBy: access.grantedBy
                ? {
                    id: access.grantedBy.id,
                    name: `${access.grantedBy.firstName} ${access.grantedBy.lastName}`,
                  }
                : null,
            };
          })
        : undefined,
    },
  });
}

/**
 * PATCH /api/v1/files/[id]
 *
 * Update file metadata. Requires write access.
 *
 * Body:
 * - description: New description
 * - isPublic: Change visibility (requires files:manage)
 * - addTags: Tags to add
 * - removeTags: Tags to remove
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  // Check write access
  const hasAccess = await canWriteFile(auth.context, id);
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Forbidden", message: "Write access required" },
      { status: 403 }
    );
  }

  const file = await prisma.fileObject.findUnique({
    where: { id },
  });

  if (!file) {
    return NextResponse.json(
      { error: "Not Found", message: "File not found" },
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    const { description, isPublic, addTags, removeTags } = body;

    const updates: Record<string, unknown> = {};
    const before: Record<string, unknown> = {};

    // Update description
    if (description !== undefined) {
      before.description = file.description;
      updates.description = description;
    }

    // Update visibility (requires files:manage)
    if (isPublic !== undefined) {
      if (!hasCapability(auth.context.globalRole, "files:manage")) {
        return NextResponse.json(
          { error: "Forbidden", message: "files:manage required to change visibility" },
          { status: 403 }
        );
      }
      before.isPublic = file.isPublic;
      updates.isPublic = isPublic;
    }

    // Apply updates
    await prisma.fileObject.update({
      where: { id },
      data: updates,
    });

    // Handle tags
    if (addTags && Array.isArray(addTags)) {
      for (const tag of addTags) {
        await prisma.fileTag.upsert({
          where: { fileId_tag: { fileId: id, tag } },
          create: { fileId: id, tag },
          update: {},
        });
      }
    }

    if (removeTags && Array.isArray(removeTags)) {
      await prisma.fileTag.deleteMany({
        where: {
          fileId: id,
          tag: { in: removeTags },
        },
      });
    }

    // Audit log
    if (Object.keys(updates).length > 0) {
      await auditUpdate("FileObject", id, auth.context, req, before, updates);
    }

    // Fetch updated file with tags
    const result = await prisma.fileObject.findUnique({
      where: { id },
      include: { tags: true },
    });

    return NextResponse.json({
      file: {
        id: result!.id,
        name: result!.name,
        mimeType: result!.mimeType,
        size: result!.size,
        description: result!.description,
        isPublic: result!.isPublic,
        tags: result!.tags.map((t) => t.tag),
        updatedAt: result!.updatedAt,
      },
    });
  } catch (error) {
    console.error("[FILES] Update error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update file" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/files/[id]
 *
 * Delete a file. Requires admin access to the file.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  // Check admin access
  const hasAccess = await canAdminFile(auth.context, id);
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Forbidden", message: "Admin access required to delete files" },
      { status: 403 }
    );
  }

  const file = await prisma.fileObject.findUnique({
    where: { id },
  });

  if (!file) {
    return NextResponse.json(
      { error: "Not Found", message: "File not found" },
      { status: 404 }
    );
  }

  try {
    // Delete from storage first
    await deleteFileFromStorage(file.storageKey);

    // Delete from database (cascades to tags and access list)
    await prisma.fileObject.delete({
      where: { id },
    });

    // Audit log
    await auditDelete("FileObject", id, auth.context, req, {
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FILES] Delete error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to delete file" },
      { status: 500 }
    );
  }
}
