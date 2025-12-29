/**
 * News Preferences Hook
 *
 * Client-side member preferences for the news feed widget.
 * Stored in localStorage for persistence across sessions.
 *
 * Preferences:
 * - sources: Which content types to show (pages, announcements, events)
 * - categories: Filter by specific categories
 * - limit: How many items to display
 *
 * Charter: P6 (human-first UI - let members customize their experience)
 *
 * Copyright (c) Murmurant, Inc.
 */

"use client";

import { useState, useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "clubos-news-preferences";

/**
 * News source types
 */
export type NewsSource = "pages" | "announcements" | "events";

/**
 * Member news preferences
 */
export interface NewsPreferences {
  /** Which sources to include */
  sources: NewsSource[];
  /** Category filters (empty = all) */
  categories: string[];
  /** Max items to show */
  limit: number;
  /** Include expired announcements */
  includeExpired: boolean;
}

/**
 * Default preferences
 */
const DEFAULT_PREFERENCES: NewsPreferences = {
  sources: ["pages", "announcements", "events"],
  categories: [],
  limit: 5,
  includeExpired: false,
};

/**
 * Hook return type
 */
export interface UseNewsPreferencesReturn {
  /** Current preferences */
  preferences: NewsPreferences;
  /** Update preferences */
  setPreferences: (prefs: Partial<NewsPreferences>) => void;
  /** Reset to defaults */
  resetPreferences: () => void;
  /** Loading state (always false - synchronous from localStorage) */
  isLoading: boolean;
}

// Store listeners for useSyncExternalStore
let listeners: Array<() => void> = [];

function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function getSnapshot(): NewsPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch {
    // Invalid JSON or localStorage error
  }
  return DEFAULT_PREFERENCES;
}

function getServerSnapshot(): NewsPreferences {
  return DEFAULT_PREFERENCES;
}

/**
 * Hook for managing member news preferences
 *
 * Uses useSyncExternalStore for safe localStorage access without
 * hydration mismatches or cascading renders.
 *
 * @example
 * ```tsx
 * const { preferences, setPreferences } = useNewsPreferences();
 *
 * // Toggle a source
 * const toggleSource = (source: NewsSource) => {
 *   const sources = preferences.sources.includes(source)
 *     ? preferences.sources.filter(s => s !== source)
 *     : [...preferences.sources, source];
 *   setPreferences({ sources });
 * };
 * ```
 */
export function useNewsPreferences(): UseNewsPreferencesReturn {
  // Use useSyncExternalStore for localStorage (React 18+ pattern)
  const preferences = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Track if we've hydrated (for isLoading compat)
  const [_hydrated] = useState(false);

  // Update preferences and persist
  const setPreferences = useCallback((updates: Partial<NewsPreferences>) => {
    const current = getSnapshot();
    const updated = { ...current, ...updates };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      emitChange();
    } catch {
      // localStorage full or disabled - continue without persistence
    }
  }, []);

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      emitChange();
    } catch {
      // Ignore errors
    }
  }, []);

  return {
    preferences,
    setPreferences,
    resetPreferences,
    isLoading: false,
  };
}

/**
 * Build query string from preferences
 */
export function buildNewsQueryString(prefs: NewsPreferences): string {
  const params = new URLSearchParams();

  if (prefs.sources.length > 0 && prefs.sources.length < 3) {
    params.set("sources", prefs.sources.join(","));
  }

  if (prefs.categories.length > 0) {
    params.set("categories", prefs.categories.join(","));
  }

  if (prefs.limit !== 10) {
    params.set("limit", String(prefs.limit));
  }

  if (prefs.includeExpired) {
    params.set("includeExpired", "true");
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
