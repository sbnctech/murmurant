/**
 * Document Detail API
 *
 * GET /api/v1/documents/[id]
 *   Get document metadata
 *
 * PATCH /api/v1/documents/[id]
 *   Update document metadata (admin only)
 *
 * DELETE /api/v1/documents/[id]
 *   Delete document (admin only)
 *
 * Authorization:
 *   - GET: Requires authentication and read access
 *   - PATCH/DELETE: Requires files:manage capability
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FileAccess } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const document = await prisma.fileObject.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        tags: {
          select: {
            id: true,
            tag: true,
          },
        },
        accessList: {
          select: {
            id: true,
            principalType: true,
            principalId: true,
            permission: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check access permissions
    const memberId = auth.context.memberId;
    const hasFullAccess = auth.context.globalRole === "admin" ||
                          auth.context.globalRole === "webmaster";

    if (!hasFullAccess && !document.isPublic) {
      const isOwner = document.uploadedBy.id === memberId;
      const hasAccess = document.accessList.some(
        (access: Pick<FileAccess, "principalType" | "principalId">) =>
          access.principalType === "USER" && access.principalId === memberId
      );

      if (!isOwner && !hasAccess) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      id: document.id,
      name: document.name,
      mimeType: document.mimeType,
      size: document.size,
      checksum: document.checksum,
      description: document.description,
      isPublic: document.isPublic,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      uploadedBy: document.uploadedBy,
      tags: document.tags,
      accessList: document.accessList,
    });
  } catch (error) {
    console.error("Document get error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

interface UpdateDocumentBody {
  name?: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "files:manage");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body: UpdateDocumentBody = await req.json();

    const existing = await prisma.fileObject.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Update document metadata
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;

    const document = await prisma.fileObject.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        mimeType: true,
        size: true,
        description: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Update tags if provided
    if (body.tags !== undefined) {
      // Delete existing tags
      await prisma.fileTag.deleteMany({
        where: { fileId: id },
      });

      // Create new tags
      if (body.tags.length > 0) {
        await prisma.fileTag.createMany({
          data: body.tags.map((tagName) => ({
            fileId: id,
            tag: tagName,
          })),
        });
      }
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Document update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "files:manage");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const existing = await prisma.fileObject.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Delete associated records first (access list, tags)
    await prisma.$transaction([
      prisma.fileAccess.deleteMany({ where: { fileId: id } }),
      prisma.fileTag.deleteMany({ where: { fileId: id } }),
      prisma.fileObject.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Document delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
