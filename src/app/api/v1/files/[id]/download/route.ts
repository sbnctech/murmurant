import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { authorizeFileAccess, logFileAccess, verifySignedUrlToken } from "@/lib/files/authorization";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  let accessedById: string | null = null;

  if (token) {
    const verification = verifySignedUrlToken(token);
    if (!verification.valid) {
      return NextResponse.json(
        { error: "Unauthorized", message: verification.reason || "Invalid token" },
        { status: 401 }
      );
    }
    if (verification.fileId !== id) {
      return NextResponse.json(
        { error: "Forbidden", message: "Token does not match file" },
        { status: 403 }
      );
    }
  } else {
    const authResult = await requireAuth(req);
    const authContext = authResult.ok ? authResult.context : null;
    const accessAuth = await authorizeFileAccess(authContext, id);
    if (!accessAuth.authorized) {
      return NextResponse.json(
        { error: accessAuth.status === 401 ? "Unauthorized" : "Forbidden", message: accessAuth.reason },
        { status: accessAuth.status }
      );
    }
    accessedById = accessAuth.context.memberId;
  }

  const file = await prisma.file.findUnique({
    where: { id },
    select: { id: true, filename: true, originalName: true, storageKey: true, mimeType: true, size: true, deletedAt: true },
  });
  if (!file || file.deletedAt) {
    return NextResponse.json({ error: "Not Found", message: "File not found" }, { status: 404 });
  }

  await logFileAccess(id, accessedById, "download", req);

  // TODO: Integrate with storage backend
  return new NextResponse(
    JSON.stringify({ message: "Storage integration pending", storageKey: file.storageKey }),
    {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${file.originalName}"`,
        "Content-Length": file.size.toString(),
      },
    }
  );
}
