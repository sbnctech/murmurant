// Copyright (c) Murmurant, Inc.
// Failure Injection Harness - Controlled chaos testing
// R3: DISABLED by default (compile-time disabled, test-only)
// Charter: P7 (observability), P5 (reversible)

/**
 * SAFETY NOTICE:
 *
 * This module is DISABLED by default and MUST remain disabled in production.
 * Failure injection is ONLY enabled when:
 *   process.env.FAIL_INJECT === "1"
 *
 * This flag MUST NEVER be set in production environments.
 * Enabling failure injection in production is a SEV-1 incident.
 */

/**
 * Injection points where failures can be introduced.
 */
export const InjectionPoint = {
  /** Database read operations */
  DB_READ: "db_read",

  /** Database write operations */
  DB_WRITE: "db_write",

  /** External API calls */
  EXTERNAL_API: "external_api",

  /** Email sending */
  EMAIL_SEND: "email_send",

  /** File storage operations */
  FILE_STORAGE: "file_storage",

  /** Authentication checks */
  AUTH_CHECK: "auth_check",

  /** Payment processing */
  PAYMENT: "payment",
} as const;

export type InjectionPointKey = (typeof InjectionPoint)[keyof typeof InjectionPoint];

/**
 * Failure modes that can be injected.
 */
export const FailureMode = {
  /** Throw an error */
  ERROR: "error",

  /** Return null/undefined */
  NULL: "null",

  /** Delay execution */
  DELAY: "delay",

  /** Timeout (delay + error) */
  TIMEOUT: "timeout",

  /** Return partial/corrupt data */
  CORRUPT: "corrupt",
} as const;

export type FailureModeKey = (typeof FailureMode)[keyof typeof FailureMode];

/**
 * Injection configuration.
 */
export type InjectionConfig = {
  point: InjectionPointKey;
  mode: FailureModeKey;
  probability?: number; // 0-1, default 1.0 (always inject)
  delayMs?: number; // For DELAY/TIMEOUT modes
  errorMessage?: string; // Custom error message
};

// ============================================================================
// RUNTIME STATE
// ============================================================================

/**
 * Check if failure injection is enabled.
 * This is the ONLY place that checks the environment variable.
 */
function isInjectionEnabled(): boolean {
  return process.env.FAIL_INJECT === "1";
}

// Active injection configurations (only populated when enabled)
const activeInjections: Map<InjectionPointKey, InjectionConfig> = new Map();

// ============================================================================
// INJECTION MANAGEMENT (TEST ONLY)
// ============================================================================

/**
 * Register a failure injection.
 *
 * R3 STATUS: DISABLED (no-op unless FAIL_INJECT=1)
 *
 * SAFETY: This function is a no-op in production.
 * Only enabled in test environments with explicit flag.
 *
 * Usage (in tests only):
 * ```typescript
 * registerInjection({
 *   point: InjectionPoint.DB_WRITE,
 *   mode: FailureMode.ERROR,
 *   probability: 0.5,
 *   errorMessage: 'Simulated DB failure',
 * });
 * ```
 */
export function registerInjection(config: InjectionConfig): void {
  if (!isInjectionEnabled()) {
    // Silent no-op in production
    return;
  }

  console.log(`[FAIL_INJECT] Registered: ${config.point} -> ${config.mode}`);
  activeInjections.set(config.point, config);
}

/**
 * Clear a specific injection.
 *
 * R3 STATUS: DISABLED (no-op unless FAIL_INJECT=1)
 */
export function clearInjection(point: InjectionPointKey): void {
  if (!isInjectionEnabled()) {
    return;
  }

  console.log(`[FAIL_INJECT] Cleared: ${point}`);
  activeInjections.delete(point);
}

/**
 * Clear all injections.
 *
 * R3 STATUS: DISABLED (no-op unless FAIL_INJECT=1)
 */
export function clearAllInjections(): void {
  if (!isInjectionEnabled()) {
    return;
  }

  console.log("[FAIL_INJECT] Cleared all injections");
  activeInjections.clear();
}

/**
 * Get active injections.
 *
 * R3 STATUS: Returns empty if disabled
 */
export function getActiveInjections(): InjectionConfig[] {
  if (!isInjectionEnabled()) {
    return [];
  }

  return Array.from(activeInjections.values());
}

// ============================================================================
// INJECTION POINTS (called from application code)
// ============================================================================

/**
 * Check and potentially trigger a failure injection.
 *
 * R3 STATUS: DISABLED (always returns immediately unless FAIL_INJECT=1)
 *
 * Usage (in application code):
 * ```typescript
 * await maybeInjectFailure(InjectionPoint.DB_WRITE);
 * // ... proceed with actual operation
 * ```
 */
export async function maybeInjectFailure(point: InjectionPointKey): Promise<void> {
  // Fast path: injection disabled (production)
  if (!isInjectionEnabled()) {
    return;
  }

  const config = activeInjections.get(point);
  if (!config) {
    return;
  }

  // Check probability
  const probability = config.probability ?? 1.0;
  if (Math.random() > probability) {
    return;
  }

  console.log(`[FAIL_INJECT] Triggering: ${point} -> ${config.mode}`);

  switch (config.mode) {
    case FailureMode.ERROR:
      throw new Error(config.errorMessage || `Injected failure at ${point}`);

    case FailureMode.DELAY:
      await new Promise((resolve) => setTimeout(resolve, config.delayMs || 1000));
      break;

    case FailureMode.TIMEOUT:
      await new Promise((resolve) => setTimeout(resolve, config.delayMs || 5000));
      throw new Error(config.errorMessage || `Injected timeout at ${point}`);

    case FailureMode.NULL:
      // For null mode, caller should check return value
      break;

    case FailureMode.CORRUPT:
      // For corrupt mode, caller should handle data validation
      break;
  }
}

/**
 * Synchronous version for sync code paths.
 *
 * R3 STATUS: DISABLED (no-op unless FAIL_INJECT=1)
 */
export function maybeInjectFailureSync(point: InjectionPointKey): void {
  if (!isInjectionEnabled()) {
    return;
  }

  const config = activeInjections.get(point);
  if (!config) {
    return;
  }

  const probability = config.probability ?? 1.0;
  if (Math.random() > probability) {
    return;
  }

  console.log(`[FAIL_INJECT] Triggering sync: ${point} -> ${config.mode}`);

  if (config.mode === FailureMode.ERROR) {
    throw new Error(config.errorMessage || `Injected failure at ${point}`);
  }
}

// ============================================================================
// STATUS (for test visibility)
// ============================================================================

/**
 * Get failure injection status.
 *
 * R3 STATUS: Returns disabled status in production
 */
export function getInjectionStatus(): {
  enabled: boolean;
  activeCount: number;
  points: InjectionPointKey[];
} {
  const enabled = isInjectionEnabled();

  return {
    enabled,
    activeCount: enabled ? activeInjections.size : 0,
    points: enabled ? Array.from(activeInjections.keys()) : [],
  };
}
