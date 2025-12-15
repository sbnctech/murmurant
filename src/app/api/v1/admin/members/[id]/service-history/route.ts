import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { errors } from "@/lib/api";
import { getMemberServiceHistory, getServiceCounts } from "@/lib/serviceHistory";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/admin/members/:id/service-history
 *
 * Get all service history records for a specific member.
 * Requires members:view capability.
 *
 * Query params:
 * - includeCounts: boolean - include service counts by type (default: false)
 *
 * Response:
 * - records: ServiceHistoryRecord[]
 * - counts?: Record<ServiceType, { total: number, active: number }>
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireCapability(req, "members:view");
  if (!auth.ok) return auth.response;

  const { id: memberId } = await params;

  try {
    // Verify member exists
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    });

    if (!member) {
      return errors.notFound("Member", memberId);
    }

    const { searchParams } = new URL(req.url);
    const includeCounts = searchParams.get("includeCounts") === "true";

    const records = await getMemberServiceHistory(memberId);

    const response: {
      records: typeof records;
      counts?: Awaited<ReturnType<typeof getServiceCounts>>;
    } = { records };

    if (includeCounts) {
      response.counts = await getServiceCounts(memberId);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching member service history:", error);
    return errors.internal("Failed to fetch member service history");
  }
}
