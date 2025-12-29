// Copyright © 2025 Murmurant, Inc. All rights reserved.
/**
 * Member Data Read-Through Cache (F3)
 *
 * Implements the read-through caching pattern for member data from Wild Apricot.
 * MM reads from WA, caches locally for performance, and provides staleness indicators.
 *
 * Features:
 * - TTL-based caching (5 min default for profiles)
 * - Staleness indicators (fresh/cached/stale/fallback)
 * - Manual refresh support
 * - Background sync polling
 * - MM fallback when WA unavailable
 *
 * Charter: P7 (observability), P9 (fail closed)
 */

import { WaContact } from "./types";
import { getWaClient, ContactFilter } from "./client";
import { auditWaRead } from "./audit";

// ============================================================================
// CACHE TYPES
// ============================================================================

/**
 * Data source for cached data.
 */
export type CacheSource = "wa_live" | "wa_cached" | "mm_fallback";

/**
 * Cached data wrapper with staleness tracking.
 * Per architecture doc section 3.3.
 */
export type CachedData<T> = {
  /** The cached data */
  data: T;

  /** When the data was cached */
  cachedAt: Date;

  /** Source of the data */
  source: CacheSource;

  /** Whether cache TTL has been exceeded */
  stale: boolean;

  /** Age in seconds */
  ageSeconds: number;
};

/**
 * Cache entry for internal storage.
 */
type CacheEntry<T> = {
  data: T;
  cachedAt: Date;
  expiresAt: Date;
  waId: number;
};

/**
 * Member cache configuration.
 */
export type MemberCacheConfig = {
  /** Cache TTL in milliseconds (default: 5 minutes) */
  ttlMs: number;

  /** Stale threshold in milliseconds (default: 60 minutes) */
  staleThresholdMs: number;

  /** Maximum cache entries (LRU eviction) */
  maxEntries: number;
};

/**
 * Default cache configuration per architecture doc section 3.2.
 */
export const DEFAULT_MEMBER_CACHE_CONFIG: MemberCacheConfig = {
  ttlMs: 5 * 60 * 1000, // 5 minutes
  staleThresholdMs: 60 * 60 * 1000, // 60 minutes
  maxEntries: 10000,
};

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

/**
 * In-memory LRU cache for member data.
 *
 * Note: This is a simple in-memory implementation suitable for single-server
 * deployments. For multi-server deployments, replace with Redis.
 */
class MemberCache {
  private cache: Map<number, CacheEntry<WaContact>> = new Map();
  private config: MemberCacheConfig;
  private accessOrder: number[] = [];

  constructor(config: MemberCacheConfig = DEFAULT_MEMBER_CACHE_CONFIG) {
    this.config = config;
  }

  /**
   * Get a cached member by WA ID.
   */
  get(waId: number): CacheEntry<WaContact> | null {
    const entry = this.cache.get(waId);
    if (!entry) return null;

    // Update access order for LRU
    this.accessOrder = this.accessOrder.filter((id) => id !== waId);
    this.accessOrder.push(waId);

    return entry;
  }

  /**
   * Cache a member.
   */
  set(waId: number, contact: WaContact): void {
    // Evict if at capacity
    while (this.cache.size >= this.config.maxEntries) {
      const oldest = this.accessOrder.shift();
      if (oldest !== undefined) {
        this.cache.delete(oldest);
      }
    }

    const now = new Date();
    this.cache.set(waId, {
      data: contact,
      cachedAt: now,
      expiresAt: new Date(now.getTime() + this.config.ttlMs),
      waId,
    });

    // Update access order
    this.accessOrder = this.accessOrder.filter((id) => id !== waId);
    this.accessOrder.push(waId);
  }

  /**
   * Invalidate a specific member.
   */
  invalidate(waId: number): void {
    this.cache.delete(waId);
    this.accessOrder = this.accessOrder.filter((id) => id !== waId);
  }

  /**
   * Invalidate all cached members.
   */
  invalidateAll(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache stats for observability.
   */
  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxEntries,
      hitRate: this._hitRate,
    };
  }

  private _hits = 0;
  private _misses = 0;

  private get _hitRate(): number {
    const total = this._hits + this._misses;
    return total > 0 ? this._hits / total : 0;
  }

  recordHit(): void {
    this._hits++;
  }

  recordMiss(): void {
    this._misses++;
  }

  /**
   * Check if entry is expired (past TTL).
   */
  isExpired(entry: CacheEntry<WaContact>): boolean {
    return new Date() > entry.expiresAt;
  }

  /**
   * Check if entry is stale (past stale threshold).
   */
  isStale(entry: CacheEntry<WaContact>): boolean {
    const age = Date.now() - entry.cachedAt.getTime();
    return age > this.config.staleThresholdMs;
  }

  /**
   * Get configuration.
   */
  getConfig(): MemberCacheConfig {
    return this.config;
  }
}

// Singleton cache instance
let memberCache: MemberCache | null = null;

/**
 * Get the member cache instance.
 */
export function getMemberCache(
  config?: MemberCacheConfig
): MemberCache {
  if (!memberCache) {
    memberCache = new MemberCache(config);
  }
  return memberCache;
}

/**
 * Reset the cache (for testing).
 */
export function resetMemberCache(): void {
  memberCache = null;
}

// ============================================================================
// MEMBER SYNC SERVICE
// ============================================================================

/**
 * Get a member by WA ID with read-through caching.
 *
 * 1. Check cache first
 * 2. If cache hit and not expired, return cached data
 * 3. If cache miss or expired, fetch from WA
 * 4. Cache the result
 * 5. Return with staleness indicator
 */
export async function getMember(
  waId: number,
  options?: {
    /** Force refresh from WA even if cached */
    forceRefresh?: boolean;
    /** User ID for audit logging */
    userId?: string;
  }
): Promise<CachedData<WaContact> | null> {
  const cache = getMemberCache();
  const client = getWaClient();

  // Check cache first (unless force refresh)
  if (!options?.forceRefresh) {
    const cached = cache.get(waId);
    if (cached && !cache.isExpired(cached)) {
      cache.recordHit();

      const ageSeconds = Math.floor(
        (Date.now() - cached.cachedAt.getTime()) / 1000
      );

      return {
        data: cached.data,
        cachedAt: cached.cachedAt,
        source: "wa_cached",
        stale: cache.isStale(cached),
        ageSeconds,
      };
    }
    cache.recordMiss();
  }

  // WA not configured - return from cache as fallback or null
  if (!client) {
    const cached = cache.get(waId);
    if (cached) {
      const ageSeconds = Math.floor(
        (Date.now() - cached.cachedAt.getTime()) / 1000
      );
      return {
        data: cached.data,
        cachedAt: cached.cachedAt,
        source: "mm_fallback",
        stale: true,
        ageSeconds,
      };
    }
    return null;
  }

  // Fetch from WA
  try {
    const contact = await client.getContact(waId);
    const now = new Date();

    // Cache the result
    cache.set(waId, contact);

    // Log the sync
    auditWaRead({
      endpoint: `/contacts/${waId}`,
      entityType: "contact",
      waEntityId: waId,
      source: options?.userId ? "user_action" : "background_sync",
      userId: options?.userId,
      durationMs: 0, // Duration tracked by WA client
    });

    return {
      data: contact,
      cachedAt: now,
      source: "wa_live",
      stale: false,
      ageSeconds: 0,
    };
  } catch (error) {
    // On error, fall back to cache
    const cached = cache.get(waId);
    if (cached) {
      const ageSeconds = Math.floor(
        (Date.now() - cached.cachedAt.getTime()) / 1000
      );
      return {
        data: cached.data,
        cachedAt: cached.cachedAt,
        source: "mm_fallback",
        stale: true,
        ageSeconds,
      };
    }

    // No cache, propagate error
    throw error;
  }
}

/**
 * Get multiple members with read-through caching.
 */
export async function getMembers(
  waIds: number[],
  options?: {
    forceRefresh?: boolean;
    userId?: string;
  }
): Promise<Map<number, CachedData<WaContact>>> {
  const results = new Map<number, CachedData<WaContact>>();

  // Fetch in parallel
  const promises = waIds.map(async (waId) => {
    try {
      const result = await getMember(waId, options);
      if (result) {
        results.set(waId, result);
      }
    } catch {
      // Individual failures don't fail the batch
    }
  });

  await Promise.all(promises);
  return results;
}

/**
 * Search members with caching.
 *
 * Returns cached results if available, otherwise fetches from WA.
 */
export async function searchMembers(
  filter: ContactFilter,
  options?: {
    forceRefresh?: boolean;
    userId?: string;
  }
): Promise<CachedData<WaContact[]>> {
  const client = getWaClient();
  const cache = getMemberCache();

  if (!client) {
    // WA not available - return empty with fallback indicator
    return {
      data: [],
      cachedAt: new Date(),
      source: "mm_fallback",
      stale: true,
      ageSeconds: 0,
    };
  }

  try {
    const result = await client.getContacts({
      ...filter,
      limit: 500,
    });

    const now = new Date();

    // Cache individual contacts
    for (const contact of result.items) {
      cache.set(contact.Id, contact);
    }

    auditWaRead({
      endpoint: "/contacts",
      entityType: "contact",
      source: options?.userId ? "user_action" : "background_sync",
      userId: options?.userId,
      durationMs: 0, // Duration tracked by WA client
    });

    return {
      data: result.items,
      cachedAt: now,
      source: "wa_live",
      stale: false,
      ageSeconds: 0,
    };
  } catch {
    // On error, return empty with fallback indicator
    return {
      data: [],
      cachedAt: new Date(),
      source: "mm_fallback",
      stale: true,
      ageSeconds: 0,
    };
  }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Invalidate a member's cache entry.
 *
 * Use when a member is edited (locally or via webhook).
 */
export function invalidateMember(waId: number): void {
  getMemberCache().invalidate(waId);
}

/**
 * Invalidate all member cache entries.
 *
 * Use for manual "refresh all" action.
 */
export function invalidateAllMembers(): void {
  getMemberCache().invalidateAll();
}

/**
 * Manual refresh for a member.
 *
 * Forces a fresh fetch from WA and updates cache.
 */
export async function refreshMember(
  waId: number,
  userId?: string
): Promise<CachedData<WaContact> | null> {
  return getMember(waId, { forceRefresh: true, userId });
}

// ============================================================================
// BACKGROUND SYNC
// ============================================================================

/**
 * Sync state for background polling.
 */
type SyncState = {
  lastSyncTime: Date | null;
  isRunning: boolean;
  intervalId: ReturnType<typeof setInterval> | null;
};

const syncState: SyncState = {
  lastSyncTime: null,
  isRunning: false,
  intervalId: null,
};

/**
 * Incremental sync - fetch members modified since last sync.
 *
 * Per architecture doc section 6.2.
 */
export async function incrementalSync(): Promise<{
  synced: number;
  errors: number;
  duration: number;
}> {
  if (syncState.isRunning) {
    return { synced: 0, errors: 0, duration: 0 };
  }

  const client = getWaClient();
  if (!client) {
    return { synced: 0, errors: 0, duration: 0 };
  }

  syncState.isRunning = true;
  const startTime = Date.now();
  let synced = 0;
  let errors = 0;

  try {
    // Default to last 15 minutes if no previous sync
    const since =
      syncState.lastSyncTime ||
      new Date(Date.now() - 15 * 60 * 1000);

    const result = await client.getAllContacts({
      updatedSince: since,
    });

    const cache = getMemberCache();
    for (const contact of result) {
      try {
        cache.set(contact.Id, contact);
        synced++;
      } catch {
        errors++;
      }
    }

    syncState.lastSyncTime = new Date();

    auditWaRead({
      endpoint: "/contacts",
      entityType: "contact",
      source: "background_sync",
      durationMs: 0, // Duration tracked by WA client
    });
  } catch {
    errors++;
  } finally {
    syncState.isRunning = false;
  }

  return {
    synced,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Start background sync polling.
 *
 * Polls WA for changes every intervalMs (default: 5 minutes).
 */
export function startBackgroundSync(intervalMs: number = 5 * 60 * 1000): void {
  if (syncState.intervalId) {
    // Already running
    return;
  }

  // Run immediately
  incrementalSync().catch(() => {
    // Swallow errors in background sync
  });

  // Then poll at interval
  syncState.intervalId = setInterval(() => {
    incrementalSync().catch(() => {
      // Swallow errors in background sync
    });
  }, intervalMs);
}

/**
 * Stop background sync polling.
 */
export function stopBackgroundSync(): void {
  if (syncState.intervalId) {
    clearInterval(syncState.intervalId);
    syncState.intervalId = null;
  }
}

/**
 * Get sync status for observability.
 */
export function getSyncStatus(): {
  lastSyncTime: Date | null;
  isRunning: boolean;
  cacheStats: { size: number; maxSize: number; hitRate: number };
} {
  return {
    lastSyncTime: syncState.lastSyncTime,
    isRunning: syncState.isRunning,
    cacheStats: getMemberCache().getStats(),
  };
}

// ============================================================================
// STALENESS HELPERS
// ============================================================================

/**
 * Get staleness indicator class for UI display.
 *
 * Per architecture doc section 3.3:
 * - Green: Fresh from WA (< 5 min)
 * - Yellow: Cached (5-60 min)
 * - Orange: Stale (> 60 min) or fallback
 */
export function getStalenessIndicator(
  cachedData: CachedData<unknown>
): "fresh" | "cached" | "stale" {
  if (cachedData.source === "mm_fallback") {
    return "stale";
  }

  if (cachedData.source === "wa_live" && cachedData.ageSeconds < 30) {
    return "fresh";
  }

  if (cachedData.stale) {
    return "stale";
  }

  return "cached";
}

/**
 * Get human-readable staleness label.
 */
export function getStalenessLabel(cachedData: CachedData<unknown>): string {
  const indicator = getStalenessIndicator(cachedData);

  switch (indicator) {
    case "fresh":
      return "Just updated";
    case "cached":
      if (cachedData.ageSeconds < 60) {
        return `Updated ${cachedData.ageSeconds}s ago`;
      }
      const minutes = Math.floor(cachedData.ageSeconds / 60);
      return `Updated ${minutes}m ago`;
    case "stale":
      if (cachedData.source === "mm_fallback") {
        return "Using cached data (WA unavailable)";
      }
      const hours = Math.floor(cachedData.ageSeconds / 3600);
      if (hours > 0) {
        return `Updated ${hours}h ago`;
      }
      return `Updated ${Math.floor(cachedData.ageSeconds / 60)}m ago`;
  }
}
