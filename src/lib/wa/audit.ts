// Copyright © 2025 Murmurant, Inc. All rights reserved.
/**
 * Wild Apricot API Audit Logging
 *
 * All WA API operations are logged for:
 * - Security monitoring (detect abuse)
 * - Debugging sync issues
 * - Compliance and accountability
 *
 * Charter: P1 (provable identity), P7 (observability), N5 (audit all mutations)
 */

import { redactSensitiveData, sanitizeForLog } from "./security";

// ============================================================================
// AUDIT TYPES
// ============================================================================

/**
 * WA operation categories for audit.
 */
export type WaOperationType =
  | "AUTH" // Token requests
  | "READ" // GET requests
  | "WRITE" // POST/PUT/DELETE
  | "SYNC" // Background sync operations
  | "RETRY"; // Retried requests

/**
 * WA audit entry structure.
 */
export type WaAuditEntry = {
  /** Unique entry ID */
  id: string;

  /** Timestamp */
  timestamp: Date;

  /** Operation type */
  operationType: WaOperationType;

  /** WA API endpoint called */
  endpoint: string;

  /** HTTP method */
  method: "GET" | "POST" | "PUT" | "DELETE";

  /** WA entity type */
  entityType?: string;

  /** WA entity ID */
  waEntityId?: number;

  /** Murmurant entity ID (if mapped) */
  mmEntityId?: string;

  /** User who triggered this (if known) */
  userId?: string;

  /** Organization ID */
  orgId?: string;

  /** Request duration in ms */
  durationMs: number;

  /** HTTP response status */
  responseStatus: number;

  /** Whether request succeeded */
  success: boolean;

  /** Error message if failed */
  error?: string;

  /** Source of the request */
  source: "user_action" | "background_sync" | "reconciliation" | "retry";

  /** Additional metadata (redacted for PII) */
  metadata?: Record<string, unknown>;
};

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Generate unique audit entry ID.
 */
function generateAuditId(): string {
  return `wa_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Log a WA API operation.
 *
 * This function:
 * 1. Redacts sensitive data
 * 2. Logs to console (P7: observability)
 * 3. Could be extended to write to database
 *
 * @param entry - Audit entry to log
 */
export function logWaOperation(entry: Omit<WaAuditEntry, "id" | "timestamp">): WaAuditEntry {
  const fullEntry: WaAuditEntry = {
    ...entry,
    id: generateAuditId(),
    timestamp: new Date(),
    // Redact any sensitive data in metadata
    metadata: entry.metadata
      ? (redactSensitiveData(entry.metadata) as Record<string, unknown>)
      : undefined,
  };

  // Console logging for observability
  const logLevel = fullEntry.success ? "info" : "error";
  const statusEmoji = fullEntry.success ? "✓" : "✗";

  console[logLevel](
    `[WA-AUDIT] ${statusEmoji} ${fullEntry.operationType} ${fullEntry.method} ${sanitizeForLog(fullEntry.endpoint)}`,
    {
      durationMs: fullEntry.durationMs,
      status: fullEntry.responseStatus,
      entityType: fullEntry.entityType,
      waId: fullEntry.waEntityId,
      source: fullEntry.source,
      ...(fullEntry.error ? { error: sanitizeForLog(fullEntry.error) } : {}),
    }
  );

  // Future: Write to database for persistent audit trail
  // await prisma.waAuditLog.create({ data: fullEntry });

  return fullEntry;
}

/**
 * Log a successful WA read operation.
 */
export function auditWaRead(params: {
  endpoint: string;
  entityType?: string;
  waEntityId?: number;
  userId?: string;
  orgId?: string;
  durationMs: number;
  source?: WaAuditEntry["source"];
  metadata?: Record<string, unknown>;
}): WaAuditEntry {
  return logWaOperation({
    operationType: "READ",
    method: "GET",
    endpoint: params.endpoint,
    entityType: params.entityType,
    waEntityId: params.waEntityId,
    userId: params.userId,
    orgId: params.orgId,
    durationMs: params.durationMs,
    responseStatus: 200,
    success: true,
    source: params.source || "user_action",
    metadata: params.metadata,
  });
}

/**
 * Log a WA write operation.
 */
export function auditWaWrite(params: {
  method: "POST" | "PUT" | "DELETE";
  endpoint: string;
  entityType?: string;
  waEntityId?: number;
  mmEntityId?: string;
  userId?: string;
  orgId?: string;
  durationMs: number;
  responseStatus: number;
  success: boolean;
  error?: string;
  source?: WaAuditEntry["source"];
  metadata?: Record<string, unknown>;
}): WaAuditEntry {
  return logWaOperation({
    operationType: "WRITE",
    method: params.method,
    endpoint: params.endpoint,
    entityType: params.entityType,
    waEntityId: params.waEntityId,
    mmEntityId: params.mmEntityId,
    userId: params.userId,
    orgId: params.orgId,
    durationMs: params.durationMs,
    responseStatus: params.responseStatus,
    success: params.success,
    error: params.error,
    source: params.source || "user_action",
    metadata: params.metadata,
  });
}

/**
 * Log a WA auth operation.
 */
export function auditWaAuth(params: {
  success: boolean;
  durationMs: number;
  error?: string;
  orgId?: string;
}): WaAuditEntry {
  return logWaOperation({
    operationType: "AUTH",
    method: "POST",
    endpoint: "/auth/token",
    durationMs: params.durationMs,
    responseStatus: params.success ? 200 : 401,
    success: params.success,
    error: params.error,
    source: "background_sync",
    orgId: params.orgId,
  });
}

/**
 * Log a failed WA operation.
 */
export function auditWaError(params: {
  operationType: WaOperationType;
  method: WaAuditEntry["method"];
  endpoint: string;
  entityType?: string;
  waEntityId?: number;
  userId?: string;
  orgId?: string;
  durationMs: number;
  responseStatus: number;
  error: string;
  source?: WaAuditEntry["source"];
}): WaAuditEntry {
  return logWaOperation({
    operationType: params.operationType,
    method: params.method,
    endpoint: params.endpoint,
    entityType: params.entityType,
    waEntityId: params.waEntityId,
    userId: params.userId,
    orgId: params.orgId,
    durationMs: params.durationMs,
    responseStatus: params.responseStatus,
    success: false,
    error: params.error,
    source: params.source || "user_action",
  });
}

// ============================================================================
// AUDIT METRICS (for dashboards)
// ============================================================================

/**
 * Metrics summary for WA operations.
 */
export type WaMetricsSummary = {
  /** Time window */
  windowStart: Date;
  windowEnd: Date;

  /** Total requests */
  totalRequests: number;

  /** Successful requests */
  successfulRequests: number;

  /** Failed requests */
  failedRequests: number;

  /** Error rate */
  errorRate: number;

  /** Average latency in ms */
  avgLatencyMs: number;

  /** 95th percentile latency */
  p95LatencyMs: number;

  /** Requests by operation type */
  byOperationType: Record<WaOperationType, number>;

  /** Requests by source */
  bySource: Record<WaAuditEntry["source"], number>;
};

/**
 * Placeholder for metrics calculation.
 * In production, this would query the audit log database.
 */
export function getWaMetrics(_windowMinutes: number = 60): WaMetricsSummary {
  const now = new Date();
  const windowStart = new Date(now.getTime() - _windowMinutes * 60 * 1000);

  // Stub implementation - would query actual data
  return {
    windowStart,
    windowEnd: now,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    errorRate: 0,
    avgLatencyMs: 0,
    p95LatencyMs: 0,
    byOperationType: {
      AUTH: 0,
      READ: 0,
      WRITE: 0,
      SYNC: 0,
      RETRY: 0,
    },
    bySource: {
      user_action: 0,
      background_sync: 0,
      reconciliation: 0,
      retry: 0,
    },
  };
}
