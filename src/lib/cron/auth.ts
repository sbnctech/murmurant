/**
 * Cron Authentication Helpers
 *
 * Charter Principles:
 * - P9: Security must fail closed
 * - P2: Default deny, least privilege
 *
 * Provides authentication for cron endpoints using CRON_SECRET.
 */

import { NextRequest, NextResponse } from "next/server";

export interface CronAuthResult {
  authorized: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Verify cron authentication using Bearer token.
 *
 * Checks the Authorization header against CRON_SECRET env var.
 * Fails closed if CRON_SECRET is not configured.
 *
 * @param req - The incoming request
 * @returns CronAuthResult indicating if the request is authorized
 */
export function verifyCronAuth(req: NextRequest): CronAuthResult {
  const cronSecret = process.env.CRON_SECRET;

  // P9: Fail closed if CRON_SECRET not configured
  if (!cronSecret || cronSecret.length < 16) {
    console.error("[cron-auth] CRON_SECRET not configured or too short");
    return {
      authorized: false,
      error: "Server configuration error",
      statusCode: 500,
    };
  }

  const authHeader = req.headers.get("authorization");

  // Check for missing auth header
  if (!authHeader) {
    return {
      authorized: false,
      error: "Unauthorized",
      statusCode: 401,
    };
  }

  // Check Bearer token format and value
  const expectedToken = `Bearer ${cronSecret}`;
  if (authHeader !== expectedToken) {
    console.warn("[cron-auth] Invalid cron token provided");
    return {
      authorized: false,
      error: "Unauthorized",
      statusCode: 401,
    };
  }

  return { authorized: true };
}

/**
 * Create a standardized error response for cron endpoints.
 *
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @returns NextResponse with JSON error body
 */
export function cronErrorResponse(
  message: string,
  statusCode: number = 500
): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: statusCode }
  );
}
