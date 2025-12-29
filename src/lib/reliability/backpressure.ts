// Copyright (c) Murmurant, Inc.
// Backpressure Facade - Rate limiting and load shedding
// R3: Inert stubs (no throttling, always allow)
// Charter: P7 (observability), P9 (fail closed)

/**
 * Traffic classifications for rate limiting.
 */
export const TrafficClass = {
  /** Public unauthenticated requests */
  PUBLIC: "public",

  /** Authenticated member requests */
  MEMBER: "member",

  /** Admin API requests */
  ADMIN: "admin",

  /** Background job processing */
  BACKGROUND: "background",

  /** External webhook callbacks */
  WEBHOOK: "webhook",

  /** High-priority system operations */
  SYSTEM: "system",
} as const;

export type TrafficClassification = (typeof TrafficClass)[keyof typeof TrafficClass];

/**
 * Backpressure check result.
 */
export type BackpressureResult = {
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
  queuePosition?: number;
};

/**
 * Backpressure options.
 */
export type BackpressureOptions = {
  /** Identifier for rate limiting (e.g., IP, userId) */
  identifier?: string;

  /** Override default classification limits */
  customLimit?: number;
};

// ============================================================================
// BACKPRESSURE ENFORCEMENT (STUB)
// ============================================================================

/**
 * Check if a request should be allowed or rejected due to backpressure.
 *
 * R3 STATUS: STUBBED (always allows)
 *
 * When implemented (post-R3), this will:
 * - Enforce per-classification rate limits
 * - Track request counts per identifier
 * - Emit metrics for observability
 * - Return retry-after hints when rejecting
 *
 * Usage:
 * ```typescript
 * const check = enforceBackpressure(TrafficClass.PUBLIC, {
 *   identifier: getClientIp(req)
 * });
 *
 * if (!check.allowed) {
 *   return NextResponse.json(
 *     { error: 'Too many requests', retryAfter: check.retryAfterMs },
 *     { status: 429 }
 *   );
 * }
 * ```
 */
export function enforceBackpressure(
  classification: TrafficClassification,
  _options?: BackpressureOptions
): BackpressureResult {
  // R3: Stub implementation - always allow

  // Debug log for observability (Charter P7)
  if (process.env.DEBUG_BACKPRESSURE === "1") {
    console.log(`[BACKPRESSURE] Checked ${classification} (stub: allowed)`, _options);
  }

  return { allowed: true };
}

/**
 * Check backpressure and throw if rejected.
 *
 * R3 STATUS: STUBBED (never throws)
 */
export function requireBackpressure(
  classification: TrafficClassification,
  _options?: BackpressureOptions
): void {
  const result = enforceBackpressure(classification, _options);
  if (!result.allowed) {
    const error = new Error(`Rate limited: ${result.reason || "Too many requests"}`);
    (error as Error & { retryAfterMs?: number }).retryAfterMs = result.retryAfterMs;
    throw error;
  }
}

// ============================================================================
// QUEUE MANAGEMENT (STUB)
// ============================================================================

/**
 * Queue status for background processing.
 */
export type QueueStatus = {
  name: string;
  pending: number;
  processing: number;
  maxSize: number;
  acceptingNew: boolean;
};

/**
 * Check if a queue can accept new items.
 *
 * R3 STATUS: STUBBED (always accepts)
 */
export function canEnqueue(_queueName: string): boolean {
  // R3: Stub - always accept
  return true;
}

/**
 * Get queue status.
 *
 * R3 STATUS: STUBBED (returns empty/healthy status)
 */
export function getQueueStatus(_queueName: string): QueueStatus {
  // R3: Stub - healthy empty queue
  return {
    name: _queueName,
    pending: 0,
    processing: 0,
    maxSize: 1000, // Placeholder
    acceptingNew: true,
  };
}

/**
 * Get all queue statuses.
 *
 * R3 STATUS: STUBBED (returns empty)
 */
export function getAllQueueStatuses(): QueueStatus[] {
  // R3: Stub - no queues defined yet
  return [];
}

// ============================================================================
// LOAD METRICS (for admin dashboard)
// ============================================================================

/**
 * Current system load metrics.
 */
export type LoadMetrics = {
  requestsPerSecond: number;
  avgResponseTimeMs: number;
  errorRate: number;
  queueDepth: number;
  activeConnections: number;
};

/**
 * Get current load metrics.
 *
 * R3 STATUS: STUBBED (returns zero metrics)
 */
export function getLoadMetrics(): LoadMetrics {
  // R3: Stub - no real metrics yet
  return {
    requestsPerSecond: 0,
    avgResponseTimeMs: 0,
    errorRate: 0,
    queueDepth: 0,
    activeConnections: 0,
  };
}

/**
 * Get load metrics by classification.
 *
 * R3 STATUS: STUBBED (returns zero metrics)
 */
export function getLoadMetricsByClass(
  _classification: TrafficClassification
): LoadMetrics {
  // R3: Stub - no real metrics yet
  return {
    requestsPerSecond: 0,
    avgResponseTimeMs: 0,
    errorRate: 0,
    queueDepth: 0,
    activeConnections: 0,
  };
}
