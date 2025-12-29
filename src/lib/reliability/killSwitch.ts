// Copyright (c) Murmurant, Inc.
// Kill Switch Registry - Server-side feature flags for reliability
// R3: Inert stubs (all switches default OFF)
// Charter: P9 (fail closed), P4 (no hidden rules)

/**
 * Enumerated kill switches.
 *
 * Each switch controls a specific reliability behavior.
 * All switches default to OFF (false) in R3.
 */
export const KillSwitch = {
  /** Disable all write operations (read-only mode) */
  WRITE_DISABLED: "WRITE_DISABLED",

  /** Disable publishing (content freeze) */
  PUBLISH_DISABLED: "PUBLISH_DISABLED",

  /** Disable admin UI access (emergency lockout) */
  ADMIN_DISABLED: "ADMIN_DISABLED",

  /** Disable preview functionality */
  PREVIEW_DISABLED: "PREVIEW_DISABLED",

  /** Disable external API calls (isolation mode) */
  EXTERNAL_APIS_DISABLED: "EXTERNAL_APIS_DISABLED",

  /** Disable email sending */
  EMAIL_DISABLED: "EMAIL_DISABLED",

  /** Disable new registrations */
  REGISTRATION_DISABLED: "REGISTRATION_DISABLED",
} as const;

export type KillSwitchKey = (typeof KillSwitch)[keyof typeof KillSwitch];

/**
 * Kill switch state with metadata.
 */
export type KillSwitchState = {
  enabled: boolean;
  enabledAt?: Date;
  enabledBy?: string;
  reason?: string;
};

// ============================================================================
// REGISTRY IMPLEMENTATION (STUB)
// ============================================================================

/**
 * Check if a kill switch is enabled.
 *
 * R3 STATUS: STUBBED (always returns false)
 *
 * When implemented (post-R3), this will check:
 * - Database-backed switch state
 * - Environment variable overrides
 * - Emergency toggle API
 *
 * Usage:
 * ```typescript
 * if (isKillSwitchEnabled(KillSwitch.WRITE_DISABLED)) {
 *   return NextResponse.json({ error: 'System in read-only mode' }, { status: 503 });
 * }
 * ```
 */
export function isKillSwitchEnabled(_switchKey: KillSwitchKey): boolean {
  // R3: Stub implementation - always OFF
  // Future: Check database/config for switch state

  // Debug log for observability (Charter P7)
  if (process.env.DEBUG_KILL_SWITCHES === "1") {
    console.log(`[KILL_SWITCH] Checked ${_switchKey} (stub: OFF)`);
  }

  return false;
}

/**
 * Get the state of a kill switch.
 *
 * R3 STATUS: STUBBED (always returns disabled state)
 */
export function getKillSwitchState(_switchKey: KillSwitchKey): KillSwitchState {
  // R3: Stub - always disabled
  return {
    enabled: false,
  };
}

/**
 * Get all kill switch states.
 *
 * R3 STATUS: STUBBED (all switches OFF)
 */
export function getAllKillSwitchStates(): Record<KillSwitchKey, KillSwitchState> {
  const states: Record<string, KillSwitchState> = {};

  for (const key of Object.values(KillSwitch)) {
    states[key] = { enabled: false };
  }

  return states as Record<KillSwitchKey, KillSwitchState>;
}

/**
 * Set a kill switch state.
 *
 * R3 STATUS: STUBBED (no-op, logs only)
 *
 * When implemented, this will:
 * - Update database state
 * - Create audit log entry
 * - Invalidate caches
 */
export function setKillSwitch(
  _switchKey: KillSwitchKey,
  _enabled: boolean,
  _actorId?: string,
  _reason?: string
): void {
  // R3: Stub implementation - no-op
  console.log(
    `[KILL_SWITCH] setKillSwitch called (stub: no-op)`,
    { switch: _switchKey, enabled: _enabled, actor: _actorId, reason: _reason }
  );
}

// ============================================================================
// CONVENIENCE HELPERS
// ============================================================================

/**
 * Check if system is in read-only mode.
 */
export function isReadOnlyMode(): boolean {
  return isKillSwitchEnabled(KillSwitch.WRITE_DISABLED);
}

/**
 * Check if publishing is frozen.
 */
export function isPublishFrozen(): boolean {
  return isKillSwitchEnabled(KillSwitch.PUBLISH_DISABLED);
}

/**
 * Check if admin access is disabled.
 */
export function isAdminDisabled(): boolean {
  return isKillSwitchEnabled(KillSwitch.ADMIN_DISABLED);
}
