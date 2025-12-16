/**
 * GET /api/health/db
 *
 * Database health check endpoint.
 *
 * Charter Principles:
 * - P7: Observability is a product feature
 * - P9: Security must fail closed
 *
 * Returns:
 * - 200: Database is healthy
 * - 503: Database is unavailable
 *
 * Auth: Public endpoint (no sensitive data exposed)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateRequestId,
  runHealthCheck,
  logError,
  type HealthCheckResult,
} from "@/lib/observability";

export async function GET() {
  const requestId = generateRequestId();
  const timestamp = new Date().toISOString();

  let dbCheck: HealthCheckResult;

  try {
    dbCheck = await runHealthCheck("database", async () => {
      // Simple connectivity check - no sensitive data
      await prisma.$queryRaw`SELECT 1`;
    });
  } catch (error) {
    logError(error, requestId, { component: "health/db" });
    dbCheck = {
      status: "error",
      lastCheckAt: timestamp,
      message: "Database check failed",
    };
  }

  const response = {
    status: dbCheck.status,
    timestamp,
    requestId,
    checks: {
      database: {
        status: dbCheck.status,
        latencyMs: dbCheck.latencyMs,
        // P9: Don't expose internal error details publicly
        ...(dbCheck.status !== "ok" ? { message: "Database unavailable" } : {}),
      },
    },
  };

  const httpStatus = dbCheck.status === "ok" ? 200 : 503;

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      "X-Request-ID": requestId,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
