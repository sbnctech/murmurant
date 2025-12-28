/**
 * Document Download API
 *
 * GET /api/v1/documents/[id]/download
 *   Download document file (checks access permissions)
 *
 * Authorization: Requires authentication and read access to the document
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
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
        accessList: {
          select: {
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
      const isOwner = document.uploadedById === memberId;
      const hasReadAccess = document.accessList.some(
        (access: Pick<FileAccess, "principalType" | "principalId" | "permission">) =>
          access.principalType === "USER" &&
          access.principalId === memberId &&
          ["READ", "WRITE", "ADMIN"].includes(access.permission)
      );

      if (!isOwner && !hasReadAccess) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
    }

    // Return download metadata
    // In a real implementation, this would generate a signed URL or stream the file
    // For now, we return the storage info for the client to handle
    return NextResponse.json({
      id: document.id,
      name: document.name,
      mimeType: document.mimeType,
      size: document.size,
      storageKey: document.storageKey,
      downloadUrl: `/storage/${document.storageKey}`,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour expiry
    });
  } catch (error) {
    console.error("Document download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
