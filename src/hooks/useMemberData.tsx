// Copyright © 2025 Murmurant, Inc. All rights reserved.
/**
 * useMemberData Hook
 *
 * Client-side hook for fetching member data from Wild Apricot with caching.
 * Provides loading state, staleness indicators, and manual refresh.
 *
 * Charter Compliance:
 * - P7: Observability (staleness indicators)
 * - P9: Fail closed (graceful degradation with fallback)
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { WaContact } from "@/lib/wa/types";
import type { CachedData, CacheSource } from "@/lib/wa/memberSync";
import {
  getMember,
  getMembers,
  refreshMember,
  getStalenessIndicator,
  getStalenessLabel,
} from "@/lib/wa/memberSync";

// ============================================================================
// Types
// ============================================================================

export interface UseMemberDataResult {
  /** The member data, or null if not loaded */
  member: WaContact | null;

  /** Full cached data with staleness info */
  cachedData: CachedData<WaContact> | null;

  /** True while fetching data */
  loading: boolean;

  /** True while refreshing (after initial load) */
  refreshing: boolean;

  /** Error message if fetch failed */
  error: string | null;

  /** Data source (wa_live, wa_cached, mm_fallback) */
  source: CacheSource | null;

  /** Staleness level (fresh, cached, stale) */
  staleness: "fresh" | "cached" | "stale" | null;

  /** Human-readable staleness label */
  stalenessLabel: string | null;

  /** Age of data in seconds */
  ageSeconds: number | null;

  /** Whether data is stale (> 60 min or fallback) */
  isStale: boolean;

  /** Manually refresh data from WA */
  refresh: () => Promise<void>;
}

export interface UseMemberDataOptions {
  /** WA contact ID to fetch */
  waId: number;

  /** User ID for audit logging */
  userId?: string;

  /** Auto-refresh when data becomes stale */
  autoRefresh?: boolean;

  /** Auto-refresh interval in ms (default: disabled) */
  autoRefreshInterval?: number;

  /** Skip initial fetch (for SSR hydration) */
  skipInitialFetch?: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for fetching and managing a single member's data with caching.
 */
export function useMemberData({
  waId,
  userId,
  autoRefresh = false,
  autoRefreshInterval,
  skipInitialFetch = false,
}: UseMemberDataOptions): UseMemberDataResult {
  const [cachedData, setCachedData] = useState<CachedData<WaContact> | null>(null);
  const [loading, setLoading] = useState(!skipInitialFetch);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch member data
  const fetchMember = useCallback(
    async (forceRefresh = false) => {
      if (!waId) return;

      const isRefresh = cachedData !== null;
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const result = forceRefresh
          ? await refreshMember(waId, userId)
          : await getMember(waId, { userId });

        setCachedData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch member data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [waId, userId, cachedData]
  );

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchMember(true);
  }, [fetchMember]);

  // Initial fetch
  useEffect(() => {
    if (!skipInitialFetch && waId) {
      fetchMember(false);
    }
  }, [waId, skipInitialFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh on interval
  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchMember(true);
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchMember]);

  // Auto-refresh when stale
  useEffect(() => {
    if (!autoRefresh || !cachedData?.stale) return;

    // Refresh stale data
    fetchMember(true);
  }, [autoRefresh, cachedData?.stale]); // eslint-disable-line react-hooks/exhaustive-deps

  // Computed values
  const member = cachedData?.data ?? null;
  const source = cachedData?.source ?? null;
  const staleness = cachedData ? getStalenessIndicator(cachedData) : null;
  const stalenessLabel = cachedData ? getStalenessLabel(cachedData) : null;
  const ageSeconds = cachedData?.ageSeconds ?? null;
  const isStale = cachedData?.stale ?? false;

  return {
    member,
    cachedData,
    loading,
    refreshing,
    error,
    source,
    staleness,
    stalenessLabel,
    ageSeconds,
    isStale,
    refresh,
  };
}

// ============================================================================
// Bulk Hook
// ============================================================================

export interface UseMembersDataResult {
  /** Map of WA ID to cached member data */
  members: Map<number, CachedData<WaContact>>;

  /** True while fetching data */
  loading: boolean;

  /** Error message if fetch failed */
  error: string | null;

  /** Get a specific member by WA ID */
  getMember: (waId: number) => WaContact | null;

  /** Check if a member is stale */
  isStale: (waId: number) => boolean;

  /** Refresh all members */
  refreshAll: () => Promise<void>;

  /** Refresh a specific member */
  refreshOne: (waId: number) => Promise<void>;
}

/**
 * Hook for fetching multiple members' data with caching.
 */
export function useMembersData(
  waIds: number[],
  options?: { userId?: string }
): UseMembersDataResult {
  const [members, setMembers] = useState<Map<number, CachedData<WaContact>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all members
  const fetchMembers = useCallback(async () => {
    if (waIds.length === 0) {
      setMembers(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await getMembers(waIds, { userId: options?.userId });
      setMembers(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch members");
    } finally {
      setLoading(false);
    }
  }, [waIds, options?.userId]);

  // Initial fetch
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Get a specific member
  const getMemberById = useCallback(
    (waId: number): WaContact | null => {
      return members.get(waId)?.data ?? null;
    },
    [members]
  );

  // Check if stale
  const isStaleById = useCallback(
    (waId: number): boolean => {
      return members.get(waId)?.stale ?? true;
    },
    [members]
  );

  // Refresh all
  const refreshAll = useCallback(async () => {
    await fetchMembers();
  }, [fetchMembers]);

  // Refresh one
  const refreshOne = useCallback(
    async (waId: number) => {
      const result = await refreshMember(waId, options?.userId);
      if (result) {
        setMembers((prev) => {
          const next = new Map(prev);
          next.set(waId, result);
          return next;
        });
      }
    },
    [options?.userId]
  );

  return {
    members,
    loading,
    error,
    getMember: getMemberById,
    isStale: isStaleById,
    refreshAll,
    refreshOne,
  };
}

export default useMemberData;
