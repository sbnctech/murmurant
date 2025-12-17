import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/auth";

/**
 * GET /api/admin/export/members
 *
 * Export all members as CSV.
 * Returns members ordered by lastName, firstName for deterministic output.
 * Requires exports:access capability (webmaster does NOT have this).
 */
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "exports:access");
  if (!auth.ok) return auth.response;
  const members = await prisma.member.findMany({
    include: {
      membershipStatus: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const headerRow = "id,name,email,status,joinedAt,phone";

  const dataRows = members.map((m) => {
    const name = `${m.firstName} ${m.lastName}`;
    const status = m.membershipStatus.code;
    const joinedAt = m.joinedAt.toISOString();
    const phone = m.phone ?? "";
    return `${m.id},${name},${m.email},${status},${joinedAt},${phone}`;
  });

  const csv = [headerRow, ...dataRows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="members.csv"',
    },
  });
}
