// Copyright (c) Murmurant, Inc.
// Write and Publish Guards - Reliability mechanism stubs
// R3: Inert stubs (always allow, no runtime behavior change)
// Charter: P9 (fail closed), P7 (observability)

/**
 * Guard result indicating whether an operation is allowed.
 */
export type GuardResult = {
  allowed: boolean;
  reason?: string;
};

/**
 * Context for guard evaluation.
 * Used to make guard decisions and for audit logging.
 */
export type GuardContext = {
  actorId?: string;
  operation?: string;
  resourceType?: string;
  resourceId?: string;
};

// ============================================================================
// WRITE GUARD
// ============================================================================

/**
 * Check if writes are allowed.
 *
 * R3 STATUS: STUBBED (always returns allowed: true)
 *
 * When enabled (post-R3), this will check:
 * - Global write disable switch
 * - Degraded mode status
 * - Maintenance windows
 *
 * Usage:
 * ```typescript
 * const writeCheck = canWrite({ actorId: auth.memberId, operation: 'create_page' });
 * if (!writeCheck.allowed) {
 *   return NextResponse.json({ error: writeCheck.reason }, { status: 503 });
 * }
 * ```
 */
export function canWrite(_context?: GuardContext): GuardResult {
  // R3: Stub implementation - always allow
  // Future: Check WRITE_DISABLED kill switch and maintenance mode

  // Debug log for observability (Charter P7)
  if (process.env.DEBUG_GUARDS === "1") {
    console.log("[WRITE_GUARD] Checked (stub: allowed)", _context);
  }

  return { allowed: true };
}

/**
 * Require writes to be allowed, throwing if not.
 *
 * R3 STATUS: STUBBED (never throws)
 */
export function requireWrite(_context?: GuardContext): void {
  const result = canWrite(_context);
  if (!result.allowed) {
    throw new Error(`Write not allowed: ${result.reason || "unknown"}`);
  }
}

// ============================================================================
// PUBLISH GUARD
// ============================================================================

/**
 * Check if publishing is allowed.
 *
 * R3 STATUS: STUBBED (always returns allowed: true)
 *
 * When enabled (post-R3), this will check:
 * - Global publish freeze switch
 * - Content freeze windows
 * - Emergency publish disable
 *
 * Usage:
 * ```typescript
 * const publishCheck = canPublish({ actorId: auth.memberId, resourceType: 'page' });
 * if (!publishCheck.allowed) {
 *   return NextResponse.json({ error: publishCheck.reason }, { status: 503 });
 * }
 * ```
 */
export function canPublish(_context?: GuardContext): GuardResult {
  // R3: Stub implementation - always allow
  // Future: Check PUBLISH_DISABLED kill switch and content freeze mode

  // Debug log for observability (Charter P7)
  if (process.env.DEBUG_GUARDS === "1") {
    console.log("[PUBLISH_GUARD] Checked (stub: allowed)", _context);
  }

  return { allowed: true };
}

/**
 * Require publishing to be allowed, throwing if not.
 *
 * R3 STATUS: STUBBED (never throws)
 */
export function requirePublish(_context?: GuardContext): void {
  const result = canPublish(_context);
  if (!result.allowed) {
    throw new Error(`Publish not allowed: ${result.reason || "unknown"}`);
  }
}

// ============================================================================
// GUARD STATUS (for admin dashboard)
// ============================================================================

/**
 * Get current guard status for admin visibility.
 *
 * R3 STATUS: STUBBED (always returns all enabled)
 */
export function getGuardStatus(): {
  writesEnabled: boolean;
  publishEnabled: boolean;
  lastUpdated: Date | null;
} {
  // R3: Stub - always enabled
  return {
    writesEnabled: true,
    publishEnabled: true,
    lastUpdated: null,
  };
}
