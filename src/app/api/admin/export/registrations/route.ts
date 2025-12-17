import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/auth";

/**
 * GET /api/admin/export/registrations
 *
 * Export all registrations as CSV.
 * Requires exports:access capability (webmaster does NOT have this).
 */
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "exports:access");
  if (!auth.ok) return auth.response;
  const registrations = await prisma.eventRegistration.findMany({
    orderBy: { registeredAt: "desc" },
    include: {
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  const headerRow = "id,memberId,memberName,eventId,eventTitle,status,registeredAt";

  const dataRows = registrations.map((r) => {
    const memberName = `${r.member.firstName} ${r.member.lastName}`;
    const eventTitle = r.event.title;

    // Escape commas in titles by quoting
    const safeEventTitle = eventTitle.includes(",") ? `"${eventTitle}"` : eventTitle;
    const safeMemberName = memberName.includes(",") ? `"${memberName}"` : memberName;

    return `${r.id},${r.memberId},${safeMemberName},${r.eventId},${safeEventTitle},${r.status},${r.registeredAt.toISOString()}`;
  });

  const csv = [headerRow, ...dataRows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="registrations.csv"',
    },
  });
}
