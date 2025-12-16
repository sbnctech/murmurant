import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  authorizeFileAccess, logFileAccess, generateSignedUrlToken,
  SIGNED_URL_DEFAULT_TTL_MINUTES, SIGNED_URL_MAX_TTL_MINUTES,
} from "@/lib/files/authorization";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  let expiresInMinutes = parseInt(searchParams.get("expiresIn") || "", 10);
  if (isNaN(expiresInMinutes) || expiresInMinutes < 1) {
    expiresInMinutes = SIGNED_URL_DEFAULT_TTL_MINUTES;
  } else if (expiresInMinutes > SIGNED_URL_MAX_TTL_MINUTES) {
    expiresInMinutes = SIGNED_URL_MAX_TTL_MINUTES;
  }
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
    select: { id: true, filename: true, mimeType: true },
  });
  if (!file) {
    return NextResponse.json({ error: "Not Found", message: "File not found" }, { status: 404 });
  }
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  let token: string;
  try {
    token = generateSignedUrlToken(id, expiresAt);
  } catch (err) {
    console.error("Failed to generate signed URL:", err);
    return NextResponse.json({ error: "Server Error", message: "Signed URLs not configured" }, { status: 500 });
  }
  await logFileAccess(id, accessAuth.context.memberId, "url_generated", req, expiresAt);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  return NextResponse.json({
    url: `${baseUrl}/api/v1/files/${id}/download?token=${token}`,
    expiresAt: expiresAt.toISOString(),
    expiresIn: expiresInMinutes,
    filename: file.filename,
    mimeType: file.mimeType,
  });
}
