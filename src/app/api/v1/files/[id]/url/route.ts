/**
 * File Download API
 *
 * GET /api/v1/files/[id]/url - Download file content
 *
 * This endpoint serves the actual file binary data.
 * For public files, a signed URL could be generated instead.
 *
 * Charter Principles:
 * - P2: Default deny (permission checks)
 * - P9: Fail closed
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { canReadFile } from "@/lib/fileAuth";
import { readFile } from "@/lib/fileStorage";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/files/[id]/url
 *
 * Download file content. Requires read access.
 *
 * Query params:
 * - download: If "true", sets Content-Disposition to attachment
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const forceDownload = searchParams.get("download") === "true";

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
  });

  if (!file) {
    return NextResponse.json(
      { error: "Not Found", message: "File not found" },
      { status: 404 }
    );
  }

  try {
    // Read file from storage
    const data = await readFile(file.storageKey);

    if (!data) {
      console.error(`[FILES] Storage missing for file ${id}: ${file.storageKey}`);
      return NextResponse.json(
        { error: "Internal Server Error", message: "File data not found" },
        { status: 500 }
      );
    }

    // Verify checksum
    const crypto = await import("crypto");
    const currentChecksum = crypto.createHash("sha256").update(data).digest("hex");
    if (currentChecksum !== file.checksum) {
      console.error(
        `[FILES] Checksum mismatch for file ${id}: expected ${file.checksum}, got ${currentChecksum}`
      );
      return NextResponse.json(
        { error: "Internal Server Error", message: "File integrity check failed" },
        { status: 500 }
      );
    }

    // Build response headers
    const headers: HeadersInit = {
      "Content-Type": file.mimeType,
      "Content-Length": file.size.toString(),
      "Cache-Control": "private, max-age=3600",
      "ETag": `"${file.checksum}"`,
    };

    // Set Content-Disposition
    const disposition = forceDownload ? "attachment" : "inline";
    const encodedFilename = encodeURIComponent(file.name);
    headers["Content-Disposition"] =
      `${disposition}; filename="${file.name}"; filename*=UTF-8''${encodedFilename}`;

    // Return file content (convert Buffer to Uint8Array for NextResponse compatibility)
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[FILES] Download error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to download file" },
      { status: 500 }
    );
  }
}
