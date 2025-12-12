import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/v1/health
 *
 * Health check endpoint for monitoring and load balancer health probes.
 * Returns system health status including optional database connectivity.
 */
export async function GET() {
  const now = new Date().toISOString();
  const env = getEnv();

  const dbConfigured = !!(env.DATABASE_URL && env.DATABASE_URL.trim().length > 0);

  let dbStatus: "ok" | "error" | "skipped" = dbConfigured ? "ok" : "skipped";
  let dbLatencyMs: number | null = null;

  if (dbConfigured) {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
      dbStatus = "ok";
    } catch {
      dbStatus = "error";
      dbLatencyMs = null;
    }
  }

  const response = {
    status: dbStatus === "error" ? "degraded" : "healthy",
    timestamp: now,
    version: process.env.APP_VERSION || "0.1.0",
    checks: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    },
  };

  const httpStatus = response.status === "healthy" ? 200 : 503;

  return NextResponse.json(
    {
      ...response,
      env: {
        dbConfigured,
      },
    },
    { status: httpStatus }
  );
}
