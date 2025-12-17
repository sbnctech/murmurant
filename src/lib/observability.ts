/**
 * Observability Utilities for ClubOS
 *
 * Charter Principle P7: Observability is a product feature.
 * Charter Principle P9: Security must fail closed.
 *
 * Provides:
 * - requestId generation and tracking
 * - structured logging helpers
 * - health check utilities
 *
 * Design decisions:
 * - No secrets in logs (P9)
 * - Lightweight dependencies
 * - Fail closed on errors
 */

import { NextRequest } from "next/server";

// ============================================================================
// REQUEST ID
// ============================================================================

/**
 * Generate a unique request ID for traceability.
 *
 * Format: req-{timestamp-base36}-{random-6chars}
 * Example: req-m5x9k2f-a1b2c3
 *
 * This ID should be:
 * - Generated at the start of each request
 * - Logged with any errors
 * - Included in API error responses (safe for client exposure)
 */
export function generateRequestId(): string {
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Extract requestId from request headers, or generate a new one.
 * Supports X-Request-ID header for distributed tracing.
 */
export function getOrCreateRequestId(req: NextRequest): string {
  const existingId = req.headers.get("x-request-id");
  if (existingId && /^[\w-]{10,64}$/.test(existingId)) {
    return existingId;
  }
  return generateRequestId();
}

// ============================================================================
// STRUCTURED LOGGING
// ============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  component?: string;
  operation?: string;
  durationMs?: number;
  [key: string]: unknown;
}

/**
 * Create a structured log entry.
 *
 * Output format is JSON for easy parsing by log aggregators.
 * Sensitive fields are redacted automatically.
 *
 * P9: Never log secrets, tokens, passwords, or PII.
 */
export function log(level: LogLevel, message: string, context?: LogContext): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitizeContext(context),
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    case "debug":
      if (process.env.NODE_ENV !== "production") {
        console.debug(output);
      }
      break;
    default:
      console.log(output);
  }
}

/**
 * Sanitize log context to remove sensitive fields.
 * P9: Security must fail closed - when in doubt, redact.
 */
function sanitizeContext(context?: LogContext): LogContext {
  if (!context) return {};

  const sensitiveKeys = [
    "password",
    "secret",
    "token",
    "authorization",
    "cookie",
    "api_key",
    "apikey",
    "private",
    "credential",
  ];

  const sanitized: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();

    // Redact sensitive keys
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    // Recursively sanitize objects (but not too deep)
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeContext(value as LogContext);
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Log an error with request context.
 * Always includes requestId for traceability.
 */
export function logError(
  error: Error | unknown,
  requestId: string,
  context?: Omit<LogContext, "requestId">
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  log("error", errorMessage, {
    ...context,
    requestId,
    // Include stack trace in non-production only (P9: don't leak internals)
    ...(process.env.NODE_ENV !== "production" && errorStack
      ? { stack: errorStack }
      : {}),
  });
}

// ============================================================================
// HEALTH CHECK UTILITIES
// ============================================================================

export type HealthStatus = "ok" | "degraded" | "error";

export interface HealthCheckResult {
  status: HealthStatus;
  latencyMs?: number;
  lastCheckAt?: string;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Run a health check with timeout and error handling.
 * P9: Fail closed - if check throws or times out, return error status.
 */
export async function runHealthCheck(
  name: string,
  check: () => Promise<void>,
  timeoutMs = 5000
): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    await Promise.race([
      check(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`${name} health check timed out`)), timeoutMs)
      ),
    ]);

    return {
      status: "ok",
      latencyMs: Date.now() - start,
      lastCheckAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "error",
      latencyMs: Date.now() - start,
      lastCheckAt: new Date().toISOString(),
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Aggregate multiple health check results into an overall status.
 */
export function aggregateHealthStatus(checks: Record<string, HealthCheckResult>): HealthStatus {
  const statuses = Object.values(checks).map((c) => c.status);

  if (statuses.includes("error")) {
    return "error";
  }
  if (statuses.includes("degraded")) {
    return "degraded";
  }
  return "ok";
}
