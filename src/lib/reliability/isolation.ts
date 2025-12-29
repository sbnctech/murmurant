// Copyright (c) Murmurant, Inc.
// Dependency Isolation - Wrappers for external service calls
// R3: Inert stubs (pass-through, no timeouts/circuit breakers)
// Charter: P7 (observability), P9 (fail closed)

/**
 * External dependency names for tracking and isolation.
 */
export const ExternalDependency = {
  /** Wild Apricot API */
  WILD_APRICOT: "wild_apricot",

  /** Email provider (e.g., SendGrid, Mailgun) */
  EMAIL_PROVIDER: "email_provider",

  /** Payment processor (e.g., Stripe) */
  PAYMENT_PROVIDER: "payment_provider",

  /** File storage (e.g., S3, Cloudflare R2) */
  FILE_STORAGE: "file_storage",

  /** Database connection */
  DATABASE: "database",

  /** External webhook targets */
  WEBHOOK: "webhook",
} as const;

export type DependencyName = (typeof ExternalDependency)[keyof typeof ExternalDependency];

/**
 * Isolation options for external calls.
 */
export type IsolationOptions = {
  /** Timeout in milliseconds (not enforced in R3) */
  timeoutMs?: number;

  /** Number of failures before circuit opens (not enforced in R3) */
  circuitThreshold?: number;

  /** Time to keep circuit open in ms (not enforced in R3) */
  circuitResetMs?: number;

  /** Fallback function if call fails (not enforced in R3) */
  fallback?: () => unknown;
};

/**
 * Result of an isolated call.
 */
export type IsolationResult<T> = {
  success: boolean;
  data?: T;
  error?: Error;
  durationMs: number;
  timedOut: boolean;
  circuitOpen: boolean;
};

// ============================================================================
// ISOLATION WRAPPER (STUB)
// ============================================================================

/**
 * Wrap an external call with isolation semantics.
 *
 * R3 STATUS: STUBBED (pass-through, no timeout/circuit behavior)
 *
 * When implemented (post-R3), this will:
 * - Enforce timeouts
 * - Track failures for circuit breaker
 * - Emit metrics for observability
 * - Execute fallback on failure
 *
 * Usage:
 * ```typescript
 * const result = await withIsolation(
 *   ExternalDependency.WILD_APRICOT,
 *   () => fetchMemberData(memberId),
 *   { timeoutMs: 5000, fallback: () => null }
 * );
 *
 * if (!result.success) {
 *   console.error('WA call failed:', result.error);
 * }
 * ```
 */
export async function withIsolation<T>(
  dependency: DependencyName,
  fn: () => Promise<T>,
  _options?: IsolationOptions
): Promise<IsolationResult<T>> {
  const startTime = Date.now();

  // Debug log for observability (Charter P7)
  if (process.env.DEBUG_ISOLATION === "1") {
    console.log(`[ISOLATION] Starting call to ${dependency} (stub: pass-through)`);
  }

  try {
    // R3: Stub - direct pass-through, no isolation
    const data = await fn();
    const durationMs = Date.now() - startTime;

    if (process.env.DEBUG_ISOLATION === "1") {
      console.log(`[ISOLATION] ${dependency} succeeded in ${durationMs}ms`);
    }

    return {
      success: true,
      data,
      durationMs,
      timedOut: false,
      circuitOpen: false,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;

    if (process.env.DEBUG_ISOLATION === "1") {
      console.log(`[ISOLATION] ${dependency} failed in ${durationMs}ms:`, error);
    }

    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      durationMs,
      timedOut: false,
      circuitOpen: false,
    };
  }
}

/**
 * Simple pass-through wrapper for sync functions.
 *
 * R3 STATUS: STUBBED (direct call)
 */
export function withIsolationSync<T>(
  dependency: DependencyName,
  fn: () => T,
  _options?: IsolationOptions
): T {
  // R3: Stub - direct pass-through
  if (process.env.DEBUG_ISOLATION === "1") {
    console.log(`[ISOLATION] Sync call to ${dependency} (stub: pass-through)`);
  }

  return fn();
}

// ============================================================================
// CIRCUIT STATUS (for admin dashboard)
// ============================================================================

/**
 * Circuit breaker state.
 */
export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

/**
 * Get circuit breaker status for a dependency.
 *
 * R3 STATUS: STUBBED (always CLOSED)
 */
export function getCircuitStatus(_dependency: DependencyName): {
  state: CircuitState;
  failures: number;
  lastFailure: Date | null;
} {
  // R3: Stub - always healthy
  return {
    state: "CLOSED",
    failures: 0,
    lastFailure: null,
  };
}

/**
 * Get all circuit statuses.
 *
 * R3 STATUS: STUBBED (all CLOSED)
 */
export function getAllCircuitStatuses(): Record<
  DependencyName,
  { state: CircuitState; failures: number }
> {
  const statuses: Record<string, { state: CircuitState; failures: number }> = {};

  for (const dep of Object.values(ExternalDependency)) {
    statuses[dep] = { state: "CLOSED", failures: 0 };
  }

  return statuses as Record<DependencyName, { state: CircuitState; failures: number }>;
}

/**
 * Manually reset a circuit breaker.
 *
 * R3 STATUS: STUBBED (no-op)
 */
export function resetCircuit(_dependency: DependencyName): void {
  // R3: Stub - no-op
  console.log(`[ISOLATION] resetCircuit called (stub: no-op)`, { dependency: _dependency });
}
