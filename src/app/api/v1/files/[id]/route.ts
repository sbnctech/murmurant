import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { authorizeFileAccess, authorizeFileDelete, logFileAccess } from "@/lib/files/authorization";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await requireAuth(req);
  const authContext = authResult.ok ? authResult.context : null;
  const accessAuth = await authorizeFileAccess(authContext, id);
  if (!accessAuth.authorized) {
    return NextResponse.json(
      { error: accessAuth.status === 401 ? "Unauthorized" : "Forbidden", message: accessAuth.reason },
      { status: accessAuth.status }
    );
  }
  const file = await prisma.file.findUnique({
    where: { id },
    select: {
      id: true, filename: true, originalName: true, mimeType: true, size: true,
      visibility: true, storageKey: true, createdAt: true, updatedAt: true,
      uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
  if (!file) {
    return NextResponse.json({ error: "Not Found", message: "File not found" }, { status: 404 });
  }
  await logFileAccess(id, accessAuth.context.memberId, "view", req);
  return NextResponse.json(file);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await requireAuth(req);
  if (!authResult.ok) return authResult.response;
  const deleteAuth = await authorizeFileDelete(authResult.context, id);
  if (!deleteAuth.authorized) {
    return NextResponse.json(
      { error: deleteAuth.status === 401 ? "Unauthorized" : "Forbidden", message: deleteAuth.reason },
      { status: deleteAuth.status }
    );
  }
  await prisma.file.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: authResult.context.memberId },
  });
  return NextResponse.json({ success: true, message: "File deleted" });
}
