/**
 * Feature Flag Evaluation
 *
 * Type-safe feature flag system with environment variable overrides.
 * See docs/reliability/FEATURE_FLAGS.md for documentation.
 */

import {
  FLAG_REGISTRY,
  FlagKey,
  FlagDefinition,
  getDefinition,
  getKillSwitches,
} from "./registry";

export { FLAG_REGISTRY, getDefinition, getKillSwitches };
export type { FlagKey, FlagDefinition };

/**
 * Context for flag evaluation (useful for testing)
 */
export interface FlagContext {
  /** Override flag values (takes precedence over env vars) */
  overrides?: Record<string, boolean>;
}

/**
 * Result of evaluating a flag
 */
export interface FlagEvaluationResult {
  key: string;
  enabled: boolean;
  source: "override" | "env" | "default";
  envVar: string;
  envValue: string | undefined;
  defaultValue: boolean;
}

// Track which flags have been logged to avoid spam
const loggedFlags = new Set<string>();

/**
 * Reset flag logging state (useful for tests)
 */
export function resetFlagLogging(): void {
  loggedFlags.clear();
}

/**
 * Convert a flag key to its environment variable name
 * @example flagKeyToEnvVar("my_feature") => "MURMURANT_FLAG_MY_FEATURE"
 */
export function flagKeyToEnvVar(key: string): string {
  return `MURMURANT_FLAG_${key.toUpperCase()}`;
}

/**
 * Parse an environment variable value as boolean
 */
function parseEnvValue(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  const v = value.toLowerCase().trim();
  if (v === "1" || v === "true") return true;
  if (v === "0" || v === "false") return false;
  // Unknown value - treat as undefined (use default)
  return undefined;
}

/**
 * Evaluate a flag and return detailed result
 */
export function evaluateFlag(
  key: FlagKey | string,
  ctx?: FlagContext
): FlagEvaluationResult {
  const definition = getDefinition(key);
  const envVar = flagKeyToEnvVar(key);
  const envValue = process.env[envVar];
  const defaultValue = definition?.defaultValue ?? false;

  // Check for override first
  if (ctx?.overrides && key in ctx.overrides) {
    return {
      key,
      enabled: ctx.overrides[key],
      source: "override",
      envVar,
      envValue,
      defaultValue,
    };
  }

  // Check environment variable
  const parsedEnv = parseEnvValue(envValue);
  if (parsedEnv !== undefined) {
    return {
      key,
      enabled: parsedEnv,
      source: "env",
      envVar,
      envValue,
      defaultValue,
    };
  }

  // Fall back to default
  return {
    key,
    enabled: defaultValue,
    source: "default",
    envVar,
    envValue,
    defaultValue,
  };
}

/**
 * Check if a feature flag is enabled
 *
 * @param key - The flag key from the registry
 * @param ctx - Optional context for overrides (useful in tests)
 * @returns true if the flag is enabled
 *
 * @example
 * ```typescript
 * if (isEnabled("event_postmortem_enabled")) {
 *   // Show postmortem UI
 * }
 *
 * // In tests
 * isEnabled("my_feature", { overrides: { my_feature: true } })
 * ```
 */
export function isEnabled(key: FlagKey | string, ctx?: FlagContext): boolean {
  const definition = getDefinition(key);

  // Warn on first use of unknown flag
  if (!definition && !loggedFlags.has(key)) {
    console.warn(`[flags] Unknown flag key: "${key}" - returning false (fail closed)`);
    loggedFlags.add(key);
  }

  const result = evaluateFlag(key, ctx);

  // Log first evaluation for debugging
  if (!loggedFlags.has(key)) {
    console.log(
      `[flags] ${key} = ${result.enabled} (source: ${result.source})`
    );
    loggedFlags.add(key);
  }

  return result.enabled;
}

/**
 * Semantic alias for isEnabled - use for kill switches
 *
 * @example
 * ```typescript
 * if (!isKillSwitchActive("email_sending_enabled")) {
 *   console.warn("[kill-switch] Email sending disabled");
 *   return mockSend();
 * }
 * ```
 */
export function isKillSwitchActive(
  key: FlagKey | string,
  ctx?: FlagContext
): boolean {
  return isEnabled(key, ctx);
}

/**
 * Get evaluation results for all flags
 * Useful for admin dashboards
 */
export function getAllFlagStatus(): FlagEvaluationResult[] {
  return FLAG_REGISTRY.map((flag) => evaluateFlag(flag.key));
}

/**
 * Get evaluation results for kill switches only
 * Useful for incident response dashboards
 */
export function getKillSwitchStatus(): FlagEvaluationResult[] {
  return getKillSwitches().map((flag) => evaluateFlag(flag.key));
}
