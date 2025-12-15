import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { errors } from "@/lib/api";
import {
  getServiceHistory,
  createServiceRecord,
  serviceHistoryFiltersSchema,
  createServiceRecordSchema,
  paginationSchema,
} from "@/lib/serviceHistory";

/**
 * GET /api/v1/admin/service-history
 *
 * List service history records with filters and pagination.
 * Requires members:view capability.
 *
 * Query params:
 * - memberId: UUID - filter by member
 * - committeeId: UUID - filter by committee
 * - termId: UUID - filter by term
 * - eventId: UUID - filter by event
 * - serviceType: ServiceType - filter by type
 * - activeOnly: boolean - only active records
 * - startAfter: ISO date - records starting after this date
 * - endBefore: ISO date - records ending before this date
 * - page: number - page number (default: 1)
 * - limit: number - items per page (default: 20, max: 100)
 */
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "members:view");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());

    const filtersResult = serviceHistoryFiltersSchema.safeParse(params);
    if (!filtersResult.success) {
      return errors.validation(
        filtersResult.error.issues.map((e) => e.message).join(", ")
      );
    }

    const paginationResult = paginationSchema.safeParse(params);
    if (!paginationResult.success) {
      return errors.validation(
        paginationResult.error.issues.map((e) => e.message).join(", ")
      );
    }

    const result = await getServiceHistory(
      filtersResult.data,
      paginationResult.data
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching service history:", error);
    return errors.internal("Failed to fetch service history");
  }
}

/**
 * POST /api/v1/admin/service-history
 *
 * Create a new service history record.
 * Requires users:manage capability.
 *
 * Request body:
 * - memberId: UUID (required)
 * - serviceType: ServiceType (required)
 * - roleTitle: string (required)
 * - committeeId: UUID (optional)
 * - committeeName: string (optional)
 * - eventId: UUID (optional)
 * - eventTitle: string (optional)
 * - termId: UUID (optional)
 * - termName: string (optional)
 * - startAt: ISO date (required)
 * - notes: string (optional)
 * - transitionPlanId: UUID (optional)
 */
export async function POST(req: NextRequest) {
  const auth = await requireCapability(req, "users:manage");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();

    const parseResult = createServiceRecordSchema.safeParse(body);
    if (!parseResult.success) {
      return errors.validation(
        parseResult.error.issues.map((e) => e.message).join(", ")
      );
    }

    const record = await createServiceRecord(
      parseResult.data,
      auth.context.memberId
    );

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Error creating service record:", error);
    if (error instanceof Error) {
      return errors.internal(error.message);
    }
    return errors.internal("Failed to create service record");
  }
}
