import { NextRequest, NextResponse } from "next/server";
import { processScheduledOperations } from "@/lib/serviceHistory";
import {
  verifyCronAuth,
  cronErrorResponse,
  withJobRun,
  generateRequestId,
  getLatestJobRun,
} from "@/lib/cron";

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
 * Authentication: Requires CRON_SECRET Bearer token.
 * Idempotency: Uses withJobRun to ensure only one execution per day.
 */
export async function POST(req: NextRequest) {
  // Generate request ID for tracing
  const requestId = generateRequestId();

  // Verify cron authentication (P9: fail closed)
  const authResult = verifyCronAuth(req);
  if (!authResult.authorized) {
    console.warn(`[transitions] Auth failed`, { requestId });
    return cronErrorResponse(
      authResult.error || "Unauthorized",
      authResult.statusCode || 401
    );
  }

  // Use today's date as the schedule key
  const scheduledFor = new Date();

  // Execute with idempotency guarantee
  const jobResult = await withJobRun(
    "transitions",
    scheduledFor,
    async () => {
      // Use a system user ID for audit purposes
      const systemUserId = "system-cron";
      return processScheduledOperations(systemUserId);
    },
    { requestId }
  );

  console.log(`[transitions] Job completed`, {
    requestId,
    runId: jobResult.runId,
    executed: jobResult.executed,
    status: jobResult.status,
  });

  if (!jobResult.executed) {
    // Job was skipped (already ran today)
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: "Job already executed for this date",
      runId: jobResult.runId,
      requestId,
    });
  }

  if (jobResult.status === "FAILED") {
    return NextResponse.json(
      {
        success: false,
        error: "Job execution failed",
        runId: jobResult.runId,
        requestId,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    ...jobResult.result,
    runId: jobResult.runId,
    requestId,
    processedAt: new Date().toISOString(),
  });
}

/**
 * GET /api/cron/transitions
 *
 * Health check endpoint for the cron job.
 * Returns information about upcoming transitions and last job run.
 * NOTE: This endpoint does not require auth for monitoring purposes.
 */
export async function GET() {
  const { getUpcomingTransitionDates, getDueTransitions } = await import(
    "@/lib/serviceHistory"
  );

  try {
    const upcoming = getUpcomingTransitionDates();
    const due = await getDueTransitions();
    const lastRun = await getLatestJobRun("transitions");

    return NextResponse.json({
      status: "ok",
      upcomingTransitionDates: upcoming.map((d) => d.toISOString()),
      dueTransitionsCount: due.length,
      lastRun: lastRun
        ? {
            id: lastRun.id,
            scheduledFor: lastRun.scheduledFor.toISOString(),
            status: lastRun.status,
            startedAt: lastRun.startedAt?.toISOString(),
            finishedAt: lastRun.finishedAt?.toISOString(),
            error: lastRun.errorSummary,
          }
        : null,
    });
  } catch (error) {
    console.error("Error in cron transitions health check:", error);
    return NextResponse.json(
      { status: "error", message: String(error) },
      { status: 500 }
    );
  }
}
