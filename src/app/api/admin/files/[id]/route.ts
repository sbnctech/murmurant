/**
 * File by ID API
 *
 * GET /api/admin/files/:id - Get file metadata (if authorized)
 * PATCH /api/admin/files/:id - Update file metadata (requires WRITE)
 * DELETE /api/admin/files/:id - Delete file (requires ADMIN)
 *
 * Charter Principles:
 * - P2: Default deny (authorization checked for every operation)
 * - P7: Full audit trail
 * - P9: Fail closed (no access without explicit grant)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { auditMutation } from "@/lib/audit";
import {
  getFileById,
  updateFile,
  deleteFile,
  canAccessFile,
  getEffectivePermission,
  updateFileSchema,
} from "@/lib/files";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/admin/files/:id
 * Get file metadata if the user has at least READ permission.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // Check authorization
    const canAccess = await canAccessFile(
      id,
      auth.context.memberId,
      auth.context.globalRole,
      "READ"
    );

    if (!canAccess) {
      return NextResponse.json(
        { error: "Not Found", message: "File not found or access denied" },
        { status: 404 }
      );
    }

    const file = await getFileById(id);

    if (!file) {
      return NextResponse.json(
        { error: "Not Found", message: "File not found" },
        { status: 404 }
      );
    }

    // Get user's effective permission on this file
    const effectivePermission = await getEffectivePermission(
      id,
      auth.context.memberId,
      auth.context.globalRole
    );

    return NextResponse.json({
      file,
      effectivePermission,
    });
  } catch (error) {
    console.error("Error getting file:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to get file" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/files/:id
 * Update file metadata. Requires WRITE permission.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // Check WRITE permission
    const canAccess = await canAccessFile(
      id,
      auth.context.memberId,
      auth.context.globalRole,
      "WRITE"
    );

    if (!canAccess) {
      return NextResponse.json(
        { error: "Forbidden", message: "Insufficient permissions to update this file" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validate input
    const validationResult = updateFileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation Error", message: validationResult.error.message },
        { status: 400 }
      );
    }

    // Get current state for audit
    const before = await getFileById(id);
    if (!before) {
      return NextResponse.json(
        { error: "Not Found", message: "File not found" },
        { status: 404 }
      );
    }

    // Update file
    const file = await updateFile(id, validationResult.data);

    // Audit log
    await auditMutation(req, auth.context, {
      action: "UPDATE",
      capability: "files:upload",
      objectType: "FileObject",
      objectId: id,
      metadata: {
        changes: validationResult.data,
      },
    });

    return NextResponse.json({ file });
  } catch (error) {
    console.error("Error updating file:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update file" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/files/:id
 * Delete a file. Requires ADMIN permission.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // Check ADMIN permission
    const canAccess = await canAccessFile(
      id,
      auth.context.memberId,
      auth.context.globalRole,
      "ADMIN"
    );

    if (!canAccess) {
      return NextResponse.json(
        { error: "Forbidden", message: "Insufficient permissions to delete this file" },
        { status: 403 }
      );
    }

    // Get file for audit log before deletion
    const file = await getFileById(id);
    if (!file) {
      return NextResponse.json(
        { error: "Not Found", message: "File not found" },
        { status: 404 }
      );
    }

    // Delete file
    await deleteFile(id);

    // Audit log
    await auditMutation(req, auth.context, {
      action: "DELETE",
      capability: "files:manage",
      objectType: "FileObject",
      objectId: id,
      metadata: {
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found")) {
      return NextResponse.json(
        { error: "Not Found", message: "File not found" },
        { status: 404 }
      );
    }
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to delete file" },
      { status: 500 }
    );
  }
}
