import { NextRequest, NextResponse } from "next/server";
import { processScheduledOperations } from "@/lib/serviceHistory";

/**
 * POST /api/cron/transitions
 *
 * Cron job endpoint to process scheduled operations:
 * 1. Apply approved transitions that are due
 * 2. Close completed event host service records
 *
 * This endpoint is designed to be called by Vercel Cron daily at 8:00 UTC
 * (midnight Pacific during PST, 1am during PDT).
 *
 * Authentication: Requires CRON_SECRET header matching env var.
 */
export async function POST(req: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!cronSecret) {
    console.error("CRON_SECRET environment variable not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Use a system user ID for audit purposes
    const systemUserId = "system-cron";

    const result = await processScheduledOperations(systemUserId);

    console.log("Cron: processScheduledOperations completed", result);

    return NextResponse.json({
      success: true,
      ...result,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in cron transitions:", error);
    return NextResponse.json(
      {
        error: "Failed to process scheduled operations",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/transitions
 *
 * Health check endpoint for the cron job.
 * Returns information about upcoming transitions.
 */
export async function GET() {
  const { getUpcomingTransitionDates, getDueTransitions } = await import(
    "@/lib/serviceHistory"
  );

  try {
    const upcoming = getUpcomingTransitionDates();
    const due = await getDueTransitions();

    return NextResponse.json({
      status: "ok",
      upcomingTransitionDates: upcoming.map((d) => d.toISOString()),
      dueTransitionsCount: due.length,
    });
  } catch (error) {
    console.error("Error in cron transitions health check:", error);
    return NextResponse.json(
      { status: "error", message: String(error) },
      { status: 500 }
    );
  }
}
