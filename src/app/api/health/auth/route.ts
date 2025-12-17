/**
 * GET /api/health/auth
 *
 * Authentication system health check endpoint.
 *
 * Charter Principles:
 * - P7: Observability is a product feature
 * - P9: Security must fail closed
 * - P2: Default deny, least privilege
 *
 * Returns:
 * - 200: Auth system is operational
 * - 503: Auth system is unavailable
 *
 * Auth levels:
 * - Public: Basic status only (ok/error)
 * - Authenticated (admin): Detailed auth configuration status
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasCapability } from "@/lib/auth";
import {
  generateRequestId,
  runHealthCheck,
  logError,
  aggregateHealthStatus,
  type HealthCheckResult,
} from "@/lib/observability";

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

  // Check 1: AUTH_SECRET is configured (required for production)
  const authSecretConfigured = !!(
    process.env.AUTH_SECRET &&
    process.env.AUTH_SECRET.length >= 32
  );

  checks.authSecretConfigured = {
    status: authSecretConfigured ? "ok" : "error",
    lastCheckAt: timestamp,
    ...(authSecretConfigured
      ? {}
      : { message: "AUTH_SECRET not properly configured" }),
  };

  // Check 2: Database can query user accounts (auth backend)
  try {
    checks.authBackend = await runHealthCheck("auth_backend", async () => {
      // Check if we can query the user accounts table
      await prisma.userAccount.count();
    });
  } catch (error) {
    logError(error, requestId, { component: "health/auth" });
    checks.authBackend = {
      status: "error",
      lastCheckAt: timestamp,
      message: "Auth backend check failed",
    };
  }

  // Check 3: User accounts table is accessible (auth data store)
  try {
    checks.userStore = await runHealthCheck("user_store", async () => {
      // Check if we can query user accounts
      await prisma.userAccount.count();
    });
  } catch (error) {
    logError(error, requestId, { component: "health/auth" });
    checks.userStore = {
      status: "error",
      lastCheckAt: timestamp,
      message: "User store check failed",
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
          authSecretConfigured: {
            status: checks.authSecretConfigured.status,
            // P9: Don't expose secret length, just whether it's valid
          },
          authBackend: {
            status: checks.authBackend.status,
            latencyMs: checks.authBackend.latencyMs,
          },
          userStore: {
            status: checks.userStore.status,
            latencyMs: checks.userStore.latencyMs,
          },
        },
        config: {
          // Safe metadata only
          nodeEnv: process.env.NODE_ENV || "development",
          authSecretLength: authSecretConfigured ? "valid" : "invalid",
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
        auth: {
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
