import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RegistrationStatus } from "@prisma/client";
import { requireCapability } from "@/lib/auth";

/**
 * GET /api/admin/export/events
 *
 * Export all events as CSV with registration counts.
 * Returns events ordered by startTime for deterministic output.
 * Requires exports:access capability (webmaster does NOT have this).
 */
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "exports:access");
  if (!auth.ok) return auth.response;
  const events = await prisma.event.findMany({
    include: {
      registrations: {
        select: {
          status: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  const headerRow = "id,title,category,startTime,registrationCount,waitlistedCount";

  const dataRows = events.map((e) => {
    const registrationCount = e.registrations.length;
    const waitlistedCount = e.registrations.filter(
      (r) => r.status === RegistrationStatus.WAITLISTED
    ).length;
    const category = e.category ?? "";
    const startTime = e.startTime.toISOString();
    return `${e.id},${e.title},${category},${startTime},${registrationCount},${waitlistedCount}`;
  });

  const csv = [headerRow, ...dataRows].join("\n") + "\n";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="events.csv"',
    },
  });
}
