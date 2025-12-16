/**
 * GET /api/health/cron
 *
 * Cron job health check endpoint.
 *
 * Charter Principles:
 * - P7: Observability is a product feature (especially for silent failures)
 * - P9: Security must fail closed
 * - P2: Default deny, least privilege
 *
 * Returns:
 * - 200: Cron system is operational
 * - 503: Cron system is unavailable or misconfigured
 *
 * Auth levels:
 * - Public: Basic status only (ok/error)
 * - Authenticated (admin): Detailed cron status and last run info
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasCapability } from "@/lib/auth";
import {
  generateRequestId,
  logError,
  aggregateHealthStatus,
  type HealthCheckResult,
} from "@/lib/observability";
import {
  getUpcomingTransitionDates,
  getDueTransitions,
} from "@/lib/serviceHistory";

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  const timestamp = new Date().toISOString();

  // Check if caller is authenticated admin (for detailed info)
  let isAdmin = false;
  try {
    const auth = await requireAuth(req);
    if (auth.ok && hasCapability(auth.context.globalRole, "admin:full")) {
      isAdmin = true;
    }
  } catch {
    // Not authenticated - that's fine for basic health check
  }

  const checks: Record<string, HealthCheckResult> = {};

  // Check 1: CRON_SECRET is configured (required for cron to work)
  const cronSecretConfigured = !!(
    process.env.CRON_SECRET &&
    process.env.CRON_SECRET.length >= 16
  );

  checks.cronSecretConfigured = {
    status: cronSecretConfigured ? "ok" : "error",
    lastCheckAt: timestamp,
    ...(cronSecretConfigured
      ? {}
      : { message: "CRON_SECRET not configured" }),
  };

  // Check 2: Can query transition plans (cron's main job)
  let dueCount = 0;
  let upcomingDates: Date[] = [];

  try {
    const due = await getDueTransitions();
    dueCount = due.length;
    upcomingDates = getUpcomingTransitionDates();

    checks.transitionService = {
      status: "ok",
      lastCheckAt: timestamp,
    };
  } catch (error) {
    logError(error, requestId, { component: "health/cron" });
    checks.transitionService = {
      status: "error",
      lastCheckAt: timestamp,
      message: "Transition service unavailable",
    };
  }

  // Check 3: Query last cron execution (from audit log if available)
  let lastCronRun: Date | null = null;
  let lastCronResult: string | null = null;

  try {
    // Look for recent system-cron audit entries
    const lastAudit = await prisma.auditLog.findFirst({
      where: {
        memberId: null, // System operations have no member
        action: "UPDATE",
        resourceType: "transition_plan",
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (lastAudit) {
      lastCronRun = lastAudit.createdAt;
    }

    checks.cronExecution = {
      status: "ok",
      lastCheckAt: timestamp,
    };
  } catch (error) {
    logError(error, requestId, { component: "health/cron" });
    checks.cronExecution = {
      status: "degraded",
      lastCheckAt: timestamp,
      message: "Could not check cron execution history",
    };
  }

  const overallStatus = aggregateHealthStatus(checks);

  // Build response based on auth level
  const baseResponse = {
    status: overallStatus,
    timestamp,
    requestId,
  };

  if (isAdmin) {
    // Admin gets detailed information
    return NextResponse.json(
      {
        ...baseResponse,
        checks: {
          cronSecretConfigured: {
            status: checks.cronSecretConfigured.status,
          },
          transitionService: {
            status: checks.transitionService.status,
          },
          cronExecution: {
            status: checks.cronExecution.status,
          },
        },
        cronStatus: {
          dueTransitionsCount: dueCount,
          upcomingTransitionDates: upcomingDates.map((d) => d.toISOString()),
          lastCronRun: lastCronRun?.toISOString() || null,
          lastCronResult: lastCronResult,
          // P7: Alert if there are stale due transitions
          alert:
            dueCount > 0
              ? `${dueCount} transition(s) are due but not yet applied`
              : null,
        },
      },
      {
        status: overallStatus === "ok" ? 200 : 503,
        headers: {
          "X-Request-ID": requestId,
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }

  // Public response - minimal info
  return NextResponse.json(
    {
      ...baseResponse,
      checks: {
        cron: {
          status: overallStatus,
        },
      },
    },
    {
      status: overallStatus === "ok" ? 200 : 503,
      headers: {
        "X-Request-ID": requestId,
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
