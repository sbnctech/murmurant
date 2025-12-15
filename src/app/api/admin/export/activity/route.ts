import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/auth";

/**
 * GET /api/admin/export/activity
 *
 * Export registration activity as CSV.
 * Returns registrations ordered by registeredAt descending (most recent first).
 * Requires exports:access capability (webmaster does NOT have this).
 */
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "exports:access");
  if (!auth.ok) return auth.response;
  const registrations = await prisma.eventRegistration.findMany({
    include: {
      member: true,
      event: true,
    },
    orderBy: { registeredAt: "desc" },
  });

  const headerRow = "id,type,memberId,memberName,eventId,eventTitle,status,registeredAt";

  const dataRows = registrations.map((r) => {
    const memberName = `${r.member.firstName} ${r.member.lastName}`;
    const eventTitle = r.event.title;
    const registeredAt = r.registeredAt.toISOString();
    return `${r.id},REGISTRATION,${r.memberId},${memberName},${r.eventId},${eventTitle},${r.status},${registeredAt}`;
  });

  const csv = [headerRow, ...dataRows].join("\n") + "\n";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="activity.csv"',
    },
  });
}
