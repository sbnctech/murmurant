/**
 * File Storage API
 *
 * POST /api/admin/files - Upload a new file
 *
 * Charter Principles:
 * - P1: Identity provable (uploadedBy tracked)
 * - P2: Default deny (files:upload capability required)
 * - P7: Full audit trail
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { auditMutation } from "@/lib/audit";
import { createFile, createFileSchema } from "@/lib/files";

/**
 * POST /api/admin/files
 * Upload a new file
 *
 * Expects multipart/form-data with:
 * - file: The file to upload
 * - name: Original filename (optional, defaults to file name)
 * - description: File description (optional)
 * - isPublic: Whether file is public (optional, defaults to false)
 * - tags: Comma-separated list of tags (optional)
 */
export async function POST(req: NextRequest) {
  const auth = await requireCapability(req, "files:upload");
  if (!auth.ok) return auth.response;

  try {
    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Bad Request", message: "No file provided" },
        { status: 400 }
      );
    }

    // Read file contents
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse metadata
    const name = (formData.get("name") as string) || file.name;
    const description = formData.get("description") as string | null;
    const isPublicStr = formData.get("isPublic") as string | null;
    const isPublic = isPublicStr === "true";
    const tagsStr = formData.get("tags") as string | null;
    const tags = tagsStr ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean) : undefined;

    // Validate input
    const validationResult = createFileSchema.safeParse({
      name,
      mimeType: file.type || "application/octet-stream",
      description: description || undefined,
      isPublic,
      tags,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation Error", message: validationResult.error.message },
        { status: 400 }
      );
    }

    // Create file
    const fileObject = await createFile(
      validationResult.data,
      buffer,
      auth.context.memberId
    );

    // Audit log
    await auditMutation(req, auth.context, {
      action: "CREATE",
      capability: "files:upload",
      objectType: "FileObject",
      objectId: fileObject!.id,
      metadata: {
        name: fileObject!.name,
        mimeType: fileObject!.mimeType,
        size: fileObject!.size,
        isPublic: fileObject!.isPublic,
      },
    });

    return NextResponse.json({ file: fileObject }, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to upload file" },
      { status: 500 }
    );
  }
}
